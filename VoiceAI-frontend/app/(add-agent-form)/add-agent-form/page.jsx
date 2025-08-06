import { auth } from '@clerk/nextjs';

import React from 'react';
import AddAgentForm from './_components/add-agent-form';

const Page = () => {
  const { sessionClaims } = auth();

  const userId = sessionClaims?.userId;

  return (
    <div>
      <AddAgentForm userId={userId} />
    </div>
  );
};

export default Page;
