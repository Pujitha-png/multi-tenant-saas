# API Documentation – Multi-Tenant SaaS Platform

## Base URL

```
/api
```

All endpoints are prefixed with `/api`.

---

## Authentication

This application uses **JWT (JSON Web Token)** based authentication.

### How Authentication Works

1. User logs in using email, password, and subdomain
2. Backend resolves tenant using subdomain
3. JWT is generated containing:

   * `userId`
   * `role`
   * `tenantId` (null for Super Admin)
4. Token must be sent in every authenticated request

### Auth Header Format

```
Authorization: Bearer <JWT_TOKEN>
```

### Roles

* `super_admin`
* `tenant_admin`
* `user`

---

## API List (19 Endpoints)

### 1. Health Check

* **Method:** GET
* **Endpoint:** `/health`
* **Auth Required:** ❌ No

**Response:**

```json
{
  "status": "ok",
  "database": "connected"
}
```

---

## Authentication APIs

### 2. Login

* **Method:** POST
* **Endpoint:** `/auth/login`
* **Auth Required:** ❌ No

**Request:**

```json
{
  "email": "admin@demo.com",
  "password": "Demo@123",
  "subdomain": "demo"
}
```

**Response:**

```json
{
  "token": "jwt_token_here",
  "user": {
    "id": 1,
    "email": "admin@demo.com",
    "role": "tenant_admin",
    "tenantId": 1
  }
}
```

---

### 3. Get Logged-in User

* **Method:** GET
* **Endpoint:** `/auth/me`
* **Auth Required:** ✅ Yes

**Response:**

```json
{
  "id": 1,
  "email": "admin@demo.com",
  "role": "tenant_admin",
  "tenantId": 1
}
```

---

## Tenant APIs (Super Admin Only)

### 4. Create Tenant

* **Method:** POST
* **Endpoint:** `/tenants`
* **Auth Required:** ✅ Yes (Super Admin)

**Request:**

```json
{
  "name": "Demo Company",
  "subdomain": "demo",
  "subscriptionPlan": "pro"
}
```

**Response:**

```json
{
  "id": 1,
  "name": "Demo Company",
  "status": "active"
}
```

---

### 5. Get All Tenants

* **Method:** GET
* **Endpoint:** `/tenants`
* **Auth Required:** ✅ Yes (Super Admin)

**Response:**

```json
[
  {
    "id": 1,
    "name": "Demo Company",
    "subdomain": "demo",
    "status": "active"
  }
]
```

---

### 6. Get Tenant by ID

* **Method:** GET
* **Endpoint:** `/tenants/:id`
* **Auth Required:** ✅ Yes (Super Admin)

**Response:**

```json
{
  "id": 1,
  "name": "Demo Company",
  "subdomain": "demo",
  "status": "active"
}
```

---

### 7. Update Tenant

* **Method:** PUT
* **Endpoint:** `/tenants/:id`
* **Auth Required:** ✅ Yes (Super Admin)

**Request:**

```json
{
  "status": "inactive"
}
```

**Response:**

```json
{
  "message": "Tenant updated successfully"
}
```

---

### 8. Delete Tenant

* **Method:** DELETE
* **Endpoint:** `/tenants/:id`
* **Auth Required:** ✅ Yes (Super Admin)

**Response:**

```json
{
  "message": "Tenant deleted successfully"
}
```

---

## User Management APIs

### 9. Create User

* **Method:** POST
* **Endpoint:** `/users`
* **Auth Required:** ✅ Yes (Tenant Admin)

**Request:**

```json
{
  "email": "user1@demo.com",
  "password": "User@123",
  "role": "user"
}
```

**Response:**

```json
{
  "id": 3,
  "email": "user1@demo.com",
  "role": "user"
}
```

---

### 10. Get All Users

* **Method:** GET
* **Endpoint:** `/users`
* **Auth Required:** ✅ Yes

**Response:**

```json
[
  {
    "id": 3,
    "email": "user1@demo.com",
    "role": "user"
  }
]
```

---

### 11. Get User by ID

* **Method:** GET
* **Endpoint:** `/users/:id`
* **Auth Required:** ✅ Yes

**Response:**

```json
{
  "id": 3,
  "email": "user1@demo.com",
  "role": "user"
}
```

---

### 12. Update User

* **Method:** PUT
* **Endpoint:** `/users/:id`
* **Auth Required:** ✅ Yes

**Request:**

```json
{
  "role": "tenant_admin"
}
```

**Response:**

```json
{
  "message": "User updated successfully"
}
```

---

### 13. Delete User

* **Method:** DELETE
* **Endpoint:** `/users/:id`
* **Auth Required:** ✅ Yes

**Response:**

```json
{
  "message": "User deleted successfully"
}
```

---

## Project APIs

### 14. Create Project

* **Method:** POST
* **Endpoint:** `/projects`
* **Auth Required:** ✅ Yes

**Request:**

```json
{
  "name": "Project Alpha",
  "description": "First demo project"
}
```

**Response:**

```json
{
  "id": 1,
  "name": "Project Alpha"
}
```

---

### 15. Get Projects

* **Method:** GET
* **Endpoint:** `/projects`
* **Auth Required:** ✅ Yes

**Response:**

```json
[
  {
    "id": 1,
    "name": "Project Alpha"
  }
]
```

---

### 16. Update Project

* **Method:** PUT
* **Endpoint:** `/projects/:id`
* **Auth Required:** ✅ Yes

**Request:**

```json
{
  "name": "Updated Project Alpha"
}
```

**Response:**

```json
{
  "message": "Project updated successfully"
}
```

---

### 17. Delete Project

* **Method:** DELETE
* **Endpoint:** `/projects/:id`
* **Auth Required:** ✅ Yes

**Response:**

```json
{
  "message": "Project deleted successfully"
}
```

---

## Task APIs

### 18. Create Task

* **Method:** POST
* **Endpoint:** `/projects/:projectId/tasks`
* **Auth Required:** ✅ Yes

**Request:**

```json
{
  "title": "Design UI",
  "description": "Create dashboard UI",
  "assignedTo": 3
}
```

**Response:**

```json
{
  "id": 10,
  "title": "Design UI",
  "status": "pending"
}
```

---

### 19. Update Task Status

* **Method:** PUT
* **Endpoint:** `/projects/:projectId/tasks/:taskId`
* **Auth Required:** ✅ Yes

**Request:**

```json
{
  "status": "completed"
}
```

**Response:**

```json
{
  "id": 10,
  "status": "completed"
}
```

---

**Authorization Rules**

Super Admin can access all tenants
Tenant Admin is restricted to own tenant
Users can only access assigned resources
Cross-tenant access returns 403 Forbidden

## Error Response Format

```json
{
  "error": "Unauthorized",
  "message": "Invalid or missing token"
}
```
