-- ============================================================================
-- HustleBase - Fresh Database Schema
-- Run this in Supabase SQL Editor for a brand new database
-- ============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- CREATE TABLES
-- ============================================================================

-- Users table (extends Supabase auth.users)
CREATE TABLE users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('provider', 'client')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Providers table
CREATE TABLE providers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    bio TEXT,
    skills TEXT NOT NULL,
    price_range TEXT,
    location TEXT,
    availability TEXT,
    contact_link TEXT NOT NULL,
    profile_img_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Portfolio images table
CREATE TABLE portfolio_images (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    provider_id UUID NOT NULL REFERENCES providers(user_id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Reviews table
CREATE TABLE reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    provider_id UUID NOT NULL REFERENCES providers(user_id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(provider_id, client_id)
);

-- Job Requests table
CREATE TABLE job_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL,
    location TEXT,
    budget TEXT,
    deadline DATE,
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'completed', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Job Applications table
CREATE TABLE job_applications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_request_id UUID NOT NULL REFERENCES job_requests(id) ON DELETE CASCADE,
    provider_id UUID NOT NULL REFERENCES providers(user_id) ON DELETE CASCADE,
    message TEXT,
    proposed_price TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'completed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(job_request_id, provider_id)
);

-- ============================================================================
-- CREATE INDEXES
-- ============================================================================

CREATE INDEX idx_providers_user_id ON providers(user_id);
CREATE INDEX idx_providers_location ON providers(location);
CREATE INDEX idx_providers_skills ON providers USING gin(to_tsvector('english', skills));
CREATE INDEX idx_portfolio_images_provider_id ON portfolio_images(provider_id);
CREATE INDEX idx_reviews_provider_id ON reviews(provider_id);
CREATE INDEX idx_reviews_client_id ON reviews(client_id);
CREATE INDEX idx_reviews_created_at ON reviews(created_at DESC);
CREATE INDEX idx_job_requests_client_id ON job_requests(client_id);
CREATE INDEX idx_job_requests_status ON job_requests(status);
CREATE INDEX idx_job_requests_category ON job_requests(category);
CREATE INDEX idx_job_requests_created_at ON job_requests(created_at DESC);
CREATE INDEX idx_job_applications_job_request_id ON job_applications(job_request_id);
CREATE INDEX idx_job_applications_provider_id ON job_applications(provider_id);
CREATE INDEX idx_job_applications_status ON job_applications(status);

-- ============================================================================
-- ENABLE ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_applications ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- CREATE RLS POLICIES
-- ============================================================================

-- Users table policies
CREATE POLICY "Users can view all profiles" ON users
    FOR SELECT USING (true);

CREATE POLICY "Users can insert own profile" ON users
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (auth.uid() = id);

-- Providers table policies
CREATE POLICY "Anyone can view providers" ON providers
    FOR SELECT USING (true);

CREATE POLICY "Providers can insert own profile" ON providers
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Providers can update own profile" ON providers
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Providers can delete own profile" ON providers
    FOR DELETE USING (auth.uid() = user_id);

-- Portfolio images table policies
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

-- Reviews table policies
CREATE POLICY "Anyone can view reviews" ON reviews
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create reviews" ON reviews
    FOR INSERT 
    WITH CHECK (
        auth.uid() IS NOT NULL 
        AND auth.uid() = client_id 
        AND auth.uid() != provider_id
        AND EXISTS (
            SELECT 1 FROM providers 
            WHERE providers.user_id = reviews.provider_id
        )
    );

CREATE POLICY "Users can update own reviews" ON reviews
    FOR UPDATE USING (auth.uid() = client_id);

CREATE POLICY "Users can delete own reviews" ON reviews
    FOR DELETE USING (auth.uid() = client_id);

-- Job requests table policies
CREATE POLICY "Anyone can view job requests" ON job_requests
    FOR SELECT USING (true);

CREATE POLICY "Clients can create job requests" ON job_requests
    FOR INSERT WITH CHECK (auth.uid() = client_id);

CREATE POLICY "Clients can update own job requests" ON job_requests
    FOR UPDATE USING (auth.uid() = client_id);

CREATE POLICY "Clients can delete own job requests" ON job_requests
    FOR DELETE USING (auth.uid() = client_id);

-- Job applications table policies
CREATE POLICY "Anyone can view job applications" ON job_applications
    FOR SELECT USING (true);

CREATE POLICY "Providers can create applications" ON job_applications
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM providers
            WHERE providers.user_id = auth.uid()
            AND providers.user_id = job_applications.provider_id
        )
    );

CREATE POLICY "Providers can update own applications" ON job_applications
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM providers
            WHERE providers.user_id = auth.uid()
            AND providers.user_id = job_applications.provider_id
        )
    );

CREATE POLICY "Clients can update applications for their jobs" ON job_applications
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM job_requests
            WHERE job_requests.id = job_applications.job_request_id
            AND job_requests.client_id = auth.uid()
        )
    );

-- ============================================================================
-- CREATE FUNCTIONS
-- ============================================================================

-- Function to automatically create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, name, email, role)
    VALUES (
        NEW.id,
        NEW.raw_user_meta_data->>'name',
        NEW.email,
        NEW.raw_user_meta_data->>'role'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- CREATE TRIGGERS
-- ============================================================================

-- Trigger to create user profile when auth user is created
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Triggers for updated_at
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_providers_updated_at
    BEFORE UPDATE ON providers
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_job_requests_updated_at
    BEFORE UPDATE ON job_requests
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_job_applications_updated_at
    BEFORE UPDATE ON job_applications
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- COMPLETE!
-- ============================================================================
-- Your database is now set up with:
-- ✅ All tables created
-- ✅ All indexes created
-- ✅ Row Level Security enabled
-- ✅ All RLS policies configured
-- ✅ Triggers and functions set up
--
-- Next steps:
-- 1. Create storage buckets: "profile-photos" and "portfolio-images" (both public)
-- 2. Test the application!
-- ============================================================================

