import { zapierVariables } from '@/app/(add-campaign)/add-campaign';

export const excludedKeys = [
  'status',
  'retries',
  'scheduled_at',
  'called_at',
  'status',
  'phone_number',
];
export const excludeKeysForEdittingAssistant = [
  'status',
  'retries',
  'scheduled_at',
  'called_at',
  'status',
];
export const capitalizeWords = (str) =>
  str
    .replace(/_/g, ' ')
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

export const getEditAgentVariables = (agent) => {
  if (agent && agent.leads) {
    const variableObj = [];
    const { type } = agent;

    if (type === 'outbound-csv') {
      for (const key in agent.leads[0]) {
        if (!excludeKeysForEdittingAssistant.includes(key)) {
          variableObj.push({
            title: capitalizeWords(key),
            variable: key,
          });
        }
      }
      return variableObj;
    }
    // eslint-disable-next-line guard-for-in
    for (const key in zapierVariables) {
      variableObj.push({ title: key, variable: zapierVariables[key] });
    }
    return variableObj;
  }
};
export function extractVariablesToObject(beginMessage, prompt) {
  const pattern = /\$[a-z_]+/g;

  const variablesInBegin = beginMessage?.match(pattern) || [];
  const variablesInPrompt = prompt?.match(pattern) || [];

  const combinedVariables = variablesInBegin.concat(variablesInPrompt);

  const variableObject = {};
  combinedVariables.forEach((variable) => {
    const key = variable?.slice(1);
    variableObject[key] = '';
  });

  return variableObject;
}
