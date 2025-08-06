import React, { useContext, useEffect, useState } from 'react';
import Graph from '@/assets/Graph';
import ThreeDots from '@/assets/ThreeDots';
import CustomPopover from '@/components/custom/popover';
import { baseUrl } from '@/utils/config';
import useDisclosure from '@/hooks/useDisclosure';
import { EditIcon2 } from '@/assets/EditIcon';
import ConversationsIcon from '@/assets/ConversationsIcon';
import { TrashIcon2 } from '@/assets/TrashIcon';
import { formatPhone } from '@/utils/format';
import axios from 'axios';
import { HTTPService } from '@/utils/http';
import { AgentsContext } from '@/context/AgentsContext/AgentsContext';
import TooltipComp from '@/components/tooltip-comp';
import AgentIcon from '@/components/custom/agent-icon';
import Tag from '@/components/custom/tag';
import { colors } from '@/styles/colors';
import { textFromBg } from '@/app/(inbox)/inbox/_components/inbox-comp';

import useCallModal from '@/hooks/useCallModal';
import { IconType } from '@/utils/agent-type-icon';
import Initials from '@/components/custom/initials';
import { Icon } from '@iconify/react';
import { colorObj } from '@/app/(leads)/leads';
import { AddCampaignContext } from '@/context/AddCampaignContext/AddCampaignContext';
import { EditCampaignContext } from '@/context/EditCampaignContext/EditCampaignContext';
import { InboxContext } from '@/context/InboxContext/InboxContext';
import PopoverHover from '@/components/custom/popover-hover';
import CallModal from '../call-modal/call-modal';

const AgentCard = ({
  setCurrentCallAgent,
  agent,
  onOpen,
  setCurrentAgent,
  onEditModalOpen,
  onEditCampaignModalOpen,
  setTabValue,
  setCampaignTabValue,
  agent_type,
  initiateCall,
  stopConversation,
  onZapierTestModalOpen,
}) => {
  const {
    isOpen: isPopoverOpen,
    onOpen: onPopoverOpen,
    onClose: onPopoverClose,
    setIsOpen: setIsPopoverOpen,
  } = useDisclosure();
  const { setEditCampaignModalLoading } = useContext(EditCampaignContext);
  const { allConversations, allConversationsLoading } =
    useContext(InboxContext);
  const [phoneNumberCopied, setPhoneNumberCopied] = useState(false);
  const { setStep, step, nextStep } = useContext(AddCampaignContext);
  const [conversations, setConversations] = useState([]);
  const [hovered, setIsHovered] = useState(false);
  const [copied, setCopied] = useState(false);
  const {
    isOpen: isCallModalOpen,
    onOpen: onCallModalOpen,
    onClose: onCallModalClose,
  } = useCallModal();
  const { user, session } = useContext(AgentsContext);

  const popoverContent = [
    {
      title: 'Edit',
      onClick: async () => {
        if (agent_type === 'inbound') {
          setCurrentAgent(agent);
          onEditModalOpen();
          setTabValue('editAssistant');
        } else {
          try {
            onEditCampaignModalOpen();
            setEditCampaignModalLoading(true);
            const res = await fetchCampaign(agent);
            setEditCampaignModalLoading(false);
            setCurrentAgent({ ...res[0], ...agent });
            setCampaignTabValue('editOutboundAssistant');
          } catch (error) {
            setEditCampaignModalLoading(false);
          }
        }
      },
      icon: EditIcon2,
    },
    {
      title: 'Conversations',
      onClick: () => {
        if (agent_type === 'inbound') {
          setCurrentAgent(agent);
          onEditModalOpen();
          setTabValue('conversations');
        } else {
          onEditCampaignModalOpen();
          agent_type === 'outbound-zapier' && setStep(2);
          setCampaignTabValue('conversations');
        }
      },
      icon: ConversationsIcon,
    },
    {
      title: 'Delete',
      onClick: () => {
        setCurrentAgent(agent);
        onOpen();
      },
      icon: TrashIcon2,
    },
  ];
  const fetchCalls = async () => {
    try {
      const res = await axios.get(
        `${baseUrl}/agents/${agent.agent_id}/calls`,
        HTTPService.setHeaders({ user, session }),
      );
      setConversations(res.data);
    } catch (error) {
      console.log(error);
    }
  };
  const onCopy = (agent) => {
    const agent_id = agent?.agent_id;
    navigator.clipboard.writeText(agent_id);
    setCopied(true);

    setTimeout(() => {
      setCopied(false);
    }, 2000);
  };
  const copyContent = (content) => {
    navigator.clipboard.writeText(content);
    setPhoneNumberCopied(true);
    setTimeout(() => {
      setPhoneNumberCopied(false);
    }, 2000);
  };

  const fetchCampaign = async (agent) => {
    try {
      const res = await axios.get(
        `${baseUrl}/users/${user?.id}/campaigns/${agent.agent_id}`,
        HTTPService.setHeaders({ user, session }),
      );
      return res.data;
    } catch (error) {
      console.log(error);
    }
  };
  useEffect(() => {
    if (allConversations && allConversationsLoading === false) {
      setConversations(
        allConversations?.filter((item) => item.agent_id === agent.agent_id),
      );
    }
  }, [allConversations, allConversationsLoading]);
  const lastItem = popoverContent[popoverContent.length - 1];
  if (!!agent?.active === false) return null;
  return (
    <div
      key={agent?.agent_id}
      className="change-shadow flex flex-col justify-between relative rounded-lg shadow-1 cursor-pointer p-6 bg-white shadow-1 gap-[12px] min-w-[320px] md:min-w-[420px]"
    >
      <div className="flex flex-col justify-between gap-[48xp] min-h-[135px]">
        <div>
          <div className="flex justify-between flex-wrap items-start gap-[8px]">
            <div className="flex flex-col gap-[4px]">
              <div className="flex items-center gap-[8px]">
                <div className="flex flex-col gap-2">
                  <AgentIcon type={agent?.type} />
                </div>
                <div className="flex flex-col">
                  <PopoverHover
                    className="p-[4px]"
                    trigger={
                      <p
                        onClick={() => copyContent(agent?.phone_number)}
                        className="text-[16px] text-neutral-800 "
                      >
                        {formatPhone(agent?.phone_number)}
                      </p>
                    }
                    value={
                      <p className="text-[12px]">
                        {phoneNumberCopied
                          ? 'Phone Number Copied'
                          : ' Copy Phone Number'}
                      </p>
                    }
                  />

                  <p className="pl-[8px] text-[12px] text-gray-500">
                    {agent?.name}
                  </p>
                </div>
              </div>
              {agent_type !== 'inbound' && (
                <div className="flex items-center gap-2">
                  {agent_type === 'outbound-zapier' && copied ? (
                    <div className="mt-[2px]">
                      <Tag color={textFromBg[colors.lightred]} bg="#f7b0b0">
                        <p className="text-[10px]">Copied</p>
                      </Tag>
                    </div>
                  ) : (
                    agent_type === 'outbound-zapier' && (
                      <TooltipComp
                        trigger={
                          <div onClick={() => onCopy(agent)}>
                            <Tag
                              color={textFromBg[colors.lightred]}
                              bg="#f7b0b0"
                            >
                              <p className="text-[10px]">Copy Agent Id</p>
                            </Tag>
                          </div>
                        }
                        value={
                          <p className="text-[10px]"> Copy To Clipboard</p>
                        }
                      />
                    )
                  )}
                </div>
              )}
            </div>
            {agent_type === 'inbound' ? (
              <p
                onClick={(e) => {
                  e.stopPropagation();
                  initiateCall(agent);
                }}
                className="hover:scale-[1.05] transition-all duration-200 ease-in py-[2px] text-[12px] px-[8px] rounded-[8px]"
                style={{
                  color: 'rgb(2, 112, 70)',
                  backgroundColor: 'rgba(0, 237, 146,0.1)',
                }}
              >
                Test assistant via web call
              </p>
            ) : (
              <p
                onClick={async () => {
                  const campaign = await fetchCampaign(agent);
                  setCurrentAgent({ ...campaign[0], ...agent });
                  onZapierTestModalOpen();
                }}
                className="hover:scale-[1.05] transition-all duration-200 ease-in py-[2px] text-[12px] px-[8px] rounded-[8px]"
                style={{
                  color: 'rgb(2, 112, 70)',
                  backgroundColor: 'rgba(0, 237, 146,0.1)',
                }}
              >
                Make phone call
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center justify-between">
          <div
            onClick={() => {
              setCurrentAgent(agent);
              if (agent_type === 'inbound') {
                onEditModalOpen();
                setTabValue('conversations');
              } else {
                onEditCampaignModalOpen();
                setCampaignTabValue('conversations');
              }
            }}
            className="flex items-end hover:scale-[1.05] transition-all duration-200 ease-in gap-[4px] text-[12px] text-gray-500"
          >
            <Graph />
            <p className="leading-[120%] ">
              {conversations?.length} Conversations
            </p>
          </div>
          <div className="flex items-center gap-2">
            <CustomPopover
              open={isPopoverOpen}
              onOpenChange={setIsPopoverOpen}
              align="end"
              className="p-0 w-[fit-content] shadow-2 rounded-[8px]"
              trigger={
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    isPopoverOpen ? onPopoverClose() : onPopoverOpen();
                  }}
                  onMouseEnter={() => setIsHovered(true)}
                  onMouseLeave={() => setIsHovered(false)}
                  className={`bg-black py-[2px] px-[8px] w-[fit-content] transition-all
                 duration-200 ease-linear rounded-[18px] 
                 border-[1px] border-neutral-900 hover:bg-white
                ${isPopoverOpen ? 'bg-white' : 'bg-black'}
                 `}
                >
                  <ThreeDots
                    color={isPopoverOpen || hovered ? 'black' : 'white'}
                  />
                </div>
              }
            >
              <div className="p-2 flex flex-col gap-[0px]">
                {popoverContent
                  .slice(0, popoverContent.length - 1)
                  .map((item, idx) => (
                    <div
                      key={idx}
                      onClick={item.onClick}
                      className="text-gray-500 hover:text-gray-700  cursor-pointer flex p-[6px] px-2 gap-[6px] w-[100%] items-center hover:bg-gray-100 rounded-md transition-all font-medium duration-200 ease-in"
                    >
                      <div>
                        <item.icon
                          color="rgb(107 114 128)"
                          className="w-4 h-4"
                        />
                      </div>
                      <p className="text-[14px] cursor-pointer">{item.title}</p>
                    </div>
                  ))}
                <div
                  onClick={lastItem.onClick}
                  className="text-red-500 cursor-pointer flex p-[6px] gap-[6px] w-full items-center hover:bg-red-500 hover:text-white rounded-md transition-all duration-200 ease-in"
                >
                  <div>
                    <lastItem.icon
                      color="rgb(248 113 113)"
                      className="w-4 h-4 text-gray-500"
                    />
                  </div>
                  <p className="text-[14px]  font-medium cursor-pointer">
                    {lastItem.title}
                  </p>
                </div>
              </div>
            </CustomPopover>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgentCard;
