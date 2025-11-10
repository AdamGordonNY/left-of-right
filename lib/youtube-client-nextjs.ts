import { youtube_v3 } from "googleapis";
import {
  getQuotaStatus,
  logQuotaUsage,
  getMidnightPST,
  createCachedYouTubeFunction,
  createCacheKey,
  getUserQuotaStatus,
  logUserQuotaUsage,
} from "./youtube-cache-nextjs";
import { prisma } from "@/lib/prisma";
import { decrypt } from "@/lib/encryption";

export class QuotaExhaustedError extends Error {
  public resetAt: Date;

  constructor(message: string, resetAt: Date) {
    super(message);
    this.name = "QuotaExhaustedError";
    this.resetAt = resetAt;
  }
}

interface YouTubeApiError {
  code?: number;
  message?: string;
  errors?: Array<{
    domain?: string;
    reason?: string;
    message?: string;
  }>;
}

export class YouTubeClientManager {
  private primaryKey: string;
  private backupKey: string | null;
  private usingBackupKey: boolean = false;
  private userId: string | null = null;
  private isUserKeys: boolean = false;

  constructor(options?: {
    userId?: string;
    primaryKey?: string;
    backupKey?: string;
  }) {
    if (options?.userId && options?.primaryKey) {
      // User-provided keys
      this.userId = options.userId;
      this.primaryKey = options.primaryKey;
      this.backupKey = options.backupKey || null;
      this.isUserKeys = true;
    } else {
      // System keys from environment variables
      this.primaryKey = process.env.YOUTUBE_API_KEY || "";
      this.backupKey = process.env.YOUTUBE_BACKUP_KEY || null;
      this.isUserKeys = false;

      if (!this.primaryKey) {
        throw new Error(
          "YOUTUBE_API_KEY environment variable is not configured"
        );
      }
    }
  }

  getCurrentKeyType(): "primary" | "backup" {
    return this.usingBackupKey ? "backup" : "primary";
  }

  getCurrentApiKey(): string {
    return this.usingBackupKey && this.backupKey
      ? this.backupKey
      : this.primaryKey;
  }

  isQuotaExceededError(error: any): boolean {
    if (!error || typeof error !== "object") return false;

    const apiError = error as YouTubeApiError;

    if (apiError.code === 403) {
      const quotaReasons = [
        "quotaExceeded",
        "dailyLimitExceeded",
        "rateLimitExceeded",
      ];

      if (apiError.errors && Array.isArray(apiError.errors)) {
        return apiError.errors.some(
          (err) => err.reason && quotaReasons.includes(err.reason)
        );
      }

      if (apiError.message) {
        const message = apiError.message.toLowerCase();
        return (
          message.includes("quota") ||
          message.includes("rate limit") ||
          message.includes("daily limit")
        );
      }
    }

    return false;
  }

  async checkQuotaBeforeRequest(): Promise<void> {
    // Use user-specific quota if this is a user's API key
    const status =
      this.isUserKeys && this.userId
        ? await getUserQuotaStatus(this.userId)
        : await getQuotaStatus();

    if (status.primary.isExhausted && !this.usingBackupKey) {
      if (this.backupKey && !status.backup.isExhausted) {
        console.log("[YouTube API] Primary key exhausted, switching to backup");
        this.usingBackupKey = true;
      } else if (!this.backupKey || status.backup.isExhausted) {
        const resetAt = getMidnightPST();
        throw new QuotaExhaustedError(
          "YouTube API quota exceeded. Please try again after midnight PST.",
          resetAt
        );
      }
    }
  }

  async executeWithFallback<T>(
    operation: (apiKey: string) => Promise<T>,
    operationType: string,
    params: Record<string, any> = {},
    options: {
      useCache?: boolean;
      revalidate?: number;
    } = {}
  ): Promise<T> {
    // Check quota status before making request
    await this.checkQuotaBeforeRequest();

    const keyType = this.getCurrentKeyType();

    // If caching is enabled, wrap the operation
    if (options.useCache !== false) {
      const cacheKey = createCacheKey(operationType, params);
      const cachedFn = createCachedYouTubeFunction(
        () => this.executeRequest(operation, operationType, keyType),
        cacheKey,
        {
          tags: ["youtube", operationType],
          revalidate: options.revalidate,
        }
      );

      return cachedFn();
    }

    // No caching - execute directly
    return this.executeRequest(operation, operationType, keyType);
  }

  private async executeRequest<T>(
    operation: (apiKey: string) => Promise<T>,
    operationType: string,
    keyType: "primary" | "backup"
  ): Promise<T> {
    try {
      const apiKey = this.getCurrentApiKey();
      const result = await operation(apiKey);

      // Log successful request (user-specific or system-wide)
      if (this.isUserKeys && this.userId) {
        await logUserQuotaUsage(this.userId, keyType, true, false);
      } else {
        await logQuotaUsage(keyType, true, false);
      }

      return result;
    } catch (error) {
      if (this.isQuotaExceededError(error)) {
        // Log quota exhaustion
        if (this.isUserKeys && this.userId) {
          await logUserQuotaUsage(this.userId, keyType, false, true);
        } else {
          await logQuotaUsage(keyType, false, true);
        }

        // Try backup key if not already using it
        if (!this.usingBackupKey && this.backupKey) {
          console.warn(
            "[YouTube API] Primary key quota exceeded, trying backup key..."
          );
          this.usingBackupKey = true;

          try {
            const apiKey = this.getCurrentApiKey();
            const result = await operation(apiKey);

            // Log successful backup request
            if (this.isUserKeys && this.userId) {
              await logUserQuotaUsage(this.userId, "backup", true, false);
            } else {
              await logQuotaUsage("backup", true, false);
            }

            console.log(
              "[YouTube API] Successfully completed request using backup key"
            );
            return result;
          } catch (backupError) {
            if (this.isQuotaExceededError(backupError)) {
              if (this.isUserKeys && this.userId) {
                await logUserQuotaUsage(this.userId, "backup", false, true);
              } else {
                await logQuotaUsage("backup", false, true);
              }
              console.error("[YouTube API] Both keys have exceeded quota");

              const resetAt = getMidnightPST();
              throw new QuotaExhaustedError(
                "YouTube API quota exceeded for all available keys. Please try again after midnight PST.",
                resetAt
              );
            }

            if (this.isUserKeys && this.userId) {
              await logUserQuotaUsage(this.userId, "backup", false, false);
            } else {
              await logQuotaUsage("backup", false, false);
            }
            throw backupError;
          }
        }

        // No backup key or already using it
        const resetAt = getMidnightPST();
        throw new QuotaExhaustedError(
          "YouTube API quota exceeded. Please try again after midnight PST.",
          resetAt
        );
      }

      // Log other errors
      if (this.isUserKeys && this.userId) {
        await logUserQuotaUsage(this.userId, keyType, false, false);
      } else {
        await logQuotaUsage(keyType, false, false);
      }
      throw error;
    }
  }

  resetToPrimaryKey(): void {
    if (this.usingBackupKey) {
      console.log("[YouTube API] Resetting to use primary key");
      this.usingBackupKey = false;
    }
  }

  isUsingBackupKey(): boolean {
    return this.usingBackupKey;
  }

  hasBackupKey(): boolean {
    return this.backupKey !== null && this.backupKey.length > 0;
  }
}

export const youtubeClientManager = new YouTubeClientManager();

/**
 * Create a YouTube client manager for a specific user
 * Will use user's API keys if available, otherwise falls back to system keys
 */
export async function createUserYouTubeClient(
  userId: string
): Promise<YouTubeClientManager> {
  // Check if feature flag is enabled
  const userKeysEnabled = process.env.ENABLE_USER_API_KEYS === "true";

  if (!userKeysEnabled) {
    // Feature disabled - use system keys
    return youtubeClientManager;
  }

  try {
    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        youtubeApiKey: true,
        youtubeApiKeyBackup: true,
      },
    });

    // If user has their own API keys, create a client with them
    if (user?.youtubeApiKey) {
      const primaryKey = decrypt(user.youtubeApiKey);
      const backupKey = user.youtubeApiKeyBackup
        ? decrypt(user.youtubeApiKeyBackup)
        : undefined;

      return new YouTubeClientManager({
        userId,
        primaryKey,
        backupKey,
      });
    }
  } catch (error) {
    console.error("[YouTube Client] Error loading user API keys:", error);
  }

  // Fall back to system keys
  return youtubeClientManager;
}

export async function executeYouTubeOperation<T>(
  operation: (apiKey: string) => Promise<T>,
  operationType: string,
  params: Record<string, any> = {},
  options: {
    useCache?: boolean;
    revalidate?: number;
    userId?: string; // Optional user ID to use user-specific API keys
  } = {}
): Promise<T> {
  // Get the appropriate client manager
  let clientManager: YouTubeClientManager;

  if (options.userId) {
    clientManager = await createUserYouTubeClient(options.userId);
  } else {
    clientManager = youtubeClientManager;
  }

  return clientManager.executeWithFallback(
    operation,
    operationType,
    params,
    options
  );
}
