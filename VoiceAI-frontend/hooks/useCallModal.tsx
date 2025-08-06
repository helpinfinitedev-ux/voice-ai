import { create } from 'zustand';

interface CallModalStore {
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
  setIsOpen: () => void;
}

const useCallModal = create<CallModalStore>((set) => ({
  isOpen: false,
  onOpen: () => set({ isOpen: true }),
  onClose: () => set({ isOpen: false }),
  setIsOpen: () => set((state) => ({ isOpen: !state.isOpen })),
}));

export default useCallModal;
