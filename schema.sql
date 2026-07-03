-- ═══════════════════════════════════════════════════════════════
-- SRINIVAS PORTFOLIO — Admin Panel Database Schema
-- ═══════════════════════════════════════════════════════════════
-- Three core tables for managing portfolio data via Admin Panel.
-- Designed for PostgreSQL but compatible with most SQL databases.
-- ═══════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────
-- TABLE 1: portfolio_data
-- ─────────────────────────────────────────────────────────────
-- Stores the primary content blocks (hero section, about, etc.)
-- that the admin can update through the dashboard.

CREATE TABLE IF NOT EXISTS portfolio_data (
    id              SERIAL PRIMARY KEY,
    section_key     VARCHAR(100) NOT NULL UNIQUE,   -- e.g. 'hero', 'about', 'contact'
    title           VARCHAR(255) NOT NULL,
    subtitle        VARCHAR(500),
    description     TEXT,
    metadata        JSONB DEFAULT '{}',             -- flexible key-value for extras
    sort_order      INTEGER DEFAULT 0,
    is_visible      BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Seed sensible defaults
INSERT INTO portfolio_data (section_key, title, subtitle, description, sort_order) VALUES
    ('hero',    'SRINIVAS. R C',    'Aspiring AI Engineer',                     'Building highly optimized agentic systems and full-stack applications.',                               1),
    ('about',   'About Me',         'AI & Full-Stack Developer from Bengaluru',  'Passionate about pushing the boundaries of what''s possible with modern AI and software engineering.', 2),
    ('contact', 'Get in Touch',     'Let''s connect',                            'Reach out for collaboration, job opportunities, or just to say hello.',                                3)
ON CONFLICT (section_key) DO NOTHING;


-- ─────────────────────────────────────────────────────────────
-- TABLE 2: projects
-- ─────────────────────────────────────────────────────────────
-- Each project the admin uploads via the panel.

CREATE TABLE IF NOT EXISTS projects (
    id              SERIAL PRIMARY KEY,
    name            VARCHAR(255) NOT NULL,
    category        VARCHAR(100) NOT NULL,          -- e.g. 'AI', 'Web', 'Mobile', 'Agent'
    description     TEXT,
    link            VARCHAR(500),                   -- live demo or repo URL
    tech_stack      TEXT[],                          -- array of technologies used
    thumbnail_url   VARCHAR(500),                   -- preview image
    is_featured     BOOLEAN DEFAULT FALSE,
    sort_order      INTEGER DEFAULT 0,
    is_visible      BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_projects_category ON projects(category);
CREATE INDEX IF NOT EXISTS idx_projects_featured ON projects(is_featured) WHERE is_featured = TRUE;


-- ─────────────────────────────────────────────────────────────
-- TABLE 3: assets
-- ─────────────────────────────────────────────────────────────
-- Storage URLs for PDFs, images, and other media uploaded
-- through the Admin Panel.

CREATE TABLE IF NOT EXISTS assets (
    id              SERIAL PRIMARY KEY,
    asset_type      VARCHAR(50) NOT NULL,           -- 'resume', 'image', 'pdf', 'video', 'certificate'
    file_name       VARCHAR(255) NOT NULL,
    storage_url     VARCHAR(500) NOT NULL,           -- cloud storage URL (S3, Supabase Storage, etc.)
    mime_type       VARCHAR(100),                    -- e.g. 'application/pdf', 'image/png'
    file_size_bytes BIGINT,
    alt_text        VARCHAR(255),                    -- for accessibility on images
    metadata        JSONB DEFAULT '{}',
    is_active       BOOLEAN DEFAULT TRUE,
    uploaded_at     TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_assets_type ON assets(asset_type);


-- ─────────────────────────────────────────────────────────────
-- TRIGGER: Auto-update `updated_at` timestamps
-- ─────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_portfolio_data_updated
    BEFORE UPDATE ON portfolio_data
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER trg_projects_updated
    BEFORE UPDATE ON projects
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER trg_assets_updated
    BEFORE UPDATE ON assets
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();
