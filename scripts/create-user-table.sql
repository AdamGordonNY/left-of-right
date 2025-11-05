-- Create User table for Clerk authentication
CREATE TABLE IF NOT EXISTS "User" (
  id TEXT PRIMARY KEY,
  "clerkId" TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  "firstName" TEXT,
  "lastName" TEXT,
  "imageUrl" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS "User_clerkId_idx" ON "User"("clerkId");
CREATE INDEX IF NOT EXISTS "User_email_idx" ON "User"(email);

-- Create trigger to update updatedAt
CREATE OR REPLACE FUNCTION update_user_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS user_updated_at_trigger ON "User";
CREATE TRIGGER user_updated_at_trigger
  BEFORE UPDATE ON "User"
  FOR EACH ROW
  EXECUTE FUNCTION update_user_updated_at();
