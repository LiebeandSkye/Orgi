CREATE EXTENSION IF NOT EXISTS pgcrypto; 

CREATE TABLE IF NOT EXISTS users ( 
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), 
    public_id TEXT UNIQUE NOT NULL, 
    user_name TEXT NOT NULL DEFAULT 'Unnamed Orgi', 
    email TEXT, 
    role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'moderator', 'admin')), 
    anonymous BOOLEAN NOT NULL DEFAULT false, 
    profile_url TEXT, 
    banner_url TEXT, 
    current_status TEXT NOT NULL DEFAULT 'Online', 
    setting_preference JSONB NOT NULL DEFAULT '{}'::jsonb, 
    inventory JSONB NOT NULL DEFAULT '{"collections": {"Ring": 0, "Cloud": 0, "Box": 0}}'::jsonb, 
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), 
    last_login_at TIMESTAMPTZ NOT NULL DEFAULT NOW() 
); 

CREATE TABLE IF NOT EXISTS items ( 
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), 
    external_id TEXT NOT NULL, 
    provider TEXT NOT NULL, 
    type TEXT NOT NULL, 
    title TEXT NOT NULL, 
    cover_url TEXT, 
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), 
    CONSTRAINT uq_items_external UNIQUE (type, provider, external_id) 
); 

CREATE TABLE IF NOT EXISTS user_collections ( 
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), 
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE, 
    item_id UUID NOT NULL REFERENCES items(id) ON DELETE CASCADE, 
    status TEXT NOT NULL DEFAULT 'favorite', 
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), 
    CONSTRAINT uq_user_collections_item UNIQUE (user_id, item_id) 
); 

CREATE TABLE IF NOT EXISTS ratings ( 
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), 
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE, 
    item_id UUID NOT NULL REFERENCES items(id) ON DELETE CASCADE, 
    score NUMERIC(3, 1) NOT NULL CHECK (score >= 1 AND score <= 10), 
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), 
    CONSTRAINT uq_ratings_user_item UNIQUE (user_id, item_id) 
); 

CREATE TABLE IF NOT EXISTS comments ( 
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), 
    item_id UUID NOT NULL REFERENCES items(id) ON DELETE CASCADE, 
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE, 
    parent_id UUID REFERENCES comments(id) ON DELETE CASCADE, 
    content TEXT NOT NULL, 
    is_deleted BOOLEAN NOT NULL DEFAULT false, 
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW() 
); 

CREATE TABLE IF NOT EXISTS reports ( 
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), 
    reporter_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE, 
    target_type TEXT NOT NULL CHECK (target_type IN ('item', 'comment', 'user')), 
    target_id UUID NOT NULL, 
    reason TEXT NOT NULL, 
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_review', 'resolved', 'dismissed')), 
    moderator_notes TEXT, 
    resolved_by UUID REFERENCES users(id) ON DELETE SET NULL, 
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), 
    resolved_at TIMESTAMPTZ 
); 
