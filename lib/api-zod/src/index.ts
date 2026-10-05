import { z } from "zod/v4";

export const SendOtpBody = z.object({
  email: z.string().email(),
});

export const ResendOtpBody = z.object({
  email: z.string().email(),
});

export const VerifyOtpBody = z.object({
  email: z.string().trim().email(),
  otp: z.string().trim().regex(/^\d{6}$/, "OTP must be exactly 6 digits"),
});

export const HealthCheckResponse = z.object({
  status: z.enum(["ok"]),
});

export const StaffLoginBody = z.object({
  identifier: z.string().trim().optional(),
  email: z.string().trim().optional(),
  username: z.string().trim().optional(),
  password: z.string().min(1, "Password is required"),
}).refine((data) => Boolean(data.identifier || data.email || data.username), {
  message: "Please enter your username or official email address.",
});

export const ForgotPasswordBody = z.object({
  email: z.string().trim().email(),
});

export const ResetPasswordBody = z.object({
  email: z.string().trim().email(),
  resetToken: z.string().min(1, "Reset token is required"),
  newPassword: z.string().min(8, "Password must be at least 8 characters long"),
});

export const ChangePasswordBody = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(8, "Password must be at least 8 characters long"),
});

export const CreateHodBody = z.object({
  name: z.string().min(1, "Full Name is required"),
  username: z.string().min(3, "Username must be at least 3 characters long"),
  email: z.string().email("Valid official email required"),
  password: z.string().min(8, "Password must be at least 8 characters long"),
  department: z.string().min(1, "Department is required"),
});

export const UpdateHodBody = z.object({
  name: z.string().optional(),
  email: z.string().email().optional(),
  department: z.string().optional(),
  isActive: z.boolean().optional(),
});

export const ResetHodPasswordBody = z.object({
  newPassword: z.string().min(8, "Password must be at least 8 characters long"),
});

export const BulkResetHodPasswordBody = z.object({
  newPassword: z.string().min(8, "Password must be at least 8 characters long"),
});

export const CreateRequestBody = z.object({
  studentName: z.string().min(1),
  registerNumber: z.string().min(1),
  branch: z.string().min(1),
  year: z.string().min(1),
  semester: z.string().min(1),
  section: z.string().optional().nullable(),
  mobileNumber: z.string().min(1),
  email: z.string().email(),
  reason: z.string().min(1),
  dateOfLoss: z.string().optional().nullable(),
  locationOfLoss: z.string().optional().nullable(),
  additionalRemarks: z.string().optional().nullable(),
});

export const GetRequestParams = z.object({
  id: z.coerce.number().int().positive(),
});

export const ListRequestsQueryParams = z.object({
  status: z.string().optional(),
  branch: z.string().optional(),
  search: z.string().optional(),
});

export const PayRequestParams = z.object({
  id: z.coerce.number().int().positive(),
});

export const PayRequestBody = z.object({
  transactionId: z.string().min(1),
  paymentMethod: z.string().min(1),
});

export const UpdateRequestStatusParams = z.object({
  id: z.coerce.number().int().positive(),
});

export const UpdateRequestStatusBody = z.object({
  status: z.string().min(1),
  adminNote: z.string().optional(),
});

export const HodActionParams = z.object({
  id: z.coerce.number().int().positive(),
});

export const HodActionBody = z.object({
  action: z.enum(["APPROVE", "REJECT"]),
  remark: z.string().optional(),
  hodName: z.string().optional(),
});

export const PrincipalActionParams = z.object({
  id: z.coerce.number().int().positive(),
});

export const PrincipalActionBody = z.object({
  action: z.enum(["APPROVE", "REJECT"]),
  remark: z.string().optional(),
  principalName: z.string().optional(),
});

export const AdminActionParams = z.object({
  id: z.coerce.number().int().positive(),
});

export const AdminActionBody = z.object({
  action: z.enum(["VERIFY", "REJECT", "START_PRINTING", "MARK_PRINTED", "QUALITY_CHECKED", "MARK_READY", "MARK_COLLECTED"]),
  note: z.string().optional(),
});

export const VerifyQrBody = z.object({
  requestNumber: z.string().min(1),
});

export const CollectCardParams = z.object({
  id: z.coerce.number().int().positive(),
});

export const CollectCardBody = z.object({
  staffId: z.string().optional(),
  remarks: z.string().optional(),
});

export const GetMyRequestQueryParams = z.object({
  email: z.string().email(),
});

export const GetNotificationsQueryParams = z.object({
  email: z.string().email(),
});

export const MarkNotificationReadParams = z.object({
  id: z.coerce.number().int().positive(),
});
