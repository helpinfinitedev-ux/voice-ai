'use client';

import { useState, createContext } from 'react';

export const EditCampaignContext = createContext({
  setEditCampaignModalLoading: () => null,
  editCampaignModalLoading: false,
});

export const EditCampaignContextProvider = ({ children }) => {
  const [editCampaignModalLoading, setEditCampaignModalLoading] =
    useState(false);
  const value = { editCampaignModalLoading, setEditCampaignModalLoading };
  return (
    <EditCampaignContext.Provider value={value}>
      {children}
    </EditCampaignContext.Provider>
  );
};
