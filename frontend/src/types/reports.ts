export interface SpendSummary {
  total_spend: string
  total_transactions: number
  average_transaction: string
  largest_payment: string
  smallest_payment: string
}

export interface DepartmentSpend {
  department_name: string
  total_spend: string
  transaction_count: number
  average_spend: string
}

export interface MonthlySpend {
  month: string
  total_spend: string
  transaction_count: number
}

export interface VendorPerformance {
  vendor_id: number
  company_name: string
  city: string
  country: string
  rating: number
  total_bids: number
  awarded_bids: number
  win_rate_percent: number
  total_purchase_orders: number
  delivered_orders: number
  delivery_rate_percent: number
  total_invoiced_amount: number
}

export interface PipelineSummary {
  pipeline: Record<string, { count: number; total_budget: number }>
  approval_turnaround: {
    average_approval_hours: number
    total_approvals: number
  }
  rfq_to_po_cycle: {
    average_cycle_hours: number
    total_pos_analyzed: number
  }
}

export interface DashboardData {
  generated_at: string
  user_role: string
  [key: string]: any
}