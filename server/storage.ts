import { db } from "./db";
import { eq, and, lte, sql } from "drizzle-orm";
import {
  users,
  notes,
  flashcards,
  quizzes,
  quizAttempts,
  studySessions,
  achievements,
  studyGroups,
  tutorConversations,
  mindMaps,
  platformSettings,
  type User,
  type InsertUser,
  type Note,
  type InsertNote,
  type Flashcard,
  type InsertFlashcard,
  type Quiz,
  type InsertQuiz,
  type QuizAttempt,
  type InsertQuizAttempt,
  type StudySession,
  type InsertStudySession,
  type Achievement,
  type InsertAchievement,
  type StudyGroup,
  type InsertStudyGroup,
  type TutorConversation,
  type InsertTutorConversation,
  type MindMap,
  type InsertMindMap,
  type PlatformSetting,
} from "@shared/schema";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User | undefined>;
  getAllStudents(): Promise<User[]>;
  deleteUser(id: string): Promise<void>;

  // Notes
  getUserNotes(userId: string): Promise<Note[]>;
  getNote(id: string): Promise<Note | undefined>;
  createNote(note: InsertNote): Promise<Note>;
  updateNote(id: string, updates: Partial<Note>): Promise<Note | undefined>;
  deleteNote(id: string): Promise<void>;

  // Flashcards
  getUserFlashcards(userId: string): Promise<Flashcard[]>;
  getDueFlashcards(userId: string): Promise<Flashcard[]>;
  getFlashcard(id: string): Promise<Flashcard | undefined>;
  createFlashcard(flashcard: InsertFlashcard): Promise<Flashcard>;
  updateFlashcard(id: string, updates: Partial<Flashcard>): Promise<Flashcard | undefined>;
  deleteFlashcard(id: string): Promise<void>;

  // Quizzes
  getUserQuizzes(userId: string): Promise<Quiz[]>;
  getQuiz(id: string): Promise<Quiz | undefined>;
  createQuiz(quiz: InsertQuiz): Promise<Quiz>;
  deleteQuiz(id: string): Promise<void>;

  // Quiz Attempts
  getUserQuizAttempts(userId: string): Promise<QuizAttempt[]>;
  createQuizAttempt(attempt: InsertQuizAttempt): Promise<QuizAttempt>;

  // Study Sessions
  getUserStudySessions(userId: string): Promise<StudySession[]>;
  createStudySession(session: InsertStudySession): Promise<StudySession>;

  // Achievements
  getUserAchievements(userId: string): Promise<Achievement[]>;
  createAchievement(achievement: InsertAchievement): Promise<Achievement>;

  // Study Groups
  getUserStudyGroups(userId: string): Promise<StudyGroup[]>;
  getAllStudyGroups(): Promise<StudyGroup[]>;
  getStudyGroup(id: string): Promise<StudyGroup | undefined>;
  createStudyGroup(group: InsertStudyGroup): Promise<StudyGroup>;
  updateStudyGroup(id: string, updates: Partial<StudyGroup>): Promise<StudyGroup | undefined>;
  deleteStudyGroup(id: string): Promise<void>;

  // Tutor Conversations
  getUserConversations(userId: string): Promise<TutorConversation[]>;
  getConversation(id: string): Promise<TutorConversation | undefined>;
  createConversation(conversation: InsertTutorConversation): Promise<TutorConversation>;
  updateConversation(id: string, updates: Partial<TutorConversation>): Promise<TutorConversation | undefined>;
  deleteConversation(id: string): Promise<void>;

  // Mind Maps
  getUserMindMaps(userId: string): Promise<MindMap[]>;
  getMindMap(id: string): Promise<MindMap | undefined>;
  createMindMap(mindMap: InsertMindMap): Promise<MindMap>;
  updateMindMap(id: string, updates: Partial<MindMap>): Promise<MindMap | undefined>;
  deleteMindMap(id: string): Promise<void>;

  // Platform Settings
  getSetting(key: string): Promise<PlatformSetting | undefined>;
  setSetting(key: string, value: string): Promise<PlatformSetting>;
  getAllSettings(): Promise<PlatformSetting[]>;
}

export class DatabaseStorage implements IStorage {
  // Users
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

  async getAllStudents(): Promise<User[]> {
    return await db.select().from(users).where(eq(users.role, "student"));
  }

  async deleteUser(id: string): Promise<void> {
    await db.delete(users).where(eq(users.id, id));
  }

  // Notes
  async getUserNotes(userId: string): Promise<Note[]> {
    return await db.select().from(notes).where(eq(notes.userId, userId));
  }

  async getNote(id: string): Promise<Note | undefined> {
    const [note] = await db.select().from(notes).where(eq(notes.id, id));
    return note;
  }

  async createNote(insertNote: InsertNote): Promise<Note> {
    const [note] = await db.insert(notes).values(insertNote).returning();
    return note;
  }

  async updateNote(id: string, updates: Partial<Note>): Promise<Note | undefined> {
    const [note] = await db.update(notes).set({ ...updates, updatedAt: new Date() }).where(eq(notes.id, id)).returning();
    return note;
  }

  async deleteNote(id: string): Promise<void> {
    await db.delete(notes).where(eq(notes.id, id));
  }

  // Flashcards
  async getUserFlashcards(userId: string): Promise<Flashcard[]> {
    return await db.select().from(flashcards).where(eq(flashcards.userId, userId));
  }

  async getDueFlashcards(userId: string): Promise<Flashcard[]> {
    return await db
      .select()
      .from(flashcards)
      .where(and(eq(flashcards.userId, userId), lte(flashcards.nextReviewDate, new Date())));
  }

  async getFlashcard(id: string): Promise<Flashcard | undefined> {
    const [flashcard] = await db.select().from(flashcards).where(eq(flashcards.id, id));
    return flashcard;
  }

  async createFlashcard(insertFlashcard: InsertFlashcard): Promise<Flashcard> {
    const [flashcard] = await db.insert(flashcards).values(insertFlashcard).returning();
    return flashcard;
  }

  async updateFlashcard(id: string, updates: Partial<Flashcard>): Promise<Flashcard | undefined> {
    const [flashcard] = await db.update(flashcards).set(updates).where(eq(flashcards.id, id)).returning();
    return flashcard;
  }

  async deleteFlashcard(id: string): Promise<void> {
    await db.delete(flashcards).where(eq(flashcards.id, id));
  }

  // Quizzes
  async getUserQuizzes(userId: string): Promise<Quiz[]> {
    return await db.select().from(quizzes).where(eq(quizzes.userId, userId));
  }

  async getQuiz(id: string): Promise<Quiz | undefined> {
    const [quiz] = await db.select().from(quizzes).where(eq(quizzes.id, id));
    return quiz;
  }

  async createQuiz(insertQuiz: InsertQuiz): Promise<Quiz> {
    const [quiz] = await db.insert(quizzes).values(insertQuiz).returning();
    return quiz;
  }

  async deleteQuiz(id: string): Promise<void> {
    await db.delete(quizzes).where(eq(quizzes.id, id));
  }

  // Quiz Attempts
  async getUserQuizAttempts(userId: string): Promise<QuizAttempt[]> {
    return await db.select().from(quizAttempts).where(eq(quizAttempts.userId, userId));
  }

  async createQuizAttempt(insertQuizAttempt: InsertQuizAttempt): Promise<QuizAttempt> {
    const [attempt] = await db.insert(quizAttempts).values(insertQuizAttempt).returning();
    return attempt;
  }

  // Study Sessions
  async getUserStudySessions(userId: string): Promise<StudySession[]> {
    return await db.select().from(studySessions).where(eq(studySessions.userId, userId));
  }

  async createStudySession(insertStudySession: InsertStudySession): Promise<StudySession> {
    const [session] = await db.insert(studySessions).values(insertStudySession).returning();
    return session;
  }

  // Achievements
  async getUserAchievements(userId: string): Promise<Achievement[]> {
    return await db.select().from(achievements).where(eq(achievements.userId, userId));
  }

  async createAchievement(insertAchievement: InsertAchievement): Promise<Achievement> {
    const [achievement] = await db.insert(achievements).values(insertAchievement).returning();
    return achievement;
  }

  // Study Groups
  async getUserStudyGroups(userId: string): Promise<StudyGroup[]> {
    return await db
      .select()
      .from(studyGroups)
      .where(sql`${userId} = ANY(${studyGroups.memberIds}) OR ${studyGroups.creatorId} = ${userId}`);
  }

  async getAllStudyGroups(): Promise<StudyGroup[]> {
    return await db.select().from(studyGroups);
  }

  async getStudyGroup(id: string): Promise<StudyGroup | undefined> {
    const [group] = await db.select().from(studyGroups).where(eq(studyGroups.id, id));
    return group;
  }

  async createStudyGroup(insertStudyGroup: InsertStudyGroup): Promise<StudyGroup> {
    const [group] = await db.insert(studyGroups).values(insertStudyGroup).returning();
    return group;
  }

  async updateStudyGroup(id: string, updates: Partial<StudyGroup>): Promise<StudyGroup | undefined> {
    const [group] = await db.update(studyGroups).set(updates).where(eq(studyGroups.id, id)).returning();
    return group;
  }

  async deleteStudyGroup(id: string): Promise<void> {
    await db.delete(studyGroups).where(eq(studyGroups.id, id));
  }

  // Tutor Conversations
  async getUserConversations(userId: string): Promise<TutorConversation[]> {
    return await db.select().from(tutorConversations).where(eq(tutorConversations.userId, userId));
  }

  async getConversation(id: string): Promise<TutorConversation | undefined> {
    const [conversation] = await db.select().from(tutorConversations).where(eq(tutorConversations.id, id));
    return conversation;
  }

  async createConversation(insertConversation: InsertTutorConversation): Promise<TutorConversation> {
    const [conversation] = await db.insert(tutorConversations).values(insertConversation).returning();
    return conversation;
  }

  async updateConversation(id: string, updates: Partial<TutorConversation>): Promise<TutorConversation | undefined> {
    const [conversation] = await db
      .update(tutorConversations)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(tutorConversations.id, id))
      .returning();
    return conversation;
  }

  async deleteConversation(id: string): Promise<void> {
    await db.delete(tutorConversations).where(eq(tutorConversations.id, id));
  }

  // Mind Maps
  async getUserMindMaps(userId: string): Promise<MindMap[]> {
    return await db.select().from(mindMaps).where(eq(mindMaps.userId, userId));
  }

  async getMindMap(id: string): Promise<MindMap | undefined> {
    const [mindMap] = await db.select().from(mindMaps).where(eq(mindMaps.id, id));
    return mindMap;
  }

  async createMindMap(insertMindMap: InsertMindMap): Promise<MindMap> {
    const [mindMap] = await db.insert(mindMaps).values(insertMindMap).returning();
    return mindMap;
  }

  async updateMindMap(id: string, updates: Partial<MindMap>): Promise<MindMap | undefined> {
    const [mindMap] = await db
      .update(mindMaps)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(mindMaps.id, id))
      .returning();
    return mindMap;
  }

  async deleteMindMap(id: string): Promise<void> {
    await db.delete(mindMaps).where(eq(mindMaps.id, id));
  }

  // Platform Settings
  async getSetting(key: string): Promise<PlatformSetting | undefined> {
    const [setting] = await db.select().from(platformSettings).where(eq(platformSettings.key, key));
    return setting;
  }

  async setSetting(key: string, value: string): Promise<PlatformSetting> {
    const [setting] = await db
      .insert(platformSettings)
      .values({ key, value })
      .onConflictDoUpdate({
        target: platformSettings.key,
        set: { value, updatedAt: new Date() },
      })
      .returning();
    return setting;
  }

  async getAllSettings(): Promise<PlatformSetting[]> {
    return await db.select().from(platformSettings);
  }
}

export const storage = new DatabaseStorage();
