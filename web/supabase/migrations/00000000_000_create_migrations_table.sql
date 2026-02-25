-- =============================================================
-- Bootstrap: Migration Tracking Table
-- This must always sort first (00000000 prefix).
-- =============================================================

CREATE TABLE IF NOT EXISTS _migrations (
  id    SERIAL       PRIMARY KEY,
  name  TEXT         UNIQUE NOT NULL,
  applied_at TIMESTAMPTZ DEFAULT NOW()
);
