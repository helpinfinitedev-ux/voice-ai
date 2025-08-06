import React from 'react';
import { AddCampaignContextProvider } from '@/context/AddCampaignContext/AddCampaignContext';
import { EditCampaignContextProvider } from '@/context/EditCampaignContext/EditCampaignContext';
import { InboundContextProvider } from '@/context/InboundContext/InboundContext';
import Dashboard from './_components/dashboard';
import OAuthCallback from './_components/oauth-callback/oauth-callback';

const Auth = () => (
  <div>
    <AddCampaignContextProvider>
      <EditCampaignContextProvider>
        <InboundContextProvider>
          <OAuthCallback />
          <Dashboard />
        </InboundContextProvider>
      </EditCampaignContextProvider>
    </AddCampaignContextProvider>
  </div>
);

export default Auth;
