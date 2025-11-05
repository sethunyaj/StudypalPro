import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  role: text("role").notNull().default("student"), // student or admin
  grade: text("grade"),
  points: integer("points").notNull().default(0),
  streak: integer("streak").notNull().default(0),
  level: integer("level").notNull().default(1),
  xp: integer("xp").notNull().default(0),
  lastLoginDate: timestamp("last_login_date"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Notes table
export const notes = pgTable("notes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: text("user_id").notNull(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  subject: text("subject"),
  tags: text("tags").array(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertNoteSchema = createInsertSchema(notes).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertNote = z.infer<typeof insertNoteSchema>;
export type Note = typeof notes.$inferSelect;

// Flashcards table with spaced repetition data
export const flashcards = pgTable("flashcards", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: text("user_id").notNull(),
  front: text("front").notNull(),
  back: text("back").notNull(),
  subject: text("subject"),
  tags: text("tags").array(),
  easeFactor: integer("ease_factor").notNull().default(2500), // SM-2 algorithm (2.5 * 1000)
  interval: integer("interval").notNull().default(0), // days
  repetitions: integer("repetitions").notNull().default(0),
  nextReviewDate: timestamp("next_review_date").notNull().defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertFlashcardSchema = createInsertSchema(flashcards).omit({
  id: true,
  createdAt: true,
});
export type InsertFlashcard = z.infer<typeof insertFlashcardSchema>;
export type Flashcard = typeof flashcards.$inferSelect;

// Quizzes table
export const quizzes = pgTable("quizzes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: text("user_id").notNull(),
  title: text("title").notNull(),
  subject: text("subject").notNull(),
  difficulty: text("difficulty").notNull(), // easy, medium, hard, expert
  questions: jsonb("questions").notNull(), // Array of question objects
  sourceNoteId: text("source_note_id"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertQuizSchema = createInsertSchema(quizzes).omit({
  id: true,
  createdAt: true,
});
export type InsertQuiz = z.infer<typeof insertQuizSchema>;
export type Quiz = typeof quizzes.$inferSelect;

// Quiz attempts table
export const quizAttempts = pgTable("quiz_attempts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: text("user_id").notNull(),
  quizId: text("quiz_id").notNull(),
  score: integer("score").notNull(),
  totalQuestions: integer("total_questions").notNull(),
  answers: jsonb("answers").notNull(), // User's answers with correctness
  timeSpent: integer("time_spent").notNull(), // seconds
  completedAt: timestamp("completed_at").notNull().defaultNow(),
});

export const insertQuizAttemptSchema = createInsertSchema(quizAttempts).omit({
  id: true,
  completedAt: true,
});
export type InsertQuizAttempt = z.infer<typeof insertQuizAttemptSchema>;
export type QuizAttempt = typeof quizAttempts.$inferSelect;

// Study sessions (Pomodoro)
export const studySessions = pgTable("study_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: text("user_id").notNull(),
  subject: text("subject"),
  duration: integer("duration").notNull(), // minutes
  type: text("type").notNull(), // focus, short_break, long_break
  completedAt: timestamp("completed_at").notNull().defaultNow(),
});

export const insertStudySessionSchema = createInsertSchema(studySessions).omit({
  id: true,
  completedAt: true,
});
export type InsertStudySession = z.infer<typeof insertStudySessionSchema>;
export type StudySession = typeof studySessions.$inferSelect;

// Achievements
export const achievements = pgTable("achievements", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: text("user_id").notNull(),
  type: text("type").notNull(), // first_quiz, streak_7, points_100, etc.
  title: text("title").notNull(),
  description: text("description").notNull(),
  icon: text("icon").notNull(),
  unlockedAt: timestamp("unlocked_at").notNull().defaultNow(),
});

export const insertAchievementSchema = createInsertSchema(achievements).omit({
  id: true,
  unlockedAt: true,
});
export type InsertAchievement = z.infer<typeof insertAchievementSchema>;
export type Achievement = typeof achievements.$inferSelect;

// Study groups
export const studyGroups = pgTable("study_groups", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  subject: text("subject"),
  creatorId: text("creator_id").notNull(),
  memberIds: text("member_ids").array().notNull().default(sql`ARRAY[]::text[]`),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertStudyGroupSchema = createInsertSchema(studyGroups).omit({
  id: true,
  createdAt: true,
});
export type InsertStudyGroup = z.infer<typeof insertStudyGroupSchema>;
export type StudyGroup = typeof studyGroups.$inferSelect;

// AI tutor conversations
export const tutorConversations = pgTable("tutor_conversations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: text("user_id").notNull(),
  messages: jsonb("messages").notNull(), // Array of {role, content} objects
  subject: text("subject"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertTutorConversationSchema = createInsertSchema(tutorConversations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertTutorConversation = z.infer<typeof insertTutorConversationSchema>;
export type TutorConversation = typeof tutorConversations.$inferSelect;

// Mind maps
export const mindMaps = pgTable("mind_maps", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: text("user_id").notNull(),
  title: text("title").notNull(),
  subject: text("subject"),
  nodes: jsonb("nodes").notNull(), // Mind map node data
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertMindMapSchema = createInsertSchema(mindMaps).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertMindMap = z.infer<typeof insertMindMapSchema>;
export type MindMap = typeof mindMaps.$inferSelect;

// Platform settings (for FastBots chatbot integration, etc.)
export const platformSettings = pgTable("platform_settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertPlatformSettingSchema = createInsertSchema(platformSettings).omit({
  updatedAt: true,
});
export type InsertPlatformSetting = z.infer<typeof insertPlatformSettingSchema>;
export type PlatformSetting = typeof platformSettings.$inferSelect;
