import { QueryClient, UseQueryOptions } from "@tanstack/react-query";
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
    role: string;
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
export type SendOtpInput = {
    data: {
        email: string;
    };
};
export type ResendOtpInput = {
    data: {
        email: string;
    };
};
export type VerifyOtpInput = {
    data: {
        email: string;
        otp: string;
    };
};
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
export declare const queryClient: QueryClient;
export declare function useSendOtp(): import("@tanstack/react-query").UseMutationResult<SendOtpResponse, any, SendOtpInput, unknown>;
export declare function useResendOtp(): import("@tanstack/react-query").UseMutationResult<SendOtpResponse, any, ResendOtpInput, unknown>;
export declare function useVerifyOtp(): import("@tanstack/react-query").UseMutationResult<VerifyOtpResponse, any, VerifyOtpInput, unknown>;
export declare function useStaffLogin(): import("@tanstack/react-query").UseMutationResult<StaffLoginResponse, any, {
    data: {
        identifier?: string;
        email?: string;
        password: string;
    };
}, unknown>;
export declare function useForgotPassword(): import("@tanstack/react-query").UseMutationResult<{
    message: string;
}, any, {
    email: string;
}, unknown>;
export declare function useResetPassword(): import("@tanstack/react-query").UseMutationResult<{
    message: string;
}, any, {
    email: string;
    resetToken: string;
    newPassword: string;
}, unknown>;
export declare function useChangePassword(): import("@tanstack/react-query").UseMutationResult<{
    message: string;
}, any, {
    token: string;
    currentPassword: string;
    newPassword: string;
}, unknown>;
export declare function useListHods(token?: string): import("@tanstack/react-query").UseQueryResult<NoInfer<StaffUser[]>, Error>;
export declare function useCreateHod(): import("@tanstack/react-query").UseMutationResult<StaffUser, any, {
    token: string;
    data: {
        name: string;
        username: string;
        email: string;
        password: string;
        department: string;
    };
}, unknown>;
export declare function useUpdateHod(): import("@tanstack/react-query").UseMutationResult<StaffUser, any, {
    token: string;
    id: number;
    data: {
        name?: string;
        email?: string;
        department?: string;
        isActive?: boolean;
    };
}, unknown>;
export declare function useResetHodPassword(): import("@tanstack/react-query").UseMutationResult<{
    message: string;
}, any, {
    token: string;
    id: number;
    newPassword: string;
}, unknown>;
export declare function useBulkResetHodPassword(): import("@tanstack/react-query").UseMutationResult<{
    message: string;
    count: number;
}, any, {
    token: string;
    newPassword: string;
}, unknown>;
export declare function useCreateRequest(): import("@tanstack/react-query").UseMutationResult<ReissueRequest, any, {
    data: Partial<ReissueRequest>;
}, unknown>;
export declare function useHodAction(): import("@tanstack/react-query").UseMutationResult<ReissueRequest, any, {
    id: number;
    token?: string;
    data: {
        action: "APPROVE" | "REJECT";
        remark?: string;
        hodName?: string;
    };
}, unknown>;
export declare function usePrincipalAction(): import("@tanstack/react-query").UseMutationResult<ReissueRequest, any, {
    id: number;
    token?: string;
    data: {
        action: "APPROVE" | "REJECT";
        remark?: string;
        principalName?: string;
    };
}, unknown>;
export declare function useAdminAction(): import("@tanstack/react-query").UseMutationResult<ReissueRequest, any, {
    id: number;
    token?: string;
    data: {
        action: string;
        note?: string;
    };
}, unknown>;
export declare function usePayRequest(): import("@tanstack/react-query").UseMutationResult<ReissueRequest, any, {
    id: number;
    data: {
        paymentMethod: string;
        transactionId: string;
    };
}, unknown>;
export declare function useVerifyQr(): import("@tanstack/react-query").UseMutationResult<{
    verified: boolean;
    request?: ReissueRequest;
    message?: string;
}, any, {
    requestNumber: string;
    token?: string;
}, unknown>;
export declare function useCollectCard(): import("@tanstack/react-query").UseMutationResult<ReissueRequest, any, {
    id: number;
    token?: string;
    data: {
        staffId?: string;
        remarks?: string;
    };
}, unknown>;
export declare function useGetRequest(id: number, options?: Omit<UseQueryOptions<any, unknown, any, readonly unknown[]>, "queryKey" | "queryFn">): import("@tanstack/react-query").UseQueryResult<any, unknown>;
export declare function useUpdateRequestStatus(): import("@tanstack/react-query").UseMutationResult<ReissueRequest, any, {
    id: number;
    data: {
        status: string;
        adminNote?: string | null;
    };
}, unknown>;
export declare function useGetMyRequest(params: {
    email: string;
}, options?: Omit<UseQueryOptions<any, unknown, any, readonly unknown[]>, "queryKey" | "queryFn">): import("@tanstack/react-query").UseQueryResult<any, unknown>;
export declare function useGetNotifications(params: {
    email: string;
}, options?: Omit<UseQueryOptions<NotificationRecord[], unknown, NotificationRecord[], readonly unknown[]>, "queryKey" | "queryFn">): import("@tanstack/react-query").UseQueryResult<NoInfer<NotificationRecord[]>, unknown>;
export declare function useMarkNotificationRead(): import("@tanstack/react-query").UseMutationResult<{
    success: boolean;
}, any, {
    id: number;
}, unknown>;
export declare function useGetAuditLogs(requestId: number | string, options?: Omit<UseQueryOptions<AuditLogRecord[], unknown, AuditLogRecord[], readonly unknown[]>, "queryKey" | "queryFn">): import("@tanstack/react-query").UseQueryResult<NoInfer<AuditLogRecord[]>, unknown>;
export declare function getGetRequestQueryKey(id: number): (string | number)[];
export declare function getListRequestsQueryKey(params: Record<string, unknown>): (string | Record<string, unknown>)[];
export declare function useGetAdminStats(token?: string): import("@tanstack/react-query").UseQueryResult<any, Error>;
export declare function useListRequests(params: Record<string, unknown> & {
    token?: string;
}, options?: Omit<UseQueryOptions<any, unknown, any, readonly unknown[]>, "queryKey" | "queryFn">): import("@tanstack/react-query").UseQueryResult<any, unknown>;
export type HodStatsResponse = {
    pending: number;
    approved: number;
    rejected: number;
    total: number;
    department: string;
    hodName: string;
};
export declare function useGetHodApplications(params: {
    token: string;
    status?: string;
    search?: string;
}, options?: Omit<UseQueryOptions<ReissueRequest[], unknown, ReissueRequest[], readonly unknown[]>, "queryKey" | "queryFn">): import("@tanstack/react-query").UseQueryResult<NoInfer<ReissueRequest[]>, unknown>;
export declare function useGetHodStats(token?: string, options?: Omit<UseQueryOptions<HodStatsResponse, unknown, HodStatsResponse, readonly unknown[]>, "queryKey" | "queryFn">): import("@tanstack/react-query").UseQueryResult<NoInfer<HodStatsResponse>, unknown>;
export declare function useHodApproveApplication(): import("@tanstack/react-query").UseMutationResult<ReissueRequest, any, {
    id: number;
    token: string;
    remark?: string;
    hodName?: string;
}, unknown>;
export declare function useHodRejectApplication(): import("@tanstack/react-query").UseMutationResult<ReissueRequest, any, {
    id: number;
    token: string;
    reason: string;
    hodName?: string;
}, unknown>;
//# sourceMappingURL=index.d.ts.map