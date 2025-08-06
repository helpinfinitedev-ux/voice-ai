import React from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Icon } from '@iconify/react';

const Modal = ({
  children,
  isOpen,
  onClose,
  showIcon,
  showIconTop,
  showIconRight,
}) => (
  <Dialog open={isOpen} onOpenChange={onClose}>
    <DialogContent className="max-w-[fit-content] outline-none p-0 !rounded-[20px]">
      <div className="relative">
        {children}
        {!!showIcon === true && (
          <div
            style={{
              top: showIconTop || '0px',
              right: showIconRight || '-25px',
            }}
            onClick={onClose}
            className="absolute cursor-pointer transition-all duration-300 ease-in hover:bg-slate-100 p-[3px] rounded-full "
          >
            <Icon
              icon="system-uicons:cross"
              style={{ color: 'rgb(25,25,25)' }}
            />
          </div>
        )}
      </div>
    </DialogContent>
  </Dialog>
);
export default Modal;
