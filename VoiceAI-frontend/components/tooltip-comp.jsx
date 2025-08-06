import React from 'react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

const TooltipComp = ({ trigger, value }) => (
  <TooltipProvider delayDuration={50}>
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="cursor-pointer">{trigger}</div>
      </TooltipTrigger>
      <TooltipContent>
        <div className="cursor-pointer">{value}</div>
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>
);

export default TooltipComp;
