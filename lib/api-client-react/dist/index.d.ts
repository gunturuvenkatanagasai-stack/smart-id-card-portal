import { QueryClient, UseQueryOptions } from "@tanstack/react-query";
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
export type SendOtpInput = {
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
export type OtpResponse = {
    otp?: string;
    email?: string;
};
export declare const queryClient: QueryClient;
export declare function useSendOtp(): import("@tanstack/react-query").UseMutationResult<unknown, Error, void, unknown>;
export declare function useVerifyOtp(): import("@tanstack/react-query").UseMutationResult<unknown, Error, void, unknown>;
export declare function useCreateRequest(): import("@tanstack/react-query").UseMutationResult<unknown, Error, void, unknown>;
export declare function usePayRequest(): import("@tanstack/react-query").UseMutationResult<unknown, Error, void, unknown>;
export declare function useGetMyRequest(params: {
    email: string;
}, options?: UseQueryOptions<any, unknown, any, readonly unknown[]>): import("@tanstack/react-query").DefinedUseQueryResult<unknown, Error>;
export declare function useGetAdminStats(): import("@tanstack/react-query").DefinedUseQueryResult<unknown, Error>;
export declare function useListRequests(params: Record<string, unknown>, options?: UseQueryOptions<any, unknown, any, readonly unknown[]>): import("@tanstack/react-query").DefinedUseQueryResult<unknown, Error>;
export declare function getListRequestsQueryKey(params: Record<string, unknown>): (string | Record<string, unknown>)[];
//# sourceMappingURL=index.d.ts.map