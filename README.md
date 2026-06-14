# Enterprise Procurement & Vendor Management Platform

A robust, enterprise-grade backend system built with **Django REST Framework (DRF)**, **PostgreSQL**, and **Docker** to streamline and manage corporate procurement workflows, purchase approvals, vendor registrations, RFQs, and budget tracking.

---

## 🚀 Completed Milestones

### **Day 1: Project Initialization & Infrastructure**
* Set up containerized environments using **Docker** and **Docker Compose**.
* Configured **PostgreSQL** as the core database with persistence.
* Designed the initial Entity-Relationship (ER) model encompassing Users, Departments, Purchase Requests, Items, Approvals, and Audit Logs.
* Established the backend project structure and installed core dependencies (`djangorestframework`, `simplejwt`, `psycopg2-binary`, etc.).

### **Day 2: Authentication & Custom Identity Management**
* Implemented a **Custom User Model** supporting enterprise roles:
  * `EMPLOYEE`
  * `MANAGER`
  * `PROCUREMENT`
  * `FINANCE`
  * `VENDOR`
  * `ADMIN`
* Created a **Department** model to track organizational divisions, their budgets, and assigned managers.
* Integrated stateless **JWT Authentication** (`djangorestframework-simplejwt`) for secure API communication.
* Added custom serializers and views for user registration (`/api/auth/register/`) and profile management (`/api/auth/profile/`).
* Registered custom models inside the Django Admin panel for convenient management.

---

## 🛠️ Prerequisites

Make sure you have the following installed on your local system:
* [Docker](https://docs.docker.com/get-docker/) & [Docker Compose](https://docs.docker.com/compose/install/) (for containerized setup)
* [Python 3.11+](https://www.python.org/downloads/) & [PostgreSQL](https://www.postgresql.org/download/) (for local setup)

---

## ⚙️ How to Setup & Run

### Option A: Using Docker & Docker Compose (Recommended)

1. **Configure Environment Variables**:
   Create a `.env` file in the `backend/` directory:
   ```bash
   cp backend/.env.example backend/.env
   ```
   Ensure settings match your Docker setup.

2. **Build and Start the Containers**:
   ```bash
   docker-compose up --build -d
   ```

3. **Run Migrations**:
   ```bash
   docker-compose exec web python manage.py migrate
   ```

4. **Create a Superuser**:
   ```bash
   docker-compose exec web python manage.py createsuperuser
   ```

---

### Option B: Running Locally (Without Docker)

1. **Start the Database**:
   Ensure you have a PostgreSQL server running locally, or start only the database service using Docker:
   ```bash
   docker-compose up -d db
   ```

2. **Configure Environment Variables**:
   Create a `.env` file in the `backend/` directory:
   ```bash
   cp backend/.env.example backend/.env
   ```
   Modify `backend/.env` to point to your local PostgreSQL instance. If using the Docker Postgres database (Option B, Step 1), configure:
   ```env
   DB_HOST=localhost
   DB_PORT=5434  # Port exposed by docker-compose for db service
   ```

3. **Set Up a Virtual Environment & Install Dependencies**:
   ```bash
   cd backend
   python3 -m venv venv
   source venv/bin/activate  # On Windows use: venv\Scripts\activate
   pip install -r requirements.txt
   ```

4. **Run Migrations**:
   ```bash
   python manage.py migrate
   ```

5. **Create a Superuser**:
   ```bash
   python manage.py createsuperuser
   ```

6. **Start the Development Server**:
   ```bash
   python manage.py runserver
   ```

---

## 🔑 Core API Endpoints (Auth Module)

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| **POST** | `/api/auth/register/` | Register a new user with a specified role | No |
| **POST** | `/api/auth/login/` | Obtain Access & Refresh tokens (JWT login) | No |
| **POST** | `/api/auth/login/refresh/` | Refresh the access token | No |
| **GET** | `/api/auth/profile/` | Fetch the current user's profile | Yes (Bearer Token) |
| **PATCH** | `/api/auth/profile/` | Update profile information | Yes (Bearer Token) |

---

## 🖥️ Port Configuration
* **Web Server**: `http://localhost:8000/`
* **Admin Dashboard**: `http://localhost:8000/admin/`
* **PostgreSQL Database**: Exposed locally on port `5434` (mapped to internal container port `5432`).