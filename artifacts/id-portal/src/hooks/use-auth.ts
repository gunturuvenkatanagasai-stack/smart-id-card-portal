import { useState, useEffect, useCallback } from "react";

const getStoredEmail = () => {
  if (typeof window !== "undefined") {
    return localStorage.getItem("studentEmail");
  }
  return null;
};

const getStoredAdminToken = () => {
  if (typeof window !== "undefined") {
    return localStorage.getItem("adminToken");
  }
  return null;
};

// Simple event emitter for cross-tab/cross-component state sync
const authEmitter = new EventTarget();

export function useAuth() {
  const [studentEmail, setStudentEmailState] = useState<string | null>(getStoredEmail());
  const [adminToken, setAdminTokenState] = useState<string | null>(getStoredAdminToken());

  useEffect(() => {
    const handleAuthChange = () => {
      setStudentEmailState(getStoredEmail());
      setAdminTokenState(getStoredAdminToken());
    };
    
    authEmitter.addEventListener("authChange", handleAuthChange);
    window.addEventListener("storage", handleAuthChange);
    
    return () => {
      authEmitter.removeEventListener("authChange", handleAuthChange);
      window.removeEventListener("storage", handleAuthChange);
    };
  }, []);

  const setStudentEmail = useCallback((email: string) => {
    localStorage.setItem("studentEmail", email);
    setStudentEmailState(email);
    authEmitter.dispatchEvent(new Event("authChange"));
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("studentEmail");
    setStudentEmailState(null);
    authEmitter.dispatchEvent(new Event("authChange"));
  }, []);

  const setAdminToken = useCallback((token: string) => {
    localStorage.setItem("adminToken", token);
    setAdminTokenState(token);
    authEmitter.dispatchEvent(new Event("authChange"));
  }, []);

  const logoutAdmin = useCallback(() => {
    localStorage.removeItem("adminToken");
    setAdminTokenState(null);
    authEmitter.dispatchEvent(new Event("authChange"));
  }, []);

  return {
    studentEmail,
    adminToken,
    setStudentEmail,
    logout,
    setAdminToken,
    logoutAdmin,
  };
}
