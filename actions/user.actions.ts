import { WebhookEvent } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function createUserFromWebhook(evt: WebhookEvent) {
  if (evt.type !== "user.created") return;

  const { id, email_addresses, first_name, last_name, image_url } = evt.data;

  const primaryEmail = email_addresses.find(
    (email) => email.id === evt.data.primary_email_address_id
  );

  if (!primaryEmail?.email_address) {
    throw new Error("No primary email address found");
  }

  await prisma.user.create({
    data: {
      clerkId: id,
      email: primaryEmail.email_address,
      firstName: first_name || null,
      lastName: last_name || null,
      imageUrl: image_url || null,
      role: "member",
    },
  });

  console.log(`User created: ${primaryEmail.email_address}`);
}

export async function updateUserFromWebhook(evt: WebhookEvent) {
  if (evt.type !== "user.updated") return;

  const { id, email_addresses, first_name, last_name, image_url } = evt.data;

  const primaryEmail = email_addresses.find(
    (email) => email.id === evt.data.primary_email_address_id
  );

  if (!primaryEmail?.email_address) {
    throw new Error("No primary email address found");
  }

  await prisma.user.update({
    where: { clerkId: id },
    data: {
      email: primaryEmail.email_address,
      firstName: first_name || null,
      lastName: last_name || null,
      imageUrl: image_url || null,
    },
  });

  console.log(`User updated: ${primaryEmail.email_address}`);
}

export async function deleteUserFromWebhook(evt: WebhookEvent) {
  if (evt.type !== "user.deleted") return;

  const { id } = evt.data;

  if (!id) {
    throw new Error("No user ID found");
  }

  await prisma.user.delete({
    where: { clerkId: id },
  });

  console.log(`User deleted: ${id}`);
}
