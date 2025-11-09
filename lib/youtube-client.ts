import { google, youtube_v3 } from "googleapis";

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

  getClient(): youtube_v3.Youtube {
    const apiKey = this.usingBackupKey && this.backupKey
      ? this.backupKey
      : this.primaryKey;

    return google.youtube({
      version: "v3",
      auth: apiKey,
    });
  }

  getAuthenticatedClient(accessToken: string): youtube_v3.Youtube {
    return google.youtube({
      version: "v3",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
  }

  isQuotaExceededError(error: any): boolean {
    if (!error || typeof error !== "object") return false;

    const apiError = error as YouTubeApiError;

    if (apiError.code === 403) {
      const quotaReasons = ["quotaExceeded", "dailyLimitExceeded", "rateLimitExceeded"];

      if (apiError.errors && Array.isArray(apiError.errors)) {
        return apiError.errors.some(err =>
          err.reason && quotaReasons.includes(err.reason)
        );
      }

      if (apiError.message) {
        const message = apiError.message.toLowerCase();
        return message.includes("quota") ||
               message.includes("rate limit") ||
               message.includes("daily limit");
      }
    }

    return false;
  }

  async executeWithFallback<T>(
    operation: (client: youtube_v3.Youtube) => Promise<T>
  ): Promise<T> {
    try {
      const client = this.getClient();
      const result = await operation(client);
      return result;
    } catch (error) {
      if (this.isQuotaExceededError(error) && !this.usingBackupKey && this.backupKey) {
        console.warn("Primary YouTube API key quota exceeded. Switching to backup key...");
        this.usingBackupKey = true;

        try {
          const backupClient = this.getClient();
          const result = await operation(backupClient);
          console.log("Successfully completed request using backup API key");
          return result;
        } catch (backupError) {
          if (this.isQuotaExceededError(backupError)) {
            console.error("Both YouTube API keys have exceeded their quota");
            throw new Error("YouTube API quota exceeded for all available keys. Please try again later.");
          }
          throw backupError;
        }
      }

      throw error;
    }
  }

  resetTorimaryKey(): void {
    if (this.usingBackupKey) {
      console.log("Resetting YouTube API client to use primary key");
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

export function getYouTubeClient(): youtube_v3.Youtube {
  return youtubeClientManager.getClient();
}

export function getAuthenticatedYouTubeClient(accessToken: string): youtube_v3.Youtube {
  return youtubeClientManager.getAuthenticatedClient(accessToken);
}

export async function executeYouTubeOperation<T>(
  operation: (client: youtube_v3.Youtube) => Promise<T>
): Promise<T> {
  return youtubeClientManager.executeWithFallback(operation);
}
