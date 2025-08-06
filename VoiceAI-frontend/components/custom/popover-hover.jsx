'use client';

import React from 'react';
import { Icon } from '@iconify/react';
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from '@/components/ui/popover';
import useDisclosure from '@/hooks/useDisclosure';

const PopoverHover = ({
  isOpen,
  setIsOpen,
  trigger,
  value,
  className,
  align,
}) => {
  const {
    isOpen: isPopoverOver,
    onOpen: onPopoverOpen,
    onClose: onPopoverClose,
    setIsOpen: setIsPopoverOpen,
  } = useDisclosure();
  return (
    <div onMouseLeave={() => setIsPopoverOpen(false)}>
      <Popover open={isPopoverOver || isOpen}>
        <PopoverTrigger
          onMouseEnter={() => onPopoverOpen()}
          // onMouseLeave={() => setIsPopoverOpen(false)}
          className="border-none outline-none"
        >
          <div>{trigger}</div>
        </PopoverTrigger>
        <PopoverContent
          side="top"
          dir="top"
          className={`p-2 text-gray-700 text-[12.5px] max-w-[300px] ${className}`}
          align={align || 'center'}
          //   onMouseEnter={() => setIsOpen(true)}
          onMouseLeave={() => setIsPopoverOpen(false)}
        >
          {value}
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default PopoverHover;
