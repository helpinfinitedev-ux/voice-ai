'use client';

import { useContext, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import axios from 'axios';
import { AgentsContext } from '@/context/AgentsContext/AgentsContext';
import { HTTPService } from '@/utils/http';
import { baseUrl } from '@/utils/config';

const OAuthCallback = () => {
  const { user, session, reloadUser } = useContext(AgentsContext);

  const updateOAuthCode = async (code) => {
    const body = {
      user_id: user?.id,
      oauth_code: code,
    };
    try {
      await axios.post('/api/updateUserCalendly', { user, status: true });
      await axios.post(
        `${baseUrl}/calendly/authorize`,
        body,
        HTTPService.setHeaders({ user, session })
      );

      localStorage.setItem('calendlyIntegrated', JSON.stringify('true'));
    } catch (error) {
      localStorage.setItem('calendlyIntegrated', JSON.stringify('error'));
    } finally {
      window.close();
    }
  };
  useEffect(() => {
    if (user) {
      const urlSearchParams = new URLSearchParams(window.location.search);
      const code = urlSearchParams.get('code');
      if (code) {
        updateOAuthCode(code);
      }
    }
  }, [user]);

  return null;
};

export default OAuthCallback;
