import { prisma } from './prisma';
import { User } from '@prisma/client';

export async function createUser(data: {
  clerkId: string;
  email: string;
  firstName?: string;
  lastName?: string;
  imageUrl?: string;
}): Promise<User> {
  return prisma.user.create({
    data: {
      id: data.clerkId,
      clerkId: data.clerkId,
      email: data.email,
      firstName: data.firstName,
      lastName: data.lastName,
      imageUrl: data.imageUrl,
    },
  });
}

export async function getUserByClerkId(clerkId: string): Promise<User | null> {
  return prisma.user.findUnique({
    where: { clerkId },
  });
}

export async function getUserByEmail(email: string): Promise<User | null> {
  return prisma.user.findUnique({
    where: { email },
  });
}

export async function updateUser(
  clerkId: string,
  data: {
    email?: string;
    firstName?: string;
    lastName?: string;
    imageUrl?: string;
  }
): Promise<User> {
  return prisma.user.update({
    where: { clerkId },
    data,
  });
}

export async function deleteUser(clerkId: string): Promise<User> {
  return prisma.user.delete({
    where: { clerkId },
  });
}

export async function upsertUser(data: {
  clerkId: string;
  email: string;
  firstName?: string;
  lastName?: string;
  imageUrl?: string;
}): Promise<User> {
  return prisma.user.upsert({
    where: { clerkId: data.clerkId },
    update: {
      email: data.email,
      firstName: data.firstName,
      lastName: data.lastName,
      imageUrl: data.imageUrl,
    },
    create: {
      id: data.clerkId,
      clerkId: data.clerkId,
      email: data.email,
      firstName: data.firstName,
      lastName: data.lastName,
      imageUrl: data.imageUrl,
    },
  });
}
