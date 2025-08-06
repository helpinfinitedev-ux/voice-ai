import { createUser, deleteUser } from '@/lib/actions/user.actions';
import { clerkClient } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const evt = await req.json();

  const eventType = evt.type;
  if (eventType === 'user?.created') {
    const { id, email_addresses, image_url, first_name, last_name, username } =
      evt.data;
    const todayTimestamp = Date.now();

    // Calculate timestamp for 7 days ahead
    const sevenDaysAheadTimestamp = todayTimestamp + 7 * 24 * 60 * 60 * 1000;
    const user = {
      user_id: id,
      email: email_addresses[0].email_address,
      username: username!,
      first_name,
      last_name,
      photo: image_url,
      plan: {
        conversations: 50,
        start_date: todayTimestamp,
        end_date: sevenDaysAheadTimestamp,
        plan_name: 'trial',
        amount: 0,
      },
      calendly_integrated: false,
    };
    // const newUser = await createUser(user);

    await clerkClient.users.updateUserMetadata(id, {
      publicMetadata: {
        plan: user?.plan,
      },
    });

    return NextResponse.json({ message: 'OK', user });
  }
  // if (eventType === 'user?.updated') {
  //   const { id, public_metadata } = evt.data;
  //   const user = {
  //     calendly_integrated: public_metadata.calendlyIntegrated,
  //   };
  //   console.log(user);
  //   const res = await updateUser(id, user);
  //   return NextResponse.json({ message: 'OK', user: res });
  // }
  if (eventType === 'user?.deleted') {
    const { id } = evt.data;

    // const deletedUser = await deleteUser(id!);

    return NextResponse.json({ message: 'OK', id });
  }

  return new Response('', { status: 200 });
}
