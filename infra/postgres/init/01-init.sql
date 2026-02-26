-- Chpli Monorepo Database Initialization

-- Create schemas for different applications
CREATE SCHEMA IF NOT EXISTS calendar_memo;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Note: Calendar Memo currently uses SQLite
-- When migrating to PostgreSQL, use this schema

-- Calendar Memo Schema
COMMENT ON SCHEMA calendar_memo IS 'Calendar Memo application tables';
