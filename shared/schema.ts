import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Quiz question types for teacher-created quizzes
export type QuestionType = "mcq" | "multiple_select" | "short_answer" | "essay";

export interface BaseQuizQuestion {
  id: string;
  question: string;
  points: number;
  explanation?: string;
}

export interface MCQQuestion extends BaseQuizQuestion {
  type: "mcq";
  options: string[];
  correctAnswer: number;
}

export interface MultipleSelectQuestion extends BaseQuizQuestion {
  type: "multiple_select";
  options: string[];
  correctAnswers: number[];
}

export interface ShortAnswerQuestion extends BaseQuizQuestion {
  type: "short_answer";
  acceptedAnswers?: string[];
}

export interface EssayQuestion extends BaseQuizQuestion {
  type: "essay";
  rubric?: string;
  maxWords?: number;
}

export type TeacherQuizQuestion = MCQQuestion | MultipleSelectQuestion | ShortAnswerQuestion | EssayQuestion;

// Legacy quiz types for AI-generated quizzes (kept for compatibility)
export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
}

export interface QuizAnswer {
  questionId: string;
  selectedAnswer: number;
  isCorrect: boolean;
}

// Answer types for teacher-created quizzes
export interface TeacherQuizAnswer {
  questionId: string;
  questionType: QuestionType;
  selectedAnswer?: number;
  selectedAnswers?: number[];
  textAnswer?: string;
  isCorrect?: boolean;
  pointsAwarded?: number;
  feedback?: string;
}

// Users table
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  role: text("role").notNull().default("student"), // student, teacher, or admin
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

// Classes/Subjects table
export const classes = pgTable("classes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  subject: text("subject").notNull(),
  teacherId: text("teacher_id").notNull(),
  code: text("code").notNull().unique(), // Class code for students to join
  color: text("color").notNull().default("bg-primary"), // For UI styling
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertClassSchema = createInsertSchema(classes).omit({
  id: true,
  createdAt: true,
});
export type InsertClass = z.infer<typeof insertClassSchema>;
export type Class = typeof classes.$inferSelect;

// Class enrollments (many-to-many between students and classes)
export const classEnrollments = pgTable("class_enrollments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  classId: text("class_id").notNull(),
  studentId: text("student_id").notNull(),
  enrolledAt: timestamp("enrolled_at").notNull().defaultNow(),
});

export const insertClassEnrollmentSchema = createInsertSchema(classEnrollments).omit({
  id: true,
  enrolledAt: true,
});
export type InsertClassEnrollment = z.infer<typeof insertClassEnrollmentSchema>;
export type ClassEnrollment = typeof classEnrollments.$inferSelect;

// To-do items per class
export const todos = pgTable("todos", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  classId: text("class_id").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  dueDate: timestamp("due_date"),
  resourceLink: text("resource_link"),
  createdBy: text("created_by").notNull(), // Teacher ID
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertTodoSchema = createInsertSchema(todos).omit({
  id: true,
  createdAt: true,
}).extend({
  dueDate: z.coerce.date().nullable().optional(),
});
export type InsertTodo = z.infer<typeof insertTodoSchema>;
export type Todo = typeof todos.$inferSelect;

// Exams per class
export const exams = pgTable("exams", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  classId: text("class_id").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  date: timestamp("date").notNull(),
  topics: text("topics").array(),
  attachments: text("attachments").array(),
  createdBy: text("created_by").notNull(), // Teacher ID
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertExamSchema = createInsertSchema(exams).omit({
  id: true,
  createdAt: true,
}).extend({
  date: z.coerce.date(),
});
export type InsertExam = z.infer<typeof insertExamSchema>;
export type Exam = typeof exams.$inferSelect;

// Class resources (notes, PDFs, links)
export const classResources = pgTable("class_resources", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  classId: text("class_id").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  type: text("type").notNull(), // pdf, image, link, text, file
  url: text("url"),
  content: text("content"),
  topic: text("topic"),
  fileName: text("file_name"),
  filePath: text("file_path"),
  fileSize: integer("file_size"),
  uploadedBy: text("uploaded_by").notNull(), // Teacher ID
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertClassResourceSchema = createInsertSchema(classResources).omit({
  id: true,
  createdAt: true,
});
export type InsertClassResource = z.infer<typeof insertClassResourceSchema>;
export type ClassResource = typeof classResources.$inferSelect;

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
  easeFactor: integer("ease_factor").notNull().default(2500),
  interval: integer("interval").notNull().default(0),
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

// Quizzes table (now linked to classes)
export const quizzes = pgTable("quizzes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: text("user_id").notNull(),
  title: text("title").notNull(),
  subject: text("subject").notNull(),
  classId: text("class_id"), // Optional: link to class
  difficulty: text("difficulty").notNull(),
  questions: jsonb("questions").notNull(),
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
  answers: jsonb("answers").notNull(),
  timeSpent: integer("time_spent").notNull(),
  completedAt: timestamp("completed_at").notNull().defaultNow(),
});

export const insertQuizAttemptSchema = createInsertSchema(quizAttempts).omit({
  id: true,
  completedAt: true,
});
export type InsertQuizAttempt = z.infer<typeof insertQuizAttemptSchema>;
export type QuizAttempt = typeof quizAttempts.$inferSelect;

// Teacher-created quizzes (with multiple question types)
export const teacherQuizzes = pgTable("teacher_quizzes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  classId: text("class_id").notNull(),
  teacherId: text("teacher_id").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  questions: jsonb("questions").notNull(),
  timeLimit: integer("time_limit"),
  passingScore: integer("passing_score"),
  totalPoints: integer("total_points").notNull(),
  isPublished: boolean("is_published").notNull().default(false),
  dueDate: timestamp("due_date"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertTeacherQuizSchema = createInsertSchema(teacherQuizzes).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  dueDate: z.coerce.date().nullable().optional(),
});
export type InsertTeacherQuiz = z.infer<typeof insertTeacherQuizSchema>;
export type TeacherQuiz = typeof teacherQuizzes.$inferSelect;

// Teacher quiz attempts (student submissions)
export const teacherQuizAttempts = pgTable("teacher_quiz_attempts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  quizId: text("quiz_id").notNull(),
  studentId: text("student_id").notNull(),
  answers: jsonb("answers").notNull(),
  autoScore: integer("auto_score").notNull().default(0),
  manualScore: integer("manual_score"),
  totalScore: integer("total_score"),
  status: text("status").notNull().default("submitted"),
  timeSpent: integer("time_spent").notNull(),
  gradedBy: text("graded_by"),
  gradedAt: timestamp("graded_at"),
  submittedAt: timestamp("submitted_at").notNull().defaultNow(),
});

export const insertTeacherQuizAttemptSchema = createInsertSchema(teacherQuizAttempts).omit({
  id: true,
  submittedAt: true,
});
export type InsertTeacherQuizAttempt = z.infer<typeof insertTeacherQuizAttemptSchema>;
export type TeacherQuizAttempt = typeof teacherQuizAttempts.$inferSelect;

// Study sessions (Pomodoro)
export const studySessions = pgTable("study_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: text("user_id").notNull(),
  subject: text("subject"),
  duration: integer("duration").notNull(),
  type: text("type").notNull(),
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
  type: text("type").notNull(),
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
  code: varchar("code", { length: 6 }).notNull().unique(),
  creatorId: text("creator_id").notNull(),
  memberIds: text("member_ids").array().notNull().default(sql`ARRAY[]::text[]`),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertStudyGroupSchema = createInsertSchema(studyGroups).omit({
  id: true,
  code: true,
  createdAt: true,
});
export type InsertStudyGroup = z.infer<typeof insertStudyGroupSchema>;
export type StudyGroup = typeof studyGroups.$inferSelect;

// Study group messages (chat)
export const groupMessages = pgTable("group_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  groupId: text("group_id").notNull(),
  userId: text("user_id").notNull(),
  userName: text("user_name").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertGroupMessageSchema = createInsertSchema(groupMessages).omit({
  id: true,
  createdAt: true,
});
export type InsertGroupMessage = z.infer<typeof insertGroupMessageSchema>;
export type GroupMessage = typeof groupMessages.$inferSelect;

// Study group shared notes
export const groupNotes = pgTable("group_notes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  groupId: text("group_id").notNull(),
  userId: text("user_id").notNull(),
  userName: text("user_name").notNull(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertGroupNoteSchema = createInsertSchema(groupNotes).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertGroupNote = z.infer<typeof insertGroupNoteSchema>;
export type GroupNote = typeof groupNotes.$inferSelect;

// Study group announcements
export const groupAnnouncements = pgTable("group_announcements", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  groupId: text("group_id").notNull(),
  userId: text("user_id").notNull(),
  userName: text("user_name").notNull(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  pinned: boolean("pinned").default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertGroupAnnouncementSchema = createInsertSchema(groupAnnouncements).omit({
  id: true,
  createdAt: true,
});
export type InsertGroupAnnouncement = z.infer<typeof insertGroupAnnouncementSchema>;
export type GroupAnnouncement = typeof groupAnnouncements.$inferSelect;

// AI tutor conversations
export const tutorConversations = pgTable("tutor_conversations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: text("user_id").notNull(),
  messages: jsonb("messages").notNull(),
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
  nodes: jsonb("nodes").notNull(),
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

// Platform settings
export const platformSettings = pgTable("platform_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  key: text("key").notNull(),
  value: text("value"),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertPlatformSettingSchema = createInsertSchema(platformSettings).omit({
  id: true,
  updatedAt: true,
});
export type InsertPlatformSetting = z.infer<typeof insertPlatformSettingSchema>;
export type PlatformSetting = typeof platformSettings.$inferSelect;

// News & Updates posts
export const newsPosts = pgTable("news_posts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  type: text("type").notNull(), // "newsletter" or "video"
  title: text("title").notNull(),
  body: text("body"),
  imageUrl: text("image_url"),
  attachmentUrl: text("attachment_url"),
  attachmentName: text("attachment_name"),
  videoUrl: text("video_url"),
  videoProvider: text("video_provider"), // "youtube" or "vimeo"
  videoOrientation: text("video_orientation").default("landscape"), // "landscape", "portrait", or "square"
  authorName: text("author_name").notNull(),
  authorRole: text("author_role").notNull(),
  authorId: text("author_id").notNull(),
  status: text("status").notNull().default("published"), // "published", "scheduled", "draft"
  scheduledAt: timestamp("scheduled_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertNewsPostSchema = createInsertSchema(newsPosts).omit({
  id: true,
  createdAt: true,
}).extend({
  scheduledAt: z.coerce.date().nullable().optional(),
});
export type InsertNewsPost = z.infer<typeof insertNewsPostSchema>;
export type NewsPost = typeof newsPosts.$inferSelect;

// News likes
export const newsLikes = pgTable("news_likes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  postId: text("post_id").notNull(),
  userId: text("user_id").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertNewsLikeSchema = createInsertSchema(newsLikes).omit({
  id: true,
  createdAt: true,
});
export type InsertNewsLike = z.infer<typeof insertNewsLikeSchema>;
export type NewsLike = typeof newsLikes.$inferSelect;

// News comments
export const newsComments = pgTable("news_comments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  postId: text("post_id").notNull(),
  userId: text("user_id").notNull(),
  userName: text("user_name").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertNewsCommentSchema = createInsertSchema(newsComments).omit({
  id: true,
  createdAt: true,
});
export type InsertNewsComment = z.infer<typeof insertNewsCommentSchema>;
export type NewsComment = typeof newsComments.$inferSelect;

// Training Hub - Topics
export const trainingTopics = pgTable("training_topics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  position: integer("position").notNull().default(0),
  createdBy: text("created_by").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertTrainingTopicSchema = createInsertSchema(trainingTopics).omit({
  id: true,
  createdAt: true,
});
export type InsertTrainingTopic = z.infer<typeof insertTrainingTopicSchema>;
export type TrainingTopic = typeof trainingTopics.$inferSelect;

// Training quiz question type for Training Hub quizzes
export interface TrainingQuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
}

// Training Hub - Items
export const trainingItems = pgTable("training_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  topicId: text("topic_id"),
  type: text("type").notNull(), // "module", "quiz", "assignment"
  title: text("title").notNull(),
  description: text("description"),
  content: text("content"),
  videoUrl: text("video_url"),
  attachmentUrl: text("attachment_url"),
  attachmentName: text("attachment_name"),
  attachmentPath: text("attachment_path"),
  questions: jsonb("questions"), // TrainingQuizQuestion[] for type="quiz"
  status: text("status").notNull().default("draft"), // "draft", "posted"
  createdBy: text("created_by").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertTrainingItemSchema = createInsertSchema(trainingItems).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertTrainingItem = z.infer<typeof insertTrainingItemSchema>;
export type TrainingItem = typeof trainingItems.$inferSelect;

// Training Quiz Attempts
export const trainingQuizAttempts = pgTable("training_quiz_attempts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: text("user_id").notNull(),
  itemId: text("item_id").notNull(),
  answers: jsonb("answers").notNull(),
  score: integer("score").notNull(),
  totalQuestions: integer("total_questions").notNull(),
  completedAt: timestamp("completed_at").notNull().defaultNow(),
});

export const insertTrainingQuizAttemptSchema = createInsertSchema(trainingQuizAttempts).omit({
  id: true,
  completedAt: true,
});
export type InsertTrainingQuizAttempt = z.infer<typeof insertTrainingQuizAttemptSchema>;
export type TrainingQuizAttempt = typeof trainingQuizAttempts.$inferSelect;

export const trainingProgress = pgTable("training_progress", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: text("user_id").notNull(),
  itemId: text("item_id").notNull(),
  completed: boolean("completed").notNull().default(false),
  completedAt: timestamp("completed_at"),
});

export const insertTrainingProgressSchema = createInsertSchema(trainingProgress).omit({
  id: true,
});
export type InsertTrainingProgress = z.infer<typeof insertTrainingProgressSchema>;
export type TrainingProgress = typeof trainingProgress.$inferSelect;
