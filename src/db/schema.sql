-- Treasure Hunter — PostgreSQL schema (Railway)
-- Multi-perfil familiar indexado por family_id y child profile_id

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Familias (unidad de enlace entre padres)
CREATE TABLE IF NOT EXISTS families (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(120),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Usuarios (padres) autenticados con Google
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  google_id VARCHAR(128) NOT NULL UNIQUE,
  email VARCHAR(255) NOT NULL UNIQUE,
  display_name VARCHAR(255),
  avatar_url TEXT,
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_family ON users(family_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Invitaciones para enlazar segundo progenitor al mismo family_id
CREATE TABLE IF NOT EXISTS family_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  invited_email VARCHAR(255) NOT NULL,
  invited_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'accepted', 'revoked')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (family_id, invited_email)
);

-- Hijos — ilimitados por family_id
CREATE TABLE IF NOT EXISTS children (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  name VARCHAR(120) NOT NULL,
  age INTEGER,
  school_level VARCHAR(60) NOT NULL DEFAULT '1_grado',
  book VARCHAR(60) DEFAULT 'small_big_things_1',
  avatar VARCHAR(16) DEFAULT '⚽',
  interests JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_children_family ON children(family_id);

-- Progreso por hijo (profile_id = children.id)
CREATE TABLE IF NOT EXISTS child_progress (
  child_id UUID PRIMARY KEY REFERENCES children(id) ON DELETE CASCADE,
  current_unit_id VARCHAR(32) DEFAULT 'unit-1',
  unlocked_units JSONB NOT NULL DEFAULT '["unit-1"]',
  completed_units JSONB NOT NULL DEFAULT '[]',
  unit_progress JSONB NOT NULL DEFAULT '{}',
  mic_tolerance NUMERIC(3,2) NOT NULL DEFAULT 0.58
    CHECK (mic_tolerance >= 0.40 AND mic_tolerance <= 0.90),
  activities_completed JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Mochila de Súper Poderes
CREATE TABLE IF NOT EXISTS backpack_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  word VARCHAR(120) NOT NULL,
  context TEXT,
  unit_id VARCHAR(32),
  activity_id VARCHAR(64),
  attempts INTEGER NOT NULL DEFAULT 3,
  released BOOLEAN NOT NULL DEFAULT FALSE,
  added_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_backpack_child ON backpack_items(child_id);
CREATE INDEX IF NOT EXISTS idx_backpack_active ON backpack_items(child_id) WHERE released = FALSE;

-- Curriculum generado por IA (9 unidades por hijo/libro)
CREATE TABLE IF NOT EXISTS curricula (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  book VARCHAR(60) NOT NULL DEFAULT 'small_big_things_1',
  units JSONB NOT NULL DEFAULT '[]',
  generated_from_image BOOLEAN NOT NULL DEFAULT TRUE,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (child_id, book)
);

CREATE INDEX IF NOT EXISTS idx_curricula_child ON curricula(child_id);

-- Historial de exámenes (práctica no borra récord)
CREATE TABLE IF NOT EXISTS exam_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  unit_id VARCHAR(32) NOT NULL,
  score INTEGER NOT NULL,
  total_questions INTEGER NOT NULL,
  percentage INTEGER NOT NULL,
  passed BOOLEAN NOT NULL,
  is_practice BOOLEAN NOT NULL DEFAULT FALSE,
  attempted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_exam_child ON exam_history(child_id);

-- Seed opcional: familia demo (solo dev, comentar en prod)
-- INSERT INTO families (id, name) VALUES ('00000000-0000-0000-0000-000000000001', 'Familia Demo');
