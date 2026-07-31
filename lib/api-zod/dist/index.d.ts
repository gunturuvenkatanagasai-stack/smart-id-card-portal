import { z } from "zod";
export declare const SendOtpBody: z.ZodObject<{
    email: z.ZodString;
}, "strip", z.ZodTypeAny, {
    email: string;
}, {
    email: string;
}>;
export declare const VerifyOtpBody: z.ZodObject<{
    email: z.ZodString;
    otp: z.ZodString;
}, "strip", z.ZodTypeAny, {
    email: string;
    otp: string;
}, {
    email: string;
    otp: string;
}>;
export declare const HealthCheckResponse: z.ZodObject<{
    status: z.ZodLiteral<"ok">;
}, "strip", z.ZodTypeAny, {
    status: "ok";
}, {
    status: "ok";
}>;
export declare const CreateRequestBody: z.ZodObject<{
    studentName: z.ZodString;
    registerNumber: z.ZodString;
    branch: z.ZodString;
    year: z.ZodString;
    semester: z.ZodString;
    mobileNumber: z.ZodString;
    email: z.ZodString;
    reason: z.ZodString;
    photoUrl: z.ZodOptional<z.ZodNullable<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    email: string;
    studentName: string;
    registerNumber: string;
    branch: string;
    year: string;
    semester: string;
    mobileNumber: string;
    reason: string;
    photoUrl?: string | null | undefined;
}, {
    email: string;
    studentName: string;
    registerNumber: string;
    branch: string;
    year: string;
    semester: string;
    mobileNumber: string;
    reason: string;
    photoUrl?: string | null | undefined;
}>;
export declare const PayRequestBody: z.ZodObject<{
    transactionId: z.ZodString;
    paymentMethod: z.ZodString;
}, "strip", z.ZodTypeAny, {
    transactionId: string;
    paymentMethod: string;
}, {
    transactionId: string;
    paymentMethod: string;
}>;
export declare const ListRequestsQueryParams: z.ZodObject<{
    status: z.ZodOptional<z.ZodString>;
    search: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    status?: string | undefined;
    search?: string | undefined;
}, {
    status?: string | undefined;
    search?: string | undefined;
}>;
export declare const GetRequestParams: z.ZodObject<{
    id: z.ZodString;
}, "strip", z.ZodTypeAny, {
    id: string;
}, {
    id: string;
}>;
export declare const PayRequestParams: z.ZodObject<{
    id: z.ZodString;
}, "strip", z.ZodTypeAny, {
    id: string;
}, {
    id: string;
}>;
export declare const UpdateRequestStatusParams: z.ZodObject<{
    id: z.ZodString;
}, "strip", z.ZodTypeAny, {
    id: string;
}, {
    id: string;
}>;
export declare const UpdateRequestStatusBody: z.ZodObject<{
    status: z.ZodString;
    adminNote: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    status: string;
    adminNote?: string | undefined;
}, {
    status: string;
    adminNote?: string | undefined;
}>;
export declare const GetMyRequestQueryParams: z.ZodObject<{
    email: z.ZodString;
}, "strip", z.ZodTypeAny, {
    email: string;
}, {
    email: string;
}>;
//# sourceMappingURL=index.d.ts.map