'use client';

// import PhoneInput from 'react-phone-number-input';
import React, { useContext, useEffect, useState } from 'react';
import { Icon } from '@iconify/react';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import Textarea from '@/components/textarea';
import axios from 'axios';
import Loader from '@/components/loader';
import { HTTPService } from '@/utils/http';
import { baseUrl, calendlyUrl } from '@/utils/config';
import { AgentsContext } from '@/context/AgentsContext/AgentsContext';
import { Switch } from '@/components/ui/switch';
import TooltipComp from '@/components/tooltip-comp';
import TimeZones from '@/app/(add-campaign)/_components/add-schedule/timezones';
import { InboundContext } from '@/context/InboundContext/InboundContext';
import { toast } from 'sonner';
import useDisclosure from '@/hooks/useDisclosure';
import PhoneInput from 'react-phone-input-2';
import PlayIcon from '@/assets/PlayIcon';
import PauseIcon from '@/assets/PauseIcon';
import PopoverHover from '@/components/custom/popover-hover';
import QuestionIcon from '@/assets/QuestionIcon';
import useTransferCallErrorModal from '@/hooks/modals/useTransferCallErrorModal';
import AudioButtons from '@/components/shared/audio-buttons';
import PromptsTemplates from './prompts-template/prompts-template';
import { getTransferCallError, voices } from '.';
import 'react-phone-input-2/lib/style.css';
import 'react-phone-number-input/style.css';
import TransferCall from './transfer-call/TransferCall';
import TransferCallErrorModal from './transfer-call-error-modal/transfer-call-error-modal';

const AddAgentForm = ({
  setAgentCreated,
  setPhoneNumber,
  setAgentName,
  onCongratsModalOpen,
  setCreatedAgent,
  onModalClose,
  handleSubmit,
}) => {
  const [audioPlaying, setAudioPlaying] = useState(false);
  const { onOpen } = useTransferCallErrorModal();
  const { transferTo, setTransferToError } = useContext(InboundContext);
  const { isOpen: isPopoverOpen, setIsOpen: setIsPopoverOpen } =
    useDisclosure();
  const [calendlyIntegrationLoading, setCalendlyIntegrationLoading] =
    useState(false);
  const [voice, setSelectedVoice] = useState('');
  const [timezone, setTimezone] = useState('');
  const [calendlyChecked, setCalendlyChecked] = useState(false);
  const [phoneNumberChecked, setPhoneNumberChecked] = useState(false);
  const [calendlyScheduleLoading, setCalendlyScheduleLoading] = useState(false);
  const [calendlySchedule, setCalendlySchedule] = useState('');
  const [postLoading, setPostLoading] = useState(false);
  const { fetchAgents, user, session, reloadUser, signOut } =
    useContext(AgentsContext);
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [prompt, setPrompt] = useState('');
  const [selectedButtons, setSelectedButtons] = useState([]);
  const [phone, setPhone] = useState('');
  const [beginMessage, setBeginMessage] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const nextStep = () => {
    setStep((prev) => prev + 1);
  };
  const onCreate = async () => {
    const transferToError = getTransferCallError(
      transferTo,
      startTime,
      endTime,
    );
    if (phoneNumberChecked && !!transferToError) {
      setTransferToError(transferToError);
      onOpen();
      return;
    }
    const requestBody = {
      name,
      prompt,
      transfer_to: phone ? (phone[0] === '+' ? phone : `+${phone}`) : '',
      begin_message: beginMessage,
      availability_schedule: calendlyChecked ? calendlySchedule : '',
      non_transfer_timeline: `${startTime} - ${endTime}`,
      transfer_events: phoneNumberChecked
        ? transferTo.map((item) => ({
            name: item.name,
            description: item.scenario,
            phone_number: item.phone,
          }))
        : [],
      timezone,
      active: true,
      voice_id: voices[selectedButtons].id,
    };
    try {
      setPostLoading(true);
      toast.loading('Creating Your Assistant');
      let schedule = '';
      if (calendlyChecked) {
        schedule = await handleCalendlySchedule();
      }
      const res = await axios.post(
        `${baseUrl}/users/${user?.id}/agents`,
        { ...requestBody, availability_schedule: schedule },
        HTTPService.setHeaders({ user, session }),
      );
      setCreatedAgent(res.data);
      setPhoneNumber(res.data.phone_number);
      setAgentName(res.data.name);
      setAgentCreated(true);
      onModalClose();
      onCongratsModalOpen();

      toast.success('Assistant Created');
    } catch (error) {
      console.log(error);
      error.response.status === 401 && signOut();
    } finally {
      setPostLoading(false);
      fetchAgents(user);
      toast.dismiss();
    }
  };
  const handSelecteToneButtons = (idx) => {
    setAudioPlaying(idx);
    setSelectedButtons(idx);
    setSelectedVoice(voices[idx].path);
  };

  const handleCalendlySchedule = async () => {
    try {
      setCalendlyScheduleLoading(true);
      const res = await axios.get(
        `${baseUrl}/users/${user?.id}/calendly/schedules`,
        HTTPService.setHeaders({ user, session }),
      );
      return res.data.schedule.trim();
    } catch (error) {
      console.log(error);
    } finally {
      setCalendlyScheduleLoading(false);
    }
  };
  const handleCalendlyChecked = () => {
    calendlyChecked ? setCalendlyChecked(false) : setCalendlyChecked(true);
  };
  const playAudio = (audio, idx) => {
    if (audio === voice) {
      playAudioOnButton(audio);
    }
    setSelectedVoice(audio);
    setAudioPlaying(idx);
  };
  const pauseAudio = (audio, idx) => {
    const audioElement = document.getElementById('audio');
    audioElement.pause();
    setAudioPlaying(null);
  };
  const playAudioOnButton = (audio) => {
    console.log('playAudio');
    const audioElement = document.getElementById('audio');
    audioElement.setAttribute('src', audio);
    audioElement.play();
  };
  useEffect(() => {
    setSelectedButtons(0);
  }, []);
  useEffect(() => {
    playAudioOnButton(voice);
  }, [voice]);
  return (
    <>
      <div className="border-b-[1px] overflow-hidden lg:border-b-[0px] border-gray-200 ">
        <div className="h-[60vh] hide-scrollbar bg-slate-container overflow-auto">
          <div className="relative   hide-scrollbar bg-slate-container bg-oapcity-20 flex flex-col gap-[32px] justify-center items-center">
            <div className=" rounded-lg w-full">
              {step === 1 && (
                <div className=" my-[24px] flex flex-col gap-[32px]">
                  <div className="w-[90%] m-auto gap-[24px] flex flex-col">
                    <div className=" flex flex-col gap-[6px]">
                      <h2 className="label">
                        Give a name to your AI assistant*
                      </h2>
                      <Input
                        value={name}
                        className="outline-none "
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Enter Name"
                      />
                    </div>

                    <div className=" flex flex-col gap-[6px]">
                      <div className="w-full flex justify-between items-end">
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
                          placeholder="Write a custom prompt or select from the given templates"
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
                        // src={voice}
                        id="audio"
                        controls
                        autoPlay={false}
                      />
                    </div>
                    <div className="flex flex-col mt-[4px] gap-[16px]">
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
                          placeholder="Write the introductory message with which assistant will introduce itself"
                          text={beginMessage}
                          handleChange={(e) => setBeginMessage(e.target.value)}
                        />
                      </div>
                      <div className="label-container">
                        <h2 className="label">
                          Select timezone that your assistant operates on*
                        </h2>
                        <TimeZones
                          type="inbound"
                          timezone={timezone}
                          setTimezone={setTimezone}
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
                                <p>
                                  The call will be transfered to this number
                                </p>
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
                                      <div
                                        className="self-center text-left"
                                        onMouseEnter={() =>
                                          setIsPopoverOpen(true)
                                        }
                                      >
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
                                    onChange={(e) =>
                                      setStartTime(e.target.value)
                                    }
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
            </div>
          </div>
        </div>
        <div className="py-[24px] flex justify-center">
          {postLoading ? (
            <Button variant="outline" className="w-[60%]">
              <Loader width="24px" height="24px" />
            </Button>
          ) : (
            <Button
              disabled={!name || !prompt || !beginMessage || !timezone}
              onClick={() => onCreate()}
              className="w-[60%] hover:border-[1px] hover:border-neutral-900 hover:bg-white hover:text-neutral-900 transition-all duration-200 ease-in"
            >
              Create Assistant
            </Button>
          )}
        </div>
      </div>
      <TransferCallErrorModal />
    </>
  );
};

export default AddAgentForm;
