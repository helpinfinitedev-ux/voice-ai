import React from 'react';

import Modal from '@/components/modal';
import { Icon } from '@iconify/react';
import EditAgentForm from '@/app/(edit-agent-form)/edit-agent-form/_components/edit-agent-form';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AddCampaign from '@/app/(add-campaign)/add-campaign/add-campaign';
import CallLogsDrawer from '../call-logs-drawer/call-logs-drawer';

const EditCampaignConvoModal = ({
  isEditModalOpen,
  onEditCongratsModalClose,
  onEditCongratsModalOpen,
  onEditModalClose,
  currentAgent,
  setUpdatedAgent,
  tabValue,
  setTabValue,
  onEditCampaignModalClose,
  onEditCampaignModalOpen,
}) => (
  <Modal showIcon isOpen={isEditModalOpen} onClose={onEditCampaignModalClose}>
    <Tabs
      value={tabValue}
      defaultValue="editOutboundAssistant"
      className="min-w-[850px] overflow-hidden"
    >
      <TabsList className="w-full">
        <TabsTrigger
          onClick={() => setTabValue('editOutboundAssistant')}
          className="w-[50%] rounded-[12px]"
          value="editOutboundAssistant"
        >
          Edit Outbound Assistant
        </TabsTrigger>
        <TabsTrigger
          onClick={() => setTabValue('conversations')}
          className="w-[50%] rounded-[12px]"
          value="conversations"
        >
          Conversations
        </TabsTrigger>
      </TabsList>
      <TabsContent value="editOutboundAssistant">
        {' '}
        <div className="min-w-[100vw] h-screen overflow-y-auto lg:h-[fit-content] lg:min-w-[650px] flex-col lg:flex-row flex items-start overflow-hidden">
          <div className="relative w-full   border-r-[1px] border-gray-200">
            <div className="h-[20vh] bg-white border-b-[1px] border-gray-200 flex-col w-full gap-[12px] flex items-center justify-center sticky top-0 left-0">
              <div className="p-[4px] rounded-full bg-slate-100">
                <Icon
                  icon="ph:globe"
                  style={{ color: 'grey' }}
                  className="w-6 h-6"
                />
              </div>
              <p className="text-[16px] text-gray-700 font-semibold">
                Edit Outbound Assistant
              </p>
            </div>

            <AddCampaign
              type="edit"
              onEditModalClose={onEditModalClose}
              currentAgent={currentAgent}
              setUpdatedAgent={setUpdatedAgent}
              onEditCongratsModalOpen={onEditCongratsModalOpen}
              onEditCongratsModalClose={onEditCongratsModalClose}
              onEditCampaignModalClose={onEditCampaignModalClose}
              onEditCampaignModalOpen={onEditCampaignModalOpen}
            />
          </div>
          {/* <div className="w-full lg:w-[50%] flex flex-col justify-center items-center relative">
<div className="py-[24px] border-b-[1px] border-gray-200 w-full">
  <p className="font-semibold text-[16px] text-center">Preview</p>
</div>

<div className="px-[24px] flex flex-col gap-[16px] w-full  mt-[24px] mb-[24px] lg:mb-0">
  <div className="flex items-center gap-[6px] cursor-pointer">
    <h1 className="label">Test Your Assistant</h1>
    <TooltipComp
      trigger={
        <Icon icon="fe:question" style={{ color: 'grey' }} />
      }
      value={
        <p className="">Create Your Assistant First To Test It</p>
      }
    />
  </div>
  <div className="flex flex-col gap-[12px]">
    <Input
      value={phoneNumber}
      disabled={!agentCreated}
      placeholder="Phone"
    />
    <Input
      value={name}
      disabled={!agentCreated}
      placeholder="Name"
    />
    <Button disabled={!agentCreated || !name || !phoneNumber}>
      Call
    </Button>
  </div>
</div>
</div> */}
        </div>
        {/* <div
          onClick={onEditCampaignModalClose}
          className="absolute cursor-pointer transition-all duration-300 ease-in top-[45px] hover:bg-slate-100 right-[15px] p-[3px] rounded-full "
        >
          <Icon icon="system-uicons:cross" style={{ color: 'rgb(25,25,25)' }} />
        </div> */}
      </TabsContent>
      <TabsContent value="conversations" className="m-0">
        <div className="min-h-[93vh] m-0">
          <CallLogsDrawer currentAgent={currentAgent} />
        </div>
      </TabsContent>
    </Tabs>
  </Modal>
);

export default EditCampaignConvoModal;
