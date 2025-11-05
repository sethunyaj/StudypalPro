import { db } from "./db";
import { eq, and, lte, sql, desc, or } from "drizzle-orm";
import {
  users,
  driverProfiles,
  rides,
  paymentTransactions,
  notifications,
  type User,
  type InsertUser,
  type DriverProfile,
  type InsertDriverProfile,
  type Ride,
  type InsertRide,
  type PaymentTransaction,
  type InsertPaymentTransaction,
  type Notification,
  type InsertNotification,
} from "@shared/schema";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  getAllRiders(): Promise<User[]>;
  getAllDrivers(): Promise<User[]>;
  deleteUser(id: string): Promise<void>;

  // Driver Profiles
  getDriverProfile(userId: string): Promise<DriverProfile | undefined>;
  getDriverProfileById(id: string): Promise<DriverProfile | undefined>;
  createDriverProfile(profile: InsertDriverProfile): Promise<DriverProfile>;
  updateDriverProfile(id: string, updates: Partial<DriverProfile>): Promise<DriverProfile | undefined>;
  getAvailableDrivers(): Promise<DriverProfile[]>;
  deleteDriverProfile(id: string): Promise<void>;

  // Rides
  getRide(id: string): Promise<Ride | undefined>;
  createRide(ride: InsertRide): Promise<Ride>;
  updateRide(id: string, updates: Partial<Ride>): Promise<Ride | undefined>;
  getRiderRides(riderId: string): Promise<Ride[]>;
  getDriverRides(driverId: string): Promise<Ride[]>;
  getPendingRides(): Promise<Ride[]>;
  getActiveRideForRider(riderId: string): Promise<Ride | undefined>;
  getActiveRideForDriver(driverId: string): Promise<Ride | undefined>;
  deleteRide(id: string): Promise<void>;

  // Payment Transactions
  getPaymentTransaction(id: string): Promise<PaymentTransaction | undefined>;
  createPaymentTransaction(transaction: InsertPaymentTransaction): Promise<PaymentTransaction>;
  updatePaymentTransaction(id: string, updates: Partial<PaymentTransaction>): Promise<PaymentTransaction | undefined>;
  getRidePayments(rideId: string): Promise<PaymentTransaction[]>;

  // Notifications
  getUserNotifications(userId: string): Promise<Notification[]>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  markNotificationRead(id: string): Promise<Notification | undefined>;
  deleteNotification(id: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // ==================== USERS ====================
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    const [user] = await db.update(users).set(updates).where(eq(users.id, id)).returning();
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async getAllRiders(): Promise<User[]> {
    return await db.select().from(users).where(eq(users.role, "rider"));
  }

  async getAllDrivers(): Promise<User[]> {
    return await db.select().from(users).where(eq(users.role, "driver"));
  }

  async deleteUser(id: string): Promise<void> {
    await db.delete(users).where(eq(users.id, id));
  }

  // ==================== DRIVER PROFILES ====================
  async getDriverProfile(userId: string): Promise<DriverProfile | undefined> {
    const [profile] = await db.select().from(driverProfiles).where(eq(driverProfiles.userId, userId));
    return profile;
  }

  async getDriverProfileById(id: string): Promise<DriverProfile | undefined> {
    const [profile] = await db.select().from(driverProfiles).where(eq(driverProfiles.id, id));
    return profile;
  }

  async createDriverProfile(insertProfile: InsertDriverProfile): Promise<DriverProfile> {
    const [profile] = await db.insert(driverProfiles).values(insertProfile).returning();
    return profile;
  }

  async updateDriverProfile(id: string, updates: Partial<DriverProfile>): Promise<DriverProfile | undefined> {
    const [profile] = await db.update(driverProfiles).set(updates).where(eq(driverProfiles.id, id)).returning();
    return profile;
  }

  async getAvailableDrivers(): Promise<DriverProfile[]> {
    return await db
      .select()
      .from(driverProfiles)
      .where(and(
        eq(driverProfiles.isAvailable, true),
        eq(driverProfiles.verificationStatus, "approved")
      ));
  }

  async deleteDriverProfile(id: string): Promise<void> {
    await db.delete(driverProfiles).where(eq(driverProfiles.id, id));
  }

  // ==================== RIDES ====================
  async getRide(id: string): Promise<Ride | undefined> {
    const [ride] = await db.select().from(rides).where(eq(rides.id, id));
    return ride;
  }

  async createRide(insertRide: InsertRide): Promise<Ride> {
    const [ride] = await db.insert(rides).values(insertRide).returning();
    return ride;
  }

  async updateRide(id: string, updates: Partial<Ride>): Promise<Ride | undefined> {
    const [ride] = await db.update(rides).set(updates).where(eq(rides.id, id)).returning();
    return ride;
  }

  async getRiderRides(riderId: string): Promise<Ride[]> {
    return await db
      .select()
      .from(rides)
      .where(eq(rides.riderId, riderId))
      .orderBy(desc(rides.requestedAt));
  }

  async getDriverRides(driverId: string): Promise<Ride[]> {
    return await db
      .select()
      .from(rides)
      .where(eq(rides.driverId, driverId))
      .orderBy(desc(rides.requestedAt));
  }

  async getPendingRides(): Promise<Ride[]> {
    return await db
      .select()
      .from(rides)
      .where(eq(rides.status, "requested"))
      .orderBy(rides.requestedAt);
  }

  async getActiveRideForRider(riderId: string): Promise<Ride | undefined> {
    const [ride] = await db
      .select()
      .from(rides)
      .where(and(
        eq(rides.riderId, riderId),
        or(
          eq(rides.status, "requested"),
          eq(rides.status, "accepted"),
          eq(rides.status, "arrived"),
          eq(rides.status, "in_progress")
        )
      ))
      .orderBy(desc(rides.requestedAt))
      .limit(1);
    return ride;
  }

  async getActiveRideForDriver(driverId: string): Promise<Ride | undefined> {
    const [ride] = await db
      .select()
      .from(rides)
      .where(and(
        eq(rides.driverId, driverId),
        or(
          eq(rides.status, "accepted"),
          eq(rides.status, "arrived"),
          eq(rides.status, "in_progress")
        )
      ))
      .orderBy(desc(rides.acceptedAt))
      .limit(1);
    return ride;
  }

  async deleteRide(id: string): Promise<void> {
    await db.delete(rides).where(eq(rides.id, id));
  }

  // ==================== PAYMENT TRANSACTIONS ====================
  async getPaymentTransaction(id: string): Promise<PaymentTransaction | undefined> {
    const [transaction] = await db.select().from(paymentTransactions).where(eq(paymentTransactions.id, id));
    return transaction;
  }

  async createPaymentTransaction(insertTransaction: InsertPaymentTransaction): Promise<PaymentTransaction> {
    const [transaction] = await db.insert(paymentTransactions).values(insertTransaction).returning();
    return transaction;
  }

  async updatePaymentTransaction(id: string, updates: Partial<PaymentTransaction>): Promise<PaymentTransaction | undefined> {
    const [transaction] = await db.update(paymentTransactions).set(updates).where(eq(paymentTransactions.id, id)).returning();
    return transaction;
  }

  async getRidePayments(rideId: string): Promise<PaymentTransaction[]> {
    return await db.select().from(paymentTransactions).where(eq(paymentTransactions.rideId, rideId));
  }

  // ==================== NOTIFICATIONS ====================
  async getUserNotifications(userId: string): Promise<Notification[]> {
    return await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt));
  }

  async createNotification(insertNotification: InsertNotification): Promise<Notification> {
    const [notification] = await db.insert(notifications).values(insertNotification).returning();
    return notification;
  }

  async markNotificationRead(id: string): Promise<Notification | undefined> {
    const [notification] = await db
      .update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.id, id))
      .returning();
    return notification;
  }

  async deleteNotification(id: string): Promise<void> {
    await db.delete(notifications).where(eq(notifications.id, id));
  }
}

export const storage = new DatabaseStorage();
