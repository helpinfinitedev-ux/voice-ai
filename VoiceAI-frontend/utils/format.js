export const getFormattedString = (inputString) =>
  inputString?.charAt(0).toUpperCase() + inputString?.slice(1);

export const formatPhone = (phone) =>
  `${phone?.substring(0, 2)} ` +
  `(${phone?.substring(2, 5)}) ${phone?.substring(5, 8)} ${phone?.substring(
    8
  )}`;

export function formatPhoneNumberWithCountryCode(phoneNumber) {
  const cleaned = `${phoneNumber}`.replace(/\D/g, '');

  // Extracting country code
  let countryCode = '';
  if (cleaned.length > 10) {
    countryCode = cleaned.substring(0, cleaned.length - 10);
  }

  // Formatting the remaining number
  const remainingNumber = cleaned.slice(-10);
  const match = remainingNumber.match(/^(\d{3})(\d{3})(\d{4})$/);
  if (match) {
    return `+${countryCode} (${match[1]}) ${match[2]} ${match[3]}`;
  }
  return phoneNumber;
}

export const FormatSring = {
  capitalizeFirstLetter: (inputString) =>
    inputString?.charAt(0).toUpperCase() + inputString?.slice(1),
};
