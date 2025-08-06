export const weekDays = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];
export function getTimeStampFromTimeInput(timeInput) {
  const [hours, minutes] = timeInput.split(':').map(Number);

  const date = new Date();
  date.setHours(hours);
  date.setMinutes(minutes);

  return date.getTime();
}
