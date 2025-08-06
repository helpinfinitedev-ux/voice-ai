import { colorObj } from '@/app/(leads)/leads';

export const options = [
  {
    value: 'scheduled',
    label: 'Call Scheduled',
    color: colorObj.scheduled,
  },
  {
    value: 'completed',
    label: 'Call Completed',
    color: colorObj.completed,
  },
  {
    value: 'no-answer',
    label: 'Call Re-Scheduled',
    color: colorObj.completed,
  },
  {
    value: 'received',
    label: 'Call Received',
    color: colorObj.completed,
  },
];
