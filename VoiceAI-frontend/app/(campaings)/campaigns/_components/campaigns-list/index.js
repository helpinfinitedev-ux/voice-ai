export const getAgentName = (agents, id) =>
  agents?.find((item) => item.agent_id === id).name;
