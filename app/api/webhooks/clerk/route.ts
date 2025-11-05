import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { Webhook } from 'svix';
import { WebhookEvent } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  // Get the headers
  const headerPayload = await headers();
  const svix_id = headerPayload.get('svix-id');
  const svix_timestamp = headerPayload.get('svix-timestamp');
  const svix_signature = headerPayload.get('svix-signature');

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return NextResponse.json(
      { error: 'Missing svix headers' },
      { status: 400 }
    );
  }

  // Get the body
  const payload = await req.json();
  const body = JSON.stringify(payload);

  // Get the Clerk webhook secret from environment variables
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    throw new Error(
      'Please add CLERK_WEBHOOK_SECRET from Clerk Dashboard to .env or .env.local'
    );
  }

  // Create a new Svix instance with your webhook secret
  const wh = new Webhook(WEBHOOK_SECRET);

  let evt: WebhookEvent;

  // Verify the payload with the headers
  try {
    evt = wh.verify(body, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    }) as WebhookEvent;
  } catch (err) {
    console.error('Error verifying webhook:', err);
    return NextResponse.json(
      { error: 'Invalid webhook signature' },
      { status: 400 }
    );
  }

  // Handle the webhook
  const eventType = evt.type;

  try {
    switch (eventType) {
      case 'user.created':
        await handleUserCreated(evt);
        break;
      case 'user.updated':
        await handleUserUpdated(evt);
        break;
      case 'user.deleted':
        await handleUserDeleted(evt);
        break;
      default:
        console.log(`Unhandled webhook event type: ${eventType}`);
    }

    return NextResponse.json(
      { message: 'Webhook processed successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error processing webhook:', error);
    return NextResponse.json(
      { error: 'Error processing webhook' },
      { status: 500 }
    );
  }
}

async function handleUserCreated(evt: WebhookEvent) {
  if (evt.type !== 'user.created') return;

  const { id, email_addresses, first_name, last_name, image_url } = evt.data;

  const primaryEmail = email_addresses.find(
    (email) => email.id === evt.data.primary_email_address_id
  );

  if (!primaryEmail?.email_address) {
    throw new Error('No primary email address found');
  }

  await prisma.user.create({
    data: {
      clerkId: id,
      email: primaryEmail.email_address,
      firstName: first_name || null,
      lastName: last_name || null,
      imageUrl: image_url || null,
      role: 'member',
    },
  });

  console.log(`User created: ${primaryEmail.email_address}`);
}

async function handleUserUpdated(evt: WebhookEvent) {
  if (evt.type !== 'user.updated') return;

  const { id, email_addresses, first_name, last_name, image_url } = evt.data;

  const primaryEmail = email_addresses.find(
    (email) => email.id === evt.data.primary_email_address_id
  );

  if (!primaryEmail?.email_address) {
    throw new Error('No primary email address found');
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

async function handleUserDeleted(evt: WebhookEvent) {
  if (evt.type !== 'user.deleted') return;

  const { id } = evt.data;

  if (!id) {
    throw new Error('No user ID found');
  }

  await prisma.user.delete({
    where: { clerkId: id },
  });

  console.log(`User deleted: ${id}`);
}
