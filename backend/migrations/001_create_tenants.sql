
CREATE TABLE tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    subdomain VARCHAR(255) UNIQUE NOT NULL,
    status VARCHAR(20) CHECK (status IN ('active', 'suspended', 'trial')),
    subscription_plan VARCHAR(20) CHECK (subscription_plan IN ('free', 'pro', 'enterprise')),
    max_users INTEGER DEFAULT 10,
    max_projects INTEGER DEFAULT 5,
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now()
);

-- DOWN Migration
-- DROP TABLE IF EXISTS tenants CASCADE;
