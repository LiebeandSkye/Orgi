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
    status TEXT NOT NULL DEFAULT 'favorite' CHECK (status IN ('favorite', 'reading', 'watching', 'completed', 'plan_to_read', 'dropped', 'on_hold')), 
    progress_chapter INTEGER, 
    progress_page INTEGER, 
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), 
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), 
    CONSTRAINT uq_user_collections_item UNIQUE (user_id, item_id) 
); 

CREATE TABLE IF NOT EXISTS custom_shelves ( 
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), 
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE, 
    title TEXT NOT NULL, 
    description TEXT, 
    is_public BOOLEAN NOT NULL DEFAULT true, 
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), 
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW() 
); 

CREATE TABLE IF NOT EXISTS shelf_items ( 
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), 
    shelf_id UUID NOT NULL REFERENCES custom_shelves(id) ON DELETE CASCADE, 
    item_id UUID NOT NULL REFERENCES items(id) ON DELETE CASCADE, 
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), 
    CONSTRAINT uq_shelf_items UNIQUE (shelf_id, item_id) 
); 

CREATE TABLE IF NOT EXISTS ratings ( 
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), 
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE, 
    item_id UUID NOT NULL REFERENCES items(id) ON DELETE CASCADE, 
    score NUMERIC(3, 1) NOT NULL CHECK (score >= 1 AND score <= 10), 
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), 
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), 
    CONSTRAINT uq_ratings_user_item UNIQUE (user_id, item_id) 
); 

CREATE TABLE IF NOT EXISTS comments ( 
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), 
    item_id UUID NOT NULL REFERENCES items(id) ON DELETE CASCADE, 
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE, 
    parent_id UUID REFERENCES comments(id) ON DELETE CASCADE, 
    content TEXT NOT NULL, 
    is_deleted BOOLEAN NOT NULL DEFAULT false, 
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), 
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW() 
); 

CREATE TABLE IF NOT EXISTS comment_votes ( 
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), 
    comment_id UUID NOT NULL REFERENCES comments(id) ON DELETE CASCADE, 
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE, 
    vote_type SMALLINT NOT NULL CHECK (vote_type IN (-1, 1)), 
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), 
    CONSTRAINT uq_comment_votes UNIQUE (comment_id, user_id) 
); 

CREATE TABLE IF NOT EXISTS reports ( 
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), 
    reporter_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE, 
    target_type TEXT NOT NULL CHECK (target_type IN ('item', 'comment', 'user')), 
    target_id UUID NOT NULL, 
    reason TEXT NOT NULL, 
    details TEXT, 
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_review', 'resolved', 'dismissed')), 
    moderator_notes TEXT, 
    resolved_by UUID REFERENCES users(id) ON DELETE SET NULL, 
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), 
    resolved_at TIMESTAMPTZ 
); 

CREATE INDEX IF NOT EXISTS idx_items_lookup ON items (type, provider, external_id); 
CREATE INDEX IF NOT EXISTS idx_user_collections_user ON user_collections (user_id); 
CREATE INDEX IF NOT EXISTS idx_custom_shelves_user ON custom_shelves (user_id); 
CREATE INDEX IF NOT EXISTS idx_shelf_items_shelf ON shelf_items (shelf_id); 
CREATE INDEX IF NOT EXISTS idx_comments_item ON comments (item_id); 
CREATE INDEX IF NOT EXISTS idx_comments_parent ON comments (parent_id); 
CREATE INDEX IF NOT EXISTS idx_ratings_item ON ratings (item_id); 
CREATE INDEX IF NOT EXISTS idx_comment_votes_comment ON comment_votes (comment_id); 
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports (status); 
