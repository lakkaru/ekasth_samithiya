// MemberContext.js
import React, { createContext, useContext, useState, useEffect } from "react";

const MemberContext = createContext();

export const MemberProvider = ({ children }) => {
  const [memberData, setMemberData] = useState(null);

  useEffect(() => {
    // Listen for logout events to clear cached data
    const handleLogoutEvent = () => {
      setMemberData(null)
    }
    
    if (typeof window !== "undefined") {
      window.addEventListener('userLoggedOut', handleLogoutEvent)
      
      return () => {
        window.removeEventListener('userLoggedOut', handleLogoutEvent)
      }
    }
  }, [])

  return (
    <MemberContext.Provider value={{ memberData, setMemberData }}>
      {children}
    </MemberContext.Provider>
  );
};

export const useMember = () => useContext(MemberContext);
