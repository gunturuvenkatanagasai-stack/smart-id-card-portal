import { pgTable, text, serial, timestamp, numeric } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const requestsTable = pgTable("id_reissue_requests", {
  id: serial("id").primaryKey(),
  requestNumber: text("request_number").notNull().unique(),
  studentName: text("student_name").notNull(),
  registerNumber: text("register_number").notNull(),
  branch: text("branch").notNull(),
  year: text("year").notNull(),
  semester: text("semester").notNull(),
  section: text("section"),
  mobileNumber: text("mobile_number").notNull(),
  email: text("email").notNull(),
  reason: text("reason").notNull(),
  dateOfLoss: text("date_of_loss"),
  locationOfLoss: text("location_of_loss"),
  additionalRemarks: text("additional_remarks"),
  status: text("status").notNull().default("PENDING_HOD_APPROVAL"),
  
  // HOD Approval Fields
  hodNote: text("hod_note"),
  hodApprovedAt: timestamp("hod_approved_at", { withTimezone: true }),
  hodApprovedBy: text("hod_approved_by"),

  // Principal Approval Fields
  principalNote: text("principal_note"),
  principalApprovedAt: timestamp("principal_approved_at", { withTimezone: true }),
  principalApprovedBy: text("principal_approved_by"),

  // Admin Verification & Status Fields
  adminNote: text("admin_note"),
  adminVerifiedAt: timestamp("admin_verified_at", { withTimezone: true }),

  // Payment Details
  paymentId: text("payment_id"),
  paymentMethod: text("payment_method"),
  paymentAmount: numeric("payment_amount", { precision: 10, scale: 2 }),
  paidAt: timestamp("paid_at", { withTimezone: true }),

  // Collection Details
  collectedAt: timestamp("collected_at", { withTimezone: true }),
  collectedByStaff: text("collected_by_staff"),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertRequestSchema = createInsertSchema(requestsTable).omit({
  id: true,
  requestNumber: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertRequest = z.infer<typeof insertRequestSchema>;
export type Request = typeof requestsTable.$inferSelect;
