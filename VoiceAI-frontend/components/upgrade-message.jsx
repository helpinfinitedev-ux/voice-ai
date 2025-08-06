'use client';

import React, { useState } from 'react';
import { Progress } from '@/components/ui/progress';
import QuestionIcon from '@/assets/QuestionIcon';
import useDisclosure from '@/hooks/useDisclosure';
import TooltipComp from './tooltip-comp';
import PopoverHover from './custom/popover-hover';

const UpgradeMessage = ({ daysLeft }) => {
  const { isOpen: isPopoverOpen, setIsOpen: setIsPopoverOpen } =
    useDisclosure();
  if (daysLeft < 0) {
    return (
      <div className="self-center flex gap-[6px] items-center text-red-600 text-[0.8rem] rounded-md font-medium">
        <p>Trial Period has ended</p>
        <PopoverHover
          align="right"
          isOpen={isPopoverOpen}
          setIsOpen={setIsPopoverOpen}
          trigger={
            <div className="mt-[2.5px]">
              <QuestionIcon className="self-end w-3 h-3" />
            </div>
          }
          value={
            <p className="text-[0.7rem] text-gray-700">
              Your Plan Period has ended. All The Outbound and Inbound calls
              will be deactivated. Please upgrade your plan to continue
            </p>
          }
        />
      </div>
    );
  }
  return (
    <div className="self-center pb-1 flex flex-col text-red-600 min-w-[200px]  text-[0.7rem] rounded-md font-medium">
      <div className="flex items-start gap-[6px]">
        <p>Conversations limit reached</p>
        <div>
          <PopoverHover
            align="right"
            isOpen={isPopoverOpen}
            setIsOpen={setIsPopoverOpen}
            trigger={
              <div className="mt-[2.5px]">
                <QuestionIcon className="self-end w-3 h-3" />
              </div>
            }
            value={
              <p className="text-[0.7rem] text-gray-700">
                Your conversation limit has reached. All The Outbound and
                Inbound calls will be deactivated. Please upgrade your plan to
                continue
              </p>
            }
          />
        </div>
      </div>
      <Progress color="rgb(239 68 68)" value={100} className="bg-red-50" />
    </div>
  );
};

export default UpgradeMessage;
