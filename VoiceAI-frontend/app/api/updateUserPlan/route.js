import { clerkClient } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

export async function POST(req) {
  const { user, plan } = await req.json();
  const res = await clerkClient.users.updateUserMetadata(user?.id, {
    publicMetadata: {
      plan,
    },
  });
  return NextResponse.json({ message: 'OK', res });
}
