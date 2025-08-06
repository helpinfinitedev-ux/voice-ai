'use client';

import { SignIn, useAuth } from '@clerk/nextjs';
import { useEffect } from 'react';

const Page = () => {
  const { isSignedIn } = useAuth();
  useEffect(() => {
    if (isSignedIn) {
      window.location.href = '/';
    }
  }, [isSignedIn]);
  return (
    <div className="min-h-screen bg-[rgba(0,0,0,0.03)] flex items-center justify-center">
      <SignIn path="/sign-in" routing="path" signUpUrl="/sign-up" />
    </div>
  );
};

export default Page;
