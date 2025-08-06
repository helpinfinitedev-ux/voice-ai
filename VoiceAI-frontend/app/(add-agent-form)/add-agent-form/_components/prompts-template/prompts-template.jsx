import useDisclosure from '@/hooks/useDisclosure';
import React from 'react';
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { promptsContent } from '.';

const PromptsTemplates = ({ template, setTemplate }) => {
  const { isOpen, onOpen, onClose, setIsOpen } = useDisclosure();
  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger>
        <Button
          onClick={onOpen}
          size="sm"
          className="text-[13px]"
          variant="outline"
        >
          Select Template
        </Button>
      </PopoverTrigger>
      <PopoverContent
        side="bottom"
        align="center"
        className="p-0 py-[2px] w-full "
      >
        {promptsContent.map((item) => (
          <div
            onClick={() => {
              setTemplate(item.prompt);
              onClose();
            }}
            className="px-4 py-[4px] font-medium min-w-[150px] hover:bg-gray-100 cursor-pointer transition-all duration-200 ease-in"
          >
            <p className=" text-gray-700 text-[14px]">{item.title}</p>
          </div>
        ))}
      </PopoverContent>
    </Popover>
  );
};

export default PromptsTemplates;
