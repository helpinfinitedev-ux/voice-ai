import React from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import Initials from '@/components/custom/initials';
import { IconType } from '@/utils/agent-type-icon';
import { formatPhone } from '@/utils/format';
import { Icon } from '@iconify/react';

const CallModal = ({ user, agent, isOpen, onClose, stopConversation }) => (
  <Dialog open={isOpen}>
    <DialogContent className="outline-none max-w-[fit-content] p-0 !rounded-[20px]">
      <div className="relative rounded-[20px] pt-[20px] min-w-[300px] flex flex-col gap-2">
        <div className="w-[90%] mx-auto">
          <div className="items-center flex gap-2">
            <img src="/logo.png" className="w-5 h-5" alt="logo" />
            <p className="text-gray-700 font-medium text-[14px]">
              Test Call With Agent
            </p>
          </div>
        </div>
        <div>
          <hr />
          <div className=" bg-modalBody pt-[10px] pb-[20px] overflow-hidden rounded-b-[20px]">
            <div className="w-[90%] mx-auto flex flex-col gap-[10px]">
              <div className="flex items-center gap-[8px] text-gray-700 text-[14px]">
                <img
                  src={user?.imageUrl}
                  alt="user_Image"
                  className="w-6 h-6 rounded-full"
                />
                <p className="ml-1">Web Call</p>
              </div>
              <div className="flex items-center gap-[8px] text-gray-700 text-[14px]">
                <Initials
                  name="Faisal"
                  Icon={IconType[agent?.type]}
                  width="24px"
                  height="24px"
                />
                <p>{formatPhone(agent?.phone_number)}</p>
              </div>
            </div>
          </div>
        </div>
        <div
          onClick={() => {
            stopConversation();
          }}
          className="absolute cursor-pointer transition-all duration-300 ease-in top-[15px] hover:bg-slate-100 right-[15px] p-[3px] rounded-full "
        >
          <Icon icon="system-uicons:cross" style={{ color: 'rgb(25,25,25)' }} />
        </div>
      </div>
    </DialogContent>
  </Dialog>
);

export default CallModal;
