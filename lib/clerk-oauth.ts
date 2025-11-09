import { clerkClient } from "@clerk/nextjs/server";

export async function getGoogleOAuthToken(
  clerkUserId: string
): Promise<string | null> {
  try {
    const client = await clerkClient();
    const response = await client.users.getUserOauthAccessToken(
      clerkUserId,
      "oauth_google"
    );

    if (!response.data || response.data.length === 0) {
      console.log("No OAuth token found for user:", clerkUserId);
      return null;
    }

    const token = response.data[0]?.token;
    return token || null;
  } catch (error) {
    console.error("Error fetching Google OAuth token:", error);
    return null;
  }
}

export async function hasGoogleOAuthConnection(
  clerkUserId: string
): Promise<boolean> {
  try {
    const client = await clerkClient();
    const user = await client.users.getUser(clerkUserId);

    const hasGoogle = user.externalAccounts?.some(
      (account) => account.provider === "google"
    );

    return hasGoogle || false;
  } catch (error) {
    console.error("Error checking Google OAuth connection:", error);
    return false;
  }
}
