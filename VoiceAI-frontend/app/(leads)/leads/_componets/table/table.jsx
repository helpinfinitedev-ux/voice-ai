'use client';

import { LeadsContext } from '@/context/LeadsContext/LeadsContext';
import { formatPhone, formatPhoneNumberWithCountryCode } from '@/utils/format';
import { FormatDate } from '@/utils/formatDates';
import React, { useContext, useEffect, useState } from 'react';
import CustomPagination from '@/components/custom/pagination';
import { Skeleton } from '@/components/ui/skeleton';
import TooltipComp from '@/components/tooltip-comp';
import QuestionIcon from '@/assets/QuestionIcon';
import Tag from '@/components/custom/tag';
import { textFromBg } from '@/app/(inbox)/inbox/_components/inbox-comp';
import { InboxContext } from '@/context/InboxContext/InboxContext';
import useDisclosure from '@/hooks/useDisclosure';
import Modal from '@/components/modal';
import { CrossIcon } from 'lucide-react';
import { Icon } from '@iconify/react';
import PopoverHover from '@/components/custom/popover-hover';
import { colorObj, dotClassNameObj, textObj } from '../../index';
import { TableUtils } from './index';
import NoLeads from '../no-leads/no-leads';
import LeadsConversations from '../leads-conversations/leads-conversations';
import StatusFilter from './_legos/status-filter/status-filter';
import AgentFilter from './_legos/agent-filter/agent-filter';

const TableComp = ({ inputString }) => {
  const [agentFilter, setAgentFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const {
    isOpen: isLeadsConversationsModalOpen,
    onOpen: onLeadsConversationsModalOpen,
    onClose: onLeadsConversationsModalClose,
  } = useDisclosure();
  const { allConversations } = useContext(InboxContext);
  const {
    allLeads,
    allLeadsLoading,
    page,
    setSelectedValue,
    selectValue,
    setPage,
    handleNext,
    handlePrev,
  } = useContext(LeadsContext);
  const [currentLead, setCurrentLead] = useState(null);
  const selectValues = [
    {
      value: 5,
    },
    {
      value: 10,
    },
    {
      value: 15,
    },
  ];
  const handleLeadConversations = (lead) => {
    setCurrentLead({ ...lead });
    onLeadsConversationsModalOpen();
  };
  useEffect(() => {
    setPage(1);
  }, [inputString, statusFilter]);
  const filteredLeads = allLeads
    .filter((item) =>
      formatPhoneNumberWithCountryCode(item.phone_number)
        .toLowerCase()
        .includes(inputString),
    )
    .filter((item) => {
      const noStatus = statusFilter === '';
      const noAgentFilter = agentFilter === '';
      const agentFilterValue = item.agents.some((agent) =>
        new RegExp(agentFilter, 'i').test(agent.agent_name),
      );
      const statusFilterValue = item.logs.some(
        (log) => log.status === statusFilter,
      );

      return (
        (noStatus || statusFilterValue) && (noAgentFilter || agentFilterValue)
      );
    })
    .sort((a, b) => {
      if (a.start_timestamp) {
        return b.end_timestamp - a.end_timestamp;
      }
      return b.scheduled_at - a.scheduled_at;
    });
  console.log(statusFilter, 'statusFilter');
  console.log(filteredLeads, 'statusFilter');
  if (allLeadsLoading) {
    return (
      <div className="w-[90%] mx-auto">
        <div className="w-[100%] border-gray-100 border-r-[1px] flex flex-col gap-4 mt-6">
          <div className="flex flex-col gap-[2px]">
            <div className="flex flex-col gap-4 ">
              <Skeleton className="h-8 w-[100%]" />
              <Skeleton className="h-8 w-[100%]" />
            </div>
          </div>
          <div className="flex flex-col gap-4">
            {[1, 2, 3, 4, 5].map((item) => (
              <div key={item} className=" flex flex-col gap-4">
                <Skeleton className="h-8 max-w-[100%]" />
                <Skeleton className="h-8 w-[100%]" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return allLeadsLoading === false && allLeads?.length > 0 ? (
    <div className="w-[90%] mx-auto">
      <div className="rounded-xl w-[100%] mx-auto flex flex-col text-gray-700 overflow-hidden">
        <div className="px-4 w-full py-4 text-[14px] grid text-gray-500 font-medium grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
          <div>Phone Number</div>
          <div className="col-span-2 flex items-center gap-2">
            <div className="">Assistants</div>
            <AgentFilter setAgentFilter={setAgentFilter} />
            {agentFilter && (
              <PopoverHover
                trigger={
                  <div
                    onClick={() => setAgentFilter('')}
                    className="cursor-pointer ml-[-4px] mb-[-4px] transition-all duration-300 ease-in hover:bg-slate-100 p-[3px] rounded-full "
                  >
                    <Icon
                      icon="system-uicons:cross"
                      style={{ color: 'rgb(25,25,25)' }}
                    />
                  </div>
                }
                value={<p>Clear Filters</p>}
              />
            )}
          </div>
          <div className="flex gap-[6px] items-center">
            <p>Status</p>
            <TooltipComp
              trigger={
                <div className="flex items-center gap-2">
                  <QuestionIcon />
                </div>
              }
              value={
                <p>
                  For Inbound calls the status is always &apos;Call
                  Received&apos;
                </p>
              }
            />
            <StatusFilter setStatusFilter={setStatusFilter} />
            {statusFilter && (
              <PopoverHover
                trigger={
                  <div
                    onClick={() => setStatusFilter('')}
                    className="cursor-pointer ml-[-4px] mb-[-4px] transition-all duration-300 ease-in hover:bg-slate-100 p-[3px] rounded-full "
                  >
                    <Icon
                      icon="system-uicons:cross"
                      style={{ color: 'rgb(25,25,25)' }}
                    />
                  </div>
                }
                value={<p>Clear Filters</p>}
              />
            )}
          </div>

          <div>Date Added</div>
          <div>Date Last Contacted</div>
        </div>

        {filteredLeads
          ?.slice((page - 1) * selectValue, page * selectValue)
          .map((item, index) => (
            <div
              key={index}
              className={`${
                index % 2 === 0 ? 'bg-[rgb(252,252,252)]' : 'bg-white'
              } ${
                index % 2 !== 0 ? 'hover:bg-gray-100' : 'hover:bg-gray-100'
              } px-4 w-full py-4 transition-all duration-300 ease-in grid grid-cols-2 md:grid-cols-3 cursor-pointer font-normal lg:grid-cols-6 text-[12px]`}
              onClick={() => handleLeadConversations(item)}
            >
              <div className="self-center">
                <p className="font-medium self-center text-left">
                  {item.phone_number !== 'undefined'
                    ? formatPhoneNumberWithCountryCode(item.phone_number)
                    : 'Web'}
                </p>
              </div>
              <div className="col-span-2 w-[100%] flex flex-wrap gap-2 pr-6">
                {item.agents?.map((agent) => (
                  <TooltipComp
                    trigger={
                      <Tag
                        bg={agent.bg_color}
                        color={textFromBg[agent.bg_color]}
                      >
                        {agent.agent_name}
                      </Tag>
                    }
                    value={<p>{formatPhone(agent.agent_phone_number)}</p>}
                  />
                ))}
              </div>
              <div className="flex items-center gap-[10px]">
                <div
                  className={
                    item.logs[0].status
                      ? dotClassNameObj[
                          item.logs.find((item) => item.called_at !== -1)
                            ?.status
                            ? 'completed'
                            : 'scheduled'
                        ]
                      : dotClassNameObj.completed
                  }
                />{' '}
                <p
                  style={{
                    color: item.logs[0].status
                      ? colorObj[
                          item.logs.find((item) => item.called_at !== -1)
                            ?.status
                            ? 'completed'
                            : 'scheduled'
                        ]
                      : colorObj.completed,
                  }}
                  className={` font-medium
                
                text-gray-700`}
                >
                  {item.logs[0].status
                    ? textObj[
                        item.logs.find((item) => item.status === 'completed')
                          ?.status ||
                          item.logs.find((item) => item.status === 'no-answer')
                            ?.status ||
                          item.logs[0].status
                      ]
                    : 'Call Received'}
                </p>
              </div>
              <div className="hidden gap-2 items-center lg:flex">
                <p className="font-medium">
                  {TableUtils.getDateContactedAndLastAdded(item.logs).dateAdded}
                </p>
              </div>
              <div className="self-center">
                <p className="font-medium ">
                  {item.type === 'inbound'
                    ? TableUtils.getDateContactedAndLastAdded(item.logs)
                        .dateLastContacted
                    : item.logs.find((item) => item.called_at !== -1)
                      ? FormatDate.getDateInDDMMYYYY(
                          item.logs.find((item) => item.called_at !== -1)
                            .called_at,
                        )
                      : 'Not Called yet'}
                </p>
              </div>
            </div>
          ))}
      </div>
      <CustomPagination
        listLength={filteredLeads?.length}
        currentPage={page}
        handleNext={handleNext}
        handlePrev={handlePrev}
        selectValue={selectValue}
        rowNumSelectValues={selectValues}
        setSelectValue={setSelectedValue}
        setPage={setPage}
      />
      {currentLead && (
        <Modal
          showIconTop="-8px"
          showIcon
          isOpen={isLeadsConversationsModalOpen}
          onClose={onLeadsConversationsModalClose}
        >
          <LeadsConversations
            currentLead={currentLead}
            logs={currentLead.logs}
            setCurrentLead={setCurrentLead}
          />
        </Modal>
      )}
    </div>
  ) : (
    <NoLeads />
  );
};

export default TableComp;
