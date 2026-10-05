import { pgTable, text, serial, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const studentsTable = pgTable("students", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  studentName: text("student_name").notNull(),
  registerNumber: text("register_number").notNull().unique(),
  branch: text("branch").notNull(),
  year: text("year").notNull(),
  semester: text("semester").notNull(),
  mobileNumber: text("mobile_number").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertStudentSchema = createInsertSchema(studentsTable).omit({
  id: true,
  createdAt: true,
});

export type InsertStudent = z.infer<typeof insertStudentSchema>;
export type Student = typeof studentsTable.$inferSelect;
