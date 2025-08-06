'use client';

import { InboxContext } from '@/context/InboxContext/InboxContext';
import React, { useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { baseUrl } from '@/utils/config';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  FormatDate,
  getDateFromTimeStamp,
  getTimeDuration,
} from '@/utils/formatDates';
import { Icon } from '@iconify/react';
import Initials from '@/components/custom/initials';
import { formatPhoneNumberWithCountryCode } from '@/utils/format';
import { format } from 'timeago.js';
import TooltipComp from '@/components/tooltip-comp';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Tag from '@/components/custom/tag';
import { IconType } from '@/utils/agent-type-icon';
import { HTTPService } from '@/utils/http';
import { AgentsContext } from '@/context/AgentsContext/AgentsContext';
import AgentIcon from '@/components/custom/agent-icon';
import { getTranscriptObject, textFromBg } from './index';
import NoInbox from '../no-inbox/no-inbox';

const InboxComp = () => {
  const {
    allConversations,
    allConversationsLoading,
    changeCallStatusById,
    tabValue,
    setTabValue,
    unread,
  } = useContext(InboxContext);
  const { user, session, signOut } = useContext(AgentsContext);
  const [currentLogLoading, setCurrentLogLoading] = useState(false);
  const [currentLog, setCurrentLog] = useState(null);
  const [inputString, setInputString] = useState('');
  const fetchLog = async (id, agent) => {
    try {
      setCurrentLogLoading(true);
      const log = await axios.get(
        `${baseUrl}/calls/${id}`,
        HTTPService.setHeaders({ user, session })
      );
      setCurrentLog({
        ...log.data,
        from_number: log.data.to_number || log.data.from_number,
        agent_name: agent.agent_name,
        phone_number: agent.phone_number,
        bg_color: agent.bg_color,
        type: agent.type,
      });
    } catch (error) {
      console.log(error);
      error.response.status === 401 && signOut();
    } finally {
      setCurrentLogLoading(false);
    }
  };
  const changeCallStatus = async (call) => {
    if (call.read === true) return;
    try {
      await axios.patch(
        `${baseUrl}/calls/${call.call_id}`,
        {
          read: true,
        },
        HTTPService.setHeaders({ user, session })
      );

      changeCallStatusById(call, true);
    } catch (error) {
      console.log(error);
    }
  };
  useEffect(() => {
    if (allConversations?.length > 0) {
      if (!currentLog) {
        fetchLog(
          allConversations.sort((a, b) => b.end_timestamp - a.end_timestamp)[0]
            ?.call_id,
          allConversations[0]
        );
      }
    }
  }, [allConversations]);

  const transcriptObject = getTranscriptObject(currentLog?.transcript_object);
  let filteredConversations = allConversations?.filter(
    (item) =>
      item.agent_name.toLowerCase().includes(inputString) ||
      item.phone_number.toLowerCase().includes(inputString)
  );

  filteredConversations = filteredConversations
    .filter((item) => {
      if (tabValue === 'unread') {
        return item.read === false;
      }
      return true;
    })
    .sort((a, b) => b.end_timestamp - a.end_timestamp);
  if (allConversationsLoading) {
    return (
      <div className="flex w-[90%] mx-auto">
        <div className="h-[100vh] w-[40%] flex flex-col gap-[16px]">
          {[1, 2, 3, 4, 5, 6, 7, 8, 0].map(() => (
            <div className="flex flex-col gap-[2px]">
              <div className="px-4 py-4 flex items-center space-x-4">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="space-y-2 w-[90%]">
                  <Skeleton className="h-4 w-[100%]" />
                  <Skeleton className="h-4 w-[90%]" />
                </div>
              </div>
            </div>
          ))}
        </div>
        <ScrollArea className="w-[60%] max-auto">
          <div className="w-full  h-[calc(100vh-230px)] border-gray-100 border-r-[1px] flex flex-col gap-4">
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
              {[1, 2, 3, 4, 5, 6, 6].map(() => (
                <div className="px-8 flex flex-col gap-[6px]">
                  <Skeleton className="h-4 max-w-[90%]" />
                  <Skeleton className="h-4 w-[100%]" />
                </div>
              ))}
            </div>
          </div>
        </ScrollArea>
      </div>
    );
  }

  return (
    // <Drawer
    //   direction="right"
    //   open={isOpen}
    //   onOpenChange={setIsOpen}
    //   onClose={() => setIsOpen(false)}
    //   className="rounded-l-lg"
    // >
    // <DrawerContent className="h-screen rounded-l-md top-0 right-0 left-auto mt-0 min-w-[650px]">
    allConversationsLoading === false &&
      (filteredConversations?.length > 0 || tabValue === 'unread') ? (
      <div>
        <hr />
        <div className="p-0 m-0 w-[90%] mx-auto  overflow-hidden">
          <div className="flex ">
            <div className="w-[40%] relative flex flex-col">
              <ScrollArea>
                <div className="w-[100%]  h-[calc(100vh-230px)]  py-6 bg-[#fcfdfd] border-l-[1px]  border-r-[1px] border-gray-100 mt-0 mx-auto">
                  <div className="flex flex-col gap-[16px] px-6">
                    <div className="relative">
                      <Input
                        onChange={(e) => setInputString(e.target.value)}
                        placeholder="Search agent by name or phone number"
                        className="py-[20px] rounded-[10px] border-gray-300 border-[1px]"
                      />
                      <div className="absolute top-[50%] translate-y-[-50%] right-[14px]">
                        <Icon icon="uil:search" style={{ color: 'grey' }} />
                      </div>
                    </div>
                    <Tabs
                      value={tabValue}
                      defaultValue="editAssistant"
                      className="w-full overflow-hidden"
                    >
                      <TabsList className="w-full">
                        <TabsTrigger
                          onClick={() => setTabValue('inbox')}
                          className="w-[50%] rounded-[12px]"
                          value="inbox"
                        >
                          Inbox ({filteredConversations?.length})
                        </TabsTrigger>
                        <TabsTrigger
                          onClick={() => setTabValue('unread')}
                          className="w-[50%] rounded-[12px]"
                          value="unread"
                        >
                          Unread <span>{`   (${unread})`}</span>
                        </TabsTrigger>
                      </TabsList>
                    </Tabs>
                    {filteredConversations?.map((item) => (
                      <ul
                        onClick={() => {
                          fetchLog(item.call_id, item);
                          changeCallStatus(item);
                        }}
                        className={`px-[12px] ${
                          item.read === false && tabValue !== 'unread'
                            ? 'bg-gray-50'
                            : 'bg-white'
                        } cursor-pointer hover:bg-gray-50 
                      trasition-all duration-200 ease-linear py-[12px] gap-[2px] flex border-[1px] 
                      border-gray-300 rounded-[12px] justify-between items-center`}
                      >
                        <div className="flex  items-center gap-[10px]">
                          <TooltipComp
                            trigger={<AgentIcon type={item.type} />}
                            value={
                              <p>
                                {formatPhoneNumberWithCountryCode(
                                  item.phone_number
                                )}
                              </p>
                            }
                          />

                          {item.type === 'inbound' ? (
                            <div className="flex flex-col gap-[2px] items-start justify-between">
                              <li className="cursor-pointer text-[14px] text-gray-700 font-medium pl-[4px]">
                                From :{' '}
                                {item.from_number
                                  ? formatPhoneNumberWithCountryCode(
                                      item.from_number
                                    )
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
                                {item.from_number
                                  ? formatPhoneNumberWithCountryCode(
                                      item.from_number
                                    )
                                  : 'Web'}
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col items-end gap-[4px]">
                          <p className="text-gray-500 mr-[4px] font-medium text-[13px]">
                            {' '}
                            {format(item?.start_timestamp)}
                          </p>
                          <p className="text-gray-600 text-[13px]">
                            Duration :{' '}
                            {getTimeDuration(
                              item.end_timestamp - item.start_timestamp
                            )}
                          </p>
                        </div>
                      </ul>
                    ))}
                  </div>
                </div>
              </ScrollArea>
            </div>

            {currentLogLoading || allConversationsLoading ? (
              <ScrollArea className="w-[60%]">
                <div className="w-full  h-[calc(100vh-230px)] overflow-y-auto border-gray-100 border-r-[1px] flex flex-col gap-4">
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
                    {[1, 2, 3, 4, 5, 6, 6].map(() => (
                      <div className="px-8 flex flex-col gap-[6px]">
                        <Skeleton className="h-4 max-w-[90%]" />
                        <Skeleton className="h-4 w-[100%]" />
                      </div>
                    ))}
                  </div>
                </div>
              </ScrollArea>
            ) : (
              <ScrollArea className="border-r-[1px]  h-[calc(100vh-230px)] border-gray-100 w-[60%]">
                <div className="w-[100%] flex flex-col gap-4">
                  <div className="w-[100%] mx-auto flex flex-col gap-4">
                    <div className="px-6">
                      <div className="p-2 py-4 justify-between  flex items-center gap-[16px]">
                        <div className="flex items-center gap-[12px]">
                          <TooltipComp
                            value={<p>{currentLog?.agent_name}</p>}
                            trigger={<AgentIcon type={currentLog?.type} />}
                          />

                          {currentLog?.type === 'inbound' ? (
                            <div className="min-w-[fit-content] items-start flex flex-col gap-[5px]">
                              <div className="text-sm font-medium gap-[8px] flex justify-between items-center text-gray-800">
                                <p>From :</p>{' '}
                                <p>
                                  {currentLog.from_number
                                    ? formatPhoneNumberWithCountryCode(
                                        currentLog.from_number
                                      )
                                    : 'Web'}
                                </p>
                              </div>
                              <div className="text-sm text-gray-800 font-medium flex items-center gap-[8px]">
                                <p className="mt-[0px]">To :</p>
                                {currentLog && (
                                  <Tag
                                    bg={currentLog?.bg_color}
                                    color={textFromBg[currentLog?.bg_color]}
                                  >
                                    {currentLog?.agent_name}
                                  </Tag>
                                )}
                              </div>
                            </div>
                          ) : (
                            <div className="min-w-[170px] items-start flex flex-col gap-[5px]">
                              <div className="text-sm font-medium gap-[8px] flex justify-between items-center text-gray-800">
                                <p>From :</p>{' '}
                                {currentLog && (
                                  <Tag
                                    bg={currentLog?.bg_color}
                                    color={textFromBg[currentLog?.bg_color]}
                                  >
                                    {currentLog?.agent_name}
                                  </Tag>
                                )}
                              </div>
                              <div className="text-sm text-gray-800 font-medium flex items-center gap-[8px]">
                                <p className="mt-[0px]">To :</p>
                                <p>
                                  {formatPhoneNumberWithCountryCode(
                                    currentLog?.from_number
                                  )}
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="px-6 flex items-center gap-[8px] text-[14px] text-gray-700 font-medium">
                          <p>
                            {' '}
                            {FormatDate.getDateInDDMMYYYY(
                              getDateFromTimeStamp(currentLog?.start_timestamp)
                            )}
                          </p>
                          <p>
                            at{' '}
                            {FormatDate.getTimeInAMPM(
                              currentLog?.start_timestamp
                            )}
                          </p>
                        </div>
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

                    <div className="flex flex-col gap-2 w-full satoshi">
                      <h1 className="px-6 text-[20px] pb-2 mt-[-12px] font-medium text-gray-700">
                        Transcript
                      </h1>
                      <div className="flex flex-col gap-[8px]  mt-[-4px]">
                        {transcriptObject?.map((item, idx) => (
                          <div
                            className={`w-full py-[8px] px-6 flex gap-[8px] items-start ${
                              idx % 2 === 1 ? 'bg-gray-100' : 'bg-white'
                            }   ${
                              idx % 2 === 1 ? 'text-gray-700' : 'text-gray-500'
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
                              } ${idx % 2 === 1 ? 'font-medium' : 'font-medium'}
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
                  </div>
                </div>
              </ScrollArea>
            )}
          </div>
        </div>
      </div>
    ) : (
      <NoInbox />
    )
  );
};

export default InboxComp;
