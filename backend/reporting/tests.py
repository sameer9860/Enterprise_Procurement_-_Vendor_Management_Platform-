from django.test import TestCase
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model
from accounts.models import Department

User = get_user_model()


class ReportingTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.dept = Department.objects.create(name='IT', budget=100000)

        self.finance = User.objects.create_user(
            'fin1', email='fin1@test.com',
            password='pass12345', role='FINANCE'
        )
        self.procurement = User.objects.create_user(
            'proc1', email='proc1@test.com',
            password='pass12345', role='PROCUREMENT'
        )
        self.employee = User.objects.create_user(
            'emp1', email='emp1@test.com',
            password='pass12345', role='EMPLOYEE',
            department=self.dept
        )
        self.admin = User.objects.create_user(
            'admin1', email='admin1@test.com',
            password='pass12345', role='ADMIN'
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

    def test_dashboard_employee(self):
        self.auth('emp1')
        resp = self.client.get('/api/reports/dashboard/')
        self.assertEqual(resp.status_code, 200)
        self.assertIn('my_requests', resp.data)
        self.assertEqual(resp.data['user_role'], 'EMPLOYEE')

    def test_dashboard_finance(self):
        self.auth('fin1')
        resp = self.client.get('/api/reports/dashboard/')
        self.assertEqual(resp.status_code, 200)
        self.assertIn('invoices', resp.data)

    def test_dashboard_admin(self):
        self.auth('admin1')
        resp = self.client.get('/api/reports/dashboard/')
        self.assertEqual(resp.status_code, 200)
        self.assertIn('system_overview', resp.data)
        self.assertIn('financial_summary', resp.data)

    def test_spend_summary_finance_only(self):
        # Finance can access
        self.auth('fin1')
        resp = self.client.get('/api/reports/spend/summary/')
        self.assertEqual(resp.status_code, 200)

        # Employee cannot access
        self.auth('emp1')
        resp = self.client.get('/api/reports/spend/summary/')
        self.assertEqual(resp.status_code, 403)

    def test_vendor_performance_procurement_only(self):
        self.auth('proc1')
        resp = self.client.get('/api/reports/vendors/performance/')
        self.assertEqual(resp.status_code, 200)
        self.assertIsInstance(resp.data, list)

        self.auth('emp1')
        resp = self.client.get('/api/reports/vendors/performance/')
        self.assertEqual(resp.status_code, 403)

    def test_pipeline_all_roles(self):
        self.auth('emp1')
        resp = self.client.get('/api/reports/pipeline/')
        self.assertEqual(resp.status_code, 200)
        self.assertIn('pipeline', resp.data)

    def test_date_range_validation(self):
        self.auth('fin1')
        # end_date before start_date
        resp = self.client.get(
            '/api/reports/spend/summary/?start_date=2026-12-01&end_date=2026-01-01'
        )
        self.assertEqual(resp.status_code, 400)

    def test_excel_download(self):
        self.auth('fin1')
        resp = self.client.get('/api/reports/download/spend/excel/')
        self.assertEqual(resp.status_code, 200)
        self.assertIn(
            'spreadsheetml',
            resp['Content-Type']
        )

    def test_pdf_download(self):
        self.auth('fin1')
        resp = self.client.get('/api/reports/download/spend/pdf/')
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp['Content-Type'], 'application/pdf')

    def test_overdue_invoices(self):
        self.auth('fin1')
        resp = self.client.get('/api/reports/invoices/overdue/')
        self.assertEqual(resp.status_code, 200)
        self.assertIn('total_overdue', resp.data)
        self.assertIn('invoices', resp.data)
