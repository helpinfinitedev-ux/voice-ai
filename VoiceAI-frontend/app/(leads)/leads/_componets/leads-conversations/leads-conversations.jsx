'use client';

import React, { useContext, useEffect, useLayoutEffect, useState } from 'react';
import {
  Drawer,
  DrawerHeader,
  DrawerContent,
  DrawerTitle,
} from '@/components/ui/drawer';
import { ScrollArea } from '@/components/ui/scroll-area';
import useSWR from 'swr';
import { baseUrl } from '@/utils/config';
import { fetcher } from '@/utils/fetcher';
import axios from 'axios';
import { Skeleton } from '@/components/ui/skeleton';
import {
  FormatDate,
  getDateFromTimeStamp,
  getTimeDuration,
} from '@/utils/formatDates';
import { Icon } from '@iconify/react';
import Initials from '@/components/custom/initials';
import Loader from '@/components/loader';
import {
  getFormattedString,
  formatPhone,
  FormatSring,
  formatPhoneNumberWithCountryCode,
} from '@/utils/format';
import { format } from 'timeago.js';
import { IconType } from '@/utils/agent-type-icon';
import { HTTPService } from '@/utils/http';
import { AgentsContext } from '@/context/AgentsContext/AgentsContext';
import AgentIcon from '@/components/custom/agent-icon';
import Modal from '@/components/modal';
import { textFromBg } from '@/app/(inbox)/inbox/_components/inbox-comp';
import Tag from '@/components/custom/tag';
import TooltipComp from '@/components/tooltip-comp';
import { InboxContext } from '@/context/InboxContext/InboxContext';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getTranscriptObject, sortItems } from './index';
import { colorObj } from '../..';

const LeadsConversations = ({
  isOpen,
  setIsOpen,
  logs,
  currentLead,
  setCurrentLead,
}) => {
  const [tabValue, setTabValue] = useState('all');
  const [agentFilter, setAgentFilter] = useState('all');
  const { changeCallStatusById } = useContext(InboxContext);
  const { user, session, signOut } = useContext(AgentsContext);
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentLogLoading, setCurrentLogLoading] = useState(true);
  const [currentLog, setCurrentLog] = useState(null);
  const changeCallStatus = async (call) => {
    if (call.read === true) return;
    try {
      await axios.patch(
        `${baseUrl}/calls/${call.call_id}`,
        {
          read: true,
        },
        HTTPService.setHeaders({ user, session }),
      );

      changeCallStatusById(call, true);
      const idx = currentLead.logs.findIndex(
        (ele) => ele.call_id === call.call_id,
      );
      if (idx === -1) return;
      currentLead.logs[idx].read = true;

      setCurrentLead({ ...currentLead, phone_number: call.phone_number });
    } catch (error) {
      console.log(error);
    }
  };
  const fetchLog = async (currentLog) => {
    if (!currentLog?.call_id) {
      setCurrentLogLoading(false);

      setCurrentLog({ ...currentLog }, 'currentLog');
      return;
    }

    try {
      setCurrentLogLoading(true);
      const log = await axios.get(
        `${baseUrl}/calls/${currentLog.call_id}`,
        HTTPService.setHeaders({ user, session }),
      );
      setCurrentLog({
        ...log.data,
        type: currentLog.type,
        agent_name: currentLog.agent_name,
        bg_color: currentLog.bg_color,
        agent_phone_number: currentLog.agent_phone_number,
        phone_number: currentLog.phone_number,
      });
    } catch (error) {
      console.log(error);
      error.response?.status === 401 && signOut();
    } finally {
      setCurrentLogLoading(false);
    }
  };
  //   const fetchCalls = async () => {
  //     try {
  //       setIsLoading(true);
  //       const res = await axios.get(
  //         `${baseUrl}/agents/${currentAgent.agent_id}/calls`,
  //         HTTPService.setHeaders({ user, session })
  //       );
  //       setData(
  //         res.data
  //           .map((item) => ({ ...item, type: currentAgent?.type }))
  //           .sort((a, b) => b.end_timestamp - a.end_timestamp)
  //       );
  //     } catch (error) {
  //       console.log(error);
  //       signOut();
  //     } finally {
  //       setIsLoading(false);
  //     }
  //   };
  const getFilteredLogs = () =>
    logs.filter((item) => {
      const noAgentFilter = agentFilter === 'all';
      const noTabValue = tabValue === 'all';

      const agentMatch = noAgentFilter || agentFilter === item.agent_name;
      const tabMatch = noTabValue || item.status !== 'completed';
      return agentMatch && tabMatch;
    });
  useEffect(() => {
    if (isLoading === false && logs) {
      const filteredLogs = getFilteredLogs();
      fetchLog(
        filteredLogs?.sort((a, b) => b.end_timestamp - a.end_timestamp)[0],
      );
    }
  }, [logs, agentFilter]);

  //   useLayoutEffect(() => {
  //     fetchCalls();
  //   }, []);

  const transcriptObject = getTranscriptObject(currentLog?.transcript_object);
  const filteredLogs = getFilteredLogs();
  console.log(sortItems(filteredLogs));
  return (
    <div className=" p-0 m-0 min-w-[970px] w-[max-content]  outline-none">
      {isLoading === false ? (
        logs?.length > 0 ? (
          <div className="flex min-h-[93vh]">
            <div className="min-w-[fit-content] relative flex flex-col">
              {isLoading && (
                <div className="h-[100vh] w-full flex justify-center items-center">
                  <div className="loader" />
                </div>
              )}
              <ScrollArea className="h-[93vh] w-[100%] ">
                <div className="w-[100%] bg-[#fcfdfd] px-3 pb-[10px] rounded-l-[20px] border-r-[1px] border-gray-100 mt-0 mx-auto">
                  <h1 className="px-4  font-semibold text-gray-600 text-[18px] py-4">
                    {currentLead?.phone_number !== 'undefined'
                      ? formatPhoneNumberWithCountryCode(
                          currentLead?.phone_number,
                        )
                      : 'Web'}
                    &apos;s Logs
                  </h1>
                  <div className="pb-4 px-3 flex flex-col-reverse gap-2">
                    {currentLead.type !== 'inbound' && (
                      <Tabs
                        value={tabValue}
                        defaultValue="all"
                        className="w-full overflow-hidden"
                      >
                        <TabsList className="w-full">
                          <TabsTrigger
                            onClick={() => setTabValue('all')}
                            className="w-[50%] rounded-[12px]"
                            value="all"
                          >
                            All
                          </TabsTrigger>
                          <TabsTrigger
                            onClick={() => setTabValue('scheduled')}
                            className="w-[50%] rounded-[12px]"
                            value="scheduled"
                          >
                            Scheduled{' '}
                            <span>
                              {`   (${
                                getFilteredLogs()?.filter(
                                  (item) => item.status !== 'completed',
                                ).length
                              })`}
                            </span>
                          </TabsTrigger>
                        </TabsList>
                      </Tabs>
                    )}
                    <Select
                      value={agentFilter}
                      defaultValue="all"
                      onValueChange={(value) => setAgentFilter(value)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select Agent" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectItem value="all">All</SelectItem>
                          {currentLead?.agents.map((item, idx) => (
                            <SelectItem key={idx} value={item.agent_name}>
                              {item.agent_name}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex flex-col gap-[12px] px-2">
                    {sortItems(filteredLogs).map((item, idx) => (
                      <ul
                        onClick={() => {
                          fetchLog(item);
                          changeCallStatus(item);
                        }}
                        className={`px-[12px] ${
                          item.read === false ? 'bg-gray-50' : 'bg-white'
                        } cursor-pointer hover:bg-gray-50 
                     trasition-all duration-200 ease-linear py-[12px] shadow-2 flex border-[1px] 
                     border-gray-300 rounded-[12px] gap-2 justify-between items-center min-w-[350px]`}
                      >
                        <div className="flex  items-center gap-[10px]">
                          <TooltipComp
                            trigger={<AgentIcon type={item.type} />}
                            value={<p>{formatPhone(item.phone_number)}</p>}
                          />

                          {item.type === 'inbound' ? (
                            <div className="flex flex-col gap-[2px] items-start justify-between">
                              <li className="cursor-pointer text-[14px] text-gray-700 font-medium pl-[4px]">
                                From :{' '}
                                {item.from_number
                                  ? formatPhone(item.from_number)
                                  : 'Web'}
                              </li>
                              <p className="text-[12.5px] pl-[4px] flex items-center gap-[4px]">
                                <p className="mt-[-1px]">To :</p>
                                <Tag
                                  bg={item.bg_color}
                                  color={textFromBg[item.bg_color]}
                                >
                                  {item.agent_name}
                                </Tag>
                              </p>
                              {/* <p className="text-[12px] text-gray-700 font-semibold pl-2">
                             Duration -{' '}
                             {getTimeDuration(
                               item.end_timestamp - item.start_timestamp
                             )}
                           </p> */}
                            </div>
                          ) : (
                            <div className="flex flex-col gap-[2px] items-start justify-between">
                              <li className="cursor-pointer flex items-center gap-[2px] text-[14px] text-gray-700 font-medium pl-[4px]">
                                <p>From : </p>{' '}
                                <Tag
                                  bg={item.bg_color}
                                  color={textFromBg[item.bg_color]}
                                >
                                  {item.agent_name}
                                </Tag>
                              </li>
                              <div className="text-[12.5px] pl-[4px] flex items-center gap-[4px]">
                                <p className="mt-[-1px]">To :</p>
                                {item.phone_number
                                  ? formatPhoneNumberWithCountryCode(
                                      item.phone_number,
                                    )
                                  : 'Web'}
                              </div>
                            </div>
                          )}
                        </div>
                        {!!item.call_id === false ? (
                          <div>
                            <p className="text-gray-500 mr-[4px] font-medium text-[12px]">
                              Scheduled At: <br />
                              {FormatDate.getDateInDDMMYYYY(item.scheduled_at)}
                            </p>
                          </div>
                        ) : (
                          <div className="flex flex-col items-end gap-[4px]">
                            <p className="text-gray-500 mr-[4px] font-medium text-[13px]">
                              {' '}
                              {format(item?.start_timestamp)}
                            </p>
                            <p className="text-gray-600 text-[13px]">
                              Duration :{' '}
                              {getTimeDuration(
                                item.end_timestamp - item.start_timestamp,
                              )}
                            </p>
                          </div>
                        )}
                      </ul>
                    ))}
                  </div>
                </div>
              </ScrollArea>
            </div>

            {currentLogLoading ? (
              <div className="w-[60%]  flex flex-col gap-4">
                <div className="flex flex-col gap-[2px]">
                  <div className="px-4 py-4 flex items-center space-x-4">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-[250px]" />
                      <Skeleton className="h-4 w-[200px]" />
                    </div>
                  </div>
                  <div className="px-6">
                    <Skeleton className=" h-[60px] w-[300px] rounded-[60px]" />
                  </div>
                </div>
                <div className="flex flex-col gap-4 mt-6">
                  {[1, 2, 3].map(() => (
                    <div className="px-8 flex flex-col gap-[6px]">
                      <Skeleton className="h-4 max-w-[350px]" />
                      <Skeleton className="h-4 w-[450px]" />
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <ScrollArea className="h-[93vh] min-w-[60%]">
                <div className="w-[100%] flex flex-col gap-4">
                  <div className="w-[100%] mx-auto flex flex-col gap-4">
                    <div className="px-6">
                      <div className="p-2 py-4 justify-between flex-wrap  flex items-center gap-[16px]">
                        <div className="flex items-center gap-[12px]">
                          <div className="flex  items-center gap-[10px]">
                            <TooltipComp
                              trigger={<AgentIcon type={currentLog.type} />}
                              value={
                                <p>
                                  {formatPhoneNumberWithCountryCode(
                                    currentLog.agent_phone_number,
                                  )}
                                </p>
                              }
                            />

                            {currentLog.type === 'inbound' ? (
                              <div className="flex flex-col gap-[2px] items-start justify-between">
                                <li className=" cursor-pointer text-[14px] text-gray-700 font-medium pl-[4px]">
                                  From :{' '}
                                  {currentLog.from_number
                                    ? formatPhoneNumberWithCountryCode(
                                        currentLog.from_number,
                                      )
                                    : 'Web'}
                                </li>
                                <p className="text-[12.5px] pl-[4px] flex items-center gap-[4px]">
                                  <p className="mt-[-1px]">To :</p>
                                  <Tag
                                    bg={currentLog.bg_color}
                                    color={textFromBg[currentLog.bg_color]}
                                  >
                                    {currentLog.agent_name}
                                  </Tag>
                                </p>
                                {/* <p className="text-[12px] text-gray-700 font-semibold pl-2">
                              Duration -{' '}
                              {getTimeDuration(
                                item.end_timestamp - item.start_timestamp
                              )}
                            </p> */}
                              </div>
                            ) : (
                              <div className="flex flex-col gap-[2px] items-start justify-between">
                                <li className="cursor-pointer flex items-center gap-[2px] text-[14px] text-gray-700 pl-[4px]">
                                  <p className=" font-medium">From : </p>{' '}
                                  <Tag
                                    bg={currentLog.bg_color}
                                    color={textFromBg[currentLog.bg_color]}
                                  >
                                    {currentLog.agent_name}
                                  </Tag>
                                </li>
                                <div className="text-[12.5px] pl-[4px] flex items-center gap-[4px]">
                                  <p className="mt-[-1px]">To :</p>
                                  {currentLog.phone_number
                                    ? formatPhoneNumberWithCountryCode(
                                        currentLog.phone_number,
                                      )
                                    : 'Web'}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                        {!!currentLog.call_id === false ? (
                          <div>
                            <p className="text-gray-500 mr-[4px] font-medium text-[14px]">
                              Scheduled At:{' '}
                              {FormatDate.getDateInDDMMYYYY(
                                currentLog?.scheduled_at,
                              )}
                              ,{' '}
                              {FormatDate.getTimeInAMPM(
                                currentLog?.scheduled_at,
                              )}
                            </p>
                          </div>
                        ) : (
                          <div className="px-6 flex items-center gap-[8px] text-[14px] text-gray-700 font-medium">
                            <p>
                              {' '}
                              {FormatDate.getDateInDDMMYYYY(
                                getDateFromTimeStamp(
                                  currentLog?.start_timestamp,
                                ),
                              )}
                            </p>
                            <p>
                              at{' '}
                              {FormatDate.getTimeInAMPM(
                                currentLog?.start_timestamp,
                              )}
                            </p>
                          </div>
                        )}
                      </div>

                      <div className="pl-[4px] w-full flex">
                        {currentLog?.recording_url && (
                          <audio controls>
                            <source
                              src={currentLog?.recording_url}
                              type="audio/wav"
                            />
                            Your browser does not support the audio element.
                          </audio>
                        )}
                      </div>
                    </div>
                    <hr />
                    <div />

                    {currentLog?.call_id ? (
                      <div className="flex flex-col gap-2 max-w-[630px] satoshi">
                        <h1 className="px-6 text-[20px] pb-2 mt-[-12px] font-medium text-gray-700">
                          Transcript
                        </h1>
                        <div className="flex flex-col gap-[8px]  mt-[-4px]">
                          {transcriptObject?.map((item, idx) => (
                            <div
                              className={`py-[8px] px-6 flex gap-[8px] items-start ${
                                idx % 2 === 1 ? 'bg-gray-100' : 'bg-white'
                              }   ${
                                idx % 2 === 1
                                  ? 'text-gray-700'
                                  : 'text-gray-500'
                              }  `}
                            >
                              <div className="mt-[0px]  min-w-[70px] ">
                                {idx % 2 === 0 ? (
                                  <div className="mt-[1.5px]">
                                    {/* <Initials
                                Icon={
                                  <Icon
                                    icon="fluent:arrow-up-right-16-regular"
                                    style={{ color: 'white' }}
                                  />
                                }
                                width="24px"
                                height="24px"
                              /> */}
                                    <p className="text-gray-500 font-medium">
                                      Assistant
                                    </p>
                                  </div>
                                ) : (
                                  <div className="">
                                    {/* <Icon
                                icon="mingcute:user-4-line"
                                width="26"
                                height="26"
                                style={{ color: 'rgb(31 41 55)' }}
                              /> */}
                                    <p className="text-gray-700 font-medium">
                                      User
                                    </p>
                                  </div>
                                )}
                              </div>
                              <p
                                className={`${
                                  idx % 2 === 1
                                    ? 'text-gray-800'
                                    : 'text-gray-500'
                                } ${
                                  idx % 2 === 1 ? 'font-medium' : 'font-medium'
                                }
                        ${
                          idx % 2 === 1 ? 'text-[16px]' : 'text-[16px]'
                        }                     
                        `}
                              >
                                {item.content !== '' ? (
                                  item.content
                                    .split('\n')
                                    .map((item) => <p>{item}</p>)
                                ) : (
                                  <p className=" italic">
                                    [user didn&apos;t respond]
                                  </p>
                                )}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="px-6 text-gray-700 font-light">
                        The call is{' '}
                        {currentLog?.status === 'scheduled'
                          ? 'scheduled'
                          : 're-scheduled'}{' '}
                        at{' '}
                        {FormatDate.getDateInDDMMYYYY(currentLog?.scheduled_at)}
                        , {FormatDate.getTimeInAMPM(currentLog?.scheduled_at)}
                      </div>
                    )}
                  </div>
                </div>
              </ScrollArea>
            )}
          </div>
        ) : (
          <div className="flex bg-gray-50 h-[93vh] justify-center items-center">
            <h1 className="text-gray-600 text-center font-semibold max-w-[400px] text-[32px]">
              Start calling {logs?.name} to view it&apos;s call logs and access
              recordings
            </h1>
          </div>
        )
      ) : (
        <div className="h-[93vh] w-full flex justify-center items-center">
          <Loader />
        </div>
      )}
    </div>
  );
};
export default LeadsConversations;
