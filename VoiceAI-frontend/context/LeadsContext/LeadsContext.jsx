'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { AgentsContext } from '@/context/AgentsContext/AgentsContext';
import { baseUrl } from '@/utils/config';
import axios from 'axios';
import { getBg } from '@/app/(inbox)/inbox/_components/inbox-comp';
import { HTTPService } from '@/utils/http';

export const LeadsContext = createContext({
  allLeads: null,
  setAllLeads: () => null,
  allLeadsLoading: true,
  setAllLeadsLoading: () => null,
  unread: 0,
  setUnread: () => null,
});

export const LeadsContextProvider = ({ children }) => {
  const [tabValue, setTabValue] = useState('inbox');
  const [unread, setUnread] = useState(0);
  const [allLeads, setAllLeads] = useState([]);
  const [allLeadsLoading, setAllLeadsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [selectValue, setSelectedValue] = useState(10);

  const handleNext = () => {
    setPage(page + 1);
  };
  const handlePrev = () => {
    setPage(page - 1);
  };
  const { agentsLoading, agents, session, fetchAgents, user, isLoading } =
    useContext(AgentsContext);

  const fetchCalls = async (agent) => {
    try {
      const res = await axios.get(
        `${baseUrl}/agents/${agent.agent_id}/calls`,
        HTTPService.setHeaders({ user, session }),
      );
      return res.data;
    } catch (error) {
      console.log(error);
    }
  };

  const fetchCampaign = async (agent) => {
    try {
      const res = await axios.get(
        `${baseUrl}/users/${user?.id}/campaigns/${agent.agent_id}`,
        HTTPService.setHeaders({ user, session }),
      );
      return res.data;
    } catch (error) {
      console.log(error);
    }
  };

  const changeCallStatusById = (call, status) => {
    const idx = allLeads.findIndex((ele) => ele.call_id === call.call_id);
    if (idx === -1) return;
    allLeads[idx].read = status;
    setAllLeads([...allLeads]);
  };
  const uniqueById = (array) => {
    const unique = array.reduce((acc, item) => {
      acc[item.id] = item; // Assign each item to a property with its id as the key
      return acc;
    }, {});
    return Object.values(unique); // Convert the object back to an array
  };

  useEffect(() => {
    if (agentsLoading === false && agents.length > 0) {
      setAllLeadsLoading(true);
      Promise.all(
        agents.map(async (item, idx) => {
          console.log('index', idx, item.name);
          if (!!item.active === false) return [];
          if (item.type === 'inbound') {
            const res = await fetchCalls(item);

            return res.map((call) => ({
              agent_id: item.agent_id,
              dateAdded: call.start_timestamp,
              ...call,
              agent_name: item.name,
              agent_phone_number: item.phone_number,
              bg_color: getBg(idx),
              type: item.type,
              status: 'received',
            }));
          }

          const res = await fetchCampaign(item);
          const calls = await fetchCalls(item);
          const campaignsLeads = res.map((campaign) => campaign.leads);

          return res
            .map((lead) =>
              lead.leads
                .filter(
                  (filterLeadItem) => filterLeadItem.status !== 'completed',
                )
                .map((leadItem) => ({
                  agent_id: item.agent_id,
                  dateAdded: lead.created_at,
                  ...leadItem,
                  agent_name: item.name,
                  agent_phone_number: item.phone_number,
                  bg_color: getBg(idx),
                  type: item.type,
                })),
            )
            .flat()
            .concat(
              calls.map((call) => ({
                agent_id: item.agent_id,
                dateAdded: call.start_timestamp,
                ...call,
                status: 'completed',
                called_at: call.start_timestamp,
                from_number: null,
                phone_number: call.to_number,
                agent_name: item.name,
                agent_phone_number: item.phone_number,
                bg_color: getBg(idx),
                type: item.type,
              })),
            );
        }),
      )
        .then((conversationsArrays) => {
          const allLeadsArray = conversationsArrays.flat();
          // console.log(allLeadsArray);
          const groupedLeads = conversationsArrays
            .flat()
            .reduce((acc, lead) => {
              const key = lead.from_number || lead.phone_number;
              if (!acc[key]) {
                acc[key] = [];
              }
              acc[key].push(lead);
              return acc;
            }, {});

          const groupedLeadsArray = Object.entries(groupedLeads);
          // console.log(groupedLeadsArray);
          const mappedLeadsArray = groupedLeadsArray.map(
            ([phoneNumber, logs]) => ({
              phone_number: phoneNumber,
              logs,

              type: logs[0].type,
              agents: uniqueById(
                logs.map((log) => ({ name: log.agent_name, id: log.agent_id })),
              ).map((agent) => {
                console.log('index', agent);
                const agentLogs = logs.find(
                  (item) => item.agent_id === agent.id,
                );
                return {
                  agent_name: agent.name,
                  bg_color: agentLogs.bg_color,
                  agent_phone_number: agentLogs.agent_phone_number,
                };
              }),
            }),
          );
          console.log(mappedLeadsArray);

          setAllLeads(mappedLeadsArray);
          setAllLeadsLoading(false);
        })
        .catch((error) => {
          console.error('Error fetching conversations:', error);
          setAllLeadsLoading(false);
        });
    } else if (agentsLoading === false) {
      setAllLeadsLoading(false);
    }
  }, [agents]);
  useEffect(() => {
    if (allLeadsLoading === false && allLeads?.length > 0) {
      const unreadCount = allLeads?.reduce((count, conversation) => {
        if (conversation.read === false) {
          return count + 1;
        }

        return count;
      }, 0);
      setUnread(unreadCount);
    }
  }, [allLeads, allLeadsLoading]);
  console.log(allLeads);
  // useEffect(() => {
  //   if (tabValue === 'unread') {
  //     setAllLeads(
  //       allLeads.filter((item) => item.read === false)
  //     );
  //   } else {
  //     setAllLeads(allLeads.filter(item));
  //   }
  // }, [tabValue]);
  const value = {
    allLeads,
    setAllLeads,
    allLeadsLoading,
    setAllLeadsLoading,
    changeCallStatusById,
    unread,
    setUnread,
    tabValue,
    setTabValue,
    page,
    setPage,
    handleNext,
    handlePrev,
    setSelectedValue,
    selectValue,
  };

  return (
    <LeadsContext.Provider value={value}>{children}</LeadsContext.Provider>
  );
};
