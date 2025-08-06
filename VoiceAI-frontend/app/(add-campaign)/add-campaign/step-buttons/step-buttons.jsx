import React, { useContext } from 'react';
import { Button } from '@/components/ui/button';
import { AddCampaignContext } from '@/context/AddCampaignContext/AddCampaignContext';
import { toast } from 'sonner';
import {
  getTransferCallError,
  voices,
} from '@/app/(add-agent-form)/add-agent-form/_components';
import { baseUrl } from '@/utils/config';
import axios from 'axios';
import { AgentsContext } from '@/context/AgentsContext/AgentsContext';
import { HTTPService } from '@/utils/http';
import useTransferCallErrorModal from '@/hooks/modals/useTransferCallErrorModal';

const StepButtons = ({
  type,
  setCreatedAgent,
  onModalClose,
  onCongratsModalOpen,
  originalFile,
  parsedFile,
  onFileErrorOpen,
  handleSaveFields,
  currentAgent,
  onEditCongratsModalOpen,
  onEditCongratsModalClose,
  setUpdatedAgent,
  onEditCampaignModalClose,
}) => {
  const {
    formData,
    step,
    nextStep,
    file,
    prompt,
    beginMessage,
    name,
    prevStep,
    handleSubmit,
    zapier,
    maxRetries,
    retryDuration,
    selectedButtons,
    setAddCampaignLoading,
    transferTo,
    startTime,
    phoneNumberChecked,
    endTime,
    setTransferToError,
  } = useContext(AddCampaignContext);
  const {
    isOpen: isTransferCallErrorModalOpen,
    onOpen: onTransferCallErrorModalOpen,
    onClose: onTransferCallErrorModalClose,
  } = useTransferCallErrorModal();
  const { fetchAgents, user, session } = useContext(AgentsContext);

  const onUpdate = async () => {
    // const body = {
    //   userId,
    //   name,
    //   prompt,
    //   phone,
    //   tone: selectedButtons,
    //   scheduleCall,
    // };
    const requestBody = {
      agent_id: currentAgent?.agent_id,
      name,
      prompt,
      begin_message: beginMessage,
      transfer_to: currentAgent.transfer_to,
      non_transfer_timeline: currentAgent.non_transfer_timeline,
      timezone: currentAgent.timezone,
      availability_schedule: currentAgent.availability_schedule,
      active: currentAgent?.active,
      voice_id: voices[selectedButtons].id,
    };
    // await updateAgent(agent._id, body);
    try {
      toast.loading('Editing your assistant');
      setAddCampaignLoading(true);
      const res = await axios.patch(
        `${baseUrl}/users/${user?.id}/agents/${currentAgent?.agent_id}`,
        requestBody,
        HTTPService.setHeaders({ user, session }),
      );
      onEditCampaignModalClose();
      toast.success('Assistant updated successfully');
      setUpdatedAgent(res.data);
      onEditCongratsModalOpen();
      setTimeout(() => {
        onEditCongratsModalClose();
      }, 4000);
    } catch (error) {
      console.log(error);
    } finally {
      setAddCampaignLoading(false);
      fetchAgents(user);
      toast.dismiss();
    }
  };

  const handleStep1Next = () => {
    handleSaveFields();
    if (parsedFile.length !== originalFile.length) {
      onFileErrorOpen();
    } else {
      nextStep();
    }
    // handleSaveFields();
  };
  const handleStep3 = async () => {
    const res = await handleSubmit();
    console.log(res);
    if (res) {
      setCreatedAgent({
        ...res,
        type: zapier ? 'outbound-zapier' : 'outbound-csv',
      });
      onCongratsModalOpen();
      onModalClose();
      return;
    }
    toast.error('Error creating outbound assistant. Please try again');
  };
  const handleStep2 = async () => {
    const transferToError = getTransferCallError(
      transferTo,
      startTime,
      endTime,
    );
    if (phoneNumberChecked && !!transferToError) {
      setTransferToError(transferToError);
      onTransferCallErrorModalOpen();
      return;
    }
    nextStep();
  };
  if (step === 1) {
    return (
      <Button
        onClick={handleStep1Next}
        className="w-[60%]  mx-auto"
        disabled={!file}
      >
        Next
      </Button>
    );
  }
  if (step === 2) {
    return type !== 'edit' ? (
      <div className="flex gap-[12px] mx-auto  justify-center w-[90%]">
        <Button className="w-[50%]" variant="outline" onClick={prevStep}>
          Back
        </Button>
        <Button
          className="w-[50%] mx-auto"
          disabled={
            !name || !prompt || !beginMessage || !maxRetries || !retryDuration
          }
          onClick={zapier ? handleStep3 : handleStep2}
        >
          {zapier
            ? type === 'edit'
              ? 'Update Assistant'
              : 'Create Assistant'
            : 'Next'}
        </Button>
      </div>
    ) : (
      <div className="w-[90%] mx-auto flex gap-[12px] justify-center items-center">
        {!!zapier === false && (
          <Button variant="outline" className="min-w-[50%]" onClick={prevStep}>
            Back
          </Button>
        )}
        <Button onClick={onUpdate} className="w-[60%]  mx-auto">
          Update Assistant
        </Button>
      </div>
    );
  }
  if (step === 3) {
    return (
      <div className="flex gap-[12px] mx-auto  justify-center w-[90%]">
        <Button className="w-[50%]" variant="outline" onClick={prevStep}>
          Back
        </Button>
        <Button
          disabled={step < 3 || !maxRetries || !retryDuration}
          onClick={handleStep3}
          className="w-[50%] hover:border-[1px] hover:border-neutral-900 hover:bg-white hover:text-neutral-900 transition-all duration-200 ease-in"
        >
          {type === 'edit' ? 'Update Assistant' : 'Create Assistant'}
        </Button>
      </div>
    );
  }
};

export default StepButtons;
