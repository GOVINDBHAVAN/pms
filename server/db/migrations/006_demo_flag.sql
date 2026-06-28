-- Add is_demo flag to organizations for passwordless demo login
ALTER TABLE organizations ADD COLUMN is_demo INTEGER DEFAULT 0;
