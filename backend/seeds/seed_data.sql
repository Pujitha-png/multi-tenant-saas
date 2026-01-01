-- ===========================
-- Seed Data for Multi-Tenant SaaS
-- Safe to run multiple times
-- ===========================

-- Enable pgcrypto for password hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ---------- SUPER ADMIN ----------
INSERT INTO users (id, tenant_id, email, password_hash, full_name, role, is_active, created_at, updated_at)
SELECT
    gen_random_uuid(),
    NULL,
    'superadmin@system.com',
    crypt('Admin@123', gen_salt('bf')),
    'Super Admin',
    'super_admin',
    true,
    now(),
    now()
WHERE NOT EXISTS (
    SELECT 1 FROM users WHERE email = 'superadmin@system.com'
);

-- ---------- DEMO TENANT ----------
INSERT INTO tenants (id, name, subdomain, status, subscription_plan, max_users, max_projects, created_at, updated_at)
VALUES (
    gen_random_uuid(),
    'Demo Company',
    'demo',
    'active',
    'pro',
    50,
    20,
    now(),
    now()
)
ON CONFLICT (subdomain) DO NOTHING;

-- ---------- TENANT ADMIN ----------
INSERT INTO users (id, tenant_id, email, password_hash, full_name, role, is_active, created_at, updated_at)
VALUES (
    gen_random_uuid(),
    (SELECT id FROM tenants WHERE subdomain = 'demo' LIMIT 1),
    'admin@demo.com',
    crypt('Demo@123', gen_salt('bf')),
    'Demo Admin',
    'tenant_admin',
    true,
    now(),
    now()
)
ON CONFLICT (tenant_id, email) DO NOTHING;

-- ---------- REGULAR USERS ----------
INSERT INTO users (id, tenant_id, email, password_hash, full_name, role, is_active, created_at, updated_at)
VALUES
    (gen_random_uuid(), (SELECT id FROM tenants WHERE subdomain='demo' LIMIT 1), 'user1@demo.com', crypt('User@123', gen_salt('bf')), 'User One', 'user', true, now(), now()),
    (gen_random_uuid(), (SELECT id FROM tenants WHERE subdomain='demo' LIMIT 1), 'user2@demo.com', crypt('User@123', gen_salt('bf')), 'User Two', 'user', true, now(), now())
ON CONFLICT (tenant_id, email) DO NOTHING;

-- ---------- SAMPLE PROJECTS ----------
INSERT INTO projects (id, tenant_id, name, description, status, created_by, created_at, updated_at)
VALUES
    (gen_random_uuid(), (SELECT id FROM tenants WHERE subdomain='demo' LIMIT 1), 'Project Alpha', 'First sample project', 'active', (SELECT id FROM users WHERE email='admin@demo.com' LIMIT 1), now(), now()),
    (gen_random_uuid(), (SELECT id FROM tenants WHERE subdomain='demo' LIMIT 1), 'Project Beta', 'Second sample project', 'active', (SELECT id FROM users WHERE email='admin@demo.com' LIMIT 1), now(), now())
ON CONFLICT (tenant_id, name) DO NOTHING;

-- ---------- SAMPLE TASKS ----------
INSERT INTO tasks (id, project_id, tenant_id, title, description, status, priority, assigned_to, due_date, created_at, updated_at)
VALUES
    (gen_random_uuid(), (SELECT id FROM projects WHERE name='Project Alpha' LIMIT 1), (SELECT id FROM tenants WHERE subdomain='demo' LIMIT 1), 'Setup database', 'Initialize PostgreSQL schema', 'todo', 'high', (SELECT id FROM users WHERE email='user1@demo.com' LIMIT 1), now() + interval '7 days', now(), now()),
    (gen_random_uuid(), (SELECT id FROM projects WHERE name='Project Alpha' LIMIT 1), (SELECT id FROM tenants WHERE subdomain='demo' LIMIT 1), 'Backend API', 'Develop Express APIs', 'in_progress', 'medium', (SELECT id FROM users WHERE email='user2@demo.com' LIMIT 1), now() + interval '10 days', now(), now()),
    (gen_random_uuid(), (SELECT id FROM projects WHERE name='Project Beta' LIMIT 1), (SELECT id FROM tenants WHERE subdomain='demo' LIMIT 1), 'Frontend Setup', 'Create React frontend', 'todo', 'high', NULL, now() + interval '5 days', now(), now()),
    (gen_random_uuid(), (SELECT id FROM projects WHERE name='Project Beta' LIMIT 1), (SELECT id FROM tenants WHERE subdomain='demo' LIMIT 1), 'Integrate APIs', 'Connect frontend with backend', 'todo', 'medium', (SELECT id FROM users WHERE email='user1@demo.com' LIMIT 1), now() + interval '12 days', now(), now()),
    (gen_random_uuid(), (SELECT id FROM projects WHERE name='Project Beta' LIMIT 1), (SELECT id FROM tenants WHERE subdomain='demo' LIMIT 1), 'Testing', 'Write basic tests', 'todo', 'low', (SELECT id FROM users WHERE email='user2@demo.com' LIMIT 1), now() + interval '15 days', now(), now());
