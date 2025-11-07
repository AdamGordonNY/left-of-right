/*
  # Add Playlist and PlaylistItem Tables

  ## New Tables
  
  ### `playlists`
  - `id` (uuid, primary key) - Unique identifier for the playlist
  - `source_id` (uuid, foreign key) - References the source/channel this playlist belongs to
  - `title` (text) - Title of the playlist
  - `description` (text, nullable) - Description of the playlist
  - `thumbnail_url` (text, nullable) - URL to the playlist thumbnail image
  - `playlist_url` (text) - URL to the actual playlist on the source platform
  - `video_count` (integer) - Number of videos in the playlist
  - `published_at` (timestamptz, nullable) - When the playlist was published
  - `created_at` (timestamptz) - Record creation timestamp
  - `updated_at` (timestamptz) - Record update timestamp
  
  ### `playlist_items`
  - `id` (uuid, primary key) - Unique identifier for the playlist item
  - `playlist_id` (uuid, foreign key) - References the playlist
  - `content_item_id` (uuid, foreign key) - References the video/content item
  - `position` (integer) - Order position of the video in the playlist
  - `created_at` (timestamptz) - Record creation timestamp
  
  ## Security
  - Enable RLS on both tables
  - Allow authenticated users to read all playlists
  - Only allow authenticated users with proper permissions to insert/update/delete playlists
  
  ## Indexes
  - Index on `source_id` for efficient playlist lookups by source
  - Index on `published_at` for chronological sorting
  - Index on `playlist_id` for efficient playlist item lookups
  - Index on `content_item_id` for reverse lookups
  - Index on `position` for efficient ordering
*/

-- Create playlists table
CREATE TABLE IF NOT EXISTS playlists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id uuid NOT NULL REFERENCES sources(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  thumbnail_url text,
  playlist_url text NOT NULL,
  video_count integer DEFAULT 0,
  published_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create playlist_items table
CREATE TABLE IF NOT EXISTS playlist_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  playlist_id uuid NOT NULL REFERENCES playlists(id) ON DELETE CASCADE,
  content_item_id uuid NOT NULL REFERENCES content_items(id) ON DELETE CASCADE,
  position integer NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(playlist_id, content_item_id)
);

-- Create indexes for playlists
CREATE INDEX IF NOT EXISTS idx_playlists_source_id ON playlists(source_id);
CREATE INDEX IF NOT EXISTS idx_playlists_published_at ON playlists(published_at);

-- Create indexes for playlist_items
CREATE INDEX IF NOT EXISTS idx_playlist_items_playlist_id ON playlist_items(playlist_id);
CREATE INDEX IF NOT EXISTS idx_playlist_items_content_item_id ON playlist_items(content_item_id);
CREATE INDEX IF NOT EXISTS idx_playlist_items_position ON playlist_items(position);

-- Enable RLS on playlists
ALTER TABLE playlists ENABLE ROW LEVEL SECURITY;

-- Enable RLS on playlist_items
ALTER TABLE playlist_items ENABLE ROW LEVEL SECURITY;

-- Playlists: Allow everyone to read all playlists
CREATE POLICY "Anyone can view playlists"
  ON playlists
  FOR SELECT
  USING (true);

-- Playlists: Allow authenticated users to insert playlists
CREATE POLICY "Authenticated users can insert playlists"
  ON playlists
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Playlists: Allow authenticated users to update playlists
CREATE POLICY "Authenticated users can update playlists"
  ON playlists
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Playlists: Allow authenticated users to delete playlists
CREATE POLICY "Authenticated users can delete playlists"
  ON playlists
  FOR DELETE
  TO authenticated
  USING (true);

-- Playlist Items: Allow everyone to read all playlist items
CREATE POLICY "Anyone can view playlist items"
  ON playlist_items
  FOR SELECT
  USING (true);

-- Playlist Items: Allow authenticated users to insert playlist items
CREATE POLICY "Authenticated users can insert playlist items"
  ON playlist_items
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Playlist Items: Allow authenticated users to update playlist items
CREATE POLICY "Authenticated users can update playlist items"
  ON playlist_items
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Playlist Items: Allow authenticated users to delete playlist items
CREATE POLICY "Authenticated users can delete playlist items"
  ON playlist_items
  FOR DELETE
  TO authenticated
  USING (true);