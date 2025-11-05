import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, boolean, jsonb, decimal } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// ==================== USERS ====================
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  email: text("email"),
  phone: text("phone"),
  role: text("role").notNull().default("rider"), // rider, driver, admin
  profilePhoto: text("profile_photo"),
  rating: decimal("rating", { precision: 3, scale: 2 }).default("5.00"),
  totalRides: integer("total_rides").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// ==================== DRIVER PROFILES ====================
export const driverProfiles = pgTable("driver_profiles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: text("user_id").notNull().unique(),
  licenseNumber: text("license_number").notNull(),
  vehicleType: text("vehicle_type").notNull(), // sedan, suv, van
  vehicleMake: text("vehicle_make").notNull(),
  vehicleModel: text("vehicle_model").notNull(),
  vehicleColor: text("vehicle_color").notNull(),
  vehiclePlate: text("vehicle_plate").notNull(),
  vehicleYear: integer("vehicle_year").notNull(),
  isAvailable: boolean("is_available").notNull().default(false),
  currentLocation: jsonb("current_location"), // {lat, lng, address}
  earnings: decimal("earnings", { precision: 10, scale: 2 }).notNull().default("0.00"),
  verificationStatus: text("verification_status").notNull().default("pending"), // pending, approved, rejected
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertDriverProfileSchema = createInsertSchema(driverProfiles).omit({
  id: true,
  createdAt: true,
});
export type InsertDriverProfile = z.infer<typeof insertDriverProfileSchema>;
export type DriverProfile = typeof driverProfiles.$inferSelect;

// ==================== RIDES ====================
export const rides = pgTable("rides", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  riderId: text("rider_id").notNull(),
  driverId: text("driver_id"),
  status: text("status").notNull().default("requested"), // requested, accepted, arrived, in_progress, completed, cancelled
  pickupLocation: jsonb("pickup_location").notNull(), // {lat, lng, address}
  dropoffLocation: jsonb("dropoff_location").notNull(), // {lat, lng, address}
  estimatedDistance: decimal("estimated_distance", { precision: 6, scale: 2 }), // km
  estimatedDuration: integer("estimated_duration"), // minutes
  estimatedPrice: decimal("estimated_price", { precision: 8, scale: 2 }), // USD
  actualPrice: decimal("actual_price", { precision: 8, scale: 2 }),
  vehicleType: text("vehicle_type").notNull(), // sedan, suv, van
  paymentMethod: text("payment_method").notNull().default("cash"), // cash, card
  riderRating: integer("rider_rating"), // 1-5
  driverRating: integer("driver_rating"), // 1-5
  riderComment: text("rider_comment"),
  driverComment: text("driver_comment"),
  requestedAt: timestamp("requested_at").notNull().defaultNow(),
  acceptedAt: timestamp("accepted_at"),
  arrivedAt: timestamp("arrived_at"),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  cancelledAt: timestamp("cancelled_at"),
  cancelledBy: text("cancelled_by"), // rider, driver
  cancellationReason: text("cancellation_reason"),
});

export const insertRideSchema = createInsertSchema(rides).omit({
  id: true,
  requestedAt: true,
});
export type InsertRide = z.infer<typeof insertRideSchema>;
export type Ride = typeof rides.$inferSelect;

// ==================== PAYMENT TRANSACTIONS ====================
export const paymentTransactions = pgTable("payment_transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  rideId: text("ride_id").notNull(),
  amount: decimal("amount", { precision: 8, scale: 2 }).notNull(),
  method: text("method").notNull(), // cash, card
  status: text("status").notNull().default("pending"), // pending, completed, failed
  createdAt: timestamp("created_at").notNull().defaultNow(),
  completedAt: timestamp("completed_at"),
});

export const insertPaymentTransactionSchema = createInsertSchema(paymentTransactions).omit({
  id: true,
  createdAt: true,
});
export type InsertPaymentTransaction = z.infer<typeof insertPaymentTransactionSchema>;
export type PaymentTransaction = typeof paymentTransactions.$inferSelect;

// ==================== NOTIFICATIONS ====================
export const notifications = pgTable("notifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: text("user_id").notNull(),
  type: text("type").notNull(), // ride_request, ride_accepted, ride_completed, etc.
  title: text("title").notNull(),
  message: text("message").notNull(),
  rideId: text("ride_id"),
  isRead: boolean("is_read").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true,
});
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type Notification = typeof notifications.$inferSelect;
