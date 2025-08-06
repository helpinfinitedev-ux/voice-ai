import React from 'react';
import { IconType } from '@/utils/agent-type-icon';
import Initials from './initials';

const AgentIcon = ({ type }) => {
  if (type === 'inbound') {
    return <Initials name="Inbound" Icon={IconType[type]} />;
  }
  if (type === 'outbound-csv') {
    return <Initials name="Outbound" Icon={IconType[type]} />;
  }
  return (
    <div
      className="w-[42px] h-[42px] bg-red-400 flex-col flex justify-center items-center rounded-full"
      src="/zapier.png"
      alt=""
    >
      <p className="text-white text-[11px] font-medium">Zapier</p>
    </div>
  );
};

export default AgentIcon;
