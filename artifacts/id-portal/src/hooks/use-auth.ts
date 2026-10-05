import { useState, useEffect, useCallback } from "react";
import type { StaffUser } from "@workspace/api-client-react";

export type StudentProfile = {
  id?: number;
  email: string;
  studentName: string;
  registerNumber: string;
  branch: string;
  year: string;
  semester: string;
  mobileNumber: string;
};

const getStoredEmail = () => (typeof window !== "undefined" ? localStorage.getItem("studentEmail") : null);
const getStoredToken = () => (typeof window !== "undefined" ? localStorage.getItem("studentToken") : null);

const getStoredProfile = (): StudentProfile | null => {
  if (typeof window !== "undefined") {
    const json = localStorage.getItem("studentProfile");
    if (json) {
      try {
        return JSON.parse(json);
      } catch (e) {
        return null;
      }
    }
  }
  return null;
};

const getStoredStaffToken = () => (typeof window !== "undefined" ? localStorage.getItem("staffToken") : null);

const getStoredStaffUser = (): StaffUser | null => {
  if (typeof window !== "undefined") {
    const json = localStorage.getItem("staffUser");
    if (json) {
      try {
        return JSON.parse(json);
      } catch (e) {
        return null;
      }
    }
  }
  return null;
};

const authEmitter = new EventTarget();

export function useAuth() {
  const [studentEmail, setStudentEmailState] = useState<string | null>(getStoredEmail());
  const [studentToken, setStudentTokenState] = useState<string | null>(getStoredToken());
  const [studentProfile, setStudentProfileState] = useState<StudentProfile | null>(getStoredProfile());
  const [staffToken, setStaffTokenState] = useState<string | null>(getStoredStaffToken());
  const [staffUser, setStaffUserState] = useState<StaffUser | null>(getStoredStaffUser());

  useEffect(() => {
    const handleAuthChange = () => {
      setStudentEmailState(getStoredEmail());
      setStudentTokenState(getStoredToken());
      setStudentProfileState(getStoredProfile());
      setStaffTokenState(getStoredStaffToken());
      setStaffUserState(getStoredStaffUser());
    };

    authEmitter.addEventListener("authChange", handleAuthChange);
    window.addEventListener("storage", handleAuthChange);

    return () => {
      authEmitter.removeEventListener("authChange", handleAuthChange);
      window.removeEventListener("storage", handleAuthChange);
    };
  }, []);

  const loginStudent = useCallback((email: string, token: string, profile?: StudentProfile | null) => {
    localStorage.setItem("studentEmail", email);
    localStorage.setItem("studentToken", token);
    if (profile) {
      localStorage.setItem("studentProfile", JSON.stringify(profile));
    }
    setStudentEmailState(email);
    setStudentTokenState(token);
    if (profile) setStudentProfileState(profile);
    authEmitter.dispatchEvent(new Event("authChange"));
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("studentEmail");
    localStorage.removeItem("studentToken");
    localStorage.removeItem("studentProfile");
    setStudentEmailState(null);
    setStudentTokenState(null);
    setStudentProfileState(null);
    authEmitter.dispatchEvent(new Event("authChange"));
  }, []);

  const loginStaff = useCallback((token: string, user: StaffUser) => {
    localStorage.setItem("staffToken", token);
    localStorage.setItem("staffUser", JSON.stringify(user));
    setStaffTokenState(token);
    setStaffUserState(user);
    authEmitter.dispatchEvent(new Event("authChange"));
  }, []);

  const logoutStaff = useCallback(() => {
    localStorage.removeItem("staffToken");
    localStorage.removeItem("staffUser");
    setStaffTokenState(null);
    setStaffUserState(null);
    authEmitter.dispatchEvent(new Event("authChange"));
  }, []);

  return {
    studentEmail,
    studentToken,
    studentProfile,
    staffToken,
    staffUser,
    loginStudent,
    logout,
    loginStaff,
    logoutStaff,
    // Alias for backward compatibility with old admin calls
    adminToken: staffUser?.role === "ADMIN" || staffUser?.role === "SUPER_ADMIN" ? staffToken : null,
    logoutAdmin: logoutStaff,
  };
}
