Research Document

Multi-Tenant SaaS Application

1. Multi-Tenancy Analysis
Multi-tenancy is a core architectural concept in Software-as-a-Service (SaaS) applications where a single application instance serves multiple organizations (tenants) while ensuring data isolation, security, and performance. Choosing the correct multi-tenancy approach is critical, as it directly impacts scalability, cost, complexity, and security.

There are three commonly used multi-tenancy approaches in modern SaaS systems. Each has advantages and trade-offs.

1.1 Shared Database + Shared Schema (Tenant ID Column)

In this approach, all tenants share the same database and the same set of tables. Each table includes a tenant_id column that identifies which tenant owns a particular record. All application queries are filtered by tenant_id to ensure data isolation.

Pros:
Cost-effective, as only one database instance is required.
Easier to scale horizontally.
Simplified database management and migrations.
Ideal for early-stage and mid-scale SaaS products.
Efficient resource utilization.

Cons:
Requires strict enforcement of tenant isolation in application logic.
A bug in query filtering can expose data across tenants.
More complex authorization logic at the application layer.

1.2 Shared Database + Separate Schema (Per Tenant)
In this approach, all tenants share the same database server, but each tenant has its own database schema. Tables are duplicated per schema, but data is isolated at the schema level.

Pros:
Better isolation compared to shared schema.
Reduced risk of cross-tenant data leakage.
Per-tenant schema customization is possible.

Cons:
Schema management becomes complex as the number of tenants grows.
Database migrations must be applied to every schema.
Harder to scale when supporting many tenants.
Increased operational overhead.

1.3 Separate Database Per Tenant
In this approach, each tenant has its own dedicated database. The application dynamically connects to the correct database based on tenant context.

Pros:
Strongest data isolation.
Simplifies compliance and regulatory requirements.
Per-tenant database tuning and backups are possible.

Cons:
High operational and infrastructure cost.
Complex connection management.
Difficult to manage migrations at scale.
Not ideal for small or medium SaaS platforms.

1.4 Comparison Table
Approach	Cost	Scalability	Isolation	Complexity
Shared DB + Shared Schema	Low	High	Medium	Medium
Shared DB + Separate Schema	Medium	Medium	High	High
Separate Database	High	Low–Medium	Very High	Very High

1.5 Chosen Approach and Justification
For this project, Shared Database + Shared Schema with tenant_id has been selected.

This approach is widely used by production-grade SaaS platforms due to its balance of scalability, cost efficiency, and simplicity. Given the project constraints (time, evaluation requirements, and Dockerized deployment), this model is the most practical. Data isolation is enforced strictly at the application level using middleware and JWT-based tenant context, ensuring that tenants cannot access data belonging to others.

This approach also aligns well with subscription enforcement, RBAC, and audit logging requirements, making it suitable for a multi-tenant task and project management system.



2. Technology Stack Justification
Choosing the right technology stack is essential to ensure maintainability, performance, and ease of development. The selected stack prioritizes simplicity, industry acceptance, and compatibility with Docker-based deployment.

2.1 Backend Framework: Node.js + Express
Node.js with Express has been chosen as the backend framework.

Reasons for selection:
Lightweight and fast for building RESTful APIs.
Simple middleware system, ideal for authentication and RBAC.
Large ecosystem and community support.
Easy integration with PostgreSQL and JWT.
Minimal boilerplate, suitable for a tight development timeline.

Express provides full control without unnecessary abstraction, making it ideal for this project.

2.2 Frontend Framework: React
React is used for frontend development.
Reasons for selection:
Component-based architecture.
Easy state management for authentication and roles.
Large ecosystem and tooling support.
Excellent for building responsive, role-based user interfaces.

Alternatives considered:
Angular (steeper learning curve)
Vue.js (smaller ecosystem)
Plain HTML/CSS (not scalable for role-based UI)

2.3 Database: PostgreSQL
PostgreSQL is selected as the relational database.
Reasons for selection:
Strong ACID compliance.
Excellent support for foreign keys and transactions.
Advanced indexing capabilities.
Ideal for multi-tenant relational data models.
Alternatives considered:
MySQL (less strict transactional guarantees)
MongoDB (not ideal for relational constraints)

2.4 Authentication Method: JWT
JSON Web Tokens (JWT) are used for authentication.
Reasons for selection:
Stateless authentication.
Scales well in distributed systems.
Simple integration with Express middleware.

Suitable for REST APIs.
Tokens have a 24-hour expiry, balancing security and usability.

2.5 Deployment Platform: Docker & Docker Compose
Docker is used to containerize:
PostgreSQL database
Backend API
Frontend application

Reasons for selection:
Consistent environments across machines.
One-command deployment.
Mandatory requirement for evaluation.
Simplifies dependency management.


3. Security Considerations
Security is critical in multi-tenant systems because multiple organizations share the same infrastructure.

3.1 Data Isolation Strategy
Data isolation is enforced using a tenant_id column in all tenant-specific tables. The tenant_id is derived from the authenticated JWT token and never accepted from the client request body. Every database query is filtered by tenant_id, ensuring complete tenant separation.

3.2 Authentication and Authorization
Authentication is handled using JWTs with a 24-hour expiry. Authorization is enforced using role-based access control (RBAC) middleware that checks user roles before allowing access to protected endpoints.

Roles include:
Super Admin
Tenant Admin

User
3.3 Password Hashing Strategy
Passwords are hashed using bcrypt with appropriate salt rounds. Plain-text passwords are never stored or logged.

3.4 API Security Measures
JWT validation middleware on all protected routes
Role-based authorization checks
Input validation to prevent malformed requests
Proper HTTP status codes for error handling
Audit logging for critical actions

3.5 Additional Security Measures
CORS configuration restricted to frontend service
Secure environment variable usage
Database constraints and foreign keys
Automatic session expiration via JWT expiry
These measures collectively ensure a secure, scalable, and robust multi-tenant SaaS application.