'use client';

import React, { useContext, useState } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import useDisclosure from '@/hooks/useDisclosure';
import { Input } from '@/components/ui/input';
import { AddCampaignContext } from '@/context/AddCampaignContext/AddCampaignContext';
import { Button } from '@/components/ui/button';
import Textarea from '@/components/textarea';
import { voices } from '@/app/(add-agent-form)/add-agent-form/_components';
import PopoverHover from '@/components/custom/popover-hover';
import QuestionIcon from '@/assets/QuestionIcon';
import TooltipComp from '@/components/tooltip-comp';
import { Switch } from '@/components/ui/switch';
import { Icon } from '@iconify/react';
import { AgentsContext } from '@/context/AgentsContext/AgentsContext';
import { calendlyUrl } from '@/utils/config';
import Loader from '@/components/loader';
import AudioButtons from '@/components/shared/audio-buttons';
import TransferCall from '../transfer-call/transfer-call';
import TransferCallErrorModal from '../transfer-call-error-modal/transfer-call-error-modal';

const AddPrompt = () => {
  const {
    beginMessage,
    variables,
    setBeginMessage,
    agentId,
    setAgentId,
    prompt,
    setPrompt,
    agents,
    nextStep,
    prevStep,
    zapier,
    name,
    setName,
    setSelectedButtons,
    setSelectedVoice,
    selectedButtons,
    voice,
    maxRetries,
    setMaxRetries,
    retryDuration,
    setRetryDuration,
    transferTo,
    setTransferTo,
    transferToError,
    setTransferToError,
    phoneNumberChecked,
    setPhoneNumberChecked,
    startTime,
    setStartTime,
    endTime,
    setEndTime,
    calendlyChecked,
    setCalendlyChecked,
    calendlyIntegrationLoading,
    setCalendlyIntegrationLoading,
    voicemail,
    setVoicemail,
    voicemailChecked,
    setVoicemailChecked,
  } = useContext(AddCampaignContext);
  const [audioPlaying, setAudioPlaying] = useState(false);
  const { user, reloadUser } = useContext(AgentsContext);
  const [addingCustomVariable, setAddingCustomVariable] = useState(false);
  const [customVariable, setCustomVariable] = useState('');
  const handleAddVariableToPrompt = (value) => {
    setPrompt((prev) => `${prev} $${value}`);
  };
  const handleAddVariable = (value) => {
    setBeginMessage((prev) => `${prev} $${value}`);
  };
  const handSelecteToneButtons = (idx) => {
    setSelectedButtons(idx);
    setSelectedVoice(voices[idx].path);
  };
  const playAudio = (audio) => {
    setSelectedVoice(audio);
    const audioElement = document.getElementById('audio');
    audioElement.play();
  };
  const handleAddCustomVariable = () => {
    if (customVariable.trim() !== '') {
      handleAddVariableToPrompt(customVariable);
      setAddingCustomVariable(false); // Reset back to button view after adding
      setCustomVariable(''); // Clear the input after adding
    }
  };
  const handleAddCustomVariableToBeginMessage = () => {
    if (customVariable.trim() !== '') {
      handleAddVariable(customVariable);
      setAddingCustomVariable(false); // Reset back to button view after adding
      setCustomVariable(''); // Clear the input after adding
    }
  };
  const handleInputKeyPress = (event) => {
    // Prevents the default action of the event
    event.stopPropagation(); // Stops the event from propagating further
  };
  const {
    isOpen: isRetryPopoverOpen,
    onOpen: onRetryPopoverOpen,
    onClose: onRetryPopoverClose,
    setIsOpen: setIsRetryPopoverOpen,
  } = useDisclosure();
  const {
    isOpen: isDurationPopoverOpen,
    onOpen: onDurationPopoverOpen,
    onClose: onDurationPopoverClose,
    setIsOpen: setIsDurationPopoverOpen,
  } = useDisclosure();
  const { isPopoverOpen, setIsPopoverOpen } = useDisclosure();
  const handleCalendlyChecked = () => {
    calendlyChecked ? setCalendlyChecked(false) : setCalendlyChecked(true);
  };
  return (
    <div className="flex flex-col gap-[12px]">
      <div className="label-container">
        <h1 className="label">Give a name to your AI assistant*</h1>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="name"
        />
      </div>
      <div className="label-container">
        <div className="flex justify-between items-end">
          <h1 className="label">Enter Beginning Message*</h1>
          <div className="flex items-center gap-[16px]">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">Insert Variable</Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                {variables?.map((item, idx) => (
                  <DropdownMenuItem
                    key={idx}
                    onClick={() => handleAddVariable(item.variable)}
                  >
                    {item.title} - {item.variable}
                  </DropdownMenuItem>
                ))}
                {addingCustomVariable ? (
                  <div
                    className="relative px-[3px] flex flex-col items-end"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Input
                      className="py-1 h-8"
                      inputMode="none"
                      autoFocus
                      value={customVariable}
                      onChange={(e) => setCustomVariable(e.target.value)}
                      placeholder="Enter custom variable"
                      onKeyDown={handleInputKeyPress}
                      onKeyPress={(event) => {
                        event.stopPropagation();
                        if (event.key === 'Enter') {
                          handleAddCustomVariableToBeginMessage();
                        }
                      }}
                    />
                    <Button
                      size="xsm"
                      variant="link"
                      className="absolute text-[11.5px] p-1 top-[50%] translate-y-[-50%] right-2"
                      onClick={handleAddCustomVariableToBeginMessage}
                    >
                      {' '}
                      + Add
                    </Button>
                  </div>
                ) : (
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      setAddingCustomVariable(true);
                    }}
                    className="text-[13.5px] hover:bg-gray-50 p-1 pl-2 rounded-sm cursor-pointer"
                  >
                    Add Custom Variable +
                  </div>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
            {/* <Select value={agentId} onValueChange={(value) => setAgentId(value)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select an agent" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {agents?.map((item) => (
                  <SelectItem value={item.agent_id}>{item.name}</SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select> */}
          </div>
        </div>
        <Textarea
          text={beginMessage}
          handleChange={(e) => setBeginMessage(e.target.value)}
          maxChars="4000"
        />
      </div>
      <div className="flex flex-col mt-4 gap-[6px]">
        <h2 className="label">Select your assistant&apos;s voice</h2>
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
        <audio className="hidden" src={voice} id="audio" controls />
      </div>
      <div className="label-container mt-4">
        <div className="flex justify-between items-end">
          <h1 className="label">
            {' '}
            Provide instructions to your assistant; the more detail the better*
          </h1>
          <div className="flex items-center gap-[16px]">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">Insert Variable</Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="pb-2"
                aria-autocomplete="none"
                inputMode="text"
                autoFocus={false}
              >
                {variables?.map((item, idx) => (
                  <DropdownMenuItem
                    key={idx}
                    onClick={() => handleAddVariableToPrompt(item.variable)}
                  >
                    {item.title} - {item.variable}
                  </DropdownMenuItem>
                ))}
                {addingCustomVariable ? (
                  <div
                    className="relative px-[3px] flex flex-col items-end"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Input
                      className="py-1 h-8"
                      inputMode="none"
                      autoFocus
                      value={customVariable}
                      onChange={(e) => setCustomVariable(e.target.value)}
                      placeholder="Enter custom variable"
                      onKeyDown={handleInputKeyPress}
                      onKeyPress={(event) => {
                        event.stopPropagation();
                        if (event.key === 'Enter') handleAddCustomVariable();
                      }}
                    />
                    <Button
                      size="xsm"
                      variant="link"
                      className="absolute text-[11.5px] p-1 top-[50%] translate-y-[-50%] right-2"
                      onClick={handleAddCustomVariable}
                    >
                      {' '}
                      + Add
                    </Button>
                  </div>
                ) : (
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      setAddingCustomVariable(true);
                    }}
                    className="text-[13.5px] flex items-center hover:bg-gray-50 p-1 pl-2 rounded-sm cursor-pointer"
                  >
                    Add Custom Variable +
                  </div>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
            {/* <Select value={agentId} onValueChange={(value) => setAgentId(value)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select an agent" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {agents?.map((item) => (
                  <SelectItem value={item.agent_id}>{item.name}</SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select> */}
          </div>
        </div>
        <Textarea
          placeholder="Enter a prompt for the assistant"
          text={prompt}
          handleChange={(e) => setPrompt(e.target.value)}
          maxChars="4000"
        />
      </div>
      {zapier && (
        <div className="label-container">
          <div className="flex items-center gap-[4px]">
            <label className="label">Maximum retries</label>
            <PopoverHover
              className="max-w-[350px]"
              isOpen={isRetryPopoverOpen}
              onClose={onRetryPopoverClose}
              onOpen={onRetryPopoverOpen}
              setIsOpen={setIsRetryPopoverOpen}
              trigger={<QuestionIcon className="mb-[-3px]" />}
              value={
                <p className="text-[14px]">
                  The maximum number of attempts the assistant should make to
                  initiate a call.
                </p>
              }
            />
          </div>
          <Input
            min="1"
            placeholder=" The maximum number of attempts the assistant should make to initiate a call."
            value={maxRetries}
            onChange={(e) => setMaxRetries(e.target.value)}
            type="number"
          />
        </div>
      )}

      {zapier && (
        <div className="label-container">
          <div className="flex items-center gap-[4px]">
            <label className="label">Retry Duration</label>
            <PopoverHover
              className="max-w-[350px]"
              isOpen={isDurationPopoverOpen}
              onClose={onDurationPopoverClose}
              onOpen={onDurationPopoverOpen}
              setIsOpen={setIsDurationPopoverOpen}
              trigger={<QuestionIcon className="mb-[-3px]" />}
              value={
                <p className="text-[14px]">
                  The duration (in hours) after which assistant should retry a
                  call
                </p>
              }
            />
          </div>
          <Input
            min="1"
            placeholder="The duration (in hours) after which assistant should retry a call"
            value={retryDuration}
            onChange={(e) => setRetryDuration(e.target.value)}
            type="number"
          />
        </div>
      )}
      <div className="flex flex-col gap-[12px] mt-[8px]">
        <div className="flex justify-between items-end">
          <div className="flex items-center cursor-pointer gap-[6px]">
            <h3 className="label">Transfer the call live to a human</h3>
            <TooltipComp
              trigger={<Icon icon="fe:question" style={{ color: 'grey' }} />}
              value={<p>The call will be transfered to this number</p>}
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
              <div className="flex items-center gap-[6px] mb-[0px]">
                <h2 className="font-medium text-[13px] text-red-400">
                  Choose time range for no call transfer
                </h2>
                <div className="mb-[-4px]">
                  <PopoverHover
                    isOpen={isPopoverOpen}
                    setIsOpen={setIsPopoverOpen}
                    value={
                      <p className="text-[14px]">
                        This lets agent know when the call won&apos;t be
                        transferred to given phone number
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
        <div className="label-container">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-[6px]">
              <label className="label">Set Voicemail Message</label>
              <div className="mb-[-5px]">
                <PopoverHover
                  trigger={
                    <div>
                      <QuestionIcon />
                    </div>
                  }
                  value={
                    <p className="text-[13px]">
                      Set the voicemail text if the lead doesn&apos;t pick the
                      call up
                    </p>
                  }
                />
              </div>
            </div>
            <Switch
              onCheckedChange={() => setVoicemailChecked((prev) => !prev)}
            />
          </div>
          {voicemailChecked && (
            <Textarea
              placeholder="Set the voicemail message in case the lead doens't pickup the call"
              showLimit={false}
              value={voicemail}
              onChange={(e) => setVoicemail(e.target.value)}
            />
          )}
        </div>
        <div className="flex flex-col gap-[12px]">
          <div className="flex justify-between items-center">
            <div className="flex items-center cursor-pointer gap-[6px]">
              <h3 className="label">Schedule live apointments</h3>
              <TooltipComp
                trigger={<Icon icon="fe:question" style={{ color: 'grey' }} />}
                value={<p>Add Your Calendly availability schedule</p>}
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
      {/* <div className="flex justify-end items-center mt-[32px] gap-[18px]">
        <Button variant="outline" onClick={prevStep}>
          Back
        </Button>
        <Button
          disabled={beginMessage === '' || prompt === ''}
          onClick={nextStep}
        >
          Next
        </Button>
      </div> */}
      <TransferCallErrorModal />
    </div>
  );
};

export default AddPrompt;
