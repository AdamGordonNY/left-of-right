/*
  # Add User Roles and Follow System

  ## Overview
  This migration adds user role management and personalized follow functionality to the content aggregation platform.

  ## Changes to Existing Tables

  ### `sources` table modifications
  - Add `created_by_user_id` (uuid) - References auth.users, indicates who added the source
  - Add `is_global` (boolean, default false) - True if admin added and available to all users

  ## New Tables

  ### `user_follows`
  Junction table tracking which sources each user follows
  - `id` (uuid, primary key) - Unique identifier
  - `user_id` (uuid, not null) - References auth.users(id)
  - `source_id` (uuid, not null) - References sources(id)
  - `created_at` (timestamptz) - When the user followed this source
  - Unique constraint on (user_id, source_id) to prevent duplicate follows

  ## Security Changes

  ### RLS Policies
  - Update sources policies to allow users to manage their own sources
  - Add policies for user_follows table
  - Users can view all global sources and their own personal sources
  - Users can follow/unfollow sources
  - Admins can create global sources
  - Regular users can only create personal sources

  ## Important Notes
  - User roles will be managed in auth.users metadata (app_metadata.role)
  - Roles: 'admin' and 'member' (default)
  - Admin role must be set directly in Supabase auth user metadata
*/

-- Add columns to sources table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'sources' AND column_name = 'created_by_user_id'
  ) THEN
    ALTER TABLE sources ADD COLUMN created_by_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'sources' AND column_name = 'is_global'
  ) THEN
    ALTER TABLE sources ADD COLUMN is_global boolean DEFAULT false;
  END IF;
END $$;

-- Create user_follows table
CREATE TABLE IF NOT EXISTS user_follows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  source_id uuid NOT NULL REFERENCES sources(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, source_id)
);

-- Create indexes for user_follows
CREATE INDEX IF NOT EXISTS idx_user_follows_user_id ON user_follows(user_id);
CREATE INDEX IF NOT EXISTS idx_user_follows_source_id ON user_follows(source_id);
CREATE INDEX IF NOT EXISTS idx_sources_created_by ON sources(created_by_user_id);
CREATE INDEX IF NOT EXISTS idx_sources_is_global ON sources(is_global);

-- Enable RLS on user_follows
ALTER TABLE user_follows ENABLE ROW LEVEL SECURITY;

-- Drop old source policies
DROP POLICY IF EXISTS "Anyone can view active sources" ON sources;
DROP POLICY IF EXISTS "Authenticated users can insert sources" ON sources;
DROP POLICY IF EXISTS "Authenticated users can update sources" ON sources;
DROP POLICY IF EXISTS "Authenticated users can delete sources" ON sources;

-- New source policies
CREATE POLICY "Users can view global sources and own sources"
  ON sources
  FOR SELECT
  TO authenticated
  USING (
    is_global = true 
    OR created_by_user_id = auth.uid()
  );

CREATE POLICY "Anonymous can view global active sources"
  ON sources
  FOR SELECT
  TO anon
  USING (is_global = true AND is_active = true);

CREATE POLICY "Users can create personal sources"
  ON sources
  FOR INSERT
  TO authenticated
  WITH CHECK (
    created_by_user_id = auth.uid()
  );

CREATE POLICY "Admins can create global sources"
  ON sources
  FOR INSERT
  TO authenticated
  WITH CHECK (
    (auth.jwt()->>'role' = 'admin' OR (auth.jwt()->'app_metadata'->>'role') = 'admin')
  );

CREATE POLICY "Users can update own sources"
  ON sources
  FOR UPDATE
  TO authenticated
  USING (created_by_user_id = auth.uid())
  WITH CHECK (created_by_user_id = auth.uid());

CREATE POLICY "Admins can update global sources"
  ON sources
  FOR UPDATE
  TO authenticated
  USING (
    is_global = true 
    AND (auth.jwt()->>'role' = 'admin' OR (auth.jwt()->'app_metadata'->>'role') = 'admin')
  )
  WITH CHECK (
    is_global = true 
    AND (auth.jwt()->>'role' = 'admin' OR (auth.jwt()->'app_metadata'->>'role') = 'admin')
  );

CREATE POLICY "Users can delete own sources"
  ON sources
  FOR DELETE
  TO authenticated
  USING (created_by_user_id = auth.uid());

CREATE POLICY "Admins can delete global sources"
  ON sources
  FOR DELETE
  TO authenticated
  USING (
    is_global = true 
    AND (auth.jwt()->>'role' = 'admin' OR (auth.jwt()->'app_metadata'->>'role') = 'admin')
  );

-- User follows policies
CREATE POLICY "Users can view own follows"
  ON user_follows
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can create own follows"
  ON user_follows
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own follows"
  ON user_follows
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Update content_items policies to respect user follows and source visibility
DROP POLICY IF EXISTS "Anyone can view content items" ON content_items;

CREATE POLICY "Users can view content from accessible sources"
  ON content_items
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM sources
      WHERE sources.id = content_items.source_id
      AND (
        sources.is_global = true
        OR sources.created_by_user_id = auth.uid()
      )
      AND sources.is_active = true
    )
  );

CREATE POLICY "Anonymous can view content from global sources"
  ON content_items
  FOR SELECT
  TO anon
  USING (
    EXISTS (
      SELECT 1 FROM sources
      WHERE sources.id = content_items.source_id
      AND sources.is_global = true
      AND sources.is_active = true
    )
  );