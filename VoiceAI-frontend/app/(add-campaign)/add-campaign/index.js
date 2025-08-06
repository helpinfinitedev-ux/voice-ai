export const selectOptions = [
  {
    title: 'First Name',
  },
  {
    title: 'Last Name',
  },
  {
    title: 'Phone Number',
  },
  {
    title: 'Company',
  },
  {
    title: 'Personalization',
  },
  {
    title: 'Website',
  },
  {
    title: 'Location',
  },
  {
    title: 'Custom Field',
  },
  {
    title: 'Ignore Field',
  },
  {
    title: 'Email',
  },
];

export const phoneCombinations = ['phone_number', 'phone number'];
export const getOptionsValidation = (selectedOptions) => {
  const optionValues = new Set();
  // eslint-disable-next-line guard-for-in
  for (const key in selectedOptions) {
    if (optionValues.has(selectedOptions[key])) {
      return `${selectedOptions[key]} can't occur in more than one field`;
    }
    if (key && selectedOptions[key]) {
      optionValues.add(selectedOptions[key]);
    }
  }
  return null;
};

export const getVariable = (value) => value.toLowerCase().split(' ').join('_');

export const getUsers = (selectedOptions, data) => {
  const variable = 1;
  return data.map((item) => {
    const obj = { retries: 0 };
    for (const key in selectedOptions) {
      if (selectedOptions[key] !== '') {
        obj[getVariable(selectedOptions[key])] = item[key];
      }
    }
    return obj;
  });
};

export const zapierVariables = {
  'First Name': 'first_name',
  'Last Name': 'last_name',
  'Phone Number': 'phone_number',
  address: 'address',
  home: 'home',
};
