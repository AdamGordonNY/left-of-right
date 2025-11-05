-- Create Source table
CREATE TABLE IF NOT EXISTS "Source" (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  url TEXT NOT NULL,
  description TEXT,
  "avatarUrl" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create ContentItem table
CREATE TABLE IF NOT EXISTS "ContentItem" (
  id TEXT PRIMARY KEY,
  "sourceId" TEXT NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  "thumbnailUrl" TEXT,
  description TEXT,
  "publishedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ContentItem_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "Source"(id) ON DELETE CASCADE ON UPDATE CASCADE
);

-- Create indexes for Source
CREATE INDEX IF NOT EXISTS "Source_type_idx" ON "Source"(type);
CREATE INDEX IF NOT EXISTS "Source_isActive_idx" ON "Source"("isActive");

-- Create indexes for ContentItem
CREATE INDEX IF NOT EXISTS "ContentItem_sourceId_idx" ON "ContentItem"("sourceId");
CREATE INDEX IF NOT EXISTS "ContentItem_type_idx" ON "ContentItem"(type);
CREATE INDEX IF NOT EXISTS "ContentItem_publishedAt_idx" ON "ContentItem"("publishedAt");

-- Create trigger to update updatedAt for Source
CREATE OR REPLACE FUNCTION update_source_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER source_updated_at_trigger
  BEFORE UPDATE ON "Source"
  FOR EACH ROW
  EXECUTE FUNCTION update_source_updated_at();

-- Create trigger to update updatedAt for ContentItem
CREATE OR REPLACE FUNCTION update_content_item_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER content_item_updated_at_trigger
  BEFORE UPDATE ON "ContentItem"
  FOR EACH ROW
  EXECUTE FUNCTION update_content_item_updated_at();
