from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status
from accounts.models import Department
from .models import PurchaseRequest, RequestItem, Approval

User = get_user_model()


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def make_item(name="Dell Latitude", qty=1, price=1000):
    return {"item_name": name, "quantity": qty, "estimated_unit_price": price}


def make_payload(title="50 Laptops", budget=50000, items=None):
    return {
        "title": title,
        "description": "Test description",
        "estimated_budget": budget,
        "items": items if items is not None else [make_item()],
    }


# ---------------------------------------------------------------------------
# Base test case with common setup
# ---------------------------------------------------------------------------

class ProcurementBaseTestCase(TestCase):
    def setUp(self):
        # Departments
        self.dept_it = Department.objects.create(name="IT", budget=100000)
        self.dept_hr = Department.objects.create(name="HR", budget=50000)

        # Users
        self.employee = User.objects.create_user(
            username="emp1", password="pass12345", role="EMPLOYEE", department=self.dept_it
        )
        self.employee2 = User.objects.create_user(
            username="emp2", password="pass12345", role="EMPLOYEE", department=self.dept_it
        )
        self.manager = User.objects.create_user(
            username="mgr1", password="pass12345", role="MANAGER", department=self.dept_it
        )
        self.manager_hr = User.objects.create_user(
            username="mgr_hr", password="pass12345", role="MANAGER", department=self.dept_hr
        )
        self.procurement_user = User.objects.create_user(
            username="proc1", password="pass12345", role="PROCUREMENT", department=self.dept_it
        )
        self.finance_user = User.objects.create_user(
            username="fin1", password="pass12345", role="FINANCE", department=self.dept_it
        )
        self.admin_user = User.objects.create_user(
            username="admin1", password="pass12345", role="ADMIN"
        )

        self.client = APIClient()

    # ---- auth helpers ----
    def get_token(self, username, password="pass12345"):
        resp = self.client.post("/api/auth/login/", {"username": username, "password": password})
        self.assertIn("access", resp.data, f"Login failed for {username}: {resp.data}")
        return resp.data["access"]

    def auth_as(self, user):
        token = self.get_token(user.username)
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")

    # ---- request helpers ----
    def create_request(self, user, payload=None):
        self.auth_as(user)
        payload = payload or make_payload()
        return self.client.post("/api/procurement/requests/", payload, format="json")

    def approve_request(self, manager, request_id, action="APPROVED", comments="Looks good"):
        self.auth_as(manager)
        return self.client.post(
            f"/api/procurement/requests/{request_id}/approve_action/",
            {"action": action, "comments": comments},
            format="json",
        )


# ===========================================================================
# TEST CLASS 1 — Happy path: create → approve
# ===========================================================================

class PurchaseRequestFlowTest(ProcurementBaseTestCase):

    def test_create_request_and_approve(self):
        """Employee creates a request; manager approves it; audit log is recorded."""
        # --- Create ---
        resp = self.create_request(self.employee, make_payload(
            title="50 Laptops",
            budget=50000,
            items=[make_item("Dell Latitude", 50, 1000)],
        ))
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        self.assertEqual(resp.data["status"], "PENDING_APPROVAL")
        request_id = resp.data["id"]

        # --- Approve ---
        resp = self.approve_request(self.manager, request_id, action="APPROVED", comments="Looks good")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.data["status"], "APPROVED")

        # --- Verify DB state ---
        pr = PurchaseRequest.objects.get(id=request_id)
        self.assertEqual(pr.status, "APPROVED")
        self.assertTrue(pr.approvals.filter(action="APPROVED").exists())

    def test_create_request_and_reject(self):
        """Manager can reject a pending request."""
        resp = self.create_request(self.employee)
        request_id = resp.data["id"]

        resp = self.approve_request(self.manager, request_id, action="REJECTED", comments="Not justified")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.data["status"], "REJECTED")

        pr = PurchaseRequest.objects.get(id=request_id)
        self.assertEqual(pr.status, "REJECTED")

    def test_create_request_changes_requested_then_resubmit(self):
        """Full resubmit cycle: PENDING → CHANGES_REQUESTED → PENDING → APPROVED."""
        resp = self.create_request(self.employee)
        request_id = resp.data["id"]

        # Manager requests changes
        resp = self.approve_request(
            self.manager, request_id, action="CHANGES_REQUESTED", comments="Add specs"
        )
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.data["status"], "CHANGES_REQUESTED")

        # Employee resubmits with updated items
        self.auth_as(self.employee)
        resubmit_payload = {
            "title": "50 Laptops (updated)",
            "description": "Added specs",
            "estimated_budget": 52000,
            "items": [make_item("Dell Latitude Pro", 50, 1040)],
        }
        resp = self.client.post(
            f"/api/procurement/requests/{request_id}/resubmit/", resubmit_payload, format="json"
        )
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.data["status"], "PENDING_APPROVAL")

        # Manager approves the resubmitted request
        resp = self.approve_request(self.manager, request_id, action="APPROVED")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.data["status"], "APPROVED")

    def test_approval_history_endpoint(self):
        """approval_history returns all approval records for a request."""
        resp = self.create_request(self.employee)
        request_id = resp.data["id"]

        self.approve_request(
            self.manager, request_id, action="CHANGES_REQUESTED", comments="Revise"
        )

        # Resubmit, then approve
        self.auth_as(self.employee)
        self.client.post(
            f"/api/procurement/requests/{request_id}/resubmit/",
            make_payload(title="Updated"),
            format="json",
        )
        self.approve_request(self.manager, request_id, action="APPROVED")

        self.auth_as(self.manager)
        resp = self.client.get(f"/api/procurement/requests/{request_id}/approval_history/")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(len(resp.data), 2)


# ===========================================================================
# TEST CLASS 2 — RBAC / permission enforcement
# ===========================================================================

class RBACPermissionTest(ProcurementBaseTestCase):

    def test_employee_cannot_approve(self):
        """An employee must receive 403 when calling approve_action."""
        resp = self.create_request(self.employee)
        request_id = resp.data["id"]

        # Same employee tries to approve
        resp = self.approve_request(self.employee, request_id, action="APPROVED")
        self.assertEqual(resp.status_code, status.HTTP_403_FORBIDDEN)

    def test_manager_from_different_department_cannot_approve(self):
        """Manager from HR dept cannot approve IT dept requests.

        The HR manager's queryset is scoped to HR department requests only,
        so the IT request is invisible to them — resulting in 404, not 403.
        This is the correct security behavior (object-level scoping).
        """
        resp = self.create_request(self.employee)  # employee is in IT
        request_id = resp.data["id"]

        resp = self.approve_request(self.manager_hr, request_id, action="APPROVED")
        # 404 because the HR manager's queryset doesn't include IT requests
        self.assertEqual(resp.status_code, status.HTTP_404_NOT_FOUND)

    def test_non_owner_cannot_resubmit(self):
        """Another employee cannot resubmit someone else's request.

        Due to queryset scoping (EMPLOYEE role sees only own requests),
        emp2 receives 404 for emp1's request, which is the correct security
        behavior (resource is invisible, not just forbidden).
        """
        resp = self.create_request(self.employee)
        request_id = resp.data["id"]

        # Manager puts it in CHANGES_REQUESTED
        self.approve_request(self.manager, request_id, action="CHANGES_REQUESTED")

        # Different employee tries to resubmit — gets 404 (not in their queryset)
        self.auth_as(self.employee2)
        resp = self.client.post(
            f"/api/procurement/requests/{request_id}/resubmit/",
            make_payload(title="Sneaky resubmit"),
            format="json",
        )
        self.assertEqual(resp.status_code, status.HTTP_404_NOT_FOUND)

    def test_unauthenticated_user_cannot_access(self):
        """Unauthenticated requests to the procurement API should be rejected."""
        self.client.credentials()  # clear any auth
        resp = self.client.get("/api/procurement/requests/")
        self.assertEqual(resp.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_employee_sees_only_own_requests(self):
        """Employees can only see their own purchase requests."""
        # emp1 creates a request
        self.create_request(self.employee, make_payload(title="Emp1 Request"))
        # emp2 creates a request
        self.create_request(self.employee2, make_payload(title="Emp2 Request"))

        # emp1 lists → should only see their own
        self.auth_as(self.employee)
        resp = self.client.get("/api/procurement/requests/")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        titles = [r["title"] for r in resp.data["results"]]
        self.assertIn("Emp1 Request", titles)
        self.assertNotIn("Emp2 Request", titles)

    def test_manager_sees_department_requests(self):
        """Manager sees all requests from their department."""
        self.create_request(self.employee, make_payload(title="IT Request 1"))
        self.create_request(self.employee2, make_payload(title="IT Request 2"))

        self.auth_as(self.manager)
        resp = self.client.get("/api/procurement/requests/")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        titles = [r["title"] for r in resp.data["results"]]
        self.assertIn("IT Request 1", titles)
        self.assertIn("IT Request 2", titles)

    def test_procurement_user_can_view_all_requests(self):
        """Procurement role can read all requests across departments."""
        self.create_request(self.employee, make_payload(title="IT Request"))

        self.auth_as(self.procurement_user)
        resp = self.client.get("/api/procurement/requests/")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(resp.data["results"]), 1)

    def test_finance_user_can_view_all_requests(self):
        """Finance role can read all requests across departments."""
        self.create_request(self.employee, make_payload(title="IT Request Finance"))

        self.auth_as(self.finance_user)
        resp = self.client.get("/api/procurement/requests/")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(resp.data["results"]), 1)


# ===========================================================================
# TEST CLASS 3 — Edge cases & validation
# ===========================================================================

class EdgeCaseTest(ProcurementBaseTestCase):

    def test_create_request_with_zero_items_fails(self):
        """Submitting a request with an empty items list should return 400."""
        self.auth_as(self.employee)
        payload = make_payload(items=[])
        resp = self.client.post("/api/procurement/requests/", payload, format="json")
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

    def test_approve_already_approved_request_fails(self):
        """Cannot act on a request that is no longer in PENDING_APPROVAL status."""
        resp = self.create_request(self.employee)
        request_id = resp.data["id"]

        # First approval
        self.approve_request(self.manager, request_id, action="APPROVED")

        # Second approval attempt
        resp = self.approve_request(self.manager, request_id, action="APPROVED")
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

    def test_resubmit_on_pending_request_fails(self):
        """Resubmit should only work when status is CHANGES_REQUESTED."""
        resp = self.create_request(self.employee)
        request_id = resp.data["id"]

        # Status is still PENDING_APPROVAL — resubmit must fail
        self.auth_as(self.employee)
        resp = self.client.post(
            f"/api/procurement/requests/{request_id}/resubmit/",
            make_payload(title="Early Resubmit"),
            format="json",
        )
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

    def test_resubmit_on_approved_request_fails(self):
        """Resubmit should fail on an already-approved request."""
        resp = self.create_request(self.employee)
        request_id = resp.data["id"]
        self.approve_request(self.manager, request_id, action="APPROVED")

        self.auth_as(self.employee)
        resp = self.client.post(
            f"/api/procurement/requests/{request_id}/resubmit/",
            make_payload(title="Post-Approval Resubmit"),
            format="json",
        )
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_request_missing_title_fails(self):
        """A request without a title should return 400."""
        self.auth_as(self.employee)
        payload = {
            "description": "Missing title",
            "estimated_budget": 5000,
            "items": [make_item()],
        }
        resp = self.client.post("/api/procurement/requests/", payload, format="json")
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

    def test_multiple_items_stored_correctly(self):
        """Requests with multiple items should store all items in the DB."""
        items = [
            make_item("Laptop", 10, 1500),
            make_item("Monitor", 10, 300),
            make_item("Keyboard", 10, 50),
        ]
        resp = self.create_request(self.employee, make_payload(items=items))
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        request_id = resp.data["id"]

        pr = PurchaseRequest.objects.get(id=request_id)
        self.assertEqual(pr.items.count(), 3)

    def test_approve_action_with_invalid_action_value_fails(self):
        """Sending an unrecognised action value should return 400."""
        resp = self.create_request(self.employee)
        request_id = resp.data["id"]

        self.auth_as(self.manager)
        resp = self.client.post(
            f"/api/procurement/requests/{request_id}/approve_action/",
            {"action": "INVALID_ACTION"},
            format="json",
        )
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)


# ===========================================================================
# TEST CLASS 4 — Audit log
# ===========================================================================

class AuditLogTest(ProcurementBaseTestCase):

    def test_audit_log_created_on_request_creation(self):
        """An audit log entry should be created when a purchase request is made."""
        from audit.models import AuditLog
        resp = self.create_request(self.employee)
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        request_id = resp.data["id"]

        log_exists = AuditLog.objects.filter(
            user=self.employee,
            action="CREATE",
            object_id=request_id,
        ).exists()
        self.assertTrue(log_exists, "No audit log found for CREATE action.")

    def test_audit_log_created_on_approval(self):
        """An audit log entry should be created when a manager approves a request."""
        from audit.models import AuditLog
        resp = self.create_request(self.employee)
        request_id = resp.data["id"]
        self.approve_request(self.manager, request_id, action="APPROVED")

        log_exists = AuditLog.objects.filter(
            user=self.manager,
            action="APPROVED",
            object_id=request_id,
        ).exists()
        self.assertTrue(log_exists, "No audit log found for APPROVED action.")

    def test_full_audit_trail(self):
        """Full cycle leaves audit entries for: CREATE, CHANGES_REQUESTED, UPDATE, APPROVED."""
        from audit.models import AuditLog
        resp = self.create_request(self.employee)
        request_id = resp.data["id"]

        self.approve_request(self.manager, request_id, action="CHANGES_REQUESTED")

        self.auth_as(self.employee)
        self.client.post(
            f"/api/procurement/requests/{request_id}/resubmit/",
            make_payload(title="Updated title"),
            format="json",
        )

        self.approve_request(self.manager, request_id, action="APPROVED")

        qs = AuditLog.objects.filter(object_id=request_id)
        actions = set(qs.values_list("action", flat=True))
        self.assertIn("CREATE", actions)
        self.assertIn("CHANGES_REQUESTED", actions)
        self.assertIn("RESUBMIT", actions)
        self.assertIn("APPROVED", actions)
