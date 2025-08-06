export const Validations = {
  validatePhoneNumber: (phoneNumber) => {
    const cleaned = phoneNumber?.replace(/\D/g, '');

    // Check if the cleaned number is a valid format
    // Allowing for country codes of 1 to 3 digits followed by any number of digits
    return /^(\+\d{1,3})?\d{10,}$/.test(cleaned);
  },
};
