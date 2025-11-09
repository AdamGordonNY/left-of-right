import { prisma } from "./prisma";
import { getUserSubscriptions, getChannelInfo } from "./youtube";
import { getGoogleOAuthToken, hasGoogleOAuthConnection } from "./clerk-oauth";

export interface SubscriptionImportResult {
  success: boolean;
  channelsAdded: number;
  channelsLinked: number;
  errors: string[];
}

export async function importYouTubeSubscriptions(
  clerkUserId: string,
  dbUserId: string
): Promise<SubscriptionImportResult> {
  const result: SubscriptionImportResult = {
    success: false,
    channelsAdded: 0,
    channelsLinked: 0,
    errors: [],
  };

  try {
    const hasGoogle = await hasGoogleOAuthConnection(clerkUserId);
    if (!hasGoogle) {
      result.errors.push("User did not sign up with Google");
      return result;
    }

    const accessToken = await getGoogleOAuthToken(clerkUserId);
    if (!accessToken) {
      result.errors.push("Could not retrieve Google OAuth token");
      return result;
    }

    const subscriptions = await getUserSubscriptions(accessToken);
    console.log(
      `Found ${subscriptions.length} subscriptions for user ${clerkUserId}`
    );

    if (subscriptions.length === 0) {
      result.success = true;
      return result;
    }

    for (const subscription of subscriptions) {
      try {
        if (!subscription.channelId) {
          result.errors.push(
            `Skipping subscription with missing channel ID: ${subscription.channelTitle}`
          );
          continue;
        }

        const channelUrl = `https://www.youtube.com/channel/${subscription.channelId}`;

        let source = await prisma.source.findFirst({
          where: {
            type: "youtube",
            url: channelUrl,
          },
        });

        if (!source) {
          const channelInfo = await getChannelInfo(subscription.channelId);

          source = await prisma.source.create({
            data: {
              name: subscription.channelTitle,
              type: "youtube",
              url: channelUrl,
              description: subscription.channelDescription || null,
              avatarUrl: subscription.thumbnailUrl || null,
              isActive: true,
              isGlobal: true,
              createdByUserId: null,
            },
          });

          result.channelsAdded++;
          console.log(`Created new source: ${source.name}`);
        }

        const existingFollow = await prisma.userFollow.findUnique({
          where: {
            userId_sourceId: {
              userId: dbUserId,
              sourceId: source.id,
            },
          },
        });

        if (!existingFollow) {
          await prisma.userFollow.create({
            data: {
              userId: dbUserId,
              sourceId: source.id,
            },
          });

          result.channelsLinked++;
          console.log(`User following: ${source.name}`);
        }
      } catch (error) {
        const errorMessage = `Failed to process ${subscription.channelTitle}: ${error}`;
        console.error(errorMessage);
        result.errors.push(errorMessage);
      }
    }

    result.success = true;
    console.log(
      `Subscription import complete: ${result.channelsAdded} added, ${result.channelsLinked} linked`
    );
  } catch (error) {
    console.error("Error importing YouTube subscriptions:", error);
    result.errors.push(`Import failed: ${error}`);
  }

  return result;
}
