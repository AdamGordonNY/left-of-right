import { google, youtube_v3 } from "googleapis";
import {
  getCachedData,
  setCachedData,
  logQuotaUsage,
  getMidnightPST,
} from "./youtube-cache";

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

class YouTubeClientManager {
  private primaryKey: string;
  private backupKey: string | null;
  private usingBackupKey: boolean = false;

  constructor() {
    this.primaryKey = process.env.YOUTUBE_API_KEY || "";
    this.backupKey = process.env.YOUTUBE_BACKUP_KEY || null;

    if (!this.primaryKey) {
      throw new Error("YOUTUBE_API_KEY environment variable is not configured");
    }
  }

  // Build an authenticated YouTube client using the current key (primary or backup)
  getClient(): youtube_v3.Youtube {
    const apiKey =
      this.usingBackupKey && this.backupKey ? this.backupKey : this.primaryKey;

    return google.youtube({
      version: "v3",
      auth: apiKey,
    });
  }

  // Build an OAuth-authenticated YouTube client using a bearer token
  getAuthenticatedClient(accessToken: string): youtube_v3.Youtube {
    return google.youtube({
      version: "v3",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
  }

  // Detect quota-related errors from YouTube API responses
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
          (err) => err.reason && quotaReasons.includes(err.reason),
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

  // Execute an API call with automatic quota logging, caching, and backup-key fallback
  async executeWithFallback<T>(
    operation: (client: youtube_v3.Youtube) => Promise<T>,
    operationType: string,
    params: any = {},
    cacheOptions?: { ttlMinutes?: number },
  ): Promise<T> {
    const keyType = this.usingBackupKey ? "backup" : "primary";

    try {
      const client = this.getClient();
      const result = await operation(client);

      await logQuotaUsage({
        apiKeyType: keyType,
        operationType,
        success: true,
        quotaExceeded: false,
      });

      if (cacheOptions) {
        await setCachedData(operationType, params, result, cacheOptions);
      }

      return result;
    } catch (error) {
      if (this.isQuotaExceededError(error)) {
        await logQuotaUsage({
          apiKeyType: keyType,
          operationType,
          success: false,
          quotaExceeded: true,
          errorType: "quota_exceeded",
        });

        if (!this.usingBackupKey && this.backupKey) {
          console.warn(
            "Primary YouTube API key quota exceeded. Switching to backup key...",
          );
          this.usingBackupKey = true;

          try {
            const backupClient = this.getClient();
            const result = await operation(backupClient);

            await logQuotaUsage({
              apiKeyType: "backup",
              operationType,
              success: true,
              quotaExceeded: false,
            });

            if (cacheOptions) {
              await setCachedData(operationType, params, result, cacheOptions);
            }

            console.log("Successfully completed request using backup API key");
            return result;
          } catch (backupError) {
            if (this.isQuotaExceededError(backupError)) {
              await logQuotaUsage({
                apiKeyType: "backup",
                operationType,
                success: false,
                quotaExceeded: true,
                errorType: "quota_exceeded",
              });

              console.error("Both YouTube API keys have exceeded their quota");

              const cachedData = await getCachedData<T>(operationType, params);
              if (cachedData) {
                console.log("Returning cached data due to quota exhaustion");
                return cachedData;
              }

              const resetAt = getMidnightPST();
              throw new QuotaExhaustedError(
                "YouTube API quota exceeded for all available keys. Please try again after midnight PST.",
                resetAt,
              );
            }

            await logQuotaUsage({
              apiKeyType: "backup",
              operationType,
              success: false,
              quotaExceeded: false,
              errorType: String(backupError),
            });

            throw backupError;
          }
        }

        const cachedData = await getCachedData<T>(operationType, params);
        if (cachedData) {
          console.log("Returning cached data due to quota exhaustion");
          return cachedData;
        }

        const resetAt = getMidnightPST();
        throw new QuotaExhaustedError(
          "YouTube API quota exceeded. Please try again after midnight PST.",
          resetAt,
        );
      }

      await logQuotaUsage({
        apiKeyType: keyType,
        operationType,
        success: false,
        quotaExceeded: false,
        errorType: String(error),
      });

      throw error;
    }
  }

  // Reset the client to use the primary key after falling back
  resetTorimaryKey(): void {
    if (this.usingBackupKey) {
      console.log("Resetting YouTube API client to use primary key");
      this.usingBackupKey = false;
    }
  }

  // Report whether the backup key is currently active
  isUsingBackupKey(): boolean {
    return this.usingBackupKey;
  }

  // Report whether a backup key is configured
  hasBackupKey(): boolean {
    return this.backupKey !== null && this.backupKey.length > 0;
  }
}

export const youtubeClientManager = new YouTubeClientManager();

export function getYouTubeClient(): youtube_v3.Youtube {
  return youtubeClientManager.getClient();
}

// Build an OAuth-authenticated client for user-scoped operations
export function getAuthenticatedYouTubeClient(
  accessToken: string,
): youtube_v3.Youtube {
  return youtubeClientManager.getAuthenticatedClient(accessToken);
}

// Execute a YouTube operation with quota handling and optional caching
export async function executeYouTubeOperation<T>(
  operation: (client: youtube_v3.Youtube) => Promise<T>,
  operationType: string,
  params: any = {},
  cacheOptions?: { ttlMinutes?: number },
): Promise<T> {
  return youtubeClientManager.executeWithFallback(
    operation,
    operationType,
    params,
    cacheOptions,
  );
}
