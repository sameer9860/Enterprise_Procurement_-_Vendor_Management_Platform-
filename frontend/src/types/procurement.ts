export type RequestStatus =
  | 'PENDING_APPROVAL'
  | 'APPROVED'
  | 'REJECTED'
  | 'CHANGES_REQUESTED'
  | 'RFQ_CREATED'
  | 'VENDOR_SELECTED'
  | 'PO_GENERATED'
  | 'INVOICE_RECEIVED'
  | 'COMPLETED'
  | 'CANCELLED'

export type POStatus =
  | 'DRAFT'
  | 'SENT'
  | 'ACKNOWLEDGED'
  | 'IN_PROGRESS'
  | 'DELIVERED'
  | 'CANCELLED'

export type InvoiceStatus =
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'APPROVED'
  | 'REJECTED'
  | 'PAID'

export type VendorStatus =
  | 'PENDING'
  | 'ACTIVE'
  | 'SUSPENDED'
  | 'BLACKLISTED'

export type BidStatus =
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'SHORTLISTED'
  | 'REJECTED'
  | 'AWARDED'

// ── Request ──
export interface RequestItem {
  id: number
  item_name: string
  quantity: number
  estimated_unit_price: string
  specifications: string
  estimated_total: string
}

export interface PurchaseRequest {
  id: number
  title: string
  description: string
  requester: number
  requester_name: string
  department: number
  department_name: string
  estimated_budget: string
  status: RequestStatus
  items: RequestItem[]
  created_at: string
  updated_at: string
}

export interface PurchaseRequestList {
  id: number
  title: string
  requester_name: string
  department_name: string
  estimated_budget: string
  status: RequestStatus
  item_count: number
  created_at: string
}

// ── Approval ──
export interface Approval {
  id: number
  request: number
  approver: number
  approver_name: string
  action: 'APPROVED' | 'REJECTED' | 'CHANGES_REQUESTED'
  comments: string
  created_at: string
}

// ── Vendor ──
export interface VendorCategory {
  id: number
  name: string
  description: string
}

export interface VendorDocument {
  id: number
  document_type: string
  file_name: string
  file_url: string
  uploaded_at: string
}

export interface Vendor {
  id: number
  user: number
  user_email: string
  company_name: string
  registration_number: string
  address: string
  city: string
  country: string
  website: string
  tax_number: string
  status: VendorStatus
  rating: string
  categories: VendorCategory[]
  documents: VendorDocument[]
  verified_at: string | null
  created_at: string
}

export interface VendorList {
  id: number
  company_name: string
  city: string
  country: string
  status: VendorStatus
  rating: string
  category_names: string[]
}

// ── RFQ ──
export interface RFQItem {
  id: number
  item_name: string
  quantity: number
  specifications: string
  estimated_unit_price: string
}

export interface RFQ {
  id: number
  rfq_number: string
  title: string
  description: string
  purchase_request: number
  purchase_request_title: string
  deadline: string
  status: 'OPEN' | 'CLOSED' | 'AWARDED' | 'CANCELLED'
  items: RFQItem[]
  invited_vendors: number[]
  invited_vendor_names: string[]
  created_by: number
  created_by_name: string
  created_at: string
  updated_at: string
}

export interface RFQList {
  id: number
  rfq_number: string
  title: string
  status: string
  deadline: string
  purchase_request_title: string
  bid_count: number
  created_at: string
}

// ── Bid ──
export interface BidItem {
  id: number
  rfq_item: number
  rfq_item_name: string
  unit_price: string
  quantity: number
  total_price: string
}

export interface Bid {
  id: number
  rfq: number
  rfq_number: string
  vendor: number
  vendor_name: string
  total_amount: string
  delivery_days: number
  validity_days: number
  notes: string
  status: BidStatus
  items: BidItem[]
  submitted_at: string
  updated_at: string
}

export interface BidComparison {
  id: number
  vendor_name: string
  vendor_rating: string
  total_amount: string
  delivery_days: number
  validity_days: number
  notes: string
  status: BidStatus
  items: BidItem[]
  savings_vs_budget: {
    amount: string
    percentage: string
  }
  rank: number
  submitted_at: string
}

// ── Purchase Order ──
export interface POItem {
  id: number
  item_name: string
  quantity: number
  unit_price: string
  total_price: string
  specifications: string
}

export interface PurchaseOrder {
  id: number
  po_number: string
  purchase_request: number
  purchase_request_title: string
  awarded_bid: number
  vendor: number
  vendor_name: string
  vendor_address: string
  status: POStatus
  delivery_address: string
  expected_delivery_date: string
  special_instructions: string
  total_amount: string
  pdf_url: string
  created_by: number
  created_by_name: string
  sent_at: string | null
  acknowledged_at: string | null
  items: POItem[]
  created_at: string
  updated_at: string
}

export interface POList {
  id: number
  po_number: string
  vendor_name: string
  purchase_request_title: string
  total_amount: string
  status: POStatus
  expected_delivery_date: string
  created_at: string
}

// ── Invoice ──
export interface InvoiceItem {
  id: number
  description: string
  quantity: number
  unit_price: string
  total_price: string
}

export interface Payment {
  id: number
  invoice: number
  amount_paid: string
  payment_method: string
  payment_reference: string
  payment_date: string
  notes: string
  processed_by: number
  processed_by_name: string
  created_at: string
}

export interface Invoice {
  id: number
  invoice_number: string
  purchase_order: number
  po_number: string
  vendor: number
  vendor_name: string
  status: InvoiceStatus
  amount: string
  invoice_date: string
  due_date: string
  file_name: string
  file_url: string
  notes: string
  rejection_reason: string
  submitted_at: string
  reviewed_at: string | null
  reviewed_by: number | null
  reviewed_by_name: string | null
  approved_at: string | null
  approved_by: number | null
  approved_by_name: string | null
  paid_at: string | null
  paid_by: number | null
  paid_by_name: string | null
  items: InvoiceItem[]
  payment: Payment | null
  created_at: string
  updated_at: string
}

export interface InvoiceList {
  id: number
  invoice_number: string
  po_number: string
  vendor_name: string
  amount: string
  status: InvoiceStatus
  invoice_date: string
  due_date: string
  submitted_at: string
}
