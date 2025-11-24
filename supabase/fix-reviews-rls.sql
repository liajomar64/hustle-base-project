-- Fix RLS Policy for Reviews Table
-- Run this in Supabase SQL Editor

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Authenticated users can create reviews" ON reviews;

-- Create corrected INSERT policy
-- Allows authenticated users to insert reviews where:
-- 1. User is authenticated (auth.uid() IS NOT NULL)
-- 2. The client_id matches the authenticated user (auth.uid() = client_id)
-- 3. The user cannot review themselves (auth.uid() != provider_id)
-- 4. The provider_id exists in the providers table
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

