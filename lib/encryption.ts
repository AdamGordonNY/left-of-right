import crypto from "crypto";

// Encryption configuration
const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;
const SALT_LENGTH = 64;
const KEY_LENGTH = 32;

/**
 * Get the encryption key from environment variables
 * This should be a secure random string stored in .env
 */
function getEncryptionKey(): string {
  const key = process.env.ENCRYPTION_SECRET;

  if (!key) {
    throw new Error(
      "ENCRYPTION_SECRET environment variable is not set. Please add a secure random string to your .env file."
    );
  }

  if (key.length < 32) {
    throw new Error("ENCRYPTION_SECRET must be at least 32 characters long.");
  }

  return key;
}

/**
 * Derive a cryptographic key from the encryption secret using PBKDF2
 */
function deriveKey(secret: string, salt: Buffer): Buffer {
  return crypto.pbkdf2Sync(secret, salt, 100000, KEY_LENGTH, "sha256");
}

/**
 * Encrypt a string value using AES-256-GCM
 * @param plaintext - The string to encrypt (e.g., YouTube API key)
 * @returns Encrypted string in format: salt:iv:authTag:ciphertext (all base64 encoded)
 */
export function encrypt(plaintext: string): string {
  if (!plaintext) {
    throw new Error("Cannot encrypt empty string");
  }

  try {
    const secret = getEncryptionKey();

    // Generate random salt and IV
    const salt = crypto.randomBytes(SALT_LENGTH);
    const iv = crypto.randomBytes(IV_LENGTH);

    // Derive key from secret using salt
    const key = deriveKey(secret, salt);

    // Create cipher
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

    // Encrypt the plaintext
    const encrypted = Buffer.concat([
      cipher.update(plaintext, "utf8"),
      cipher.final(),
    ]);

    // Get authentication tag
    const authTag = cipher.getAuthTag();

    // Combine salt, iv, authTag, and encrypted data
    // Format: salt:iv:authTag:ciphertext
    return [
      salt.toString("base64"),
      iv.toString("base64"),
      authTag.toString("base64"),
      encrypted.toString("base64"),
    ].join(":");
  } catch (error) {
    console.error("[Encryption] Error encrypting data:", error);
    throw new Error("Failed to encrypt data");
  }
}

/**
 * Decrypt a string value that was encrypted with the encrypt function
 * @param encryptedData - The encrypted string in format: salt:iv:authTag:ciphertext
 * @returns Decrypted plaintext string
 */
export function decrypt(encryptedData: string): string {
  if (!encryptedData) {
    throw new Error("Cannot decrypt empty string");
  }

  try {
    const secret = getEncryptionKey();

    // Split the encrypted data
    const parts = encryptedData.split(":");

    if (parts.length !== 4) {
      throw new Error("Invalid encrypted data format");
    }

    const [saltB64, ivB64, authTagB64, encryptedB64] = parts;

    // Convert from base64
    const salt = Buffer.from(saltB64, "base64");
    const iv = Buffer.from(ivB64, "base64");
    const authTag = Buffer.from(authTagB64, "base64");
    const encrypted = Buffer.from(encryptedB64, "base64");

    // Derive key from secret using salt
    const key = deriveKey(secret, salt);

    // Create decipher
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    // Decrypt
    const decrypted = Buffer.concat([
      decipher.update(encrypted),
      decipher.final(),
    ]);

    return decrypted.toString("utf8");
  } catch (error) {
    console.error("[Encryption] Error decrypting data:", error);
    throw new Error(
      "Failed to decrypt data. The data may be corrupted or the encryption key may have changed."
    );
  }
}

/**
 * Validate that a YouTube API key is in the correct format
 * YouTube API keys are typically 39 characters long and contain alphanumeric characters, hyphens, and underscores
 */
export function validateYouTubeApiKey(apiKey: string): boolean {
  if (!apiKey || typeof apiKey !== "string") {
    return false;
  }

  // Remove whitespace
  const trimmedKey = apiKey.trim();

  // YouTube API keys are typically 39 characters long
  // They contain alphanumeric characters, hyphens, and underscores
  const apiKeyPattern = /^[A-Za-z0-9_-]{39}$/;

  return apiKeyPattern.test(trimmedKey);
}

/**
 * Mask an API key for display purposes
 * Shows only the first 8 and last 4 characters
 */
export function maskApiKey(apiKey: string): string {
  if (!apiKey || apiKey.length < 12) {
    return "••••••••••••";
  }

  const first = apiKey.substring(0, 8);
  const last = apiKey.substring(apiKey.length - 4);
  const masked = "•".repeat(Math.max(0, apiKey.length - 12));

  return `${first}${masked}${last}`;
}
