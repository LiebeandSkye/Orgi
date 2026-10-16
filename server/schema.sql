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
    collection JSONB, -- 'item_1:{external_id:"",provider:"tmdb",type:"movie"}, item_2:{external_id:"",provider:"mangadex",type:"manga"}'::jsonb, 
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), 
    last_login_at TIMESTAMPTZ NOT NULL DEFAULT NOW() 
); 

CREATE TABLE IF NOT EXISTS items ( 
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), 
    external_id TEXT NOT NULL, 
    provider TEXT NOT NULL, -- tmdb, mangadex, google_books, spotify, etc... 
    type TEXT NOT NULL, -- movie, manga, manhwa, book, music, etc... 
    title TEXT NOT NULL, 
    cover_url TEXT, 
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), 
    CONSTRAINT uq_items_external UNIQUE (type, provider, external_id) 
); 

CREATE TABLE IF NOT EXISTS user_collections ( 
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), 
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE, 
    item_id UUID NOT NULL REFERENCES items(id) ON DELETE CASCADE, 
    status TEXT NOT NULL DEFAULT 'plan' CHECK (status IN ('plan', 'progress', 'completed')), 
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), 
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), 
    CONSTRAINT uq_user_collections_item UNIQUE (user_id, item_id) 
); 
 
ALTER TABLE user_collections ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(); 
 
CREATE TABLE IF NOT EXISTS reviews ( 
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), 
    item_id UUID NOT NULL REFERENCES items(id) ON DELETE CASCADE, 
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE, 
    parent_id UUID REFERENCES reviews(id) ON DELETE CASCADE, 
    score INTEGER CHECK (score >= 1 AND score <= 10), 
    content TEXT, 
    is_edited BOOLEAN NOT NULL DEFAULT false, 
    is_deleted BOOLEAN NOT NULL DEFAULT false, 
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), 
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW() 
); 
 
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS is_edited BOOLEAN NOT NULL DEFAULT false; 
 
CREATE UNIQUE INDEX IF NOT EXISTS uq_user_item_top_review 
ON reviews (user_id, item_id) 
WHERE parent_id IS NULL; 
 
CREATE INDEX IF NOT EXISTS idx_reviews_item_id ON reviews(item_id); 
CREATE INDEX IF NOT EXISTS idx_reviews_parent_id ON reviews(parent_id); 
CREATE INDEX IF NOT EXISTS idx_user_collections_user_id ON user_collections(user_id); 
 
CREATE TABLE IF NOT EXISTS review_likes ( 
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), 
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE, 
    review_id UUID NOT NULL REFERENCES reviews(id) ON DELETE CASCADE, 
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), 
    CONSTRAINT uq_user_review_like UNIQUE (user_id, review_id) 
); 
 
CREATE INDEX IF NOT EXISTS idx_review_likes_user_id ON review_likes(user_id); 
CREATE INDEX IF NOT EXISTS idx_review_likes_review_id ON review_likes(review_id); 
 
CREATE TABLE IF NOT EXISTS reports ( 
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), 
    reporter_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE, 
    target_type TEXT NOT NULL CHECK (target_type IN ('item', 'review', 'user')), 
    target_id UUID NOT NULL, 
    reason TEXT NOT NULL, 
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_review', 'resolved', 'dismissed')), 
    moderator_notes TEXT, 
    resolved_by UUID REFERENCES users(id) ON DELETE SET NULL, 
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), 
    resolved_at TIMESTAMPTZ 
); 
 
ALTER TABLE users ENABLE ROW LEVEL SECURITY; 
ALTER TABLE items ENABLE ROW LEVEL SECURITY; 
ALTER TABLE user_collections ENABLE ROW LEVEL SECURITY; 
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY; 
ALTER TABLE review_likes ENABLE ROW LEVEL SECURITY; 
ALTER TABLE reports ENABLE ROW LEVEL SECURITY; 
 
CREATE POLICY "Allow public read access to users" 
ON users FOR SELECT 
USING (true); 
 
CREATE POLICY "Allow public read access to review_likes" 
ON review_likes FOR SELECT 
USING (true); 
 
CREATE POLICY "Allow users to insert own review_likes" 
ON review_likes FOR INSERT 
WITH CHECK (auth.uid() = user_id); 
 
CREATE POLICY "Allow users to delete own review_likes" 
ON review_likes FOR DELETE 
USING (auth.uid() = user_id); 
 
CREATE POLICY "Allow moderators to read all reports" 
ON reports FOR SELECT 
USING ( 
    auth.uid() = reporter_id OR  
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'moderator')) 
); 
 
CREATE POLICY "Allow moderators to update reports" 
ON reports FOR UPDATE 
USING ( 
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'moderator')) 
); 
 
CREATE POLICY "Allow users to insert their own profile" 
ON users FOR INSERT 
WITH CHECK (auth.uid() = id); 
 
CREATE POLICY "Allow users to update own profile" 
ON users FOR UPDATE 
USING (auth.uid() = id); 
 
CREATE POLICY "Allow public read access to items" 
ON items FOR SELECT 
USING (true); 
 
CREATE POLICY "Allow users to read own collections" 
ON user_collections FOR SELECT 
USING (auth.uid() = user_id); 
 
CREATE POLICY "Allow users to insert own collections" 
ON user_collections FOR INSERT 
WITH CHECK (auth.uid() = user_id); 
 
CREATE POLICY "Allow users to update own collections" 
ON user_collections FOR UPDATE 
USING (auth.uid() = user_id); 
 
CREATE POLICY "Allow users to delete own collections" 
ON user_collections FOR DELETE 
USING (auth.uid() = user_id); 
 
CREATE POLICY "Allow public read access to non-deleted reviews" 
ON reviews FOR SELECT 
USING (NOT is_deleted); 
 
CREATE POLICY "Allow users to insert own reviews" 
ON reviews FOR INSERT 
WITH CHECK (auth.uid() = user_id); 
 
CREATE POLICY "Allow users to update own reviews" 
ON reviews FOR UPDATE 
USING (auth.uid() = user_id); 
 
CREATE POLICY "Allow users to delete own reviews" 
ON reviews FOR DELETE 
USING (auth.uid() = user_id); 
 
CREATE POLICY "Allow users to create reports" 
ON reports FOR INSERT 
WITH CHECK (auth.uid() = reporter_id); 
 
CREATE POLICY "Allow reporters to read own reports" 
ON reports FOR SELECT 
USING (auth.uid() = reporter_id); 
 
CREATE POLICY "Allow reporters to delete own reports" 
ON reports FOR DELETE 
USING (auth.uid() = reporter_id); 

CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$ 
BEGIN 
    INSERT INTO public.users (id, public_id, user_name, email, anonymous) 
    VALUES ( 
        NEW.id, 
        UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 16)), 
        COALESCE(NEW.raw_user_meta_data->>'user_name', 'Unnamed Orgi_' || SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 4)), 
        NEW.email, 
        COALESCE(NEW.is_anonymous, false) 
    ) 
    ON CONFLICT (id) DO NOTHING; 
    RETURN NEW; 
END; 
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public; 

CREATE OR REPLACE TRIGGER on_auth_user_created 
    AFTER INSERT ON auth.users 
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user(); 

GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role, postgres, supabase_auth_admin; 
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role, postgres, supabase_auth_admin; 
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role, postgres, supabase_auth_admin; 
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO anon, authenticated, service_role, postgres, supabase_auth_admin; 

ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role, postgres, supabase_auth_admin; 
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated, service_role, postgres, supabase_auth_admin; 
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON ROUTINES TO anon, authenticated, service_role, postgres, supabase_auth_admin; 
