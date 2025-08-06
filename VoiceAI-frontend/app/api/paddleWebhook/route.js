import { clerkClient } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

export async function POST(req) {
  const webhookBody = await req.json();
  //   console.log(webhookBody);
  const { data } = webhookBody;
  const { custom_data } = data;

  if (webhookBody.event_type === 'subscription.created') {
    const result = await clerkClient.users.updateUserMetadata(
      custom_data.userId,
      {
        publicMetadata: {
          planData: custom_data,
        },
      },
    );
    return NextResponse.json({ message: 'OK', result });
  }

  return NextResponse.json({ message: 'OK', webhookBody });
}
