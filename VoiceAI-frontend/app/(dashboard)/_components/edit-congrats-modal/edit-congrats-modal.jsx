import React from 'react';
import Modal from '@/components/modal';
import { Button } from '@/components/ui/button';

const EditCongratsModal = ({
  isEditCongratsModalOpen,
  onEditCongratsModalClose,
  updatedAgent,
  setCurrentAgent,
  onEditModalOpen,
}) => (
  <Modal isOpen={isEditCongratsModalOpen} onClose={onEditCongratsModalClose}>
    <div className="relative flex flex-col items-center max-w-[500px] p-4 pb-[36px] border-none">
      <img
        src="/confetti.svg"
        alt=""
        className="w-[120px] h-[120px] mt-[2px] object-cover"
      />
      <p className="text-gray-600 text-[18px] text-center font-semibold">
        Your assistant{' '}
        <span className="text-gray-700 font-bold">{updatedAgent?.name}</span> is
        updated and has the same phone number
      </p>
    </div>
  </Modal>
);

export default EditCongratsModal;
