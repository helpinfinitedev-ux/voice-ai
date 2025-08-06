import React, { useContext } from 'react';
import Modal from '@/components/modal';
import { Button } from '@/components/ui/button';
import { formatPhone } from '@/utils/format';
import { baseUrl } from '@/utils/config';
import { AgentsContext } from '@/context/AgentsContext/AgentsContext';
import { HTTPService } from '@/utils/http';
import axios from 'axios';
import { EditCampaignContext } from '@/context/EditCampaignContext/EditCampaignContext';

const CongratsModal = ({
  initiateCall,
  isCongratsModalOpen,
  onCongratsModalClose,
  createdAgent,
  setCurrentAgent,
  onEditModalOpen,
  setTabValue,
  onEditCampaignModalOpen,
  setCampaignTabValue,
  onZapierTestModalOpen,
}) => {
  const { setEditCampaignModalLoading } = useContext(EditCampaignContext);
  const { user, session } = useContext(AgentsContext);

  const fetchCampaign = async (agent) => {
    try {
      const res = await axios.get(
        `${baseUrl}/users/${user?.id}/campaigns/${agent.agent_id}`,
        HTTPService.setHeaders({ user, session })
      );
      return res.data;
    } catch (error) {
      console.log(error);
    }
  };
  const openZapierTestModal = async (agent) => {
    const campaign = await fetchCampaign(agent);
    setCurrentAgent({ ...campaign[0], ...agent });
    onZapierTestModalOpen();
  };

  return (
    <Modal isOpen={isCongratsModalOpen} onClose={onCongratsModalClose}>
      <div className="relative flex flex-col items-center max-w-[500px] p-4 pb-[36px] border-none">
        <img
          src="/confetti.svg"
          alt=""
          className="w-[160px] h-[160px] ml-[14px] mt-[0px] object-cover"
        />
        <p className="text-gray-700 px-2 text-[18px] text-center font-semibold">
          Congratulations your assistant has been created, here is the phone
          number associated with it
        </p>
        <div className="w-full mt-[16px] justify-center flex flex-col gap-[12px]">
          <p className="text-lg text-center text-gray-700 font-semibold">
            Phone No :{' '}
            {formatPhone(createdAgent?.phone_number || '+1234528562')}
          </p>
          <div className="w-full gap-4 flex justify-center">
            <Button variant="outline" onClick={onCongratsModalClose}>
              Go To Home
            </Button>

            <Button
              variant="outline"
              onClick={() => {
                createdAgent.type === 'inbound'
                  ? initiateCall(createdAgent)
                  : openZapierTestModal(createdAgent);
              }}
            >
              Test Your Assistant
            </Button>

            <Button
              onClick={async () => {
                onCongratsModalClose();
                if (createdAgent?.type === 'inbound') {
                  setCurrentAgent(createdAgent);
                  onEditModalOpen();
                  setTabValue('editAssistant');
                } else {
                  onEditCampaignModalOpen();
                  setEditCampaignModalLoading(true);
                  const res = await fetchCampaign(createdAgent);
                  console.log(createdAgent, 'CREATED AGENT');
                  setEditCampaignModalLoading(false);
                  setCurrentAgent({ ...res[0], ...createdAgent });
                  setCampaignTabValue('editOutboundAssistant');
                }
              }}
            >
              Edit Assistant
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default CongratsModal;
