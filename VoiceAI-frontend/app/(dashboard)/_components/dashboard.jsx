'use client';

import React, { useContext, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Modal from '@/components/modal';
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from '@/components/ui/popover';
import axios from 'axios';
import { RetellWebClient } from 'retell-client-js-sdk';
import { Icon } from '@iconify/react';
import Loader from '@/components/loader';
import { AgentsContext } from '@/context/AgentsContext/AgentsContext';
import useDisclosure from '@/hooks/useDisclosure';
import AddAgentForm from '@/app/(add-agent-form)/add-agent-form/_components/add-agent-form';
import AddCampaign from '@/app/(add-campaign)/add-campaign/add-campaign';
import { baseUrl } from '@/utils/config';
import { HTTPService } from '@/utils/http';
import Tag from '@/components/custom/tag';
import AgentIcon from '@/components/custom/agent-icon';
import { AddCampaignContext } from '@/context/AddCampaignContext/AddCampaignContext';
import { redirect } from 'next/navigation';
import useCallModal from '@/hooks/useCallModal';
import { toast } from 'sonner';
import { FormatDate } from '@/utils/formatDates';
import { EditCampaignContext } from '@/context/EditCampaignContext/EditCampaignContext';
import CongratsModal from './congrats-modal/congrats-modal';
import NoAgents from './no-agents';
import ConfirmationModal from './confimation-modal/confirmation-modal';
import AgentCard from './agent-card/agent-card';
import EditCongratsModal from './edit-congrats-modal/edit-congrats-modal';
import EditConvoModal from './edit-convo-modal/edit-convo-modal';
import EditCampaignConvoModal from './edit-campaign-convo-modal/edit-campaign-convo-modal';
import CallModal from './call-modal/call-modal';
import ZapierTestModal from './zapier-test-modal/zapier-test-modal';

const webClient = new RetellWebClient();
const Dashboard = () => {
  const { editCampaignModalLoading } = useContext(EditCampaignContext);
  const [currentCallAgent, setCurrentCallAgent] = useState(null);
  const [tabValue, setTabValue] = useState('editAssistant');
  const [campaignTabValue, setCampaignTabValue] = useState(
    'editOutboundAssistant',
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const {
    isOpen: isOutboundModalOpen,
    onOpen: onOutboundModalOpen,
    onClose: onOutboundModalClose,
  } = useDisclosure();
  const [agentCreated, setAgentCreated] = useState(false);
  const {
    isOpen: isZapierTestModalOpen,
    onOpen: onZapierTestModalOpen,
    onClose: onZapierTestModalClose,
  } = useDisclosure();
  const {
    isOpen: isEditModalOpen,
    onOpen: onEditModalOpen,
    onClose: onEditModalClose,
  } = useDisclosure();
  const {
    isOpen: isCongratsModalOpen,
    onOpen: onCongratsModalOpen,
    onClose: onCongratsModalClose,
  } = useDisclosure();
  const {
    isOpen: isEditCongratsModalOpen,
    onOpen: onEditCongratsModalOpen,
    onClose: onEditCongratsModalClose,
  } = useDisclosure();
  const {
    isOpen: isEditCampaignModalOpen,
    onOpen: onEditCampaignModalOpen,
    onClose: onEditCampaignModalClose,
  } = useDisclosure();
  const {
    isOpen: isCallModalOpen,
    onOpen: onCallModalOpen,
    onClose: onCallModalClose,
  } = useCallModal();
  const [updatedAgent, setUpdatedAgent] = useState(null);
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [isOpen, setIsOpen] = useState(null);
  const [currentAgent, setCurrentAgent] = useState(null);
  const [createdAgent, setCreatedAgent] = useState(null);
  const [isCalling, setIsCalling] = useState(false);
  const {
    agentsLoading,
    agents,
    fetchAgents,
    isAuthLoaded,
    isSignedIn,
    currentUser,
    session,
    user,
    isLoading,
  } = useContext(AgentsContext);
  const { clearData, setSelectedButtons, setSelectedVoice } =
    useContext(AddCampaignContext);
  const [agentDeleteLoading, setAgentDeleteLoading] = useState(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [name, setName] = useState('');
  const [confirmDeleteText, setConfirmDeleteText] = useState('');
  const onModalOpen = () => setIsModalOpen(true);
  const onModalClose = () => setIsModalOpen(false);
  const onDelete = async (agent) => {
    setAgentDeleteLoading(agent.agent_id);
    const {
      agent_id,
      name,
      prompt,
      begin_message,
      non_transfer_timeline,
      transfer_to,
      timezone,
      availability_schedule,
    } = agent;
    const requestBody = {
      active: !!agent?.active === false,
    };
    try {
      await axios.patch(
        `${baseUrl}/users/${user?.id}/agents/archive/${agent.agent_id}`,
        requestBody,
        HTTPService.setHeaders({ user, session }),
      );
      await fetchAgents(user);
    } catch (error) {
      console.error(error);
    } finally {
      setAgentDeleteLoading(null);
      setModalIsOpen(false);
    }
  };
  async function registerCall(id) {
    try {
      // Replace with your server url

      const requestBody = {
        audio_encoding: 's16le',
        audio_websocket_protocol: 'web',
        sample_rate: 24000,
      };
      const response = await axios.post(
        `${baseUrl}/agents/${id}/register-call`,
        requestBody,
        HTTPService.setHeaders({ user, session }),
      );

      return response.data;
    } catch (err) {
      console.log(err);
      throw new Error(err);
    }
  }

  const toggleConversation = async (agent) => {
    if (isCalling) {
      webClient.stopConversation();
      setIsCalling(false);
      onCallModalClose();
    } else {
      const registerCallResponse = await registerCall(agent.agent_id);
      if (registerCallResponse.call_id) {
        webClient
          .startConversation({
            callId: registerCallResponse.call_id,
            sampleRate: registerCallResponse.sample_rate,
            enableUpdate: true,
          })
          .catch(console.error);

        setIsCalling(true); // Update button to "Stop" when conversation starts
      }
    }
  };
  const initiateCall = async (agent) => {
    if (agent.type === 'inbound') {
      const toastId = toast.loading('Connecting call, please wait...');
      setCurrentCallAgent(agent);

      toggleConversation(agent);
    }
  };

  useEffect(() => {
    // Setup event listeners
    webClient.on('conversationStarted', () => {
      onCallModalOpen();
      console.log('conversationStarted');
    });

    webClient.on('audio', (audio) => {
      console.log('There is audio');
    });

    webClient.on('conversationEnded', ({ code, reason }) => {
      console.log('Closed with code:', code, ', reason:', reason);
      setIsCalling(false);
      onCallModalClose(); // Update button to "Start" when conversation ends
    });

    webClient.on('error', (error) => {
      console.error('An error occurred:', error);
      setIsCalling(false); // Update button to "Start" in case of error
    });

    webClient.on('update', (update) => {
      // Print live transcript as needed
      console.log('update', update);
    });
  }, [currentCallAgent]);
  useEffect(() => {
    if (isModalOpen === false && isOutboundModalOpen === false) {
      setAgentCreated(false);
      setPhoneNumber('');
      setName('');
    }
  }, [onModalClose, onOutboundModalClose]);

  useEffect(() => {
    if (isOpen === false) {
      setCurrentAgent(null);
    }
  }, [isOpen]);
  useEffect(() => {
    if (isOutboundModalOpen === false) {
      clearData();
    }
  }, [isOutboundModalOpen]);
  useEffect(() => {
    if (isEditCampaignModalOpen === false) {
      clearData();
    }
  }, [isEditCampaignModalOpen]);

  useEffect(() => {
    if (isCallModalOpen) {
      toast.dismiss();
    }
  }, [isCallModalOpen]);
  useEffect(() => {
    if (!isZapierTestModalOpen) {
      setCurrentAgent(null);
    }
  }, [isZapierTestModalOpen]);
  useEffect(() => {
    if (isEditCampaignModalOpen === false) {
      setSelectedButtons(0);
      setSelectedVoice('');
    }
  }, [isEditCampaignModalOpen]);

  if (agentsLoading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[100vh]">
        <div className="loader" />
      </div>
    );
  }
  const disableCreateAgent = () =>
    currentUser?.plan?.conversations <= 0 ||
    +currentUser?.plan.agents <=
      agents?.filter((item) => item.active === true).length ||
    FormatDate.getDaysLeft(currentUser?.plan?.end_date) < 0;

  return (
    <>
      <main className="w-[100%] m-auto py-4">
        <div className="w-[100%] m-auto">
          <div className="flex w-[90%] m-auto justify-between items-center py-8">
            <div>
              <h1 className=" font-normal text-gray-600 text-2xl">
                Assistants
              </h1>
            </div>
            <div className="flex justify-end gap-4 items-center">
              <div className="flex items-center gap-[24px]">
                <Popover>
                  <PopoverTrigger disabled={disableCreateAgent()}>
                    <Button
                      disabled={disableCreateAgent()}
                      className="hover:border-[1px] hover:border-neutral-900 hover:bg-white hover:text-neutral-900 transition-all duration-200 ease-in"
                    >
                      Create Assistant
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="p-0 font-bold max-w-[300px]">
                    <div
                      onClick={onModalOpen}
                      className="flex flex-col gap-[2px] border-b-[1px] border-gray-100 container-effect px-4 py-[9px] cursor-pointer text-effect-bold font-medium"
                    >
                      <div className="flex gap-[2px] items-center">
                        <p className="font-semibold text-gray-800 text-[15px]">
                          For Inbound Calls
                        </p>
                      </div>
                      <p className="font-medium text-[12px] text-gray-500">
                        Manage incoming calls via phone
                      </p>
                    </div>
                    <div
                      onClick={onOutboundModalOpen}
                      className="flex flex-col gap-[2px] container-effect px-4 py-[9px] cursor-pointer text-effect-bold font-medium"
                    >
                      <p className="font-semibold text-gray-800 text-[15px]">
                        For Outbound Calls
                      </p>
                      <div className="flex items-end">
                        <p className="inline font-medium leading-[170%] text-[12px] text-gray-500">
                          {' '}
                          Automatically calls a list of leads from an uploaded
                          csv or <Tag>zapier</Tag>
                        </p>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>
          <hr />

          {agents?.filter((item) => item.active === true).length > 0 ? (
            <div className="mt-[32px] w-[90%] gap-[32px] flex flex-wrap m-auto">
              {agents?.map((item) => (
                <AgentCard
                  setCurrentCallAgent={setCurrentCallAgent}
                  setCurrentAgent={setCurrentAgent}
                  agent={item}
                  onOpen={() => setModalIsOpen(true)}
                  onDrawerOpen={() => setIsOpen(true)}
                  onEditModalOpen={onEditModalOpen}
                  setTabValue={setTabValue}
                  onEditCampaignModalOpen={onEditCampaignModalOpen}
                  setCampaignTabValue={setCampaignTabValue}
                  agent_type={item.type}
                  stopConversation={() => webClient.stopConversation()}
                  initiateCall={initiateCall}
                  onZapierTestModalOpen={onZapierTestModalOpen}
                />
              ))}{' '}
            </div>
          ) : (
            <NoAgents setIsModalOpen={setIsModalOpen} />
          )}
        </div>

        <ConfirmationModal
          isOpen={modalIsOpen}
          onClose={() => setModalIsOpen(false)}
        >
          <div className="flex flex-col min-w-screen md:min-w-[450px] pt-[36px]">
            <div className="text-center px-[48px] pb-[12px] border-b-[1px] border-gray-200 flex items-center flex-col gap-[16px]">
              <AgentIcon type={currentAgent?.type} />
              <div className="flex flex-col gap-[4px]">
                <p className="text-lg font-semibold">
                  Delete {currentAgent?.name}
                </p>
              </div>
              <p className="text-gray-500 mt-[-4px] text-sm font-normal text-center max-w-[330px] leading-[150%]">
                Warning: This is an irreversible action. This will delete the
                agent and it&apos;s corresponding call logs
              </p>
            </div>
            <div className="bg-[#f9fafb] pt-[24px] pb-[40px] ">
              <div className="flex flex-col gap-[8px] w-[80%] m-auto">
                <div className="flex flex-col gap-[2px]">
                  <p className="text-sm text-gray-700 font-normal tracking-normal">
                    To verify, type{' '}
                    <span className="font-bold">{currentAgent?.name}</span>{' '}
                    below
                  </p>
                  <Input
                    placeholder="Type here"
                    onChange={(e) => setConfirmDeleteText(e.target.value)}
                    onKeyDown={(e) => {
                      if (
                        e.key === 'Enter' &&
                        confirmDeleteText?.trim() === currentAgent?.name?.trim()
                      ) {
                        onDelete(currentAgent);
                      }
                    }}
                  />
                </div>
                {agentDeleteLoading ? (
                  <div className="flex justify-center mt-[12px]">
                    <Loader width="24px" height="24px" />
                  </div>
                ) : (
                  <div className="w-full flex gap-[12px]">
                    <Button
                      disabled={
                        confirmDeleteText.trim() !== currentAgent?.name.trim()
                      }
                      className="border-[1px] w-full border-red-500 bg-red-500 hover:bg-white text-white hover:text-red-500"
                      onClick={() => onDelete(currentAgent)}
                    >
                      Delete
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </ConfirmationModal>
      </main>

      <Modal isOpen={isModalOpen} onClose={onModalClose}>
        <div className="min-w-[100vw] h-screen overflow-y-auto lg:h-[fit-content] lg:min-w-[750px] flex-col lg:flex-row flex items-start">
          <div className="relative w-full  rounded-[20px]  border-r-[1px] border-gray-200">
            <div className="h-[20vh] rounded-t-[20px] bg-white border-b-[1px] border-gray-200 flex-col w-full gap-[12px] flex items-center justify-center sticky top-0 left-0">
              <div className="p-[4px] rounded-full bg-slate-100">
                <Icon
                  icon="ph:globe"
                  style={{ color: 'grey' }}
                  className="w-6 h-6"
                />
              </div>
              <p className="text-[16px] text-gray-700 font-semibold">
                Add Inbound Assistant
              </p>
            </div>

            <AddAgentForm
              setAgentName={setName}
              setPhoneNumber={setPhoneNumber}
              setAgentCreated={setAgentCreated}
              onCongratsModalOpen={onCongratsModalOpen}
              setCreatedAgent={setCreatedAgent}
              onModalClose={onModalClose}
            />
          </div>
        </div>
        <div
          onClick={onModalClose}
          className="absolute cursor-pointer transition-all duration-300 ease-in top-[15px] hover:bg-slate-100 right-[15px] p-[3px] rounded-full "
        >
          <Icon icon="system-uicons:cross" style={{ color: 'rgb(25,25,25)' }} />
        </div>
      </Modal>
      <CongratsModal
        isCongratsModalOpen={isCongratsModalOpen}
        onCongratsModalClose={onCongratsModalClose}
        createdAgent={createdAgent}
        setCurrentAgent={setCurrentAgent}
        onEditModalOpen={onEditModalOpen}
        setTabValue={setTabValue}
        onEditCampaignModalOpen={onEditCampaignModalOpen}
        setCampaignTabValue={setCampaignTabValue}
        initiateCall={initiateCall}
        onZapierTestModalOpen={onZapierTestModalOpen}
        onEditCampaignModalClose={onEditCampaignModalClose}
      />
      <Modal
        // showIcon
        isOpen={isOutboundModalOpen}
        onClose={onOutboundModalClose}
      >
        <div className="min-w-[100vw] h-screen lg:h-[fit-content]    lg:min-w-[750px] flex-col lg:flex-row flex items-start">
          <div className="relative w-full rounded-[20px] border-r-[1px] border-gray-200">
            <div className="py-[32px] rounded-t-[20px] bg-white border-b-[1px] border-gray-200 flex-col w-full gap-[12px] flex items-center justify-center sticky top-0 left-0">
              <div className="p-[4px] rounded-full bg-slate-100">
                <Icon
                  icon="ph:globe"
                  style={{ color: 'grey' }}
                  className="w-6 h-6"
                />
              </div>
              <p className="text-[16px] text-gray-700 font-semibold">
                Add Outbound Assistant
              </p>
            </div>

            <AddCampaign
              setAgentName={setName}
              setPhoneNumber={setPhoneNumber}
              setAgentCreated={setAgentCreated}
              onCongratsModalOpen={onCongratsModalOpen}
              setCreatedAgent={setCreatedAgent}
              onModalClose={onOutboundModalClose}
              onEditCampaignModalClose={onEditCampaignModalClose}
              isEditCampaignModalOpen={isEditCampaignModalOpen}
              onEditCampaignModalOpen={onEditCampaignModalOpen}
              onEditCongratsModalClose={onEditCampaignModalClose}
              onEditCongratsModalOpen={onEditCampaignModalOpen}
            />
          </div>
        </div>
        <div
          onClick={onOutboundModalClose}
          className="absolute cursor-pointer top-[15px] hover:bg-slate-100 right-[15px] p-[3px] rounded-full "
        >
          <Icon icon="system-uicons:cross" style={{ color: 'rgb(25,25,25)' }} />
        </div>
      </Modal>
      <EditConvoModal
        isEditModalOpen={isEditModalOpen}
        onEditModalClose={onEditModalClose}
        onEditCongratsModalClose={onEditCongratsModalClose}
        onEditCongratsModalOpen={onEditCongratsModalOpen}
        setUpdatedAgent={setUpdatedAgent}
        currentAgent={currentAgent}
        tabValue={tabValue}
        setTabValue={setTabValue}
      />
      <EditCampaignConvoModal
        currentAgent={currentAgent}
        isEditModalOpen={isEditCampaignModalOpen}
        onEditCongratsModalClose={onEditCongratsModalClose}
        onEditCongratsModalOpen={onEditCongratsModalOpen}
        setUpdatedAgent={setUpdatedAgent}
        tabValue={campaignTabValue}
        setTabValue={setCampaignTabValue}
        onEditCampaignModalClose={onEditCampaignModalClose}
        onEditCampaignModalOpen={onEditCampaignModalOpen}
      />
      <EditCongratsModal
        isEditCongratsModalOpen={isEditCongratsModalOpen}
        onEditCongratsModalClose={onEditCongratsModalClose}
        updatedAgent={updatedAgent}
      />
      <CallModal
        onClose={onCallModalClose}
        user={user}
        agent={currentCallAgent}
        isOpen={isCallModalOpen}
        stopConversation={() => webClient.stopConversation()}
      />
      {currentAgent && (
        <ZapierTestModal
          agent={currentAgent}
          user={user}
          isOpen={isZapierTestModalOpen}
          onOpen={onZapierTestModalOpen}
          onClose={onZapierTestModalClose}
        />
      )}
    </>
  );
};

export default Dashboard;
