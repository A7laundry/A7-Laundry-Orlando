-- Add intake_data column to projects table
ALTER TABLE projects ADD COLUMN IF NOT EXISTS intake_data jsonb;
COMMENT ON COLUMN projects.intake_data IS 'Business details submitted via intake form (businessName, niche, phone, address, serviceArea, tagline, notes)';
