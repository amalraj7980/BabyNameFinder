import React, {createContext, useState, useContext} from 'react';

export const NetworkContext = createContext();

export const NetworkProvider = ({children}) => {
  const [isConnected, setIsConnected] = useState(true);

  return (
    <NetworkContext.Provider value={{isConnected, setIsConnected}}>
      {children}
    </NetworkContext.Provider>
  );
};

export const useNetwork = () => {
  const context = useContext(NetworkContext);
  if (!context) {
    throw new Error('useNetwork must be used within a NetworkProvider');
  }
  return context;
};
