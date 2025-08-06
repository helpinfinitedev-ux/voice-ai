'use client';

import { useState, createContext, useEffect, useContext } from 'react';
import axios from 'axios';
import useDisclosure from '@/hooks/useDisclosure';
import { baseUrl } from '@/utils/config';
import { HTTPService } from '@/utils/http';
import {
  getStartEndTimeError,
  getTransferCallError,
  voices,
} from '@/app/(add-agent-form)/add-agent-form/_components';
import useTransferCallErrorModal from '@/hooks/modals/useTransferCallErrorModal';
import { FormatDate } from '@/utils/formatDates';
import { getTimeStampFromTimeInput } from './index';
import { AgentsContext } from '../AgentsContext/AgentsContext';

export const AddCampaignContext = createContext({
  agents: null,
  setAgents: () => null,
  transferTo: [],
  setTransferTo: () => null,
  setTransferToError: () => null,
  transferToError: null,
  phoneNumberChecked: false,
  setPhoneNumberChecked: () => null,
});
const initialFormData = {
  duration: null,
  start_time: null,
  end_time: null,
  campaign_start_date: null,
  days: [],
  timezone: '',
};
export const defaultTransferTo = [
  {
    name: '',
    phone: '',
    scenario: '',
  },
];
export const AddCampaignContextProvider = ({ children }) => {
  const [calendlyChecked, setCalendlyChecked] = useState(false);
  const [calendlyIntegrationLoading, setCalendlyIntegrationLoading] =
    useState(false);
  const [transferToError, setTransferToError] = useState(null);
  const [transferTo, setTransferTo] = useState([
    { name: '', phone: '', scenario: '' },
  ]);
  const [endTime, setEndTime] = useState('');
  const [startTime, setStartTime] = useState('');
  const [phoneNumberChecked, setPhoneNumberChecked] = useState(false);
  const {
    isOpen: isTransferCallErrorModalOpen,
    onOpen: onTransferCallErrorModalOpen,
    onClose: onTransferCallErrorModalClose,
  } = useTransferCallErrorModal();

  const [maxRetries, setMaxRetries] = useState(5);
  const [voicemailChecked, setVoicemailChecked] = useState(false);
  const [retryDuration, setRetryDuration] = useState(1);
  const [zapier, setZapier] = useState(false);
  const [voice, setSelectedVoice] = useState('');
  const [selectedButtons, setSelectedButtons] = useState(0);
  const { fetchAgents, user, session, isLoading } = useContext(AgentsContext);
  const [addCampaignLoading, setAddCampaignLoading] = useState(false);
  const [name, setName] = useState('');
  const [timezone, setTimezone] = useState('');
  const [agentId, setAgentId] = useState('');
  const [agents, setAgents] = useState();
  const [parsedData, setParsedData] = useState([]);
  const [agentsLoading, setAgentsLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [beginMessage, setBeginMessage] = useState('');
  const [prompt, setPrompt] = useState('');
  const [step, setStep] = useState(1);
  const [data, setData] = useState([]);
  const [variables, setVariables] = useState([]);
  const [selectedOptions, setSelectedOptions] = useState({});
  const [currentVariable, setCurrentVariable] = useState('');
  const [voicemail, setVoicemail] = useState('');
  const [days, setDays] = useState([]);
  const [formData, setFormData] = useState(initialFormData);
  const [calendlyScheduleLoading, setCalendlyScheduleLoading] = useState(false);
  const [requiredError, setRequiredError] = useState({
    duration: false,
    start_time: false,
    end_time: false,
    campaign_start_date: false,
    days: false,
    timezone,
  });

  const { isOpen, onClose, onOpen } = useDisclosure();

  const handleFormFieldChange = (e) => {
    let { value } = e.target;
    const { name } = e.target;

    if (name === 'duration') {
      value = +value;
    }
    setFormData({
      ...formData,
      [name]: value,
    });
    if (value) {
      setRequiredError({
        ...requiredError,
        [name]: false,
      });
    }
  };

  const handleCheckboxChange = (option) => {
    let daysArr = [];
    if (days.includes(option)) {
      daysArr = days.filter((item) => item !== option);
    } else {
      daysArr = [...days, option];
    }
    if (daysArr.length === 0) {
      setRequiredError({
        ...requiredError,
        days: true,
      });
    } else {
      setRequiredError({
        ...requiredError,
        days: false,
      });
    }
    setDays(daysArr);
  };

  const checkRequiredFields = () => {
    if (zapier) return false;
    const requiredErrorObj = {};
    let flag = false;
    if (!!timezone === false) {
      requiredError.timezone = false;
    } else {
      requiredError.timezone = true;
    }
    for (const key in formData) {
      if (!formData[key] || (key === 'days' && days.length === 0)) {
        flag = true;
        requiredErrorObj[key] = true;
      }
    }
    setRequiredError({ ...requiredError, ...requiredErrorObj });
    return flag;
  };

  const handleSubmit = async () => {
    if (checkRequiredFields()) {
      console.log('required field error', requiredError);
      return;
    }
    const start_time_value = zapier
      ? -1
      : FormatDate.combineDateTimeToTimestamp(
          formData.campaign_start_date,
          formData.start_time,
          formData.timezone,
        );
    const end_time_value = zapier
      ? -1
      : FormatDate.combineDateTimeToTimestamp(
          formData.campaign_start_date,
          formData.end_time,
          formData.timezone,
        );
    const transferToErrorVal = getTransferCallError(
      transferTo,
      startTime,
      endTime,
    );
    const startEndTimeValidError = getStartEndTimeError(
      start_time_value,
      end_time_value,
    );

    if (phoneNumberChecked && !!transferToErrorVal) {
      setTransferToError(transferToErrorVal);
      onTransferCallErrorModalOpen();
      return;
    }
    if (zapier === false && startEndTimeValidError) {
      console.log('startTimeValidError', startEndTimeValidError);
      setTransferToError(startEndTimeValidError);
      onTransferCallErrorModalOpen();
      return;
    }
    // const call_window = `${formData.start_time} - ${formData.end_time}`;
    formData.start_time = start_time_value;
    formData.end_time = end_time_value;
    console.log(
      'Timestamp CONTEXT timezone\n',
      FormatDate.combineDateTimeToTimestamp(
        formData.campaign_start_date,
        formData.end_time,
        formData.timezone,
      ),
    );
    const body = {
      user_id: user?.id,
      agent_name: name,
      leads: zapier ? [] : users,
      begin_message_template: beginMessage.trim(),
      prompt,
      ...formData,
      duration: zapier ? -1 : formData.duration,
      days,
      non_transfer_timeline: `${startTime} - ${endTime}`,
      transfer_events: phoneNumberChecked
        ? transferTo.map((item) => ({
            name: item.name,
            description: item.scenario,
            phone_number: item.phone,
          }))
        : [],

      voice_id: voices[selectedButtons].id,
      max_retries: maxRetries,
      retry_duration: retryDuration,
      voicemail_message: voicemail,
    };
    console.log(body);
    try {
      setAddCampaignLoading(true);
      let schedule = '';
      if (calendlyChecked) {
        schedule = await handleCalendlySchedule();
      }
      const res = await axios.post(
        `${baseUrl}/users/${user?.id}/campaigns`,
        { ...body, availability_schedule: schedule },
        HTTPService.setHeaders({ user, session }),
      );
      // const res = { data: { phone_number: '12354252' } };

      return res.data;
    } catch (error) {
      console.log(error);
    } finally {
      setAddCampaignLoading(false);
      fetchAgents(user);
    }
  };

  const [file, setFile] = useState('');
  // commet
  const nextStep = () => {
    setStep((prev) => prev + 1);
  };
  const prevStep = () => {
    setStep((prev) => prev - 1);
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
        HTTPService.setHeaders({ user, session }),
      );
      return res.data.schedule.trim();
    } catch (error) {
      console.log(error);
    } finally {
      setCalendlyScheduleLoading(false);
    }
  };
  const clearData = () => {
    setFile(null);
    setPrompt('');
    setName('');
    setBeginMessage('');
    setFormData(initialFormData);
    setZapier(false);
    setVoicemailChecked(false);
    setCalendlyChecked(false);
    setTransferTo([
      {
        name: '',
        phone: '',
        scenario: '',
      },
    ]);
    setPhoneNumberChecked(false);

    setStep(1);
  };
  console.log('formData', formData);
  const value = {
    agents,
    setAgents,
    agentId,
    setAgentId,
    file,
    setFile,
    user,
    isLoading,
    parsedData,
    setParsedData,
    agentsLoading,
    setAgentsLoading,
    users,
    setUsers,
    beginMessage,
    setBeginMessage,
    prompt,
    setPrompt,
    step,
    setStep,
    data,
    setData,
    variables,
    setVariables,
    selectedOptions,
    setSelectedOptions,
    requiredError,
    setRequiredError,
    currentVariable,
    setCurrentVariable,
    setAddCampaignLoading,
    nextStep,
    prevStep,
    handleSubmit,
    handleCheckboxChange,
    handleFormFieldChange,
    days,
    setDays,
    addCampaignLoading,
    name,
    setName,
    timezone,
    setTimezone,
    formData,
    setFormData,
    zapier,
    setZapier,
    clearData,
    selectedButtons,
    setSelectedButtons,
    voice,
    setSelectedVoice,
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
    voicemail,
    setVoicemail,
    calendlyChecked,
    setCalendlyChecked,
    calendlyIntegrationLoading,
    setCalendlyIntegrationLoading,
    voicemailChecked,
    setVoicemailChecked,
  };

  useEffect(() => {
    if (user) {
      fetchAgents(user);
    }
  }, [user]);

  return (
    <AddCampaignContext.Provider value={value}>
      {children}
    </AddCampaignContext.Provider>
  );
};
