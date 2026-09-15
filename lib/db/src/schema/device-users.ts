import { doublePrecision, integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const deviceUsersTable = pgTable("device_users", {
  deviceId: text("device_id").primaryKey(),
  displayName: text("display_name"),
  reputationScore: integer("reputation_score").notNull().default(0),
  lastConfirmedZoneId: integer("last_confirmed_zone_id"),
  lastConfirmedAt: timestamp("last_confirmed_at", { withTimezone: true }),
  lastConfirmedLat: doublePrecision("last_confirmed_lat"),
  lastConfirmedLng: doublePrecision("last_confirmed_lng"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertDeviceUserSchema = createInsertSchema(deviceUsersTable).omit({
  createdAt: true,
});
export type InsertDeviceUser = z.infer<typeof insertDeviceUserSchema>;
export type DeviceUser = typeof deviceUsersTable.$inferSelect;