# Procurement Platform — Frontend

Next.js 14 + TypeScript frontend for the Enterprise Procurement & Vendor Management Platform.

## Tech Stack
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS + shadcn/ui
- **State**: Zustand
- **Data Fetching**: TanStack Query
- **Forms**: React Hook Form + Zod
- **Charts**: Recharts
- **Auth**: JWT (httpOnly cookies)

## Setup

```bash
cd frontend
npm install
cp .env.example .env.local
# Set NEXT_PUBLIC_API_URL=http://localhost:8000/api
npm run dev
```

## User Roles
| Role | Access |
|------|--------|
| EMPLOYEE | Create purchase requests |
| MANAGER | Approve requests |
| PROCUREMENT | RFQs, POs, vendors |
| FINANCE | Invoices, payments |
| VENDOR | Bids, POs, invoices |
| ADMIN | Full access |

## Project Structure
```
src/
├── app/          # Next.js App Router pages
├── components/   # Reusable components
├── hooks/        # Custom React hooks
├── lib/api/      # API client functions
├── store/        # Zustand stores
└── types/        # TypeScript interfaces
```
