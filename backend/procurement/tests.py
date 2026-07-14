from django.test import TestCase
from rest_framework.test import APIClient
from .models import (
    PurchaseRequest, Approval, RFQ, Bid,
    PurchaseOrder, POItem, Invoice, InvoiceItem,
    Vendor
)
from accounts.models import User, Department

class InvoiceTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.dept = Department.objects.create(name='IT', budget=100000)

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
            user=self.vendor_user, company_name='TechCo',
            registration_number='V001', address='Addr',
            city='KTM', country='Nepal', status='ACTIVE'
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

    def create_delivered_po(self):
        """Helper — runs through phases 1-4 to get a delivered PO"""
        # Request + approval
        self.auth('emp1')
        resp = self.client.post('/api/procurement/requests/', {
            "title": "50 Laptops", "estimated_budget": 50000,
            "items": [{"item_name": "Dell", "quantity": 50, "estimated_unit_price": 1000}]
        }, format='json')
        request_id = resp.data['id']

        self.auth('mgr1')
        self.client.post(
            f'/api/procurement/requests/{request_id}/approve_action/',
            {"action": "APPROVED"}, format='json'
        )

        # RFQ
        self.auth('proc1')
        resp = self.client.post('/api/procurement/rfqs/create_from_request/', {
            "request_id": request_id,
            "deadline": "2026-12-31T17:00:00Z"
        }, format='json')
        rfq_id = resp.data['id']
        rfq_item_id = resp.data['items'][0]['id']

        # Bid
        self.auth('vendor1')
        resp = self.client.post('/api/procurement/bids/', {
            "rfq": rfq_id, "total_amount": 48000, "delivery_days": 14,
            "items": [{"rfq_item": rfq_item_id, "unit_price": 960, "quantity": 50}]
        }, format='json')
        bid_id = resp.data['id']

        # Award
        self.auth('proc1')
        self.client.post(f'/api/procurement/rfqs/{rfq_id}/close_rfq/')
        self.client.post(f'/api/procurement/bids/{bid_id}/award_bid/')

        # Generate PO
        resp = self.client.post('/api/procurement/purchase-orders/generate_po/', {
            "bid_id": bid_id,
            "delivery_address": "123 Main St",
            "expected_delivery_date": "2026-08-15"
        }, format='json')
        po_id = resp.data['id']

        # Send + acknowledge
        self.client.post(f'/api/procurement/purchase-orders/{po_id}/send_to_vendor/')
        self.auth('vendor1')
        self.client.post(f'/api/procurement/purchase-orders/{po_id}/acknowledge/')

        return po_id

    # -------------------------------------------------------
    # Test 1: Vendor submits invoice
    # -------------------------------------------------------
    def test_submit_invoice(self):
        po_id = self.create_delivered_po()

        self.auth('vendor1')
        resp = self.client.post('/api/procurement/invoices/submit_invoice/', {
            "purchase_order_id": po_id,
            "amount": "48000.00",
            "invoice_date": "2026-07-08",
            "due_date": "2026-08-08",
            "notes": "Please process payment",
            "items": [
                {"description": "Dell Laptop x50", "quantity": 50, "unit_price": "960.00"}
            ]
        }, format='json')

        self.assertEqual(resp.status_code, 201)
        self.assertTrue(resp.data['invoice_number'].startswith('INV-'))
        self.assertEqual(resp.data['status'], 'SUBMITTED')

        # PurchaseRequest status should be INVOICE_RECEIVED
        from .models import PurchaseRequest, PurchaseOrder
        pr = PurchaseOrder.objects.get(id=po_id).purchase_request
        self.assertEqual(pr.status, 'INVOICE_RECEIVED')

    # -------------------------------------------------------
    # Test 2: Cannot submit duplicate invoice
    # -------------------------------------------------------
    def test_cannot_submit_duplicate_invoice(self):
        po_id = self.create_delivered_po()

        self.auth('vendor1')
        payload = {
            "purchase_order_id": po_id,
            "amount": "48000.00",
            "invoice_date": "2026-07-08",
            "due_date": "2026-08-08"
        }
        self.client.post(
            '/api/procurement/invoices/submit_invoice/',
            payload, format='json'
        )
        resp = self.client.post(
            '/api/procurement/invoices/submit_invoice/',
            payload, format='json'
        )
        self.assertEqual(resp.status_code, 400)
        self.assertIn('already exists', resp.data['error'])

    # -------------------------------------------------------
    # Test 3: Full finance review workflow
    # -------------------------------------------------------
    def test_full_review_workflow(self):
        po_id = self.create_delivered_po()

        self.auth('vendor1')
        resp = self.client.post('/api/procurement/invoices/submit_invoice/', {
            "purchase_order_id": po_id,
            "amount": "48000.00",
            "invoice_date": "2026-07-08",
            "due_date": "2026-08-08"
        }, format='json')
        invoice_id = resp.data['id']

        # Finance marks under review
        self.auth('fin1')
        resp = self.client.post(
            f'/api/procurement/invoices/{invoice_id}/mark_under_review/'
        )
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.data['status'], 'UNDER_REVIEW')

        # Finance approves
        resp = self.client.post(
            f'/api/procurement/invoices/{invoice_id}/review_invoice/',
            {"action": "APPROVE"}, format='json'
        )
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.data['status'], 'APPROVED')

        # Finance records payment
        resp = self.client.post(
            f'/api/procurement/invoices/{invoice_id}/record_payment/',
            {
                "amount_paid": "48000.00",
                "payment_method": "BANK_TRANSFER",
                "payment_reference": "TXN-2026-001",
                "payment_date": "2026-07-10"
            }, format='json'
        )
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.data['status'], 'PAID')
        self.assertEqual(resp.data['purchase_request_status'], 'COMPLETED')

    # -------------------------------------------------------
    # Test 4: Reject invoice requires reason
    # -------------------------------------------------------
    def test_reject_requires_reason(self):
        po_id = self.create_delivered_po()

        self.auth('vendor1')
        resp = self.client.post('/api/procurement/invoices/submit_invoice/', {
            "purchase_order_id": po_id,
            "amount": "48000.00",
            "invoice_date": "2026-07-08",
            "due_date": "2026-08-08"
        }, format='json')
        invoice_id = resp.data['id']

        self.auth('fin1')
        resp = self.client.post(
            f'/api/procurement/invoices/{invoice_id}/review_invoice/',
            {"action": "REJECT"},
            format='json'
        )
        self.assertEqual(resp.status_code, 400)

    # -------------------------------------------------------
    # Test 5: Wrong payment amount blocked
    # -------------------------------------------------------
    def test_wrong_payment_amount_blocked(self):
        po_id = self.create_delivered_po()

        self.auth('vendor1')
        resp = self.client.post('/api/procurement/invoices/submit_invoice/', {
            "purchase_order_id": po_id,
            "amount": "48000.00",
            "invoice_date": "2026-07-08",
            "due_date": "2026-08-08"
        }, format='json')
        invoice_id = resp.data['id']

        self.auth('fin1')
        self.client.post(
            f'/api/procurement/invoices/{invoice_id}/review_invoice/',
            {"action": "APPROVE"}, format='json'
        )

        # Wrong amount
        resp = self.client.post(
            f'/api/procurement/invoices/{invoice_id}/record_payment/',
            {
                "amount_paid": "45000.00",
                "payment_method": "BANK_TRANSFER",
                "payment_date": "2026-07-10"
            }, format='json'
        )
        self.assertEqual(resp.status_code, 400)
        self.assertIn('does not match', resp.data['error'])

    # -------------------------------------------------------
    # Test 6: Timeline
    # -------------------------------------------------------
    def test_invoice_timeline(self):
        po_id = self.create_delivered_po()

        self.auth('vendor1')
        resp = self.client.post('/api/procurement/invoices/submit_invoice/', {
            "purchase_order_id": po_id,
            "amount": "48000.00",
            "invoice_date": "2026-07-08",
            "due_date": "2026-08-08"
        }, format='json')
        invoice_id = resp.data['id']

        self.auth('fin1')
        self.client.post(
            f'/api/procurement/invoices/{invoice_id}/review_invoice/',
            {"action": "APPROVE"}, format='json'
        )

        resp = self.client.get(
            f'/api/procurement/invoices/{invoice_id}/timeline/'
        )
        self.assertEqual(resp.status_code, 200)
        self.assertIn('timeline', resp.data)
        self.assertGreater(len(resp.data['timeline']), 0)

    # -------------------------------------------------------
    # Test 7: Summary stats
    # -------------------------------------------------------
    def test_invoice_summary(self):
        po_id = self.create_delivered_po()

        self.auth('vendor1')
        self.client.post('/api/procurement/invoices/submit_invoice/', {
            "purchase_order_id": po_id,
            "amount": "48000.00",
            "invoice_date": "2026-07-08",
            "due_date": "2026-08-08"
        }, format='json')

        self.auth('fin1')
        resp = self.client.get('/api/procurement/invoices/summary/')
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.data['total_invoices'], 1)
        self.assertEqual(resp.data['by_status']['submitted'], 1)