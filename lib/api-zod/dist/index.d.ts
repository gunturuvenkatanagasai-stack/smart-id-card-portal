import { z } from "zod/v4";
export declare const SendOtpBody: z.ZodObject<{
    email: z.ZodString;
}, z.core.$strip>;
export declare const ResendOtpBody: z.ZodObject<{
    email: z.ZodString;
}, z.core.$strip>;
export declare const VerifyOtpBody: z.ZodObject<{
    email: z.ZodString;
    otp: z.ZodString;
}, z.core.$strip>;
export declare const HealthCheckResponse: z.ZodObject<{
    status: z.ZodEnum<{
        ok: "ok";
    }>;
}, z.core.$strip>;
export declare const StaffLoginBody: z.ZodObject<{
    identifier: z.ZodOptional<z.ZodString>;
    email: z.ZodOptional<z.ZodString>;
    username: z.ZodOptional<z.ZodString>;
    password: z.ZodString;
}, z.core.$strip>;
export declare const ForgotPasswordBody: z.ZodObject<{
    email: z.ZodString;
}, z.core.$strip>;
export declare const ResetPasswordBody: z.ZodObject<{
    email: z.ZodString;
    resetToken: z.ZodString;
    newPassword: z.ZodString;
}, z.core.$strip>;
export declare const ChangePasswordBody: z.ZodObject<{
    currentPassword: z.ZodString;
    newPassword: z.ZodString;
}, z.core.$strip>;
export declare const CreateHodBody: z.ZodObject<{
    name: z.ZodString;
    username: z.ZodString;
    email: z.ZodString;
    password: z.ZodString;
    department: z.ZodString;
}, z.core.$strip>;
export declare const UpdateHodBody: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    email: z.ZodOptional<z.ZodString>;
    department: z.ZodOptional<z.ZodString>;
    isActive: z.ZodOptional<z.ZodBoolean>;
}, z.core.$strip>;
export declare const ResetHodPasswordBody: z.ZodObject<{
    newPassword: z.ZodString;
}, z.core.$strip>;
export declare const BulkResetHodPasswordBody: z.ZodObject<{
    newPassword: z.ZodString;
}, z.core.$strip>;
export declare const CreateRequestBody: z.ZodObject<{
    studentName: z.ZodString;
    registerNumber: z.ZodString;
    branch: z.ZodString;
    year: z.ZodString;
    semester: z.ZodString;
    section: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    mobileNumber: z.ZodString;
    email: z.ZodString;
    reason: z.ZodString;
    dateOfLoss: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    locationOfLoss: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    additionalRemarks: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, z.core.$strip>;
export declare const GetRequestParams: z.ZodObject<{
    id: z.ZodCoercedNumber<unknown>;
}, z.core.$strip>;
export declare const ListRequestsQueryParams: z.ZodObject<{
    status: z.ZodOptional<z.ZodString>;
    branch: z.ZodOptional<z.ZodString>;
    search: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const PayRequestParams: z.ZodObject<{
    id: z.ZodCoercedNumber<unknown>;
}, z.core.$strip>;
export declare const PayRequestBody: z.ZodObject<{
    transactionId: z.ZodString;
    paymentMethod: z.ZodString;
}, z.core.$strip>;
export declare const UpdateRequestStatusParams: z.ZodObject<{
    id: z.ZodCoercedNumber<unknown>;
}, z.core.$strip>;
export declare const UpdateRequestStatusBody: z.ZodObject<{
    status: z.ZodString;
    adminNote: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const HodActionParams: z.ZodObject<{
    id: z.ZodCoercedNumber<unknown>;
}, z.core.$strip>;
export declare const HodActionBody: z.ZodObject<{
    action: z.ZodEnum<{
        APPROVE: "APPROVE";
        REJECT: "REJECT";
    }>;
    remark: z.ZodOptional<z.ZodString>;
    hodName: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const PrincipalActionParams: z.ZodObject<{
    id: z.ZodCoercedNumber<unknown>;
}, z.core.$strip>;
export declare const PrincipalActionBody: z.ZodObject<{
    action: z.ZodEnum<{
        APPROVE: "APPROVE";
        REJECT: "REJECT";
    }>;
    remark: z.ZodOptional<z.ZodString>;
    principalName: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const AdminActionParams: z.ZodObject<{
    id: z.ZodCoercedNumber<unknown>;
}, z.core.$strip>;
export declare const AdminActionBody: z.ZodObject<{
    action: z.ZodEnum<{
        REJECT: "REJECT";
        VERIFY: "VERIFY";
        START_PRINTING: "START_PRINTING";
        MARK_PRINTED: "MARK_PRINTED";
        QUALITY_CHECKED: "QUALITY_CHECKED";
        MARK_READY: "MARK_READY";
        MARK_COLLECTED: "MARK_COLLECTED";
    }>;
    note: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const VerifyQrBody: z.ZodObject<{
    requestNumber: z.ZodString;
}, z.core.$strip>;
export declare const CollectCardParams: z.ZodObject<{
    id: z.ZodCoercedNumber<unknown>;
}, z.core.$strip>;
export declare const CollectCardBody: z.ZodObject<{
    staffId: z.ZodOptional<z.ZodString>;
    remarks: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const GetMyRequestQueryParams: z.ZodObject<{
    email: z.ZodString;
}, z.core.$strip>;
export declare const GetNotificationsQueryParams: z.ZodObject<{
    email: z.ZodString;
}, z.core.$strip>;
export declare const MarkNotificationReadParams: z.ZodObject<{
    id: z.ZodCoercedNumber<unknown>;
}, z.core.$strip>;
//# sourceMappingURL=index.d.ts.map