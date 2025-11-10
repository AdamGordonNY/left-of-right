import { youtube_v3 } from "googleapis";
import {
  getQuotaStatus,
  logQuotaUsage,
  getMidnightPST,
  createCachedYouTubeFunction,
  createCacheKey,
} from "./youtube-cache-nextjs";

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

  constructor() {
    this.primaryKey = process.env.YOUTUBE_API_KEY || "";
    this.backupKey = process.env.YOUTUBE_BACKUP_KEY || null;

    if (!this.primaryKey) {
      throw new Error("YOUTUBE_API_KEY environment variable is not configured");
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
    const status = await getQuotaStatus();

    if (status.primary.isExhausted && !this.usingBackupKey) {
      if (this.backupKey && !status.backup.isExhausted) {
        console.log("[YouTube API] Primary key exhausted, switching to backup");
        this.usingBackupKey = true;
      } else if (!this.backupKey || status.backup.isExhausted) {
        const resetAt = status.primary.resetAt
          ? new Date(status.primary.resetAt)
          : getMidnightPST();
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

      // Log successful request
      await logQuotaUsage(keyType, true, false);

      return result;
    } catch (error) {
      if (this.isQuotaExceededError(error)) {
        // Log quota exhaustion
        await logQuotaUsage(keyType, false, true);

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
            await logQuotaUsage("backup", true, false);

            console.log(
              "[YouTube API] Successfully completed request using backup key"
            );
            return result;
          } catch (backupError) {
            if (this.isQuotaExceededError(backupError)) {
              await logQuotaUsage("backup", false, true);
              console.error("[YouTube API] Both keys have exceeded quota");

              const resetAt = getMidnightPST();
              throw new QuotaExhaustedError(
                "YouTube API quota exceeded for all available keys. Please try again after midnight PST.",
                resetAt
              );
            }

            await logQuotaUsage("backup", false, false);
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
      await logQuotaUsage(keyType, false, false);
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

export async function executeYouTubeOperation<T>(
  operation: (apiKey: string) => Promise<T>,
  operationType: string,
  params: Record<string, any> = {},
  options: {
    useCache?: boolean;
    revalidate?: number;
  } = {}
): Promise<T> {
  return youtubeClientManager.executeWithFallback(
    operation,
    operationType,
    params,
    options
  );
}
