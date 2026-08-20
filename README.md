# Enterprise Procurement & Vendor Management Platform

A modern, full-stack enterprise platform built with **Next.js 14 (App Router)**, **TypeScript**, **Django REST Framework (DRF)**, and **PostgreSQL**. Designed to streamline corporate procurement workflows, purchase approvals, vendor onboarding & evaluation, competitive RFQ bidding, purchase order tracking, invoice processing, and financial reporting.

---

## 🌟 Platform Highlights & Features

- 🔐 **Role-Based Access Control (RBAC)**: Support for 6 distinct roles (`EMPLOYEE`, `MANAGER`, `PROCUREMENT`, `FINANCE`, `VENDOR`, `ADMIN`).
- 📝 **Purchase Request Workflow**: Dynamic multi-item request submission with auto-calculated budgets, manager approval, and change request feedback loops.
- 🎯 **RFQ & Competitive Bidding System**: Open RFQ creation, public/invited vendor participation, sealed bid submission, side-by-side bid comparison, and automated bid awarding.
- 📦 **Purchase Order Lifecycle**: Multi-status PO generation, vendor acknowledgement, item delivery tracking, and automated completion updates.
- 💳 **Invoice & Payment Processing**: Multi-file invoice uploads, finance review & approval, line-item verification, and payment recording (Bank Transfer, Cheque, Online, Cash).
- 📊 **Executive Analytics & Reporting**: Interactive Recharts analytics (monthly spend trends, department breakdown pie charts, quarterly bars, vendor performance rankings, and process cycle metrics).
- 📄 **Export & Async Reports**: Instant Excel workbook exports (6 sheets) and PDF reports, plus background Celery report generation with email notifications.
- 🛡️ **Audit Logging & Security**: Automated audit log tracking for system actions with model filtering, IP address recording, and security controls.
- 🎨 **Modern UX/UI**: Mobile-first responsive layout with touch swipe-to-close sidebar, animated skeleton loaders, standardized `ApiError` boundary, and persistent Dark Mode.

---

## 🛠️ Tech Stack

### **Frontend**
- **Framework**: Next.js 14 (App Router, Client & Server Components)
- **Language**: TypeScript
- **Styling**: Tailwind CSS + shadcn/ui
- **State Management**: Zustand (with persistent storage & hydration handlers)
- **Data Fetching & Caching**: TanStack Query v5
- **Forms & Validation**: React Hook Form + Zod
- **Charts & Visualizations**: Recharts
- **Icons**: Lucide React

### **Backend**
- **Framework**: Django REST Framework (DRF) 3.14+
- **Language**: Python 3.11+
- **Database**: PostgreSQL 15
- **Authentication**: SimpleJWT (Stateless JWT with httpOnly cookies support)
- **Async Tasks & Queues**: Celery + Redis
- **Containerization**: Docker & Docker Compose

---

## 👥 User Roles & Capabilities

| Role | Access & Key Features |
| :--- | :--- |
| **EMPLOYEE** | Create and track purchase requests, resubmit modified requests, view request status. |
| **MANAGER** | Review pending team requests, approve/reject/request changes with comments, monitor department spending. |
| **PROCUREMENT** | Convert approved requests into RFQs, compare vendor bids side-by-side, award bids, generate and send Purchase Orders, manage vendor verifications. |
| **FINANCE** | Review submitted invoices, approve/reject invoices against POs, record payment transactions, export spend reports. |
| **VENDOR** | View open RFQs, submit competitive bids, acknowledge POs, submit invoices with file attachments, manage vendor profile & compliance documents. |
| **ADMIN** | Full system administration, user management, audit logs, system-wide metrics, vendor verification overrides. |

---

## 📂 Project Architecture

```
├── backend/
│   ├── accounts/             # Authentication, Users, Departments
│   ├── procurement/          # Purchase Requests, RFQs, Bids, POs, Invoices, Vendors
│   ├── audit/                # System Action Audit Logging
│   ├── reporting/            # Spend Summary, Analytics, Excel/PDF Generators
│   ├── config/               # Project Settings, URLs, Celery Config
│   ├── Dockerfile
│   └── requirements.txt
│
├── frontend/
│   ├── src/
│   │   ├── app/              # Next.js App Router (Dashboard, Auth, Reports, etc.)
│   │   ├── components/       # UI Components (Layout, Dashboard, Shared, Skeletons)
│   │   ├── hooks/            # Custom Hooks (useAuth, useRBAC, etc.)
│   │   ├── lib/api/          # Axios API Client Modules (requests, rfqs, bids, pos, invoices, reports)
│   │   ├── store/            # Zustand State Stores (authStore)
│   │   └── types/            # TypeScript Interfaces (procurement, auth, reports)
│   ├── package.json
│   └── tailwind.config.ts
│
└── docker-compose.yml
```

---

## ⚙️ How to Setup & Run

### 1. Clone the Repository

```bash
git clone https://github.com/sameer9860/Enterprise_Procurement_-_Vendor_Management_Platform-.git
cd Enterprise_Procurement_-_Vendor_Management_Platform-
```

---

### 2. Backend Setup

#### **Option A: Using Docker & Docker Compose (Recommended)**

```bash
# Navigate to backend directory and configure environment variables
cp backend/.env.example backend/.env

# Build and start services (Postgres, Django API, Redis, Celery)
docker-compose up --build -d

# Run database migrations
docker-compose exec web python manage.py migrate

# Create initial admin superuser
docker-compose exec web python manage.py createsuperuser
```

#### **Option B: Running Locally (Without Docker / Virtual Environment)**

1. **Start PostgreSQL & Redis**:
   Ensure PostgreSQL server and Redis are installed and running locally on your machine.

2. **Configure Environment Variables**:
   ```bash
   cp backend/.env.example backend/.env
   ```
   Update `backend/.env` with your local PostgreSQL credentials:
   ```env
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=procurement_db
   DB_USER=postgres
   DB_PASSWORD=your_password
   ```

3. **Create Virtual Environment & Install Dependencies**:
   ```bash
   cd backend
   python3 -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   ```

4. **Run Migrations & Create Superuser**:
   ```bash
   python manage.py migrate
   python manage.py createsuperuser
   ```

5. **Start Development Server**:
   ```bash
   python manage.py runserver
   ```

*Backend server will run at*: `http://localhost:8000/`  
*API Base URL*: `http://localhost:8000/api/`  
*Admin Panel*: `http://localhost:8000/admin/`

---

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env.local
# Ensure NEXT_PUBLIC_API_URL=http://localhost:8000/api

# Start Next.js development server
npm run dev
```

*Frontend web app will run at*: `http://localhost:3000/`

---

## 🧪 Verification & Type Safety

To verify frontend TypeScript compilation across all 40+ pages and components:

```bash
cd frontend
npx tsc --noEmit
```

To run backend Django tests:

```bash
cd backend
python manage.py test
```

---

## 📜 License

This project is licensed under the MIT License.