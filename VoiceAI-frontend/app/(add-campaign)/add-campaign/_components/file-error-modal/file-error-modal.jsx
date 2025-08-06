import React from 'react';
import Modal from '@/components/modal';
import { Button } from '@/components/ui/button';

const FileErrorModal = ({
  onClick,
  onCancelClick,
  originalFile,
  parsedFile,
  isOpen,
  onClose,
}) => (
  <Modal isOpen={isOpen} onClose={onClose}>
    <div className="py-6 pb-10 max-w-[500px] px-4 flex flex-col gap-2 mx-auto relative">
      <div className="w-full flex flex-col gap-6">
        <div className="w-full p-0 text-gray-700 !m-0 text-center font-medium text-[18px]">
          Your file had{' '}
          <span className="text-red-500 text-[19px]">
            {originalFile?.length - parsedFile?.length}
          </span>{' '}
          contacts which were invalid. Only{' '}
          <span className="text-gray-800 text-[19]">{parsedFile?.length}</span>{' '}
          of them will be uploaded
        </div>
        <div className="flex justify-center mx-auto w-[100%] gap-2">
          <Button
            className="min-w-[120px]"
            variant="outline"
            onClick={onCancelClick}
          >
            Reupload
          </Button>
          <Button onClick={onClick} className="min-w-[120px]" variant="default">
            Continue
          </Button>
        </div>
      </div>
      <div className="ml-auto absolute right-8 bottom-2 text-[11px] font-medium">
        <p>*Make sure you have mapped phone number correctly</p>
      </div>
    </div>
  </Modal>
);

export default FileErrorModal;
