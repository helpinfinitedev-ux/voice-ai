import moment from 'moment-timezone';

export const FormatDate = {
  getDateInDDMMYYYY: (value) => moment(value).format('DD MMM, YYYY'),
  getTimeInAMPM: (timestamp) => {
    const momentObj = moment(timestamp);
    const formattedTime = momentObj.format('h:mm A');
    return formattedTime;
  },
  getUTCDateFromTimestamp: (timestamp) => {
    const date = new Date(timestamp * 1000);
    const utcYear = date.getUTCFullYear();
    const utcMonth = String(date.getUTCMonth() + 1).padStart(2, '0'); // Months are zero-indexed, so add 1
    const utcDay = String(date.getUTCDate()).padStart(2, '0');
    return `${utcYear}-${utcMonth}-${utcDay}`;
  },
  getTimeStringFromTimestamp: (timestamp) => {
    const date = new Date(timestamp * 1000);
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  },
  getDaysLeft: (timestamp) =>
    Math.round((timestamp - Date.now()) / (24 * 60 * 60 * 1000)),
  combineDateTimeToTimestamp: (dateString, timeString, timezone) => {
    // Combine date and time into a single string
    const dateTimeString = `${dateString} ${timeString}`;

    const format = 'YYYY-MM-DD HH:mm:ss';

    // Create a moment object in the specified timezone
    const momentInTimezone = moment.tz(dateTimeString, format, timezone);

    // Get the Unix timestamp in seconds
    const timestamp = momentInTimezone.unix();

    console.log('parsed timestamp', timestamp);

    return timestamp;
  },
};

export const getDateFromTimeStamp = (value) => new Date(value);
export const getTimeDuration = (milliseconds) => {
  let totalSeconds = Math.floor(milliseconds / 1000);

  const hours = Math.floor(totalSeconds / 3600);
  totalSeconds %= 3600;

  const minutes = Math.floor(totalSeconds / 60);

  const seconds = totalSeconds % 60;

  let duration = '';

  if (hours > 0) {
    duration += `${hours}h `;
  }

  if (minutes > 0 || hours > 0) {
    duration += `${minutes}m `;
  }

  duration += `${seconds}s`;

  return duration.trim();
};
export function getTimeString(unixTimestamp) {
  const date = new Date(unixTimestamp * 1000); // Multiply by 1000 to convert seconds to milliseconds

  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');

  const timeString = `${hours}:${minutes}`;

  return timeString;
}
