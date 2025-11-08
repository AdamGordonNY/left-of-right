-- Create favorites table for storing user's favorited content items with notes
CREATE TABLE IF NOT EXISTS favorites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content_item_id UUID NOT NULL REFERENCES content_items(id) ON DELETE CASCADE,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(user_id, content_item_id)
);
-- Create index for faster lookups by user
CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON favorites(user_id);
-- Create index for faster lookups by content item
CREATE INDEX IF NOT EXISTS idx_favorites_content_item_id ON favorites(content_item_id);
-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_favorites_updated_at() RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = now();
RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER favorites_updated_at BEFORE
UPDATE ON favorites FOR EACH ROW EXECUTE FUNCTION update_favorites_updated_at();