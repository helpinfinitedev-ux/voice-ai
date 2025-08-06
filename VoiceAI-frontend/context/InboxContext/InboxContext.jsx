'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { AgentsContext } from '@/context/AgentsContext/AgentsContext';
import { baseUrl } from '@/utils/config';
import axios from 'axios';
import { getBg } from '@/app/(inbox)/inbox/_components/inbox-comp';
import { HTTPService } from '@/utils/http';
import { usePathname } from 'next/navigation';

export const InboxContext = createContext({
  allConversations: null,
  setAllConversations: () => null,
  allConversationsLoading: true,
  setAllConversationsLoading: () => null,
  unread: 0,
  setUnread: () => null,
});

export const InboxContextProvider = ({ children }) => {
  const [value, setValue] = useState(0);
  const [tabValue, setTabValue] = useState('inbox');
  const [unread, setUnread] = useState(0);
  const [allConversations, setAllConversations] = useState([]);
  const [allConversationsLoading, setAllConversationsLoading] = useState(true);
  const {
    agentsLoading,
    reloadUser,
    agents,
    session,
    fetchAgents,
    user,
    isLoading,
    currentUser,
    signOut,
    isSignedIn,
  } = useContext(AgentsContext);
  const pathname = usePathname();
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

  const changeCallStatusById = (call, status) => {
    const idx = allConversations.findIndex(
      (ele) => ele.call_id === call.call_id,
    );
    if (idx === -1) return;
    allConversations[idx].read = status;
    setAllConversations([...allConversations]);
  };

  const getCallsByAgentId = (agent, allCoversationsRes) =>
    allCoversationsRes?.filter((item) => item.agent_id === agent.agent_id);

  const organizeAllConversationsByAgent = (allConversationsRes) => {
    Promise.all(
      agents.map(async (item, idx) => {
        const res = getCallsByAgentId(item, allConversationsRes);
        return res.map((call) => ({
          ...call,
          from_number: call.to_number || call.from_number,
          type: item.type,
          agent_name: item.name,
          phone_number: item.phone_number,
          bg_color: getBg(idx),
        })); // Return the result of each fetchCalls() to Promise.all
      }),
    )
      .then((conversationsArrays) => {
        const allConversationsArray = conversationsArrays.flat();
        setAllConversations(allConversationsArray);
        setAllConversationsLoading(false);
      })
      .catch((error) => {
        console.error('Error fetching conversations:', error);
        setAllConversationsLoading(false);
      });
  };

  const fetchAllConversations = async () => {
    try {
      const allConversationsRes = await axios.get(
        `${baseUrl}/users/${user?.id}/conversations`,
        HTTPService.setHeaders({ user, session }),
      );

      console.log(allConversationsRes.data, 'allConversationsRes');
      organizeAllConversationsByAgent(allConversationsRes.data);
    } catch (error) {
      setAllConversationsLoading(false);
      error?.response?.status === 401 && signOut();
    }
  };
  useEffect(() => {
    if (
      agents &&
      user?.id &&
      session?.id &&
      session?.status === 'active' &&
      isSignedIn &&
      agentsLoading === false
    ) {
      fetchAllConversations();
    }
  }, [agents, user, pathname]);
  useEffect(() => {
    if (allConversationsLoading === false && allConversations?.length > 0) {
      const unreadCount = allConversations?.reduce((count, conversation) => {
        if (conversation.read === false) {
          return count + 1;
        }

        return count;
      }, 0);
      setUnread(unreadCount);
    }
  }, [allConversations, allConversationsLoading]);
  useEffect(() => {
    if (user && allConversationsLoading === false) {
      // const existingPlan = user?.publicMetadata?.plan;
      // const existingConversations = user?.publicMetadata?.plan?.conversations;
      const allConversationsValue = currentUser?.plan?.totalConversations;
      const remainingConversations = 50 - allConversationsValue;
      const conversationValue = Math.floor(
        ((allConversationsValue - currentUser?.plan?.conversations) /
          currentUser?.plan.totalConversations) *
          100,
      );
      setValue(conversationValue);
      //   if (remainingConversations === existingConversations) {
      //     setValue(user?.publicMetadata?.plan?.conversations * 2);
      //   } else {
      //     axios
      //       .post('/api/updateUserPlan', {
      //         user,
      //         plan: {
      //           ...existingPlan,
      //           conversations:
      //             remainingConversations < 0 ? 0 : remainingConversations,
      //         },
      //       })
      //       .then(() => {
      //         reloadUser().then(() =>
      //           setValue(
      //             user?.publicMetadata.plan?.conversations * 2 < 0
      //               ? 0
      //               : user?.publicMetadata.plan?.conversations
      //           )
      //         );
      //       });
      //   }
    }
    //  else {
    //   setValue(
    //     user?.publicMetadata.plan?.conversations * 2 < 0
    //       ? 0
    //       : user?.publicMetadata.plan?.conversations
    //   );
    // }
  }, [user, allConversations, allConversationsLoading]);

  // useEffect(() => {
  //   if (tabValue === 'unread') {
  //     setAllConversations(
  //       allConversations.filter((item) => item.read === false)
  //     );
  //   } else {
  //     setAllConversations(allConversations.filter(item));
  //   }
  // }, [tabValue]);

  const valueObj = {
    allConversations,
    setAllConversations,
    allConversationsLoading,
    setAllConversationsLoading,
    changeCallStatusById,
    unread,
    setUnread,
    tabValue,
    setTabValue,
    fetchAllConversations,
    setValue,
    value,
  };

  return (
    <InboxContext.Provider value={valueObj}>{children}</InboxContext.Provider>
  );
};
