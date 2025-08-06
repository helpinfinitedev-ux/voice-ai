'use client';

import React, { useContext, useEffect, useState } from 'react';
import Link from 'next/link';
import InfoIcon from '@/assets/InfoIcon';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Icon } from '@iconify/react';
import { useParams } from 'next/navigation';
import { getAgentById, updateAgent } from '@/lib/actions/agent.actions';
import axios from 'axios';
import Textarea from '@/components/textarea';
import { useUser } from '@clerk/nextjs';
import Loader from '@/components/loader';
import TooltipComp from '@/components/tooltip-comp';
import { Switch } from '@/components/ui/switch';
import { appBaseUrl, baseUrl, calendlyUrl } from '@/utils/config';
import { AgentsContext } from '@/context/AgentsContext/AgentsContext';
import { toast } from 'sonner';
import TimeZones from '@/app/(add-campaign)/_components/add-schedule/timezones';
import { getFormattedString } from '@/utils/format';
import PromptsTemplates from '@/app/(add-agent-form)/add-agent-form/_components/prompts-template/prompts-template';
import { HTTPService } from '@/utils/http';
import PhoneInput from 'react-phone-input-2';
import { voices } from '@/app/(add-agent-form)/add-agent-form/_components';
import 'react-phone-input-2/lib/style.css';
import { InboundContext } from '@/context/InboundContext/InboundContext';
import { defaultTransferTo } from '@/context/AddCampaignContext/AddCampaignContext';
import PopoverHover from '@/components/custom/popover-hover';
import TransferCall from '@/app/(add-agent-form)/add-agent-form/_components/transfer-call/TransferCall';
import QuestionIcon from '@/assets/QuestionIcon';
import AudioButtons from '@/components/shared/audio-buttons';
import { toneButtons } from './index';

const EditAgentForm = ({
  currentAgent,
  onEditCongratsModalOpen,
  onEditCongratsModalClose,
  onEditModalClose,
  setUpdatedAgent,
}) => {
  // const { agentId } = useParams();
  const [audioPlaying, setAudioPlaying] = useState(false);
  const { setTransferTo } = useContext(InboundContext);
  const [timezone, setTimezone] = useState(currentAgent.timezone);
  const [calendlyChecked, setCalendlyChecked] = useState(
    !!currentAgent?.availability_schedule
  );
  const [phoneNumberChecked, setPhoneNumberChecked] = useState(
    !!currentAgent.transfer_to
  );
  const [calendlyIntegrationLoading, setCalendlyIntegrationLoading] =
    useState(false);
  const [voice, setSelectedVoice] = useState('');

  const [calendlyScheduleLoading, setCalendlyScheduleLoading] = useState(false);
  const { user, isLoading } = useUser();
  const { session } = useContext(AgentsContext);
  const [editLoading, setEditLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [agent, setAgent] = useState(null);
  const [step, setStep] = useState(1);
  const [name, setName] = useState(currentAgent.name);
  const [prompt, setPrompt] = useState(currentAgent.prompt);
  const [beginMessage, setBeginMessage] = useState(currentAgent.begin_message);
  const [selectedButtons, setSelectedButtons] = useState('');
  const [phone, setPhone] = useState(currentAgent.transfer_to);
  const [scheduleCall, setScheduleCall] = useState('');
  const [calendlySchedule, setCalendlySchedule] = useState(
    currentAgent?.availability_schedule
  );
  const { fetchAgents, reloadUser } = useContext(AgentsContext);
  const { agentId } = useParams();
  const [startTime, setStartTime] = useState(
    currentAgent.non_transfer_timeline.split('-')[0]?.trim()
  );
  const [endTime, setEndTime] = useState(
    currentAgent.non_transfer_timeline.split('-')[1]?.trim()
  );
  // const fetchAgentById = (user) => {
  //   axios
  //     .get(
  //       `${baseUrl}/${user?.id}/agents/${agentId}`
  //     )
  //     .then((res) => {
  //       setAgent(res.data);
  //       setLoading(false);
  //     })
  //     .catch((err) => console.log(err));
  // };

  // const nextStep = () => {
  //   setStep((prev) => prev + 1);
  // };
  const onUpdate = async () => {
    // const body = {
    //   userId,
    //   name,
    //   prompt,
    //   phone,
    //   tone: selectedButtons,
    //   scheduleCall,
    // };
    const requestBody = {
      agent_id: currentAgent?.agent_id,
      name,
      prompt,
      begin_message: beginMessage,
      transfer_to: phone ? (phone[0] === '+' ? phone : `+${phone}`) : '',
      non_transfer_timeline: `${startTime} - ${endTime}`,
      timezone,
      availability_schedule: calendlySchedule,
      active: currentAgent?.active,
      voice_id: voices[selectedButtons].id,
    };
    // await updateAgent(agent._id, body);
    try {
      toast.loading('Editing your assistant');
      setEditLoading(true);
      let schedule = '';
      if (calendlyChecked) {
        schedule = await handleCalendlySchedule();
      }
      const res = await axios.patch(
        `${baseUrl}/users/${user?.id}/agents/${currentAgent?.agent_id}`,
        { ...requestBody, availability_schedule: schedule },
        HTTPService.setHeaders({ user, session })
      );
      toast.success('Assistant updated successfully');
      setUpdatedAgent(res.data);
      onEditModalClose();
      onEditCongratsModalOpen();
      setTimeout(() => {
        onEditCongratsModalClose();
      }, 4000);
    } catch (error) {
      console.log(error);
    } finally {
      setEditLoading(false);
      fetchAgents(user);
      toast.dismiss();
    }
  };
  const handSelecteToneButtons = (idx) => {
    setSelectedButtons(idx);
    setSelectedVoice(voices[idx].path);
  };
  const handleCalendlySchedule = async () => {
    try {
      setCalendlyScheduleLoading(true);
      const res = await axios.get(
        `${baseUrl}/users/${user?.id}/calendly/schedules`,
        HTTPService.setHeaders({ user, session })
      );
      setCalendlySchedule(res.data.schedule.trim());
    } catch (error) {
      console.log(error);
    } finally {
      setCalendlyScheduleLoading(false);
    }
  };
  const handleCalendlyChecked = () => {
    if (!user?.publicMetadata.calendlyIntegrated) {
      calendlyChecked ? setCalendlyChecked(false) : setCalendlyChecked(true);
      return;
    }
    if (calendlyChecked) {
      setCalendlyChecked(false);
    } else {
      setCalendlyChecked(true);
      if (!!calendlySchedule === false) {
        handleCalendlySchedule();
      }
    }
  };
  const playAudio = (audio) => {
    setSelectedVoice(audio);
    const audioElement = document.getElementById('audio');
    audioElement.play();
  };

  // useEffect(() => {
  //   if (user) {
  //     fetchAgentById(user);
  //   }
  // }, [user]);
  useEffect(() => {
    setSelectedButtons(
      voices.findIndex((item) => item.id === currentAgent?.voice_id)
    );
    setTransferTo(
      currentAgent?.transfer_events?.length > 0
        ? currentAgent?.transfer_events.map((item) => ({
            name: item.name,
            scenario: item.description,
            phone: item.phone_number,
          }))
        : defaultTransferTo
    );
    setTimezone(currentAgent?.timezone);
    setPhoneNumberChecked(currentAgent?.transfer_events?.length > 0);
  }, [currentAgent]);
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="loader" />
      </div>
    );
  }
  return (
    <div className="border-b-[1px] lg:border-b-[0px] border-gray-200">
      <div className="h-[60vh] hide-scrollbar bg-slate-container overflow-scroll">
        <div className="relative   hide-scrollbar bg-slate-container bg-oapcity-20 flex flex-col gap-[32px] justify-center items-center">
          <div className=" rounded-lg w-full">
            {step === 1 && (
              <div className=" my-[24px] flex flex-col gap-[32px]">
                <div className="w-[90%] m-auto gap-[24px] flex flex-col">
                  <div className=" flex flex-col gap-[6px]">
                    <h2 className="label">Give a name to your AI assistant*</h2>
                    <Input
                      value={name}
                      className="outline-none "
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Enter Name"
                    />
                  </div>
                  <div />
                  <div className=" flex flex-col gap-[6px]">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-[6px]">
                        <h2 className="label">
                          Provide instructions to your assistant; the more
                          detail the better*
                        </h2>
                        <TooltipComp
                          trigger={
                            <Icon
                              icon="fe:question"
                              style={{ color: 'grey' }}
                            />
                          }
                          value={
                            <p>
                              This prompt can be used to provide context, task
                              guidance or input specification
                            </p>
                          }
                        />
                      </div>
                      <PromptsTemplates
                        template={prompt}
                        setTemplate={setPrompt}
                      />
                    </div>
                    <div className="">
                      <Textarea
                        text={prompt}
                        handleChange={(e) => setPrompt(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="flex flex-col gap-[6px]">
                    <h2 className="label">
                      Select your assistant&apos;s voice
                    </h2>
                    <div className="grid grid-cols-3 gap-4">
                      <AudioButtons
                        voices={voices}
                        voice={voice}
                        audioPlaying={audioPlaying}
                        selectedButtons={selectedButtons}
                        setSelectedVoice={setSelectedVoice}
                        setAudioPlaying={setAudioPlaying}
                        setSelectedButtons={setSelectedButtons}
                      />
                    </div>
                    <audio
                      className="hidden"
                      src={voice}
                      id="audio"
                      controls
                      autoPlay
                    />
                  </div>
                  <div className="flex flex-col gap-[16px] py-[16px]">
                    <div className="flex flex-col gap-[6px]">
                      <div className="flex items-center gap-[6px]">
                        <h2 className="label">Enter Beginning Message*</h2>
                        <TooltipComp
                          trigger={
                            <Icon
                              icon="fe:question"
                              style={{ color: 'grey' }}
                            />
                          }
                          value={
                            <p>Agent introduce itself with this message</p>
                          }
                        />
                      </div>
                      <Textarea
                        text={beginMessage}
                        handleChange={(e) => setBeginMessage(e.target.value)}
                      />
                    </div>
                    <div className="label-container">
                      <h2 className="label">
                        Select timezone that your assistant operates on*
                      </h2>
                      <TimeZones
                        timezone={timezone}
                        setTimezone={setTimezone}
                        type="inbound"
                      />
                    </div>
                    <div className="flex flex-col gap-[8px]">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center cursor-pointer gap-[6px]">
                          <h3 className="label">
                            Transfer the call live to a human
                          </h3>
                          <TooltipComp
                            trigger={
                              <Icon
                                icon="fe:question"
                                style={{ color: 'grey' }}
                              />
                            }
                            value={
                              <p>The call will be transfered to this number</p>
                            }
                          />
                        </div>

                        <Switch
                          onCheckedChange={() =>
                            phoneNumberChecked
                              ? setPhoneNumberChecked(false)
                              : setPhoneNumberChecked(true)
                          }
                          checked={phoneNumberChecked}
                        />
                      </div>
                      {phoneNumberChecked && (
                        <>
                          {' '}
                          <TransferCall />
                          <div className="mt-[0px] flex flex-col gap-[12px]">
                            <div className="flex items-center gap-[6px] mb-[-8px]">
                              <h2 className="font-medium text-[13px] text-red-400">
                                Choose time range for no call transfer
                              </h2>
                              <div className="mb-[-15px">
                                <PopoverHover
                                  value={
                                    <p className="text-[14px]">
                                      This lets agent know when the call
                                      won&apos;t be transferred to given phone
                                      number
                                    </p>
                                  }
                                  trigger={
                                    <div className="self-center text-left">
                                      <QuestionIcon />
                                    </div>
                                  }
                                />
                              </div>
                            </div>
                            <div className="w-full flex items-center gap-[18px]">
                              <div className="w-1/2 flex flex-col gap-[2px]">
                                <h1 className="label-sm">Start Time*</h1>
                                <input
                                  value={startTime}
                                  onChange={(e) => setStartTime(e.target.value)}
                                  name="start_time"
                                  type="time"
                                  className="px-4 py-[4px] w-full outline-none border-neutral-300 border-[1px] rounded-md"
                                />
                              </div>
                              <div className="w-1/2 flex flex-col gap-[2px]">
                                <h1 className="label-sm">End Time*</h1>
                                <input
                                  value={endTime}
                                  onChange={(e) => setEndTime(e.target.value)}
                                  type="time"
                                  className="px-4 py-[4px] w-full outline-none border-neutral-300 border-[1px] rounded-md"
                                />
                              </div>
                            </div>
                          </div>
                        </>
                      )}
                    </div>

                    <div className="flex flex-col gap-[12px]">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center cursor-pointer gap-[6px]">
                          <h3 className="label">Schedule live apointments</h3>
                          <TooltipComp
                            trigger={
                              <Icon
                                icon="fe:question"
                                style={{ color: 'grey' }}
                              />
                            }
                            value={
                              <p>Add Your Calendly availability schedule</p>
                            }
                          />
                        </div>
                        <Switch
                          onCheckedChange={handleCalendlyChecked}
                          checked={calendlyChecked}
                        />
                      </div>
                      {/* {calendlyChecked && (
                          <Button
                            onClick={handleCalendlySchedule}
                            variant={
                              scheduleCall === 'Connect Calendly'
                                ? 'default'
                                : 'outline'
                            }
                          >
                            {calendlyScheduleLoading ? (
                              <Loader width="20px" height="20px" />
                            ) : (
                              'Get Calendly Schedule'
                            )}
                          </Button>
                        )} */}

                      {/* <p>
                          {calendlySchedule.split('\n').map((item) => (
                            <div className="w-full flex justify-between items-center">
                              <p className="p-2 font-medium text-[15px] text-gray-700 ">
                                {getFormattedString(item).split(':')[0]}
                              </p>
                              <p className="p-2 font-medium text-[15px] text-gray-700 ">
                                {item.substring(item.indexOf(':') + 1)}
                              </p>
                            </div>
                          ))}
                        </p> */}
                      {calendlyChecked &&
                      !user?.publicMetadata.calendlyIntegrated &&
                      calendlyIntegrationLoading ? (
                        <Button variant="outline">
                          <Loader width="24px" height="24px" />
                        </Button>
                      ) : (
                        calendlyChecked &&
                        !user?.publicMetadata.calendlyIntegrated && (
                          <Button
                            onClick={() => {
                              setCalendlyIntegrationLoading(true);
                              window.open(`${calendlyUrl}`, '_blank');
                              setTimeout(() => {
                                reloadUser().then(() => {
                                  setCalendlyIntegrationLoading(false);
                                  handleCalendlySchedule();
                                });
                              }, 10000);
                            }}
                          >
                            Integrate Calendly
                          </Button>
                        )
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
            {/*
    {step !== 3 && (
      <div className="flex justify-end gap-[18px] items-center py-[12px]">
        {step === 2 && (
          <Button variant="outline" onClick={() => setStep(1)}>
            Back
          </Button>
        )}
        {selectedButtons.length > 0 &&
          !!name &&
          !!prompt &&
          (editLoading ? (
            <Loader width="24px" height="24px" />
          ) : (
            <Button onClick={() => (step === 2 ? onCreate() : nextStep())}>
              {step === 2 ? 'Publish' : 'Next'}
            </Button>
          ))}
      </div>
    )} */}
            {step === 3 && (
              <div className="flex flex-col gap-[18px] ">
                <h1 className="text-[20px] leading-normal pb-[8px]">
                  <span className="font-bold">
                    Congratulations, here’s your AI agent.
                  </span>{' '}
                  You can call it directly to give it a try. If you want your
                  agent to only answer when you hang up the phone; you can do
                  this here
                </h1>
                <div className="flex items-center gap-[16px]">
                  <p className="text-[20px] font-bold">Name</p>
                  <p className="text-[18px] ">{name}</p>
                </div>
                <div className="flex items-center gap-[16px]">
                  <p className="text-[20px] font-bold">Prompt</p>
                  <p className="text-[18px] ">{prompt}</p>
                </div>
                <div className="flex items-center gap-[16px]">
                  <p className="text-[20px] font-bold">Tone</p>
                  <p className="text-[18px] ">{selectedButtons.join(', ')}</p>
                </div>

                <Link href="/" className="flex justify-end ml-auto">
                  <Button>Go To Dashboard</Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="h-[13vh] items-center flex justify-center">
        {editLoading ? (
          <Button variant="outline" className="w-[60%] mx-auto">
            <Loader width="24px" height="24px" />
          </Button>
        ) : (
          <Button
            disabled={!name || !prompt || !beginMessage}
            onClick={() => onUpdate()}
            className="w-[60%] hover:border-[1px] hover:border-neutral-900 hover:bg-white hover:text-neutral-900 transition-all duration-200 ease-in"
          >
            Update Assistant
          </Button>
        )}
      </div>
    </div>
  );
};

export default EditAgentForm;
