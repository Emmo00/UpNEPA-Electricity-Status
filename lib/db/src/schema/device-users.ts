import { integer, text, timestamp, pgTable } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const deviceUsersTable = pgTable("device_users", {
  deviceId: text("device_id").primaryKey(),
  displayName: text("display_name"),
  reputationScore: integer("reputation_score").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertDeviceUserSchema = createInsertSchema(deviceUsersTable).omit({
  createdAt: true,
});
export type InsertDeviceUser = z.infer<typeof insertDeviceUserSchema>;
export type DeviceUser = typeof deviceUsersTable.$inferSelect;