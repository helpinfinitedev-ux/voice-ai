export const getErrorMessage = (transferTo) => {
  switch (transferTo) {
    case 'duplicate-name':
      return 'Scenario names cannot be duplicate';
    case 'invalid-phone':
      return 'Please enter a valid phone number';
    case 'empty-name':
      return 'Scenario name is required';
    case 'no-start-time':
      return 'Start time for no call transfer is required';
    case 'no-end-time':
      return 'End time for no call transfer is required';
    case 'Start time cannot be greater than end time':
      return 'Start time cannot be greater than end time';
    default:
      return 'Please fill the field';
  }
};
