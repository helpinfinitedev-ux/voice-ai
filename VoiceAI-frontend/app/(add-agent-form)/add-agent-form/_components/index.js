import { Validations } from '@/utils/validations';

export const buttons = [
  {
    title: 'Receptionnist',
    value: 'receptionist',
  },
  {
    title: 'Cold Calling',
    value: 'cold calling',
  },
];

export const toneButtons = [
  {
    value: 'Light',
  },
  {
    value: 'Dark',
  },
  {
    value: 'Modern',
  },
  {
    value: 'Artsy',
  },
  {
    value: 'Techy',
  },
  {
    value: 'Young',
  },
  {
    value: 'Corporate',
  },
  {
    value: 'Formal',
  },
  {
    value: 'Elegant',
  },
  {
    value: 'Hand-Drawn',
  },
];

export const voices = [
  {
    path: '/adrian.mp3',
    name: 'Adrian',
    id: '11labs-Adrian',
  },
  {
    path: '/alloy.wav',
    name: 'Alloy',
    id: 'openai-Alloy',
  },
  {
    path: '/amritanshu.mp3',
    name: 'Amritanshu',
    id: '11labs-Amritanshu',
  },
  {
    path: '/amy.mp3',
    name: 'Amy',
    id: '11labs-Amy',
  },
  {
    path: '/andrew.mp3',
    name: 'Andrew',
    id: '11labs-Andrew',
  },
];

export const getTransferCallError = (
  transferTo,
  startTime,
  endTime,
  start_time,
  end_time,
) => {
  const seenNames = new Set();
  for (const element of transferTo) {
    if (element.name === '') {
      return 'empty-name';
    }
    if (seenNames.has(element.name)) {
      return 'duplicate-name';
    }
    seenNames.add(element.name);
    if (!Validations.validatePhoneNumber(element.phone)) {
      return 'invalid-phone';
    }
  }
  if (!!startTime === false) return 'no-start-time';
  if (!!endTime === false) return 'no-end-time';

  return false;
};
export const getStartEndTimeError = (start_time, end_time) => {
  if (start_time && end_time && start_time >= end_time) {
    return 'Start time cannot be greater than end time';
  }
  return null;
};
