import React from 'react';
import useDisclosure from '@/hooks/useDisclosure';
import { Icon } from '@iconify/react';
import CustomPopover from '@/components/custom/popover';
import { options } from '.';

const StatusFilter = ({ setStatusFilter }) => {
  const { isOpen, onOpen, onClose, setIsOpen } = useDisclosure();
  return (
    <CustomPopover
      className="p-0 rounded-md text-gray-600 text-[12px]"
      trigger={<Icon icon="prime:filter" />}
      open={isOpen}
      onOpenChange={setIsOpen}
    >
      {options.map((item) => (
        <div className="flex items-center">
          <p
            onClick={() => {
              setStatusFilter(item.value);
              onClose();
            }}
            style={{ color: item.color }}
            className={`px-2 py-1 w-full font-normal hover:bg-gray-50 cursor-pointer ${item.className}`}
          >
            {item.label}
          </p>
        </div>
      ))}
    </CustomPopover>
  );
};

export default StatusFilter;
