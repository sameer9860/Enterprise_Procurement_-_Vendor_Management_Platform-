'use client';

import { useRBAC } from '@/hooks/useRBAC';
import EmployeeDashboard from '@/components/dashboard/EmployeeDashboard';
import ManagerDashboard from '@/components/dashboard/ManagerDashboard';
import ProcurementDashboard from '@/components/dashboard/ProcurementDashboard';
import FinanceDashboard from '@/components/dashboard/FinanceDashboard';
import VendorDashboard from '@/components/dashboard/VendorDashboard';
import AdminDashboard from '@/components/dashboard/AdminDashboard';
import LoadingSpinner from '@/components/shared/LoadingSpinner';

export default function DashboardPage() {
  const { user, role } = useRBAC();

  if (!user) return <LoadingSpinner text="Loading dashboard..." />;

  switch (role) {
    case 'EMPLOYEE':
      return <EmployeeDashboard />;
    case 'MANAGER':
      return <ManagerDashboard />;
    case 'PROCUREMENT':
      return <ProcurementDashboard />;
    case 'FINANCE':
      return <FinanceDashboard />;
    case 'VENDOR':
      return <VendorDashboard />;
    case 'ADMIN':
      return <AdminDashboard />;
    default:
      return <div>Unknown role</div>;
  }
}
