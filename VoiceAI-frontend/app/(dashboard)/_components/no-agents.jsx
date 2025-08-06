import React from 'react';
import { SignInButton, SignedIn, SignedOut } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

const NoAgents = ({ setIsModalOpen }) => (
  <div className="flex m-auto items-center w-full min-h-[calc(100vh-245px)] py-12  bg-gray-100 justify-center ">
    <div className="flex bg-white px-[196px] h-[500px] rounded-[6px]  flex-col gap-[42px] items-center justify-center py-[49px]">
      <h1 className="text-[20px] text-[#374151] font-semibold">
        No assistants found
      </h1>
      <img
        src="/no-agents.png"
        alt=""
        className="mt-[0px] w-[320px] h-[210px]"
      />
      <div className="flex flex-col gap-[16px] items-center justify-center">
        <SignedOut>
          <div className="flex items-center gap-4">
            <SignInButton mode="modal">
              <Button variant="default" size="lg">
                Log In
              </Button>
            </SignInButton>
          </div>
        </SignedOut>

        <Button
          onClick={(e) => {
            e.stopPropagation();
            setIsModalOpen(true);
          }}
        >
          Create Assistant
        </Button>
      </div>
    </div>
  </div>
);

export default NoAgents;
