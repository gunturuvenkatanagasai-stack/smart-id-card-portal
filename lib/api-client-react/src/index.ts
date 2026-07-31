import { useQuery, useMutation, QueryClient, UseQueryOptions } from "@tanstack/react-query";

export type ReissueRequest = {
  id: number;
  requestNumber: string;
  studentName: string;
  registerNumber: string;
  branch: string;
  year: string;
  semester: string;
  mobileNumber: string;
  email: string;
  reason: string;
  photoUrl: string | null;
  status: string;
  paymentAmount: number | null;
  paidAt: string | null;
  createdAt: string;
  updatedAt: string;
  adminNote?: string | null;
};

export type SendOtpInput = { data: { email: string } };
export type VerifyOtpInput = { data: { email: string; otp: string } };

export type OtpResponse = { otp?: string; email?: string };
export type UpdateStatusBodyStatus = "pending" | "payment_pending" | "approved" | "ready_to_collect" | "collected";

export const queryClient = new QueryClient();

export function useSendOtp() {
  return useMutation(async (payload: SendOtpInput) => {
    const response = await fetch("/api/auth/send-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload.data),
    });
    if (!response.ok) throw response;
    return response.json();
  });
}

export function useVerifyOtp() {
  return useMutation(async (payload: VerifyOtpInput) => {
    const response = await fetch("/api/auth/verify-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload.data),
    });
    if (!response.ok) throw response;
    return response.json();
  });
}

export function useCreateRequest() {
  return useMutation(async (payload: { data: Omit<ReissueRequest, "id" | "requestNumber" | "createdAt" | "updatedAt" | "status"> }) => {
    const response = await fetch("/api/requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload.data),
    });
    if (!response.ok) throw response;
    return response.json();
  });
}

export function usePayRequest() {
  return useMutation(async (payload: { id: number; data: { paymentMethod: string; transactionId: string } }) => {
    const response = await fetch(`/api/requests/${payload.id}/pay`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload.data),
    });
    if (!response.ok) throw response;
    return response.json();
  });
}

export function useGetRequest(id: number, options?: UseQueryOptions<any, unknown, any, readonly unknown[]>) {
  return useQuery(["/api/requests", id], async () => {
    const response = await fetch(`/api/requests/${id}`);
    if (!response.ok) throw response;
    return response.json();
  }, options);
}

export function getGetRequestQueryKey(id: number) {
  return ["/api/requests", id];
}

export function useUpdateRequestStatus() {
  return useMutation(async (payload: { id: number; data: { status: UpdateStatusBodyStatus; adminNote?: string | null } }) => {
    const response = await fetch(`/api/requests/${payload.id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload.data),
    });
    if (!response.ok) throw response;
    return response.json();
  });
}

export function useGetMyRequest(
  params: { email: string },
  options?: UseQueryOptions<any, unknown, any, readonly unknown[]>
) {
  return useQuery(["/api/my-request", params.email], async () => {
    const response = await fetch(`/api/my-request?email=${encodeURIComponent(params.email)}`);
    if (!response.ok) throw response;
    return response.json();
  }, options);
}

export function useGetAdminStats() {
  return useQuery(["/api/admin/stats"], async () => {
    const response = await fetch("/api/admin/stats");
    if (!response.ok) throw response;
    return response.json();
  });
}

export function useListRequests(
  params: Record<string, unknown>,
  options?: UseQueryOptions<any, unknown, any, readonly unknown[]>
) {
  const queryString = new URLSearchParams(Object.entries(params).filter(([, value]) => value != null).map(([key, value]) => [key, String(value)])).toString();
  return useQuery(["/api/requests", queryString], async () => {
    const response = await fetch(`/api/requests?${queryString}`);
    if (!response.ok) throw response;
    return response.json();
  }, options);
}

export function getListRequestsQueryKey(params: Record<string, unknown>) {
  return ["/api/requests", params];
}
