import { redirectToSignIn } from '@clerk/nextjs';
import React from 'react';

const useRedirect = () => redirectToSignIn();

export default useRedirect;
