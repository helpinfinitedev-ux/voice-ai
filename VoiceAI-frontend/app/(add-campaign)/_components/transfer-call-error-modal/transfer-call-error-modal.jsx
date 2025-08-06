import React, { useContext } from 'react';
import InfoIcon from '@/assets/InfoIcon';
import Modal from '@/components/modal';
import useTransferCallErrorModal from '@/hooks/modals/useTransferCallErrorModal';
import { InboundContext } from '@/context/InboundContext/InboundContext';
import { Button } from '@/components/ui/button';
import { AddCampaignContext } from '@/context/AddCampaignContext/AddCampaignContext';
import { getErrorMessage } from '@/app/(add-agent-form)/add-agent-form/_components/transfer-call-error-modal';

const TransferCallErrorModal = () => {
  const { transferToError } = useContext(AddCampaignContext);
  const { isOpen, onOpen, onClose } = useTransferCallErrorModal();
  const errorMessage = getErrorMessage(transferToError);
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="p-[20px] flex gap-4 flex-col">
        <div className="flex gap-2 items-center text-gray-700">
          <InfoIcon />
          <p className="text-[16px] font-medium">{errorMessage}</p>
        </div>
        <div className="flex justify-end">
          <Button onClick={onClose} size="xsm" variant="destructive">
            Go Back
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default TransferCallErrorModal;
