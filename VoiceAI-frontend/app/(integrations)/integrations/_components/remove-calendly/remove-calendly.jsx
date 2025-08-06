'use client';

import React, { useContext, useState } from 'react';
import { Button } from '@/components/ui/button';
import axios from 'axios';
import { AgentsContext } from '@/context/AgentsContext/AgentsContext';
import { toast } from 'sonner';
import Loader from '@/components/loader';

const RemoveCalendly = () => {
  const { user, reloadUser } = useContext(AgentsContext);
  const [removeCalendlyLoading, setRemoveCalendlyLoading] = useState(false);
  const removeCalendly = async () => {
    try {
      setRemoveCalendlyLoading(true);
      await axios.post('/api/updateUserCalendly', { user, status: false });
    } catch (error) {
      toast.error('Error integrating calendly');
    } finally {
      reloadUser().then(() => setRemoveCalendlyLoading(false));
    }
  };
  return (
    <div className="flex flex-col gap-4 mt-4">
      <div className="flex flex-col gap-[1px]">
        <h1 className="text-[20px] text-gray-800 font-medium">Calendly</h1>
        <p className="text-gray-600 font-normal text-[13px]">
          You have connected the calendly account already. Click below to remove
          it
        </p>
      </div>
      {removeCalendlyLoading ? (
        <Loader width="24px" height="24px" />
      ) : (
        <Button
          onClick={removeCalendly}
          className="text-sm max-w-[140px]"
          size="sm"
        >
          Remove Calendly
        </Button>
      )}
    </div>
  );
};

export default RemoveCalendly;
