import { create } from 'zustand';

interface TransferCallErrorModalStore {
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
  setIsOpen: () => void;
}

const useTransferCallErrorModal = create<TransferCallErrorModalStore>(
  (set) => ({
    isOpen: false,
    onOpen: () => set({ isOpen: true }),
    onClose: () => set({ isOpen: false }),
    setIsOpen: () => set((state) => ({ isOpen: !state.isOpen })),
  })
);

export default useTransferCallErrorModal;
