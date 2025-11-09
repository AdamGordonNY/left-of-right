/*
  # YouTube API Quota Tracking

  1. New Tables
    - `youtube_quota_logs`
      - `id` (uuid, primary key)
      - `api_key_type` (text) - 'primary' or 'backup'
      - `operation_type` (text) - type of YouTube API operation
      - `success` (boolean) - whether the operation succeeded
      - `error_type` (text) - type of error if failed
      - `quota_exceeded` (boolean) - whether quota was exceeded
      - `created_at` (timestamptz) - when the log was created

    - `youtube_cache`
      - `id` (uuid, primary key)
      - `cache_key` (text, unique) - unique identifier for cached data
      - `operation_type` (text) - type of YouTube API operation
      - `request_params` (jsonb) - parameters used in the request
      - `response_data` (jsonb) - cached response data
      - `created_at` (timestamptz) - when cached
      - `expires_at` (timestamptz) - when cache expires
      - `last_accessed_at` (timestamptz) - last time cache was accessed

    - `youtube_quota_status`
      - `id` (uuid, primary key)
      - `api_key_type` (text, unique) - 'primary' or 'backup'
      - `is_exhausted` (boolean) - whether quota is exhausted
      - `exhausted_at` (timestamptz) - when quota was exhausted
      - `reset_at` (timestamptz) - when quota resets (midnight PST)
      - `total_requests_today` (integer) - count of requests today
      - `failed_requests_today` (integer) - count of failed requests
      - `updated_at` (timestamptz) - last update time

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to read quota status
    - Only system (service role) can write to these tables
*/

-- Create youtube_quota_logs table
CREATE TABLE IF NOT EXISTS youtube_quota_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  api_key_type text NOT NULL CHECK (api_key_type IN ('primary', 'backup')),
  operation_type text NOT NULL,
  success boolean DEFAULT false,
  error_type text,
  quota_exceeded boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_quota_logs_created_at ON youtube_quota_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_quota_logs_key_type ON youtube_quota_logs(api_key_type);

ALTER TABLE youtube_quota_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read quota logs"
  ON youtube_quota_logs FOR SELECT
  TO authenticated
  USING (true);

-- Create youtube_cache table
CREATE TABLE IF NOT EXISTS youtube_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cache_key text UNIQUE NOT NULL,
  operation_type text NOT NULL,
  request_params jsonb NOT NULL DEFAULT '{}'::jsonb,
  response_data jsonb NOT NULL,
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz NOT NULL,
  last_accessed_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_youtube_cache_key ON youtube_cache(cache_key);
CREATE INDEX IF NOT EXISTS idx_youtube_cache_expires ON youtube_cache(expires_at);
CREATE INDEX IF NOT EXISTS idx_youtube_cache_operation ON youtube_cache(operation_type);

ALTER TABLE youtube_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read cache"
  ON youtube_cache FOR SELECT
  TO authenticated
  USING (expires_at > now());

-- Create youtube_quota_status table
CREATE TABLE IF NOT EXISTS youtube_quota_status (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  api_key_type text UNIQUE NOT NULL CHECK (api_key_type IN ('primary', 'backup')),
  is_exhausted boolean DEFAULT false,
  exhausted_at timestamptz,
  reset_at timestamptz,
  total_requests_today integer DEFAULT 0,
  failed_requests_today integer DEFAULT 0,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE youtube_quota_status ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read quota status"
  ON youtube_quota_status FOR SELECT
  TO authenticated
  USING (true);

-- Initialize quota status for primary and backup keys
INSERT INTO youtube_quota_status (api_key_type, reset_at)
VALUES
  ('primary', (now() AT TIME ZONE 'America/Los_Angeles' + INTERVAL '1 day')::date AT TIME ZONE 'America/Los_Angeles'),
  ('backup', (now() AT TIME ZONE 'America/Los_Angeles' + INTERVAL '1 day')::date AT TIME ZONE 'America/Los_Angeles')
ON CONFLICT (api_key_type) DO NOTHING;

-- Function to clean up expired cache entries
CREATE OR REPLACE FUNCTION cleanup_expired_cache()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM youtube_cache
  WHERE expires_at < now();
END;
$$;

-- Function to reset quota status at midnight PST
CREATE OR REPLACE FUNCTION reset_quota_status()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  next_reset timestamptz;
BEGIN
  next_reset := (now() AT TIME ZONE 'America/Los_Angeles' + INTERVAL '1 day')::date AT TIME ZONE 'America/Los_Angeles';

  UPDATE youtube_quota_status
  SET
    is_exhausted = false,
    exhausted_at = NULL,
    reset_at = next_reset,
    total_requests_today = 0,
    failed_requests_today = 0,
    updated_at = now();
END;
$$;
