'use client';

import { useAuth, useSession, useUser } from '@clerk/nextjs';
import { createContext, useState, useEffect } from 'react';
import axios from 'axios';
import { HTTPService } from '@/utils/http';
import { baseUrl } from '@/utils/config';
import { redirect } from 'next/navigation';

export const AgentsContext = createContext({
  agents: null,
  user: null,
  setAgents: () => null,
  agentsLoading: false,
  setAgentsLoading: () => null,
});

export const AgentsContextProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [agents, setAgents] = useState([]);
  const [agentsLoading, setAgentsLoading] = useState(true);

  const { user, isLoading, isLoaded } = useUser();
  const { isSignedIn, isLoaded: isAuthLoaded } = useAuth();
  const { signOut } = useAuth();
  const { session } = useSession();

  const reloadUser = async () => {
    await user?.reload();
  };
  let retry = 5;
  const fetchAgents = async (user) => {
    try {
      const userData = await axios.get(
        `${baseUrl}/users/${user?.id}/user`,
        HTTPService.setHeaders({ user, session })
      );
      const agents = await axios.get(
        `${baseUrl}/users/${user?.id}/agents`,
        HTTPService.setHeaders({ user, session })
      );
      setCurrentUser(userData.data.user);
      setAgents(agents.data);
      setAgentsLoading(false);
    } catch (error) {
      if (retry > 0) {
        retry -= 1;
        fetchAgents(user);
        return;
      }
      console.log(error);
      error.response.status === 401 && signOut();
    }
  };
  useEffect(() => {
    if (session?.id && session?.status === 'active' && user?.id && isLoaded) {
      setTimeout(() => {
        if (agentsLoading === true) {
          fetchAgents(user);
        }
      }, 3000);
    }
  }, [user, session]);

  const value = {
    agents,
    setAgents,
    agentsLoading,
    setAgentsLoading,
    user,
    session,
    fetchAgents,
    isLoading,
    reloadUser,
    currentUser,
    setCurrentUser,
    isAuthLoaded,
    isSignedIn,
    signOut,
  };

  return (
    <AgentsContext.Provider value={value}>{children}</AgentsContext.Provider>
  );
};
