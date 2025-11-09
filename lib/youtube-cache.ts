import { createClient } from "@supabase/supabase-js";
import { createHash } from "crypto";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export interface CacheOptions {
  ttlMinutes?: number;
}

export interface QuotaLogEntry {
  apiKeyType: "primary" | "backup";
  operationType: string;
  success: boolean;
  errorType?: string;
  quotaExceeded: boolean;
}

function generateCacheKey(operationType: string, params: any): string {
  const paramsString = JSON.stringify(params, Object.keys(params).sort());
  const hash = createHash("md5").update(paramsString).digest("hex");
  return `${operationType}:${hash}`;
}

export async function getCachedData<T>(
  operationType: string,
  params: any
): Promise<T | null> {
  try {
    const cacheKey = generateCacheKey(operationType, params);

    const { data, error } = await supabase
      .from("youtube_cache")
      .select("response_data, expires_at")
      .eq("cache_key", cacheKey)
      .gt("expires_at", new Date().toISOString())
      .maybeSingle();

    if (error) {
      console.error("Error fetching from cache:", error);
      return null;
    }

    if (data) {
      await supabase
        .from("youtube_cache")
        .update({ last_accessed_at: new Date().toISOString() })
        .eq("cache_key", cacheKey);

      console.log(`Cache hit for ${operationType}`);
      return data.response_data as T;
    }

    return null;
  } catch (error) {
    console.error("Error in getCachedData:", error);
    return null;
  }
}

export async function setCachedData<T>(
  operationType: string,
  params: any,
  data: T,
  options?: CacheOptions
): Promise<void> {
  try {
    const cacheKey = generateCacheKey(operationType, params);
    const ttl = options?.ttlMinutes || 60;
    const expiresAt = new Date(Date.now() + ttl * 60 * 1000);

    await supabase.from("youtube_cache").upsert(
      {
        cache_key: cacheKey,
        operation_type: operationType,
        request_params: params,
        response_data: data as any,
        expires_at: expiresAt.toISOString(),
        last_accessed_at: new Date().toISOString(),
      },
      { onConflict: "cache_key" }
    );

    console.log(`Cached ${operationType} data for ${ttl} minutes`);
  } catch (error) {
    console.error("Error in setCachedData:", error);
  }
}

export async function logQuotaUsage(entry: QuotaLogEntry): Promise<void> {
  try {
    await supabase.from("youtube_quota_logs").insert({
      api_key_type: entry.apiKeyType,
      operation_type: entry.operationType,
      success: entry.success,
      error_type: entry.errorType,
      quota_exceeded: entry.quotaExceeded,
    });

    await supabase
      .from("youtube_quota_status")
      .update({
        total_requests_today: supabase.rpc("increment_requests"),
        updated_at: new Date().toISOString(),
      })
      .eq("api_key_type", entry.apiKeyType);

    if (entry.quotaExceeded) {
      const midnightPST = new Date();
      midnightPST.setDate(midnightPST.getDate() + 1);
      midnightPST.setHours(0, 0, 0, 0);

      const pstOffset = 8 * 60 * 60 * 1000;
      const resetAt = new Date(midnightPST.getTime() + pstOffset);

      await supabase
        .from("youtube_quota_status")
        .update({
          is_exhausted: true,
          exhausted_at: new Date().toISOString(),
          reset_at: resetAt.toISOString(),
          failed_requests_today: supabase.rpc("increment_failures"),
        })
        .eq("api_key_type", entry.apiKeyType);

      console.log(`Quota exhausted for ${entry.apiKeyType} key. Resets at ${resetAt.toISOString()}`);
    }
  } catch (error) {
    console.error("Error logging quota usage:", error);
  }
}

export async function getQuotaStatus(): Promise<{
  primary: { isExhausted: boolean; resetAt: string | null };
  backup: { isExhausted: boolean; resetAt: string | null };
}> {
  try {
    const { data, error } = await supabase
      .from("youtube_quota_status")
      .select("api_key_type, is_exhausted, reset_at")
      .in("api_key_type", ["primary", "backup"]);

    if (error) throw error;

    const status = {
      primary: { isExhausted: false, resetAt: null as string | null },
      backup: { isExhausted: false, resetAt: null as string | null },
    };

    data?.forEach((row) => {
      if (row.api_key_type === "primary") {
        status.primary = {
          isExhausted: row.is_exhausted,
          resetAt: row.reset_at,
        };
      } else if (row.api_key_type === "backup") {
        status.backup = {
          isExhausted: row.is_exhausted,
          resetAt: row.reset_at,
        };
      }
    });

    return status;
  } catch (error) {
    console.error("Error fetching quota status:", error);
    return {
      primary: { isExhausted: false, resetAt: null },
      backup: { isExhausted: false, resetAt: null },
    };
  }
}

export async function cleanupExpiredCache(): Promise<void> {
  try {
    const { error } = await supabase.rpc("cleanup_expired_cache");
    if (error) throw error;
    console.log("Cleaned up expired cache entries");
  } catch (error) {
    console.error("Error cleaning up cache:", error);
  }
}

export function getMidnightPST(): Date {
  const now = new Date();
  const pst = new Date(now.toLocaleString("en-US", { timeZone: "America/Los_Angeles" }));

  pst.setDate(pst.getDate() + 1);
  pst.setHours(0, 0, 0, 0);

  return pst;
}
