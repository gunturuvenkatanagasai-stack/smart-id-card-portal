import { useQuery, useMutation, QueryClient, UseQueryOptions } from "@tanstack/react-query";

export type ReissueRequest = {
  id: number;
  requestNumber: string;
  studentName: string;
  registerNumber: string;
  branch: string;
  year: string;
  semester: string;
  section?: string | null;
  mobileNumber: string;
  email: string;
  reason: string;
  dateOfLoss?: string | null;
  locationOfLoss?: string | null;
  additionalRemarks?: string | null;
  status: string;
  hodNote?: string | null;
  hodApprovedAt?: string | null;
  hodApprovedBy?: string | null;
  principalNote?: string | null;
  principalApprovedAt?: string | null;
  principalApprovedBy?: string | null;
  paymentAmount: number | null;
  paymentId?: string | null;
  paymentMethod?: string | null;
  paidAt: string | null;
  collectedAt?: string | null;
  collectedByStaff?: string | null;
  createdAt: string;
  updatedAt: string;
  adminNote?: string | null;
};

export type StaffUser = {
  id: number;
  name: string;
  username?: string | null;
  email: string;
  role: string; // HOD, PRINCIPAL, ADMIN, ID_CARD_STAFF, SUPER_ADMIN
  department?: string | null;
  isActive: boolean;
  lastLoginAt?: string | null;
  createdAt?: string;
};

export type AuditLogRecord = {
  id: number;
  requestNumber: string;
  user: string;
  role: string;
  action: string;
  remarks?: string | null;
  createdAt: string;
};

export type NotificationRecord = {
  id: number;
  email: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  createdAt: string;
};

export type SendOtpInput = { data: { email: string } };
export type ResendOtpInput = { data: { email: string } };
export type VerifyOtpInput = { data: { email: string; otp: string } };

export type SendOtpResponse = {
  success?: boolean;
  message: string;
  expiresInSeconds?: number;
  resendCooldownSeconds?: number;
  otpMode?: "development" | "production" | string;
  otp?: string;
  demoOtp?: string;
  emailSent?: boolean;
  deliveryMethod?: "smtp" | "ethereal" | "simulated" | string;
  previewUrl?: string;
  error?: string;
};

export type VerifyOtpResponse = {
  success?: boolean;
  token: string;
  email: string;
  student?: any;
  message: string;
  error?: string;
  remainingAttempts?: number;
};

export type StaffLoginResponse = {
  token: string;
  user: StaffUser;
  message: string;
};

export const queryClient = new QueryClient();

async function handleFetchJson(url: string, bodyData: any, defaultErrorMsg: string) {
  let response: Response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(bodyData),
    });
  } catch (networkError: any) {
    const networkErrMsg = "Unable to connect to the server. Please check your internet connection.";
    const err: any = new Error(networkErrMsg);
    err.data = { success: false, message: networkErrMsg, error: networkErrMsg };
    throw err;
  }

  let resData: any = null;
  try {
    resData = await response.json();
  } catch {
    // Non-JSON response (e.g. 504 gateway HTML error)
  }

  if (!response.ok) {
    const errorMsg =
      resData?.message ||
      resData?.error ||
      (response.status === 429
        ? "Too many OTP requests. Please wait before trying again."
        : defaultErrorMsg);
    const err: any = new Error(errorMsg);
    err.data = resData || { success: false, message: errorMsg, error: errorMsg };
    err.status = response.status;
    throw err;
  }

  return resData;
}

export function useSendOtp() {
  return useMutation<SendOtpResponse, any, SendOtpInput>({
    mutationFn: async (payload: SendOtpInput) => {
      return handleFetchJson("/api/auth/send-otp", payload.data, "Failed to send OTP");
    },
  });
}

export function useResendOtp() {
  return useMutation<SendOtpResponse, any, ResendOtpInput>({
    mutationFn: async (payload: ResendOtpInput) => {
      return handleFetchJson("/api/auth/resend-otp", payload.data, "Failed to resend OTP");
    },
  });
}

export function useVerifyOtp() {
  return useMutation<VerifyOtpResponse, any, VerifyOtpInput>({
    mutationFn: async (payload: VerifyOtpInput) => {
      return handleFetchJson("/api/auth/verify-otp", payload.data, "Verification failed");
    },
  });
}

export function useStaffLogin() {
  return useMutation<StaffLoginResponse, any, { data: { identifier?: string; email?: string; password: string } }>({
    mutationFn: async (payload) => {
      const response = await fetch("/api/staff/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload.data),
      });
      const resData = await response.json();
      if (!response.ok) {
        const err: any = new Error(resData.error || "Login failed");
        err.data = resData;
        err.status = response.status;
        throw err;
      }
      return resData;
    },
  });
}

export function useForgotPassword() {
  return useMutation<{ message: string }, any, { email: string }>({
    mutationFn: async (payload) => {
      const response = await fetch("/api/staff/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const resData = await response.json();
      if (!response.ok) {
        const err: any = new Error(resData.error || "Failed to process forgot password request");
        err.data = resData;
        throw err;
      }
      return resData;
    },
  });
}

export function useResetPassword() {
  return useMutation<{ message: string }, any, { email: string; resetToken: string; newPassword: string }>({
    mutationFn: async (payload) => {
      const response = await fetch("/api/staff/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const resData = await response.json();
      if (!response.ok) {
        const err: any = new Error(resData.error || "Failed to reset password");
        err.data = resData;
        throw err;
      }
      return resData;
    },
  });
}

export function useChangePassword() {
  return useMutation<{ message: string }, any, { token: string; currentPassword: string; newPassword: string }>({
    mutationFn: async (payload) => {
      const response = await fetch("/api/staff/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${payload.token}`,
        },
        body: JSON.stringify({
          currentPassword: payload.currentPassword,
          newPassword: payload.newPassword,
        }),
      });
      const resData = await response.json();
      if (!response.ok) {
        const err: any = new Error(resData.error || "Failed to change password");
        err.data = resData;
        throw err;
      }
      return resData;
    },
  });
}

// Super Admin HOD Management Hooks
export function useListHods(token?: string) {
  return useQuery<StaffUser[]>({
    queryKey: ["/api/admin/hods", token],
    queryFn: async () => {
      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const response = await fetch("/api/admin/hods", { headers });
      if (!response.ok) throw response;
      return response.json();
    },
    enabled: Boolean(token),
  });
}

export function useCreateHod() {
  return useMutation<StaffUser, any, { token: string; data: { name: string; username: string; email: string; password: string; department: string } }>({
    mutationFn: async (payload) => {
      const response = await fetch("/api/admin/hods", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${payload.token}`,
        },
        body: JSON.stringify(payload.data),
      });
      const resData = await response.json();
      if (!response.ok) {
        const err: any = new Error(resData.error || "Failed to create HOD account");
        err.data = resData;
        throw err;
      }
      return resData;
    },
  });
}

export function useUpdateHod() {
  return useMutation<StaffUser, any, { token: string; id: number; data: { name?: string; email?: string; department?: string; isActive?: boolean } }>({
    mutationFn: async (payload) => {
      const response = await fetch(`/api/admin/hods/${payload.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${payload.token}`,
        },
        body: JSON.stringify(payload.data),
      });
      const resData = await response.json();
      if (!response.ok) {
        const err: any = new Error(resData.error || "Failed to update HOD account");
        err.data = resData;
        throw err;
      }
      return resData;
    },
  });
}

export function useResetHodPassword() {
  return useMutation<{ message: string }, any, { token: string; id: number; newPassword: string }>({
    mutationFn: async (payload) => {
      const response = await fetch(`/api/admin/hods/${payload.id}/reset-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${payload.token}`,
        },
        body: JSON.stringify({ newPassword: payload.newPassword }),
      });
      const resData = await response.json();
      if (!response.ok) {
        const err: any = new Error(resData.error || "Failed to reset HOD password");
        err.data = resData;
        throw err;
      }
      return resData;
    },
  });
}

export function useBulkResetHodPassword() {
  return useMutation<{ message: string; count: number }, any, { token: string; newPassword: string }>({
    mutationFn: async (payload) => {
      const response = await fetch("/api/admin/hods/bulk-reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${payload.token}`,
        },
        body: JSON.stringify({ newPassword: payload.newPassword }),
      });
      const resData = await response.json();
      if (!response.ok) {
        const err: any = new Error(resData.error || "Failed to reset password for all HODs");
        err.data = resData;
        throw err;
      }
      return resData;
    },
  });
}

export function useCreateRequest() {
  return useMutation<ReissueRequest, any, { data: Partial<ReissueRequest> }>({
    mutationFn: async (payload) => {
      const response = await fetch("/api/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload.data),
      });
      const resData = await response.json();
      if (!response.ok) {
        const err: any = new Error(resData.error || "Failed to create request");
        err.data = resData;
        throw err;
      }
      return resData;
    },
  });
}

export function useHodAction() {
  return useMutation<ReissueRequest, any, { id: number; token?: string; data: { action: "APPROVE" | "REJECT"; remark?: string; hodName?: string } }>({
    mutationFn: async (payload) => {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (payload.token) headers["Authorization"] = `Bearer ${payload.token}`;

      const response = await fetch(`/api/requests/${payload.id}/hod-action`, {
        method: "POST",
        headers,
        body: JSON.stringify(payload.data),
      });
      const resData = await response.json();
      if (!response.ok) {
        const err: any = new Error(resData.error || "HOD action failed");
        err.data = resData;
        err.status = response.status;
        throw err;
      }
      return resData;
    },
  });
}

export function usePrincipalAction() {
  return useMutation<ReissueRequest, any, { id: number; token?: string; data: { action: "APPROVE" | "REJECT"; remark?: string; principalName?: string } }>({
    mutationFn: async (payload) => {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (payload.token) headers["Authorization"] = `Bearer ${payload.token}`;

      const response = await fetch(`/api/requests/${payload.id}/principal-action`, {
        method: "POST",
        headers,
        body: JSON.stringify(payload.data),
      });
      const resData = await response.json();
      if (!response.ok) {
        const err: any = new Error(resData.error || "Principal action failed");
        err.data = resData;
        err.status = response.status;
        throw err;
      }
      return resData;
    },
  });
}

export function useAdminAction() {
  return useMutation<ReissueRequest, any, { id: number; token?: string; data: { action: string; note?: string } }>({
    mutationFn: async (payload) => {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (payload.token) headers["Authorization"] = `Bearer ${payload.token}`;

      const response = await fetch(`/api/requests/${payload.id}/admin-action`, {
        method: "POST",
        headers,
        body: JSON.stringify(payload.data),
      });
      const resData = await response.json();
      if (!response.ok) {
        const err: any = new Error(resData.error || "Admin action failed");
        err.data = resData;
        err.status = response.status;
        throw err;
      }
      return resData;
    },
  });
}

export function usePayRequest() {
  return useMutation<ReissueRequest, any, { id: number; data: { paymentMethod: string; transactionId: string } }>({
    mutationFn: async (payload) => {
      const response = await fetch(`/api/requests/${payload.id}/pay`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload.data),
      });
      const resData = await response.json();
      if (!response.ok) {
        const err: any = new Error(resData.error || "Payment failed");
        err.data = resData;
        throw err;
      }
      return resData;
    },
  });
}

export function useVerifyQr() {
  return useMutation<{ verified: boolean; request?: ReissueRequest; message?: string }, any, { requestNumber: string; token?: string }>({
    mutationFn: async (payload) => {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (payload.token) headers["Authorization"] = `Bearer ${payload.token}`;

      const response = await fetch("/api/requests/verify-qr", {
        method: "POST",
        headers,
        body: JSON.stringify({ requestNumber: payload.requestNumber }),
      });
      const resData = await response.json();
      if (!response.ok) {
        const err: any = new Error(resData.error || "QR Verification failed");
        err.data = resData;
        err.status = response.status;
        throw err;
      }
      return resData;
    },
  });
}

export function useCollectCard() {
  return useMutation<ReissueRequest, any, { id: number; token?: string; data: { staffId?: string; remarks?: string } }>({
    mutationFn: async (payload) => {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (payload.token) headers["Authorization"] = `Bearer ${payload.token}`;

      const response = await fetch(`/api/requests/${payload.id}/collect`, {
        method: "POST",
        headers,
        body: JSON.stringify(payload.data),
      });
      const resData = await response.json();
      if (!response.ok) {
        const err: any = new Error(resData.error || "Collection update failed");
        err.data = resData;
        err.status = response.status;
        throw err;
      }
      return resData;
    },
  });
}

export function useGetRequest(id: number, options?: Omit<UseQueryOptions<any, unknown, any, readonly unknown[]>, "queryKey" | "queryFn">) {
  return useQuery({
    queryKey: ["/api/requests", id],
    queryFn: async () => {
      const response = await fetch(`/api/requests/${id}`);
      if (!response.ok) throw response;
      return response.json();
    },
    ...options,
  });
}

export function useUpdateRequestStatus() {
  return useMutation<ReissueRequest, any, { id: number; data: { status: string; adminNote?: string | null } }>({
    mutationFn: async (payload) => {
      const response = await fetch(`/api/requests/${payload.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload.data),
      });
      const resData = await response.json();
      if (!response.ok) {
        const err: any = new Error(resData.error || "Update status failed");
        err.data = resData;
        throw err;
      }
      return resData;
    },
  });
}

export function useGetMyRequest(
  params: { email: string },
  options?: Omit<UseQueryOptions<any, unknown, any, readonly unknown[]>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: ["/api/my-request", params.email],
    queryFn: async () => {
      const response = await fetch(`/api/my-request?email=${encodeURIComponent(params.email)}`);
      if (!response.ok) throw response;
      return response.json();
    },
    ...options,
  });
}

export function useGetNotifications(
  params: { email: string },
  options?: Omit<UseQueryOptions<NotificationRecord[], unknown, NotificationRecord[], readonly unknown[]>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: ["/api/notifications", params.email],
    queryFn: async () => {
      const response = await fetch(`/api/notifications?email=${encodeURIComponent(params.email)}`);
      if (!response.ok) throw response;
      return response.json();
    },
    ...options,
  });
}

export function useMarkNotificationRead() {
  return useMutation<{ success: boolean }, any, { id: number }>({
    mutationFn: async (payload) => {
      const response = await fetch(`/api/notifications/${payload.id}/read`, {
        method: "PATCH",
      });
      const resData = await response.json();
      if (!response.ok) {
        const err: any = new Error(resData.error || "Failed to mark read");
        err.data = resData;
        throw err;
      }
      return resData;
    },
  });
}

export function useGetAuditLogs(
  requestId: number | string,
  options?: Omit<UseQueryOptions<AuditLogRecord[], unknown, AuditLogRecord[], readonly unknown[]>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: ["/api/requests", requestId, "audit-trail"],
    queryFn: async () => {
      const response = await fetch(`/api/requests/${requestId}/audit-trail`);
      if (!response.ok) throw response;
      return response.json();
    },
    ...options,
  });
}

export function getGetRequestQueryKey(id: number) {
  return ["/api/requests", id];
}

export function getListRequestsQueryKey(params: Record<string, unknown>) {
  return ["/api/requests", params];
}

export function useGetAdminStats(token?: string) {
  return useQuery({
    queryKey: ["/api/admin/stats", token],
    queryFn: async () => {
      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const response = await fetch("/api/admin/stats", { headers });
      if (!response.ok) throw response;
      return response.json();
    },
  });
}

export function useListRequests(
  params: Record<string, unknown> & { token?: string },
  options?: Omit<UseQueryOptions<any, unknown, any, readonly unknown[]>, "queryKey" | "queryFn">
) {
  const { token, ...queryParams } = params;
  const queryString = new URLSearchParams(
    Object.entries(queryParams)
      .filter(([, value]) => value != null)
      .map(([key, value]) => [key, String(value)])
  ).toString();

  return useQuery({
    queryKey: ["/api/requests", queryString, token],
    queryFn: async () => {
      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const response = await fetch(`/api/requests?${queryString}`, { headers });
      if (!response.ok) throw response;
      return response.json();
    },
    ...options,
  });
}

export type HodStatsResponse = {
  pending: number;
  approved: number;
  rejected: number;
  total: number;
  department: string;
  hodName: string;
};

export function useGetHodApplications(
  params: { token: string; status?: string; search?: string },
  options?: Omit<UseQueryOptions<ReissueRequest[], unknown, ReissueRequest[], readonly unknown[]>, "queryKey" | "queryFn">
) {
  const { token, status, search } = params;
  const q = new URLSearchParams();
  if (status) q.set("status", status);
  if (search) q.set("search", search);
  const qs = q.toString() ? `?${q.toString()}` : "";

  return useQuery({
    queryKey: ["/api/hod/applications", token, status, search],
    queryFn: async () => {
      const response = await fetch(`/api/hod/applications${qs}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (!response.ok) {
        const err: any = new Error(data.error || "Failed to fetch HOD applications");
        err.data = data;
        err.status = response.status;
        throw err;
      }
      return data;
    },
    enabled: Boolean(token),
    ...options,
  });
}

export function useGetHodStats(
  token?: string,
  options?: Omit<UseQueryOptions<HodStatsResponse, unknown, HodStatsResponse, readonly unknown[]>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: ["/api/hod/stats", token],
    queryFn: async () => {
      const response = await fetch("/api/hod/stats", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await response.json();
      if (!response.ok) {
        const err: any = new Error(data.error || "Failed to fetch HOD stats");
        err.data = data;
        err.status = response.status;
        throw err;
      }
      return data;
    },
    enabled: Boolean(token),
    ...options,
  });
}

export function useHodApproveApplication() {
  return useMutation<ReissueRequest, any, { id: number; token: string; remark?: string; hodName?: string }>({
    mutationFn: async (payload) => {
      const response = await fetch(`/api/hod/applications/${payload.id}/approve`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${payload.token}`,
        },
        body: JSON.stringify({ remark: payload.remark, hodName: payload.hodName }),
      });
      const data = await response.json();
      if (!response.ok) {
        const err: any = new Error(data.error || "Failed to approve application");
        err.data = data;
        err.status = response.status;
        throw err;
      }
      return data;
    },
  });
}

export function useHodRejectApplication() {
  return useMutation<ReissueRequest, any, { id: number; token: string; reason: string; hodName?: string }>({
    mutationFn: async (payload) => {
      const response = await fetch(`/api/hod/applications/${payload.id}/reject`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${payload.token}`,
        },
        body: JSON.stringify({ reason: payload.reason, hodName: payload.hodName }),
      });
      const data = await response.json();
      if (!response.ok) {
        const err: any = new Error(data.error || "Failed to reject application");
        err.data = data;
        err.status = response.status;
        throw err;
      }
      return data;
    },
  });
}
