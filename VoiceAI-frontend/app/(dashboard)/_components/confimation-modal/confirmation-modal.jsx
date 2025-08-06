import React from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';

const ConfimationModal = ({ children, isOpen, onClose }) => (
  <Dialog open={isOpen} onOpenChange={onClose}>
    <DialogContent className="md:max-w-[fit-content] overflow-hidden p-0 rounded-[20px]">
      {children}
    </DialogContent>
  </Dialog>
);

export default ConfimationModal;
