from django.test import TestCase
from unittest.mock import patch
from django.contrib.auth import get_user_model
from accounts.models import Department
from procurement.models import (
    PurchaseRequest, RequestItem, Vendor
)

User = get_user_model()


class NotificationTaskTest(TestCase):
    def setUp(self):
        self.dept = Department.objects.create(name='IT', budget=100000)
        self.employee = User.objects.create_user(
            'emp1', email='emp1@test.com',
            password='pass12345', role='EMPLOYEE',
            department=self.dept
        )
        self.manager = User.objects.create_user(
            'mgr1', email='mgr1@test.com',
            password='pass12345', role='MANAGER',
            department=self.dept
        )
        self.finance = User.objects.create_user(
            'fin1', email='fin1@test.com',
            password='pass12345', role='FINANCE'
        )
        self.vendor_user = User.objects.create_user(
            'vendor1', email='vendor1@test.com',
            password='pass12345', role='VENDOR'
        )
        self.vendor = Vendor.objects.create(
            user=self.vendor_user, company_name='TechCo',
            registration_number='V001', address='Addr',
            city='KTM', country='Nepal', status='ACTIVE'
        )

    @patch('notifications.tasks.send_email')
    def test_notify_manager_new_request(self, mock_send):
        mock_send.return_value = True

        pr = PurchaseRequest.objects.create(
            requester=self.employee,
            department=self.dept,
            title='Test Request',
            estimated_budget=10000,
            status='PENDING_APPROVAL'
        )
        RequestItem.objects.create(
            request=pr, item_name='Laptop',
            quantity=5, estimated_unit_price=2000
        )

        from notifications.tasks import notify_manager_new_request
        notify_manager_new_request(pr.id)

        mock_send.assert_called_once()
        call_args = mock_send.call_args
        self.assertIn('mgr1@test.com', call_args[1]['recipient_list'])
        self.assertIn('Action Required', call_args[1]['subject'])

    @patch('notifications.tasks.send_email')
    def test_notify_requester_approved(self, mock_send):
        mock_send.return_value = True

        from procurement.models import Approval
        pr = PurchaseRequest.objects.create(
            requester=self.employee,
            department=self.dept,
            title='Test Request',
            estimated_budget=10000,
            status='APPROVED'
        )
        Approval.objects.create(
            request=pr,
            approver=self.manager,
            action='APPROVED',
            comments='Looks good'
        )

        from notifications.tasks import notify_requester_approval_action
        notify_requester_approval_action(pr.id, 'APPROVED', 'Looks good')

        mock_send.assert_called_once()
        call_args = mock_send.call_args
        self.assertIn('emp1@test.com', call_args[1]['recipient_list'])
        self.assertIn('Approved', call_args[1]['subject'])

    @patch('notifications.tasks.send_email')
    def test_remind_pending_approvals(self, mock_send):
        mock_send.return_value = True

        from django.utils import timezone
        from datetime import timedelta

        pr = PurchaseRequest.objects.create(
            requester=self.employee,
            department=self.dept,
            title='Old Request',
            estimated_budget=5000,
            status='PENDING_APPROVAL'
        )
        # Manually set created_at to 3 days ago
        PurchaseRequest.objects.filter(id=pr.id).update(
            created_at=timezone.now() - timedelta(days=3)
        )

        from notifications.tasks import remind_pending_approvals
        remind_pending_approvals()

        mock_send.assert_called_once()
        call_args = mock_send.call_args
        self.assertIn('mgr1@test.com', call_args[1]['recipient_list'])

    @patch('notifications.tasks.send_email')
    def test_no_email_sent_when_no_pending(self, mock_send):
        from notifications.tasks import remind_pending_approvals
        remind_pending_approvals()
        mock_send.assert_not_called()