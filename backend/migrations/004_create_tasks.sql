CREATE TABLE tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(20) CHECK (status IN ('todo', 'in_progress', 'completed')),
    priority VARCHAR(10) CHECK (priority IN ('low', 'medium', 'high')),
    assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
    due_date DATE,
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now()
);

CREATE INDEX idx_tasks_tenant_project ON tasks(tenant_id, project_id);

-- DOWN Migration
-- DROP TABLE IF EXISTS tasks CASCADE;
