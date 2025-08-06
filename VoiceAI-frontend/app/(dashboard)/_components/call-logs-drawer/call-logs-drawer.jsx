'use client';

import React, {
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
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
import { getFormattedString, formatPhone } from '@/utils/format';
import { format } from 'timeago.js';
import { IconType } from '@/utils/agent-type-icon';
import { HTTPService } from '@/utils/http';
import { AgentsContext } from '@/context/AgentsContext/AgentsContext';
import AgentIcon from '@/components/custom/agent-icon';
import { Switch } from '@/components/ui/switch';
import TranscriptText from '@/components/shared/transcript-text/transcript-text';
import { getTranscriptObject } from './index';

const CallLogsDrawer = ({ isOpen, setIsOpen, currentAgent }) => {
  const [viewFullTranscript, setViewFullTranscript] = useState(false);
  const { user, session, signOut } = useContext(AgentsContext);
  const [data, setData] = useState([]);
  const [activeWords, setActiveWords] = useState([]);

  const [isLoading, setIsLoading] = useState(true);
  const [currentLogLoading, setCurrentLogLoading] = useState(true);
  const [currentLog, setCurrentLog] = useState(null);
  const audioRef = useRef(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [activeTranscript, setActiveTranscript] = useState([]);

  // Function to update the active transcript based on audio time
  const updateActiveTranscript = () => {
    const { currentTime } = audioRef.current;
    const newActiveTranscript = getTranscriptObject(
      currentLog?.transcript_object,
    ).reduce((acc, entry) => {
      // Check if any word in this entry is active
      const isActive = entry.words.some((word) => word.end <= currentTime);
      if (isActive) {
        // If the role is the same as the last entry, append to it
        if (acc.length && acc[acc.length - 1].role === entry.role) {
          acc[acc.length - 1].content += ` ${entry.content}`;
        } else {
          // Otherwise, start a new entry
          acc.push({ role: entry.role, content: entry.content });
        }
      }
      return acc;
    }, []);

    setActiveTranscript(newActiveTranscript);
  };
  const fetchLog = async (id) => {
    if (!id) return;
    try {
      setCurrentLogLoading(true);
      const log = await axios.get(
        `${baseUrl}/calls/${id}`,
        HTTPService.setHeaders({ user, session }),
      );
      setCurrentLog({ ...log.data, type: currentAgent.type });
    } catch (error) {
      console.log(error);
      error?.response?.status === 401 && signOut();
    } finally {
      setCurrentLogLoading(false);
    }
  };
  const fetchCalls = async () => {
    try {
      setIsLoading(true);
      const res = await axios.get(
        `${baseUrl}/agents/${currentAgent.agent_id}/calls`,
        HTTPService.setHeaders({ user, session }),
      );
      setData(
        res.data
          .map((item) => ({ ...item, type: currentAgent?.type }))
          .sort((a, b) => b.end_timestamp - a.end_timestamp),
      );
    } catch (error) {
      console.log(error);
      error?.response?.status === 401 && signOut();
    } finally {
      setIsLoading(false);
    }
  };
  useEffect(() => {
    if (isLoading === false && data) {
      fetchLog(data[0]?.call_id);
    }
  }, [data]);

  useLayoutEffect(() => {
    fetchCalls();
  }, []);
  console.log(activeWords);
  const checkCurrentWord = () => {
    const { currentTime } = audioRef.current;
    const newIndex = getTranscriptObject(
      currentLog.transcript_object,
    ).findIndex((entry) =>
      entry.words.some(
        (word) => currentTime >= word.start && currentTime <= word.end,
      ),
    );
    if (newIndex !== -1 && newIndex !== currentIndex) {
      setCurrentIndex(newIndex);
    }
  };

  // Function to update the list of spoken words based on audio time
  const updateSpokenWords = () => {
    const { currentTime } = audioRef.current;
    // We now include the role in the activeWords array
    const newActiveWords = [];
    getTranscriptObject(currentLog?.transcript_object).forEach((entry) => {
      entry.words.forEach((word) => {
        if (word.end <= currentTime) {
          newActiveWords.push({ word: word.word, role: entry.role });
        }
      });
    });

    // Only update state if new words have been spoken
    if (newActiveWords.length > activeWords.length) {
      setActiveWords(newActiveWords);
    }
  };

  useEffect(() => {
    setActiveTranscript([]);
    const audio = audioRef?.current;
    audio?.addEventListener('timeupdate', updateActiveTranscript);

    return () => {
      audio?.removeEventListener('timeupdate', updateActiveTranscript);
    };
  }, [currentLog]);
  const transcriptObject = getTranscriptObject(currentLog?.transcript_object);
  console.log(transcriptObject);
  return (
    // <Drawer
    //   direction="right"
    //   open={isOpen}
    //   onOpenChange={setIsOpen}
    //   onClose={() => setIsOpen(false)}
    //   className="rounded-l-lg"
    // >
    // <DrawerContent className="h-screen rounded-l-md top-0 right-0 left-auto mt-0 min-w-[650px]">
    <div className="p-0 m-0 h-[93vh]">
      {isLoading === false ? (
        data.length > 0 ? (
          <div className="flex ">
            <div className="w-[40%] relative flex flex-col">
              {isLoading && (
                <div className="h-[100vh] w-full flex justify-center items-center">
                  <div className="loader" />
                </div>
              )}
              <ScrollArea>
                <div className="w-[100%] bg-[#fcfdfd] h-[93vh] border-r-[1px] border-gray-100 mt-0 mx-auto">
                  <h1 className="px-4  font-semibold text-gray-600 text-[18px] py-4">
                    {getFormattedString(currentAgent?.name)}&apos;s
                    Conversations
                  </h1>

                  <div className="flex flex-col gap-[12px] px-2">
                    {data?.map((item, idx) => (
                      <ul
                        onClick={() => fetchLog(item.call_id)}
                        className="px-2 cursor-pointer bg-white hover:bg-gray-50 trasition-all duration-200 ease-linear py-2 gap-[2px] flex border-[1px] border-gray-300 rounded-[12px] justify-between items-center"
                      >
                        <div className="flex  items-center gap-[6px]">
                          <AgentIcon type={currentAgent.type} />
                          <div className="flex items-center justify-between">
                            <li className="cursor-pointer text-[14px] text-gray-700 font-semibold pl-[4px]">
                              {item.from_number
                                ? formatPhone(item.from_number)
                                : 'Web'}
                            </li>

                            {/* <p className="text-[12px] text-gray-700 font-semibold pl-2">
                          Duration -{' '}
                          {getTimeDuration(
                            item.end_timestamp - item.start_timestamp
                          )}
                        </p> */}
                          </div>
                        </div>
                        <p className="text-gray-500 font-medium text-[13px]">
                          {' '}
                          {format(item?.start_timestamp)}
                        </p>
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
              <ScrollArea className="h-[93vh] w-[60%]">
                <div className="w-[100%] flex flex-col gap-4">
                  <div className="w-[100%] mx-auto flex flex-col gap-4">
                    <div className="px-6">
                      <div className="p-2 py-4 justify-between  flex items-center gap-[16px]">
                        <div className="flex items-center gap-[12px]">
                          <AgentIcon type={currentAgent.type} />
                          <p className="text-sm font-semibold text-gray-800">
                            {currentLog?.from_number
                              ? formatPhone(currentLog?.from_number)
                              : 'Web'}
                          </p>
                        </div>
                        <div className="px-6 flex items-center gap-[8px] text-[14px] text-gray-700 font-medium">
                          <p>
                            {' '}
                            {FormatDate.getDateInDDMMYYYY(
                              getDateFromTimeStamp(currentLog?.start_timestamp),
                            )}
                          </p>
                          <p>
                            at{' '}
                            {FormatDate.getTimeInAMPM(
                              currentLog?.start_timestamp,
                            )}
                          </p>
                        </div>
                      </div>

                      <div className="pl-[4px] w-full flex">
                        {currentLog?.recording_url && (
                          <audio ref={audioRef} controls>
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

                    <div className="flex flex-col gap-2 max-w-[630px] satoshi">
                      <div className="flex justify-between mt-[-12px] pr-6 items-center">
                        <h1 className="px-6 text-[20px] pb-2 font-medium text-gray-700">
                          Transcript
                        </h1>
                        <div className="flex items-center gap-2">
                          <p className="text-[16px] text-gray-700">
                            View Full Transcript
                          </p>
                          <Switch
                            checked={viewFullTranscript}
                            onCheckedChange={() =>
                              setViewFullTranscript((prev) => !prev)
                            }
                          />
                        </div>
                      </div>
                      <div className="flex flex-col gap-[8px]  mt-[-4px]">
                        {!viewFullTranscript
                          ? activeTranscript?.map((item, idx) => (
                              <TranscriptText item={item} idx={idx} />
                            ))
                          : getTranscriptObject(
                              currentLog?.transcript_object,
                            )?.map((item, idx) => (
                              <TranscriptText item={item} idx={idx} />
                            ))}
                      </div>
                    </div>
                  </div>
                </div>
              </ScrollArea>
            )}
          </div>
        ) : (
          <div className="flex bg-gray-50 h-[93vh] justify-center items-center">
            <h1 className="text-gray-600 text-center font-semibold max-w-[400px] text-[32px]">
              Start calling {currentAgent.name} to view it&apos;s call logs and
              access recordings
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
export default CallLogsDrawer;
