import { create } from 'zustand';

interface PaymentModalStore {
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
  setIsOpen: () => void;
}

const usePaymentModal = create<PaymentModalStore>((set) => ({
  isOpen: false,
  onOpen: () => set({ isOpen: true }),
  onClose: () => set({ isOpen: false }),
  setIsOpen: () => set((state) => ({ isOpen: !state.isOpen })),
}));

export default usePaymentModal;
