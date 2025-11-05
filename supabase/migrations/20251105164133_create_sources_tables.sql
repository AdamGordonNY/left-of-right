/*
  # Create Sources Tables for Content Aggregation

  ## Overview
  This migration creates the database schema for storing content sources (YouTube channels and Substack authors).

  ## New Tables
  
  ### `sources`
  Stores information about content creators/sources
  - `id` (uuid, primary key) - Unique identifier for each source
  - `name` (text, not null) - Display name of the source/creator
  - `type` (text, not null) - Type of source: 'youtube' or 'substack'
  - `url` (text, not null) - URL to the source (channel/profile)
  - `description` (text) - Optional description of the source
  - `avatar_url` (text) - Optional avatar/logo image URL
  - `is_active` (boolean, default true) - Whether to actively fetch content from this source
  - `created_at` (timestamptz) - Timestamp of when source was added
  - `updated_at` (timestamptz) - Timestamp of last update

  ### `content_items`
  Stores individual content items (videos/articles) from sources
  - `id` (uuid, primary key) - Unique identifier for each content item
  - `source_id` (uuid, foreign key) - Reference to the source
  - `type` (text, not null) - Type of content: 'video' or 'article'
  - `title` (text, not null) - Title of the content
  - `url` (text, not null) - URL to the content
  - `thumbnail_url` (text) - Thumbnail/cover image URL
  - `description` (text) - Content description/excerpt
  - `published_at` (timestamptz) - When the content was published
  - `created_at` (timestamptz) - Timestamp of when content was added to database
  - `updated_at` (timestamptz) - Timestamp of last update

  ## Security
  - Enable RLS on both tables
  - Add policies for public read access (for displaying content)
  - Add policies for authenticated admin users to manage sources
*/

-- Create sources table
CREATE TABLE IF NOT EXISTS sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('youtube', 'substack')),
  url text NOT NULL,
  description text,
  avatar_url text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create content_items table
CREATE TABLE IF NOT EXISTS content_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id uuid NOT NULL REFERENCES sources(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('video', 'article')),
  title text NOT NULL,
  url text NOT NULL,
  thumbnail_url text,
  description text,
  published_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_sources_type ON sources(type);
CREATE INDEX IF NOT EXISTS idx_sources_is_active ON sources(is_active);
CREATE INDEX IF NOT EXISTS idx_content_items_source_id ON content_items(source_id);
CREATE INDEX IF NOT EXISTS idx_content_items_type ON content_items(type);
CREATE INDEX IF NOT EXISTS idx_content_items_published_at ON content_items(published_at DESC);

-- Enable Row Level Security
ALTER TABLE sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_items ENABLE ROW LEVEL SECURITY;

-- Public read access for sources
CREATE POLICY "Anyone can view active sources"
  ON sources
  FOR SELECT
  USING (is_active = true);

-- Public read access for content_items
CREATE POLICY "Anyone can view content items"
  ON content_items
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM sources
      WHERE sources.id = content_items.source_id
      AND sources.is_active = true
    )
  );

-- Admin policies for sources (authenticated users can manage)
CREATE POLICY "Authenticated users can insert sources"
  ON sources
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update sources"
  ON sources
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete sources"
  ON sources
  FOR DELETE
  TO authenticated
  USING (true);

-- Admin policies for content_items (authenticated users can manage)
CREATE POLICY "Authenticated users can insert content"
  ON content_items
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update content"
  ON content_items
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete content"
  ON content_items
  FOR DELETE
  TO authenticated
  USING (true);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers to automatically update updated_at
CREATE TRIGGER update_sources_updated_at
  BEFORE UPDATE ON sources
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_content_items_updated_at
  BEFORE UPDATE ON content_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
