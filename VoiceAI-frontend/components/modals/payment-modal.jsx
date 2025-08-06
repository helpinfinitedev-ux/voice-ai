'use client';

import React from 'react';
import Modal from '@/components/modal';
import usePaymentModal from '@/hooks/usePaymentModal';
import Cards from '@/app/(pricing)/pricing/_components/cards/cards';
import { Icon } from '@iconify/react';

const PaymentModal = () => {
  const { isOpen, onClose, onOpen } = usePaymentModal();
  return (
    <Modal isOpen={isOpen} onOpen={onOpen} onClose={onClose}>
      <div className="w-full relative">
        <div className=" py-[24px] flex flex-col gap-4 items-center border-b-[1px] border-gray-200">
          <img src="/logo.png" className="w-12 h-12" alt="" />
          <p className="font-medium text-gray-700 text-[16px]">
            Upgrade to plan that suits your business needs
          </p>
        </div>
        <Cards />
        <div
          onClick={onClose}
          className="absolute cursor-pointer transition-all duration-300 ease-in top-[15px] hover:bg-slate-100 right-[15px] p-[3px] rounded-full "
        >
          <Icon icon="system-uicons:cross" style={{ color: 'rgb(25,25,25)' }} />
        </div>
      </div>
    </Modal>
  );
};

export default PaymentModal;
