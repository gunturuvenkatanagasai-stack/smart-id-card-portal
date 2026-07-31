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
  mobileNumber: text("mobile_number").notNull(),
  email: text("email").notNull(),
  reason: text("reason").notNull(),
  photoUrl: text("photo_url"),
  status: text("status").notNull().default("pending"),
  paymentId: text("payment_id"),
  paymentMethod: text("payment_method"),
  paymentAmount: numeric("payment_amount", { precision: 10, scale: 2 }),
  adminNote: text("admin_note"),
  paidAt: timestamp("paid_at", { withTimezone: true }),
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
