-- Fix RLS Policies for HustleBase
-- Run this in your Supabase SQL Editor if you're getting "row-level security policy" errors

-- Drop ALL existing policies first to avoid conflicts
DROP POLICY IF EXISTS "Users can view all profiles" ON users;
DROP POLICY IF EXISTS "Users can insert own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;

DROP POLICY IF EXISTS "Anyone can view providers" ON providers;
DROP POLICY IF EXISTS "Providers can insert own profile" ON providers;
DROP POLICY IF EXISTS "Providers can update own profile" ON providers;
DROP POLICY IF EXISTS "Providers can delete own profile" ON providers;

DROP POLICY IF EXISTS "Anyone can view portfolio images" ON portfolio_images;
DROP POLICY IF EXISTS "Providers can manage own portfolio" ON portfolio_images;

-- Recreate RLS Policies for users table
CREATE POLICY "Users can view all profiles" ON users
    FOR SELECT USING (true);

CREATE POLICY "Users can insert own profile" ON users
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (auth.uid() = id);

-- Recreate RLS Policies for providers table
CREATE POLICY "Anyone can view providers" ON providers
    FOR SELECT USING (true);

CREATE POLICY "Providers can insert own profile" ON providers
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Providers can update own profile" ON providers
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Providers can delete own profile" ON providers
    FOR DELETE USING (auth.uid() = user_id);

-- Recreate portfolio_images policies
CREATE POLICY "Anyone can view portfolio images" ON portfolio_images
    FOR SELECT USING (true);

CREATE POLICY "Providers can manage own portfolio" ON portfolio_images
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM providers
            WHERE providers.user_id = auth.uid()
            AND providers.user_id = portfolio_images.provider_id
        )
    );

-- Verify RLS is enabled
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_images ENABLE ROW LEVEL SECURITY;

