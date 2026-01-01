CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(20) CHECK (status IN ('active', 'archived', 'completed')),
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now()
);

-- ✅ REQUIRED for ON CONFLICT (tenant_id, name)
ALTER TABLE projects
ADD CONSTRAINT unique_project_per_tenant
UNIQUE (tenant_id, name);

CREATE INDEX idx_projects_tenant_id ON projects(tenant_id);
