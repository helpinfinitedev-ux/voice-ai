'use client';

import { useState, createContext } from 'react';

export const InboundContext = createContext({
  transferTo: [],
  setTransferTo: () => null,
  setTransferToError: () => null,
  transferToError: null,
});

export const InboundContextProvider = ({ children }) => {
  const [transferToError, setTransferToError] = useState(null);
  const [transferTo, setTransferTo] = useState([
    { name: '', phone: '', scenario: '' },
  ]);
  const value = {
    transferTo,
    setTransferTo,
    transferToError,
    setTransferToError,
  };
  return (
    <InboundContext.Provider value={value}>{children}</InboundContext.Provider>
  );
};
