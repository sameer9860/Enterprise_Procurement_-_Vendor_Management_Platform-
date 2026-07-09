from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from django.contrib.auth import get_user_model
from accounts.models import Department
from .models import (
    PurchaseRequest, Vendor, VendorCategory,
    RFQ, Bid, PurchaseOrder
)

User = get_user_model()


class PurchaseOrderTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.dept = Department.objects.create(name='IT', budget=100000)

        # Users
        self.employee = User.objects.create_user(
            'emp1', password='pass12345', role='EMPLOYEE', department=self.dept
        )
        self.manager = User.objects.create_user(
            'mgr1', password='pass12345', role='MANAGER', department=self.dept
        )
        self.procurement = User.objects.create_user(
            'proc1', password='pass12345', role='PROCUREMENT'
        )
        self.finance = User.objects.create_user(
            'fin1', password='pass12345', role='FINANCE'
        )
        self.vendor_user = User.objects.create_user(
            'vendor1', password='pass12345', role='VENDOR'
        )
        self.vendor = Vendor.objects.create(
            user=self.vendor_user,
            company_name='TechCo',
            registration_number='V001',
            address='123 Street',
            city='Kathmandu',
            country='Nepal',
            status='ACTIVE'
        )

    def get_token(self, username):
        resp = self.client.post(
            '/api/auth/login/',
            {'username': username, 'password': 'pass12345'}
        )
        return resp.data['access']

    def auth(self, username):
        token = self.get_token(username)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')

    # -------------------------------------------------------
    # Helper: run through phase 1-3 to get an awarded bid
    # -------------------------------------------------------
    def create_awarded_bid(self):
        # Employee creates request
        self.auth('emp1')
        resp = self.client.post('/api/procurement/requests/', {
            "title": "50 Laptops",
            "estimated_budget": 50000,
            "items": [
                {"item_name": "Dell Laptop", "quantity": 50, "estimated_unit_price": 1000}
            ]
        }, format='json')
        self.assertEqual(resp.status_code, 201)
        request_id = resp.data['id']

        # Manager approves
        self.auth('mgr1')
        resp = self.client.post(
            f'/api/procurement/requests/{request_id}/approve_action/',
            {"action": "APPROVED"}, format='json'
        )
        self.assertEqual(resp.status_code, 200)

        # Procurement creates RFQ
        self.auth('proc1')
        resp = self.client.post('/api/procurement/rfqs/create_from_request/', {
            "request_id": request_id,
            "deadline": "2026-12-31T17:00:00Z"
        }, format='json')
        self.assertEqual(resp.status_code, 201)
        rfq_id = resp.data['id']
        rfq_item_id = resp.data['items'][0]['id']

        # Vendor submits bid
        self.auth('vendor1')
        resp = self.client.post('/api/procurement/bids/', {
            "rfq": rfq_id,
            "total_amount": 48000,
            "delivery_days": 14,
            "validity_days": 30,
            "items": [
                {"rfq_item": rfq_item_id, "unit_price": 960, "quantity": 50}
            ]
        }, format='json')
        self.assertEqual(resp.status_code, 201)
        bid_id = resp.data['id']

        # Procurement closes RFQ + awards bid
        self.auth('proc1')
        self.client.post(f'/api/procurement/rfqs/{rfq_id}/close_rfq/')
        resp = self.client.post(f'/api/procurement/bids/{bid_id}/award_bid/')
        self.assertEqual(resp.status_code, 200)

        return bid_id

    def generate_po(self, bid_id):
        """Helper to generate PO from awarded bid"""
        self.auth('proc1')
        resp = self.client.post('/api/procurement/purchase-orders/generate_po/', {
            "bid_id": bid_id,
            "delivery_address": "123 Main Street, Kathmandu, Nepal",
            "expected_delivery_date": "2026-08-15",
            "special_instructions": "Handle with care"
        }, format='json')
        self.assertEqual(resp.status_code, 201)
        return resp.data['id'], resp.data

    # -------------------------------------------------------
    # Test 1: PO Generation
    # -------------------------------------------------------
    def test_generate_po_success(self):
        bid_id = self.create_awarded_bid()
        po_id, data = self.generate_po(bid_id)

        self.assertTrue(data['po_number'].startswith('PO-'))
        self.assertEqual(data['status'], 'DRAFT')
        self.assertEqual(data['total_amount'], '48000.00')
        self.assertIsNotNone(data['items'])
        self.assertEqual(len(data['items']), 1)

        # PurchaseRequest status must be PO_GENERATED
        pr = PurchaseRequest.objects.get(purchase_order__id=po_id)
        self.assertEqual(pr.status, 'PO_GENERATED')

    # -------------------------------------------------------
    # Test 2: Cannot generate PO twice for same bid
    # -------------------------------------------------------
    def test_cannot_generate_po_twice(self):
        bid_id = self.create_awarded_bid()
        self.generate_po(bid_id)

        # Try again
        self.auth('proc1')
        resp = self.client.post('/api/procurement/purchase-orders/generate_po/', {
            "bid_id": bid_id,
            "delivery_address": "123 Main Street",
            "expected_delivery_date": "2026-08-15"
        }, format='json')
        self.assertEqual(resp.status_code, 400)
        self.assertIn('already been generated', resp.data['error'])

    # -------------------------------------------------------
    # Test 3: Full status workflow
    # -------------------------------------------------------
    def test_full_status_workflow(self):
        bid_id = self.create_awarded_bid()
        po_id, _ = self.generate_po(bid_id)

        self.auth('proc1')

        # DRAFT → SENT
        resp = self.client.post(
            f'/api/procurement/purchase-orders/{po_id}/send_to_vendor/'
        )
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(PurchaseOrder.objects.get(id=po_id).status, 'SENT')

        # SENT → ACKNOWLEDGED (by vendor)
        self.auth('vendor1')
        resp = self.client.post(
            f'/api/procurement/purchase-orders/{po_id}/acknowledge/'
        )
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(PurchaseOrder.objects.get(id=po_id).status, 'ACKNOWLEDGED')

        # ACKNOWLEDGED → IN_PROGRESS
        self.auth('proc1')
        resp = self.client.post(
            f'/api/procurement/purchase-orders/{po_id}/update_status/',
            {"status": "IN_PROGRESS"}, format='json'
        )
        self.assertEqual(resp.status_code, 200)

        # IN_PROGRESS → DELIVERED
        resp = self.client.post(
            f'/api/procurement/purchase-orders/{po_id}/update_status/',
            {"status": "DELIVERED"}, format='json'
        )
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(PurchaseOrder.objects.get(id=po_id).status, 'DELIVERED')

    # -------------------------------------------------------
    # Test 4: Invalid status transition
    # -------------------------------------------------------
    def test_invalid_status_transition(self):
        bid_id = self.create_awarded_bid()
        po_id, _ = self.generate_po(bid_id)

        self.auth('proc1')

        # DRAFT → DELIVERED (invalid jump)
        resp = self.client.post(
            f'/api/procurement/purchase-orders/{po_id}/update_status/',
            {"status": "DELIVERED"}, format='json'
        )
        self.assertEqual(resp.status_code, 400)
        self.assertIn('Cannot transition', resp.data['error'])

    # -------------------------------------------------------
    # Test 5: Wrong vendor cannot acknowledge
    # -------------------------------------------------------
    def test_wrong_vendor_cannot_acknowledge(self):
        # Create second vendor
        vendor_user2 = User.objects.create_user(
            'vendor2', password='pass12345', role='VENDOR'
        )
        Vendor.objects.create(
            user=vendor_user2, company_name='OtherCo',
            registration_number='V002', address='Addr',
        city='KTM', country='Nepal', status='ACTIVE'
    )

        bid_id = self.create_awarded_bid()
        po_id, _ = self.generate_po(bid_id)

        # Send to vendor first
        self.auth('proc1')
        self.client.post(f'/api/procurement/purchase-orders/{po_id}/send_to_vendor/')

        # Wrong vendor tries to acknowledge
        # Gets 404 because PO is filtered out of their queryset entirely
        self.auth('vendor2')
        resp = self.client.post(
            f'/api/procurement/purchase-orders/{po_id}/acknowledge/'
        )
        self.assertIn(resp.status_code, [403, 404])  # either is correct security behavior

    # -------------------------------------------------------
    # Test 6: PDF download
    # -------------------------------------------------------
    def test_pdf_download(self):
        bid_id = self.create_awarded_bid()
        po_id, _ = self.generate_po(bid_id)

        self.auth('proc1')
        resp = self.client.get(
            f'/api/procurement/purchase-orders/{po_id}/download_pdf/'
        )
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp['Content-Type'], 'application/pdf')

    # -------------------------------------------------------
    # Test 7: Timeline tracking
    # -------------------------------------------------------
    def test_timeline(self):
        bid_id = self.create_awarded_bid()
        po_id, _ = self.generate_po(bid_id)

        self.auth('proc1')
        self.client.post(f'/api/procurement/purchase-orders/{po_id}/send_to_vendor/')

        self.auth('vendor1')
        self.client.post(f'/api/procurement/purchase-orders/{po_id}/acknowledge/')

        self.auth('proc1')
        resp = self.client.get(
            f'/api/procurement/purchase-orders/{po_id}/timeline/'
        )
        self.assertEqual(resp.status_code, 200)
        self.assertIn('timeline', resp.data)
        self.assertGreater(len(resp.data['timeline']), 0)
        self.assertEqual(resp.data['current_status'], 'ACKNOWLEDGED')

    # -------------------------------------------------------
    # Test 8: Summary stats
    # -------------------------------------------------------
    def test_summary(self):
        bid_id = self.create_awarded_bid()
        self.generate_po(bid_id)

        self.auth('proc1')
        resp = self.client.get('/api/procurement/purchase-orders/summary/')
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.data['total_purchase_orders'], 1)
        self.assertEqual(resp.data['by_status']['draft'], 1)

    # -------------------------------------------------------
    # Test 9: Filtering
    # -------------------------------------------------------
    def test_filtering(self):
        bid_id = self.create_awarded_bid()
        self.generate_po(bid_id)

        self.auth('proc1')

        # Filter by status
        resp = self.client.get('/api/procurement/purchase-orders/?status=DRAFT')
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.data['count'], 1)

        # Filter by wrong status
        resp = self.client.get('/api/procurement/purchase-orders/?status=DELIVERED')
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.data['count'], 0)

    # -------------------------------------------------------
    # Test 10: Employee cannot access POs
    # -------------------------------------------------------
    def test_employee_cannot_access_pos(self):
        self.auth('emp1')
        resp = self.client.get('/api/procurement/purchase-orders/')
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.data['count'], 0)