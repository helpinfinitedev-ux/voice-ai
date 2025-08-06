import React from 'react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

const NoLeads = () => (
  <div className="flex m-auto items-center w-full min-h-[calc(100vh-245px)] py-12  bg-gray-100 justify-center ">
    <div className="flex bg-white px-[196px] h-[500px] rounded-[6px]  flex-col gap-[42px] items-center justify-center py-[49px]">
      <h1 className="text-[20px] text-[#374151] font-semibold">
        No Leads found
      </h1>
      <img
        src="/no-agents.png"
        alt=""
        className="mt-[0px] w-[320px] h-[210px]"
      />
      <Link
        href="/"
        className="flex flex-col gap-[16px] items-center justify-center"
      >
        <Button
          onClick={(e) => {
            e.stopPropagation();
          }}
        >
          Go To Dashboard
        </Button>
      </Link>
    </div>
  </div>
);

export default NoLeads;
