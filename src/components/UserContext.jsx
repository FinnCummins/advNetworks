import React, { createContext, useContext, useState } from 'react';

const UserContext = createContext();

export const useUser = () => useContext(UserContext);

export const UserProvider = ({ children }) => {
  const [userInfo, setUserInfo] = useState({
    username: '',
    token: '', 
    privateKey: null,
  });

  const updateUserInfo = ({ username, token, privateKey }) => {
    setUserInfo(prev => ({
      ...prev,
      username: username || prev.username,
      token: token || prev.token,
      privateKey: privateKey || prev.privateKey,
    }));
  };

  return (
    <UserContext.Provider value={{ userInfo, updateUserInfo }}>
      {children}
    </UserContext.Provider>
  );
};
