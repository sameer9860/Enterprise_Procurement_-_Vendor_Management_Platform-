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
* [Docker](https://docs.docker.com/get-docker/)
* [Docker Compose](https://docs.docker.com/compose/install/)

---

## ⚙️ How to Setup & Run

### 1. Configure Environment Variables
Create a `.env` file in the `backend/` directory by copying the example environment file:
```bash
cp backend/.env.example backend/.env
```
Ensure the database credentials match your docker-compose settings.

### 2. Build and Start the Containers
Spin up the PostgreSQL database and Django web server containers:
```bash
docker-compose up --build -d
```

### 3. Run Database Migrations
Apply the initial migrations to prepare the database schema:
```bash
docker-compose exec web python manage.py migrate
```

### 4. Create an Administrator (Superuser)
Create an admin account to access the Django Admin panel:
```bash
docker-compose exec web python manage.py createsuperuser
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