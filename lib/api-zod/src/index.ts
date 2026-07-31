import { z } from "zod/v4";

export const SendOtpBody = z.object({
  email: z.string().email(),
});

export const VerifyOtpBody = z.object({
  email: z.string().email(),
  otp: z.string().min(4),
});

export const HealthCheckResponse = z.object({
  status: z.enum(["ok"]),
});

export const CreateRequestBody = z.object({
  studentName: z.string().min(1),
  registerNumber: z.string().min(1),
  branch: z.string().min(1),
  year: z.string().min(1),
  semester: z.string().min(1),
  mobileNumber: z.string().min(1),
  email: z.string().email(),
  reason: z.string().min(1),
  photoUrl: z.string().url().optional().nullable(),
});

export const GetRequestParams = z.object({
  id: z.coerce.number().int().positive(),
});

export const ListRequestsQueryParams = z.object({
  status: z.string().optional(),
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
  status: z.enum(["pending", "approved", "rejected", "ready_to_collect", "collected"]),
  adminNote: z.string().optional(),
});

export const GetMyRequestQueryParams = z.object({
  email: z.string().email(),
});
