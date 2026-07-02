"""
Phase 3 Automated Tests — Procurement Module
Covers: RFQ creation from approved PR, bid submission, comparison
dashboard, shortlisting, rejection, RFQ close, vendor selection
(award_bid), and all permission / guard-rail scenarios.

Run with:
    docker-compose exec web python manage.py test procurement
"""
from django.test import TestCase
from rest_framework.test import APIClient

from accounts.models import User, Department
from .models import (
    PurchaseRequest, RequestItem,
    Vendor, VendorCategory,
    RFQ, RFQItem,
    Bid, BidItem,
)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def make_user(username, role, department=None, password="pass12345"):
    return User.objects.create_user(
        username=username, password=password, role=role, department=department
    )


def make_vendor(user, company, reg_num, status="ACTIVE"):
    return Vendor.objects.create(
        user=user,
        company_name=company,
        registration_number=reg_num,
        address="123 Street",
        city="Kathmandu",
        country="Nepal",
        status=status,
    )


# ---------------------------------------------------------------------------
# Base test-case with shared fixtures
# ---------------------------------------------------------------------------

class ProcurementBaseTest(TestCase):
    """Shared setUp for all Phase 3 tests."""

    def setUp(self):
        self.client = APIClient()

        # Department
        self.dept = Department.objects.create(name="IT", budget=200000)

        # Vendor category
        self.category = VendorCategory.objects.create(name="IT Hardware")

        # Users
        self.employee = make_user("emp1", "EMPLOYEE", self.dept)
        self.manager = make_user("mgr1", "MANAGER", self.dept)
        self.procurement = make_user("proc1", "PROCUREMENT")
        self.finance = make_user("fin1", "FINANCE")
        self.admin = make_user("admin1", "ADMIN")

        self.vendor_user1 = make_user("vendor1", "VENDOR")
        self.vendor_user2 = make_user("vendor2", "VENDOR")
        self.vendor_user3 = make_user("vendor3", "VENDOR")

        # Vendor profiles
        self.vendor1 = make_vendor(self.vendor_user1, "TechCo", "V001")
        self.vendor2 = make_vendor(self.vendor_user2, "SupplyCo", "V002")
        self.vendor3 = make_vendor(self.vendor_user3, "FastDeliver Ltd", "V003")

    # -----------------------------------------------------------------------
    # Token helpers
    # -----------------------------------------------------------------------

    def get_token(self, username, password="pass12345"):
        resp = self.client.post(
            "/api/auth/login/", {"username": username, "password": password}
        )
        self.assertEqual(resp.status_code, 200, f"Login failed for {username}: {resp.data}")
        return resp.data["access"]

    def auth(self, username):
        self.client.credentials(
            HTTP_AUTHORIZATION=f"Bearer {self.get_token(username)}"
        )

    # -----------------------------------------------------------------------
    # Flow helpers
    # -----------------------------------------------------------------------

    def create_approved_pr(self, title="50 Laptops", budget=50000):
        """Create a purchase request and approve it. Returns request_id."""
        self.auth("emp1")
        payload = {
            "title": title,
            "estimated_budget": budget,
            "items": [
                {
                    "item_name": "Dell Laptop",
                    "quantity": 50,
                    "estimated_unit_price": 1000,
                    "specifications": "i7, 16GB RAM",
                }
            ],
        }
        resp = self.client.post(
            "/api/procurement/requests/", payload, format="json"
        )
        self.assertEqual(resp.status_code, 201, resp.data)
        request_id = resp.data["id"]

        # Manager approves
        self.auth("mgr1")
        resp = self.client.post(
            f"/api/procurement/requests/{request_id}/approve_action/",
            {"action": "APPROVED", "comments": "Looks good"},
            format="json",
        )
        self.assertEqual(resp.status_code, 200, resp.data)
        return request_id

    def create_rfq(self, request_id, deadline="2026-12-31T17:00:00Z"):
        """Create an RFQ from an approved PR. Returns (rfq_id, rfq_item_id)."""
        self.auth("proc1")
        resp = self.client.post(
            "/api/procurement/rfqs/create_from_request/",
            {"request_id": request_id, "deadline": deadline},
            format="json",
        )
        self.assertEqual(resp.status_code, 201, resp.data)
        return resp.data["id"], resp.data["items"][0]["id"]

    def submit_bid(self, username, rfq_id, rfq_item_id, total_amount, unit_price, delivery_days=14):
        """Vendor submits a bid. Returns bid_id."""
        self.auth(username)
        payload = {
            "rfq": rfq_id,
            "total_amount": total_amount,
            "delivery_days": delivery_days,
            "validity_days": 30,
            "notes": "Includes warranty",
            "items": [
                {"rfq_item": rfq_item_id, "unit_price": unit_price, "quantity": 50}
            ],
        }
        resp = self.client.post(
            "/api/procurement/bids/", payload, format="json"
        )
        return resp

    def close_rfq(self, rfq_id):
        self.auth("proc1")
        return self.client.post(f"/api/procurement/rfqs/{rfq_id}/close_rfq/")


# ===========================================================================
# 1. RFQ Creation Tests
# ===========================================================================

class RFQCreationTest(ProcurementBaseTest):

    def test_procurement_can_create_rfq_from_approved_pr(self):
        request_id = self.create_approved_pr()
        rfq_id, rfq_item_id = self.create_rfq(request_id)

        self.assertIsNotNone(rfq_id)
        self.assertIsNotNone(rfq_item_id)

        # PR status should now be RFQ_CREATED
        pr = PurchaseRequest.objects.get(id=request_id)
        self.assertEqual(pr.status, "RFQ_CREATED")

    def test_rfq_gets_auto_generated_number(self):
        request_id = self.create_approved_pr()
        self.auth("proc1")
        resp = self.client.post(
            "/api/procurement/rfqs/create_from_request/",
            {"request_id": request_id, "deadline": "2026-12-31T17:00:00Z"},
            format="json",
        )
        self.assertTrue(resp.data["rfq_number"].startswith("RFQ-"))

    def test_cannot_create_rfq_from_pending_pr(self):
        """RFQ creation must fail if the PR is still PENDING_APPROVAL."""
        self.auth("emp1")
        resp = self.client.post(
            "/api/procurement/requests/",
            {
                "title": "Chairs",
                "estimated_budget": 5000,
                "items": [
                    {"item_name": "Office Chair", "quantity": 10, "estimated_unit_price": 500}
                ],
            },
            format="json",
        )
        pending_id = resp.data["id"]

        self.auth("proc1")
        resp = self.client.post(
            "/api/procurement/rfqs/create_from_request/",
            {"request_id": pending_id, "deadline": "2026-12-31T17:00:00Z"},
            format="json",
        )
        self.assertEqual(resp.status_code, 400)
        self.assertIn("APPROVED", resp.data["error"])

    def test_cannot_create_duplicate_rfq_for_same_pr(self):
        """
        After an RFQ is created the PR status changes to RFQ_CREATED.
        A second create_from_request call is therefore rejected with the
        'must be APPROVED' guard (status is RFQ_CREATED, not APPROVED).
        Either way, creating a second RFQ for the same PR must return 400.
        """
        request_id = self.create_approved_pr()
        self.create_rfq(request_id)

        self.auth("proc1")
        resp = self.client.post(
            "/api/procurement/rfqs/create_from_request/",
            {"request_id": request_id, "deadline": "2026-12-31T17:00:00Z"},
            format="json",
        )
        self.assertEqual(resp.status_code, 400)  # creation blocked — any guard is fine

    def test_vendor_cannot_create_rfq(self):
        request_id = self.create_approved_pr()
        self.auth("vendor1")
        resp = self.client.post(
            "/api/procurement/rfqs/create_from_request/",
            {"request_id": request_id, "deadline": "2026-12-31T17:00:00Z"},
            format="json",
        )
        self.assertEqual(resp.status_code, 403)

    def test_rfq_copies_items_from_pr(self):
        request_id = self.create_approved_pr()
        rfq_id, rfq_item_id = self.create_rfq(request_id)
        rfq = RFQ.objects.get(id=rfq_id)
        self.assertEqual(rfq.items.count(), 1)
        self.assertEqual(rfq.items.first().item_name, "Dell Laptop")

    def test_rfq_invites_all_active_vendors_by_default(self):
        request_id = self.create_approved_pr()
        rfq_id, _ = self.create_rfq(request_id)
        rfq = RFQ.objects.get(id=rfq_id)
        active_vendor_count = Vendor.objects.filter(status="ACTIVE").count()
        self.assertEqual(rfq.invited_vendors.count(), active_vendor_count)

    def test_close_rfq(self):
        request_id = self.create_approved_pr()
        rfq_id, _ = self.create_rfq(request_id)
        resp = self.close_rfq(rfq_id)
        self.assertEqual(resp.status_code, 200)
        rfq = RFQ.objects.get(id=rfq_id)
        self.assertEqual(rfq.status, "CLOSED")

    def test_cannot_close_already_closed_rfq(self):
        request_id = self.create_approved_pr()
        rfq_id, _ = self.create_rfq(request_id)
        self.close_rfq(rfq_id)
        resp = self.close_rfq(rfq_id)  # second close
        self.assertEqual(resp.status_code, 400)

    def test_vendor_sees_only_invited_rfqs(self):
        request_id = self.create_approved_pr()
        rfq_id, _ = self.create_rfq(request_id)

        self.auth("vendor1")
        resp = self.client.get("/api/procurement/rfqs/")
        self.assertEqual(resp.status_code, 200)
        rfq_ids = [r["id"] for r in resp.data["results"]]
        self.assertIn(rfq_id, rfq_ids)


# ===========================================================================
# 2. Bid Submission Tests
# ===========================================================================

class BidSubmissionTest(ProcurementBaseTest):

    def setUp(self):
        super().setUp()
        request_id = self.create_approved_pr()
        self.rfq_id, self.rfq_item_id = self.create_rfq(request_id)

    def test_vendor_can_submit_bid(self):
        resp = self.submit_bid("vendor1", self.rfq_id, self.rfq_item_id, 48000, 960)
        self.assertEqual(resp.status_code, 201, resp.data)
        self.assertEqual(resp.data["status"], "SUBMITTED")

    def test_vendor_cannot_bid_twice_on_same_rfq(self):
        self.submit_bid("vendor1", self.rfq_id, self.rfq_item_id, 48000, 960)
        resp = self.submit_bid("vendor1", self.rfq_id, self.rfq_item_id, 47000, 940)
        self.assertEqual(resp.status_code, 400)

    def test_multiple_vendors_can_bid_on_same_rfq(self):
        r1 = self.submit_bid("vendor1", self.rfq_id, self.rfq_item_id, 48000, 960)
        r2 = self.submit_bid("vendor2", self.rfq_id, self.rfq_item_id, 46500, 930)
        r3 = self.submit_bid("vendor3", self.rfq_id, self.rfq_item_id, 47000, 940)
        self.assertEqual(r1.status_code, 201)
        self.assertEqual(r2.status_code, 201)
        self.assertEqual(r3.status_code, 201)
        self.assertEqual(Bid.objects.filter(rfq_id=self.rfq_id).count(), 3)

    def test_bid_item_total_price_is_auto_calculated(self):
        resp = self.submit_bid("vendor1", self.rfq_id, self.rfq_item_id, 48000, 960)
        bid_item = BidItem.objects.get(bid_id=resp.data["id"])
        self.assertEqual(bid_item.total_price, 960 * 50)

    def test_non_vendor_cannot_submit_bid(self):
        self.auth("emp1")
        resp = self.client.post(
            "/api/procurement/bids/",
            {
                "rfq": self.rfq_id,
                "total_amount": 48000,
                "delivery_days": 14,
                "items": [
                    {"rfq_item": self.rfq_item_id, "unit_price": 960, "quantity": 50}
                ],
            },
            format="json",
        )
        self.assertEqual(resp.status_code, 403)

    def test_vendor_cannot_bid_on_closed_rfq(self):
        self.close_rfq(self.rfq_id)
        resp = self.submit_bid("vendor1", self.rfq_id, self.rfq_item_id, 48000, 960)
        self.assertEqual(resp.status_code, 400)

    def test_vendor_sees_only_own_bids(self):
        self.submit_bid("vendor1", self.rfq_id, self.rfq_item_id, 48000, 960)
        self.submit_bid("vendor2", self.rfq_id, self.rfq_item_id, 46500, 930)

        self.auth("vendor1")
        resp = self.client.get("/api/procurement/bids/")
        self.assertEqual(resp.status_code, 200)
        vendors = [b["vendor_name"] for b in resp.data["results"]]
        self.assertTrue(all(v == "TechCo" for v in vendors))


# ===========================================================================
# 3. Bid Comparison Dashboard Tests
# ===========================================================================

class BidComparisonTest(ProcurementBaseTest):

    def setUp(self):
        super().setUp()
        request_id = self.create_approved_pr()
        self.rfq_id, self.rfq_item_id = self.create_rfq(request_id)

        # Three vendors bid
        self.bid1_resp = self.submit_bid("vendor1", self.rfq_id, self.rfq_item_id, 48000, 960)
        self.bid2_resp = self.submit_bid("vendor2", self.rfq_id, self.rfq_item_id, 46500, 930)
        self.bid3_resp = self.submit_bid("vendor3", self.rfq_id, self.rfq_item_id, 47000, 940)

        self.bid1_id = self.bid1_resp.data["id"]
        self.bid2_id = self.bid2_resp.data["id"]
        self.bid3_id = self.bid3_resp.data["id"]

    def test_comparison_dashboard_returns_correct_stats(self):
        self.auth("proc1")
        resp = self.client.get(f"/api/procurement/bids/compare/?rfq_id={self.rfq_id}")
        self.assertEqual(resp.status_code, 200)
        stats = resp.data["statistics"]
        self.assertEqual(stats["total_bids"], 3)
        self.assertEqual(stats["lowest_bid"], "46500.00")
        self.assertEqual(stats["highest_bid"], "48000.00")

    def test_comparison_bids_ordered_by_price(self):
        self.auth("proc1")
        resp = self.client.get(f"/api/procurement/bids/compare/?rfq_id={self.rfq_id}")
        amounts = [float(b["total_amount"]) for b in resp.data["bids"]]
        self.assertEqual(amounts, sorted(amounts))

    def test_comparison_returns_rank(self):
        self.auth("proc1")
        resp = self.client.get(f"/api/procurement/bids/compare/?rfq_id={self.rfq_id}")
        ranks = [b["rank"] for b in resp.data["bids"]]
        self.assertEqual(ranks, [1, 2, 3])

    def test_comparison_requires_rfq_id_param(self):
        self.auth("proc1")
        resp = self.client.get("/api/procurement/bids/compare/")
        self.assertEqual(resp.status_code, 400)

    def test_vendor_cannot_access_comparison_dashboard(self):
        self.auth("vendor1")
        resp = self.client.get(f"/api/procurement/bids/compare/?rfq_id={self.rfq_id}")
        self.assertEqual(resp.status_code, 403)

    def test_shortlist_bid(self):
        self.auth("proc1")
        resp = self.client.post(f"/api/procurement/bids/{self.bid2_id}/shortlist/")
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(Bid.objects.get(id=self.bid2_id).status, "SHORTLISTED")

    def test_reject_bid(self):
        self.auth("proc1")
        resp = self.client.post(f"/api/procurement/bids/{self.bid1_id}/reject_bid/")
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(Bid.objects.get(id=self.bid1_id).status, "REJECTED")

    def test_vendor_cannot_shortlist_bids(self):
        self.auth("vendor1")
        resp = self.client.post(f"/api/procurement/bids/{self.bid2_id}/shortlist/")
        self.assertEqual(resp.status_code, 403)


# ===========================================================================
# 4. Vendor Selection (award_bid) Tests — Day 18 core
# ===========================================================================

class VendorSelectionTest(ProcurementBaseTest):

    def setUp(self):
        super().setUp()
        request_id = self.create_approved_pr()
        self.request_id = request_id
        self.rfq_id, self.rfq_item_id = self.create_rfq(request_id)

        self.bid1_id = self.submit_bid(
            "vendor1", self.rfq_id, self.rfq_item_id, 48000, 960
        ).data["id"]
        self.bid2_id = self.submit_bid(
            "vendor2", self.rfq_id, self.rfq_item_id, 46500, 930
        ).data["id"]
        self.bid3_id = self.submit_bid(
            "vendor3", self.rfq_id, self.rfq_item_id, 47000, 940
        ).data["id"]

    def _award(self, bid_id):
        self.auth("proc1")
        return self.client.post(f"/api/procurement/bids/{bid_id}/award_bid/")

    def _close_and_award(self, bid_id):
        self.close_rfq(self.rfq_id)
        return self._award(bid_id)

    # --- Happy path ---

    def test_award_bid_returns_200(self):
        resp = self._close_and_award(self.bid2_id)
        self.assertEqual(resp.status_code, 200)
        self.assertIn("SupplyCo", resp.data["vendor"])

    def test_awarded_bid_status_is_awarded(self):
        self._close_and_award(self.bid2_id)
        self.assertEqual(Bid.objects.get(id=self.bid2_id).status, "AWARDED")

    def test_other_bids_auto_rejected_on_award(self):
        self._close_and_award(self.bid2_id)
        self.assertEqual(Bid.objects.get(id=self.bid1_id).status, "REJECTED")
        self.assertEqual(Bid.objects.get(id=self.bid3_id).status, "REJECTED")

    def test_rfq_status_becomes_awarded(self):
        self._close_and_award(self.bid2_id)
        self.assertEqual(RFQ.objects.get(id=self.rfq_id).status, "AWARDED")

    def test_purchase_request_status_becomes_vendor_selected(self):
        self._close_and_award(self.bid2_id)
        pr = PurchaseRequest.objects.get(id=self.request_id)
        self.assertEqual(pr.status, "VENDOR_SELECTED")

    def test_awarded_bid_endpoint_on_rfq(self):
        self._close_and_award(self.bid2_id)
        self.auth("proc1")
        resp = self.client.get(f"/api/procurement/rfqs/{self.rfq_id}/awarded_bid/")
        self.assertEqual(resp.status_code, 200)
        self.assertIn("total_amount", resp.data)

    def test_awarded_bid_endpoint_returns_message_when_no_award(self):
        self.auth("proc1")
        resp = self.client.get(f"/api/procurement/rfqs/{self.rfq_id}/awarded_bid/")
        self.assertEqual(resp.status_code, 200)
        self.assertIn("No bid has been awarded", resp.data["message"])

    # --- Guard-rails ---

    def test_cannot_award_before_rfq_is_closed(self):
        resp = self._award(self.bid2_id)
        self.assertEqual(resp.status_code, 400)
        self.assertIn("CLOSED", resp.data["error"])

    def test_cannot_award_rejected_bid(self):
        self.close_rfq(self.rfq_id)
        self.auth("proc1")
        self.client.post(f"/api/procurement/bids/{self.bid1_id}/reject_bid/")
        resp = self._award(self.bid1_id)
        self.assertEqual(resp.status_code, 400)

    def test_cannot_award_twice(self):
        """
        After awarding bid2 the RFQ status becomes AWARDED (not CLOSED),
        so a second award attempt is blocked first by the 'must be CLOSED'
        guard. Either way the response must be 400.
        """
        self._close_and_award(self.bid2_id)
        self.auth("proc1")
        resp = self.client.post(f"/api/procurement/bids/{self.bid3_id}/award_bid/")
        self.assertEqual(resp.status_code, 400)  # blocked by any guard

    def test_vendor_cannot_award_bid(self):
        self.close_rfq(self.rfq_id)
        self.auth("vendor2")
        resp = self.client.post(f"/api/procurement/bids/{self.bid2_id}/award_bid/")
        self.assertEqual(resp.status_code, 403)

    def test_employee_cannot_award_bid(self):
        self.close_rfq(self.rfq_id)
        self.auth("emp1")
        resp = self.client.post(f"/api/procurement/bids/{self.bid2_id}/award_bid/")
        self.assertEqual(resp.status_code, 403)

    def test_cannot_reject_awarded_bid(self):
        self._close_and_award(self.bid2_id)
        self.auth("proc1")
        resp = self.client.post(f"/api/procurement/bids/{self.bid2_id}/reject_bid/")
        self.assertEqual(resp.status_code, 400)
        self.assertIn("Cannot reject an awarded bid", resp.data["error"])


# ===========================================================================
# 5. Full End-to-End Flow Test (mirrors plan Step 3)
# ===========================================================================

class FullPhase3FlowTest(ProcurementBaseTest):
    """
    Mirrors the plan's test_full_rfq_bidding_flow exactly
    to confirm the complete Phase 3 happy-path works end-to-end.
    """

    def test_full_rfq_bidding_flow(self):
        # 1. Employee creates request
        self.auth("emp1")
        resp = self.client.post(
            "/api/procurement/requests/",
            {
                "title": "50 Laptops",
                "estimated_budget": 50000,
                "items": [
                    {
                        "item_name": "Dell Laptop",
                        "quantity": 50,
                        "estimated_unit_price": 1000,
                    }
                ],
            },
            format="json",
        )
        self.assertEqual(resp.status_code, 201)
        request_id = resp.data["id"]

        # 2. Manager approves
        self.auth("mgr1")
        resp = self.client.post(
            f"/api/procurement/requests/{request_id}/approve_action/",
            {"action": "APPROVED"},
            format="json",
        )
        self.assertEqual(resp.status_code, 200)

        # 3. Procurement creates RFQ
        self.auth("proc1")
        resp = self.client.post(
            "/api/procurement/rfqs/create_from_request/",
            {"request_id": request_id, "deadline": "2026-12-31T17:00:00Z"},
            format="json",
        )
        self.assertEqual(resp.status_code, 201)
        rfq_id = resp.data["id"]
        rfq_item_id = resp.data["items"][0]["id"]
        self.assertTrue(resp.data["rfq_number"].startswith("RFQ-"))

        # 4. Three vendors submit bids
        bid1_resp = self.submit_bid("vendor1", rfq_id, rfq_item_id, 48000, 960, 14)
        self.assertEqual(bid1_resp.status_code, 201)
        bid1_id = bid1_resp.data["id"]

        bid2_resp = self.submit_bid("vendor2", rfq_id, rfq_item_id, 46500, 930, 10)
        self.assertEqual(bid2_resp.status_code, 201)
        bid2_id = bid2_resp.data["id"]

        bid3_resp = self.submit_bid("vendor3", rfq_id, rfq_item_id, 47000, 940, 12)
        self.assertEqual(bid3_resp.status_code, 201)

        # 5. Procurement compares bids
        self.auth("proc1")
        resp = self.client.get(f"/api/procurement/bids/compare/?rfq_id={rfq_id}")
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.data["statistics"]["total_bids"], 3)
        self.assertEqual(resp.data["statistics"]["lowest_bid"], "46500.00")

        # 6. Shortlist lowest bid
        resp = self.client.post(f"/api/procurement/bids/{bid2_id}/shortlist/")
        self.assertEqual(resp.status_code, 200)

        # 7. Close RFQ
        resp = self.client.post(f"/api/procurement/rfqs/{rfq_id}/close_rfq/")
        self.assertEqual(resp.status_code, 200)

        # 8. Award lowest bid
        resp = self.client.post(f"/api/procurement/bids/{bid2_id}/award_bid/")
        self.assertEqual(resp.status_code, 200)
        self.assertIn("SupplyCo", resp.data["vendor"])
        self.assertEqual(resp.data["awarded_amount"], "46500.00")

        # 9. Verify bid1 was auto-rejected
        self.assertEqual(Bid.objects.get(id=bid1_id).status, "REJECTED")

        # 10. Verify PurchaseRequest status
        pr = PurchaseRequest.objects.get(id=request_id)
        self.assertEqual(pr.status, "VENDOR_SELECTED")

        # 11. Verify RFQ awarded_bid endpoint
        resp = self.client.get(f"/api/procurement/rfqs/{rfq_id}/awarded_bid/")
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(float(resp.data["total_amount"]), 46500.0)

    def test_vendor_cannot_bid_twice(self):
        request_id = self.create_approved_pr("Chairs", 10000)
        rfq_id, rfq_item_id = self.create_rfq(request_id)

        r1 = self.submit_bid("vendor1", rfq_id, rfq_item_id, 9000, 180)
        self.assertEqual(r1.status_code, 201)

        r2 = self.submit_bid("vendor1", rfq_id, rfq_item_id, 8500, 170)
        self.assertEqual(r2.status_code, 400)
