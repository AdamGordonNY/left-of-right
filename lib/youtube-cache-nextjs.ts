import { unstable_cache } from "next/cache";
import { readFile, writeFile, mkdir } from "fs/promises";
import { join } from "path";

// Use /tmp for serverless environments (Vercel, AWS Lambda, etc.)
const CACHE_DIR = process.env.VERCEL
  ? join("/tmp", ".cache")
  : join(process.cwd(), ".cache");
const QUOTA_FILE = join(CACHE_DIR, "quota-status.json");

export interface QuotaStatus {
  primary: {
    isExhausted: boolean;
    exhaustedAt: string | null;
    resetAt: string | null;
    requestsToday: number;
  };
  backup: {
    isExhausted: boolean;
    exhaustedAt: string | null;
    resetAt: string | null;
    requestsToday: number;
  };
}

// Ensure cache directory exists
async function ensureCacheDir() {
  try {
    await mkdir(CACHE_DIR, { recursive: true });
  } catch (error) {
    // Directory already exists
  }
}

// Get midnight PST (YouTube quota reset time)
export function getMidnightPST(): Date {
  const now = new Date();
  const pst = new Date(
    now.toLocaleString("en-US", { timeZone: "America/Los_Angeles" })
  );

  pst.setDate(pst.getDate() + 1);
  pst.setHours(0, 0, 0, 0);

  return pst;
}

// Read quota status from file
export async function getQuotaStatus(): Promise<QuotaStatus> {
  // Always ensure cache directory exists before any operation
  await ensureCacheDir();

  const defaultStatus: QuotaStatus = {
    primary: {
      isExhausted: false,
      exhaustedAt: null,
      resetAt: null,
      requestsToday: 0,
    },
    backup: {
      isExhausted: false,
      exhaustedAt: null,
      resetAt: null,
      requestsToday: 0,
    },
  };

  try {
    const data = await readFile(QUOTA_FILE, "utf-8");
    const status = JSON.parse(data) as QuotaStatus;

    // Check if we've passed the reset time
    const now = new Date();

    if (status.primary.resetAt && new Date(status.primary.resetAt) < now) {
      status.primary.isExhausted = false;
      status.primary.requestsToday = 0;
      status.primary.exhaustedAt = null;
      status.primary.resetAt = null;
    }

    if (status.backup.resetAt && new Date(status.backup.resetAt) < now) {
      status.backup.isExhausted = false;
      status.backup.requestsToday = 0;
      status.backup.exhaustedAt = null;
      status.backup.resetAt = null;
    }

    return status;
  } catch (error: any) {
    // If file doesn't exist, create it with default status
    if (error.code === "ENOENT") {
      try {
        await writeFile(
          QUOTA_FILE,
          JSON.stringify(defaultStatus, null, 2),
          "utf-8"
        );
      } catch (writeError) {
        console.error(
          "[YouTube Cache] Failed to create quota status file:",
          writeError
        );
      }
    }

    // Return default status
    return defaultStatus;
  }
}

// Update quota status
export async function updateQuotaStatus(
  keyType: "primary" | "backup",
  updates: Partial<QuotaStatus["primary"]>
): Promise<void> {
  await ensureCacheDir();

  const status = await getQuotaStatus();
  status[keyType] = { ...status[keyType], ...updates };

  await writeFile(QUOTA_FILE, JSON.stringify(status, null, 2), "utf-8");
}

// Log quota usage
export async function logQuotaUsage(
  keyType: "primary" | "backup",
  success: boolean,
  quotaExceeded: boolean
): Promise<void> {
  const status = await getQuotaStatus();

  // Increment request counter
  status[keyType].requestsToday += 1;

  // If quota exceeded, mark as exhausted
  if (quotaExceeded) {
    const resetAt = getMidnightPST();
    status[keyType].isExhausted = true;
    status[keyType].exhaustedAt = new Date().toISOString();
    status[keyType].resetAt = resetAt.toISOString();
  }

  await updateQuotaStatus(keyType, status[keyType]);

  // Optional: Log to console for debugging
  console.log(
    `[YouTube API] ${keyType} key - Success: ${success}, Quota exceeded: ${quotaExceeded}, Total today: ${status[keyType].requestsToday}`
  );
}

// Create cached function with Next.js unstable_cache
export function createCachedYouTubeFunction<T>(
  fn: () => Promise<T>,
  keyParts: string[],
  options: {
    tags?: string[];
    revalidate?: number; // seconds
  } = {}
): () => Promise<T> {
  return unstable_cache(fn, keyParts, {
    tags: options.tags || ["youtube"],
    revalidate: options.revalidate || 3600, // 1 hour default
  });
}

// Helper to create cache key from params
export function createCacheKey(
  operationType: string,
  params: Record<string, any>
): string[] {
  const sortedParams = Object.keys(params)
    .sort()
    .map((key) => `${key}:${params[key]}`)
    .join("-");

  return ["youtube", operationType, sortedParams];
}
