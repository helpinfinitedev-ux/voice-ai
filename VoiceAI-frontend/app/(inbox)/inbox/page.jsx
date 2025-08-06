import React from 'react';
import { InboxContextProvider } from '@/context/InboxContext/InboxContext';
import InboxComp from './_components/inbox-comp/inbox-comp';

const page = () => (
  <div>
    <div className="flex w-[90%] mx-auto justify-between items-center py-8">
      <div>
        <h1 className=" font-normal text-gray-600 text-2xl">
          All Conversations
        </h1>
      </div>
    </div>
    <InboxComp />
  </div>
);

export default page;
