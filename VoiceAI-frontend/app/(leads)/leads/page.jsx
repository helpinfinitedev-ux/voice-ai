import React from 'react';
import { LeadsContextProvider } from '@/context/LeadsContext/LeadsContext';
import LeadsComp from './_componets/leads-comp/leads-comp';

const page = () => (
  <div>
    <LeadsContextProvider>
      <LeadsComp />
    </LeadsContextProvider>
  </div>
);

export default page;
