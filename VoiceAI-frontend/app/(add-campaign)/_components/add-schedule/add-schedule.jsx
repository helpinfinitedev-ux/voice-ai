'use client';

import React, { useContext, useEffect, useRef, useState } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { AddCampaignContext } from '@/context/AddCampaignContext/AddCampaignContext';

import { FormatDate } from '@/utils/formatDates';
import 'react-time-picker/dist/TimePicker.css';
import 'react-clock/dist/Clock.css';
import useDisclosure from '@/hooks/useDisclosure';
import { Input } from '@/components/ui/input';
import QuestionIcon from '@/assets/QuestionIcon';
import PopoverHover from '@/components/custom/popover-hover';
import Textarea from '@/components/textarea';
import { weekDays } from './index';
import TimeZones from './timezones';
import TransferCallErrorModal from '../transfer-call-error-modal/transfer-call-error-modal';

const AddSchedule = () => {
  const endTimeRef = useRef(null);
  const [timezone, setTimezone] = useState('');
  const {
    days,
    handleCheckboxChange,
    handleFormFieldChange,
    maxRetries,
    setMaxRetries,
    retryDuration,
    setRetryDuration,
    requiredError,
    formData,
    zapier,
  } = useContext(AddCampaignContext);
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
  if (formData.start_time && formData.campaign_start_date && timezone !== '') {
    console.log(
      'Timestamp timezone\n',
      FormatDate.combineDateTimeToTimestamp(
        formData.campaign_start_date,
        formData.start_time,
        timezone,
      ),
    );
  }

  return (
    <div className="flex">
      <div className="w-full">
        <div className="w-full flex flex-col gap-[24px]">
          <div className="font-semibold text-gray-600 text-[24px]">
            Add Schedule
          </div>

          <div className="flex flex-col gap-[12px]">
            <h1 className="label">Send These Days*</h1>
            <div className="flex flex-wrap ml-[4px] gap-[12px] items-center">
              {weekDays.map((item, idx) => (
                <div className="flex gap-[6px] text-gray-700 font-medium text-sm items-center">
                  <Checkbox
                    checked={days.includes(idx + 1)}
                    onCheckedChange={() => handleCheckboxChange(idx + 1)}
                  />
                  <p>{item}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="label-container">
            <h1 className="label">
              {' '}
              Select timezone that your assistant operates on*
            </h1>
            <TimeZones
              value={formData.timezone}
              handleFormFieldChange={handleFormFieldChange}
              timezone={timezone}
              setTimezone={setTimezone}
            />
          </div>
          <div className="label-container">
            <div>
              <p className="label">
                Define the time window for assistant to call leads
              </p>
            </div>
            <div className="flex justify-between gap-[12px] items-center">
              <div className="w-[100%] flex items-center gap-[18px]">
                <div className="w-1/2 label-container">
                  <h1 className="label">From*</h1>
                  <Input
                    value={formData.start_time || ''}
                    onChange={handleFormFieldChange}
                    name="start_time"
                    type="time"
                    className="px-4 py-[6px] w-full outline-none border-neutral-300 border-[1px] rounded-md"
                  />
                </div>
                <div className="w-1/2 label-container">
                  <h1 className="label">To*</h1>
                  <Input
                    ref={endTimeRef}
                    min={formData.start_time}
                    disabled={!formData.start_time}
                    name="end_time"
                    value={formData.end_time || ''}
                    onChange={handleFormFieldChange}
                    type="time"
                    className="px-4 py-2 w-full outline-none border-neutral-300 border-[1px] rounded-md"
                  />
                </div>
              </div>
            </div>
          </div>
          <div className="w-[100%] label-container">
            <h1 className="label">Average Call Duration*</h1>
            <input
              min="1"
              value={formData.duration}
              onChange={handleFormFieldChange}
              name="duration"
              placeholder="Minutes"
              type="number"
              className="px-4 py-[6px] w-full outline-none border-neutral-300 border-[1px] rounded-md"
            />
          </div>
          <div className="label-container">
            <h1 className="label">Select campaign start date*</h1>
            <input
              min={new Date().toISOString().split('T')[0]}
              value={formData.campaign_start_date}
              onChange={handleFormFieldChange}
              name="campaign_start_date"
              type="date"
              className="px-4 py-2 w-full outline-none border-neutral-300 border-[1px] rounded-md"
            />
          </div>

          {!zapier && (
            <div className="label-container mt-[-8px]">
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
                      The maximum number of attempts the assistant should make
                      to initiate a call.
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
          {!zapier && (
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
                      The duration (in hours) after which assistant should retry
                      a call
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
          <div className="flex justify-between items-center">
            <div className="flex flex-col gap-[4px] text-red-500 text-[14px] font-medium">
              {requiredError.start_time && <p>Start Time is required </p>}
              {requiredError.campaign_start_date && (
                <p>Start Date is required </p>
              )}
              {requiredError.duration && <p>Duration is required </p>}
              {requiredError.days && (
                <p>Select at least one day in the week </p>
              )}
              {requiredError.timezone && <p>Please select timezone first</p>}
              {requiredError.end_time && <p>End Time is required </p>}
            </div>
            {/* <div className="flex gap-[18px] justify-end items-start">
              <Button variant="outline" onClick={prevStep}>
                Back
              </Button>
            </div> */}
          </div>
        </div>
      </div>
      <TransferCallErrorModal />
    </div>
  );
};

export default AddSchedule;
