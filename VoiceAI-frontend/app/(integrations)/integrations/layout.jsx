'use client';

import React, { useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import Navbar from '@/components/navbar';

const MainLayout = ({ children }) => {
  const { isSignedIn } = useAuth();
  useEffect(() => {
    if (!isSignedIn) {
      window.location.href = '/sign-in';
    }
  }, [isSignedIn]);

  return (
    <div>
      {' '}
      <Navbar />
      {children}
    </div>
  );
};

export default MainLayout;
