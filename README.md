# Multi-Tenant SaaS Platform

## Project Title and Description

### Multi-Tenant SaaS Platform

**Description:**
A full-stack **Multi-Tenant SaaS application** designed to demonstrate tenant isolation, role-based access control, and scalable architecture. The platform allows a **Super Admin** to manage multiple tenants, while each tenant independently manages users, projects, and tasks within strict data boundaries.

**Target Audience:**

* SaaS product engineers
* Full-stack developers
* System design evaluators
* Organizations exploring multi-tenant architectures

---

## Features

* Super Admin system-level access
* Confirmed multi-tenant architecture with strict data isolation
* Tenant registration and subdomain-based access
* Role-based access control (Super Admin, Tenant Admin, User)
* User management per tenant
* Project and task management
* Secure JWT-based authentication
* Dockerized full-stack environment
* Automatic database migrations and seeding
* Health check and monitoring endpoints

---


## Technology Stack

### Frontend

* React 18
* Vite
* Axios
* React Router DOM

### Backend

* Node.js 18
* Express.js 4
* JWT Authentication (`jsonwebtoken`)
* bcrypt for password hashing
* Native PostgreSQL driver (`pg`)

### Database

* PostgreSQL 15

### DevOps & Containerization

* Docker
* Docker Compose

---

## Architecture Overview

This application follows a **containerized microservice-style architecture** using Docker Compose.

* Frontend communicates with backend via REST APIs
* Backend enforces tenant isolation using tenant_id scoping
* PostgreSQL database stores all tenant data with strict foreign key constraints

**Multi-Tenancy Approach:**

* Shared database
* Separate tenant data using `tenant_id`
* Super Admin has global visibility

### Architecture Diagram

![System Architecture](docs/images/system_architecture.png)

---

## Installation & Setup

### Prerequisites

* Docker Desktop
* Docker Compose
* Node.js (optional for local dev)

### Local Setup

```bash
git clone https://github.com/Pujitha-png/multi-tenant-saas.git
cd multi-tenant-saas
```

### Environment Setup

```bash
cp .env.example .env
```

### Start Application

```bash
docker-compose up -d
```

### Database Migrations

Migrations run automatically when the backend container starts.

### Seed Database

Seed data is loaded automatically via `seed_data.sql` during container startup.

### Backend URL

```
http://localhost:5000/api
```

### Frontend URL

```
http://localhost:3000
```

---

## Environment Variables

### Backend

| Variable     | Description         |
| ------------ | ------------------- |
| PORT         | Backend server port |
| DB_HOST      | Database hostname   |
| DB_PORT      | Database port       |
| DB_NAME      | Database name       |
| DB_USER      | Database username   |
| DB_PASSWORD  | Database password   |
| JWT_SECRET   | JWT signing secret  |
| FRONTEND_URL | Allowed CORS origin |

### Frontend

| Variable     | Description          |
| ------------ | -------------------- |
| VITE_API_URL | Backend API base URL |

---

## API Documentation

This project provides complete API documentation in Markdown format.

* 📄 **API Docs:** `docs/API.md`
* Includes all endpoints, authentication details, and request/response examples

---

* 📄 [API Documentation](docs/API.md)

---

## Demo Video

The demo video covers:

* Architecture walkthrough
* Multi-tenancy & data isolation
* Docker-based application startup
* Tenant, user, project, and task management
* Role-based access control demonstration

---

🎥 **YouTube Demo:** *(Add link here after upload)*

---
