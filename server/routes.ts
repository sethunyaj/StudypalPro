import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { generateQuiz, getTutorResponse } from "./openai";
import bcrypt from "bcrypt";
import multer from "multer";
import { Client } from "@replit/object-storage";
import { randomUUID } from "crypto";
import path from "path";
import fs from "fs";
import { mdToPdf } from "md-to-pdf";
import { execSync } from "child_process";

// Get system Chromium path for PDF generation
function getChromiumPath(): string {
  try {
    return execSync("which chromium").toString().trim();
  } catch {
    return "";
  }
}
import {
  insertUserSchema,
  insertNoteSchema,
  insertFlashcardSchema,
  insertQuizSchema,
  insertQuizAttemptSchema,
  insertStudySessionSchema,
  insertStudyGroupSchema,
  insertGroupMessageSchema,
  insertGroupNoteSchema,
  insertGroupAnnouncementSchema,
  insertClassSchema,
  insertTodoSchema,
  insertExamSchema,
  insertClassResourceSchema,
  insertTeacherQuizSchema,
  insertTeacherQuizAttemptSchema,
  insertMindMapSchema,
  insertNewsPostSchema,
  insertNewsCommentSchema,
  insertTrainingTopicSchema,
  insertTrainingItemSchema,
  type QuizQuestion,
  type QuizAnswer,
} from "@shared/schema";
import { z } from "zod";

// SM-2 Algorithm for spaced repetition
function calculateNextReview(quality: number, flashcard: any) {
  const easeFactor = flashcard.easeFactor / 1000; // Convert back from integer storage
  const repetitions = flashcard.repetitions;
  const interval = flashcard.interval;

  let newEaseFactor = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  if (newEaseFactor < 1.3) newEaseFactor = 1.3;

  let newRepetitions = repetitions;
  let newInterval = interval;

  if (quality < 3) {
    newRepetitions = 0;
    newInterval = 0;
  } else {
    newRepetitions = repetitions + 1;
    if (repetitions === 0) {
      newInterval = 1;
    } else if (repetitions === 1) {
      newInterval = 6;
    } else {
      newInterval = Math.round(interval * easeFactor);
    }
  }

  const nextReviewDate = new Date();
  nextReviewDate.setDate(nextReviewDate.getDate() + newInterval);

  return {
    easeFactor: Math.round(newEaseFactor * 1000), // Store as integer
    repetitions: newRepetitions,
    interval: newInterval,
    nextReviewDate,
  };
}

// Check and award achievements
async function checkAchievements(userId: string) {
  const user = await storage.getUser(userId);
  const achievements = await storage.getUserAchievements(userId);
  const existingTypes = new Set(achievements.map(a => a.type));

  const newAchievements = [];

  // First quiz achievement
  const quizAttempts = await storage.getUserQuizAttempts(userId);
  if (quizAttempts.length === 1 && !existingTypes.has("first_quiz")) {
    newAchievements.push({
      userId,
      type: "first_quiz",
      title: "Quiz Rookie",
      description: "Completed your first quiz",
      icon: "🎯",
    });
  }

  // Points milestones
  if (user && user.points >= 100 && !existingTypes.has("points_100")) {
    newAchievements.push({
      userId,
      type: "points_100",
      title: "Centurion",
      description: "Earned 100 XP",
      icon: "💯",
    });
  }

  if (user && user.points >= 500 && !existingTypes.has("points_500")) {
    newAchievements.push({
      userId,
      type: "points_500",
      title: "XP Master",
      description: "Earned 500 XP",
      icon: "⭐",
    });
  }

  // Streak achievements
  if (user && user.streak >= 3 && !existingTypes.has("streak_3")) {
    newAchievements.push({
      userId,
      type: "streak_3",
      title: "On Fire",
      description: "3-day study streak",
      icon: "🔥",
    });
  }

  if (user && user.streak >= 7 && !existingTypes.has("streak_7")) {
    newAchievements.push({
      userId,
      type: "streak_7",
      title: "Week Warrior",
      description: "7-day study streak",
      icon: "🏆",
    });
  }

  // Create all new achievements
  for (const achievement of newAchievements) {
    await storage.createAchievement(achievement);
  }

  return newAchievements;
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Initialize default admin account if it doesn't exist
  async function initializeDefaultAdmin() {
    try {
      const adminUser = await storage.getUserByUsername("admin");
      if (!adminUser) {
        const hashedPassword = await bcrypt.hash("admin123", 10);
        await storage.createUser({
          username: "admin",
          password: hashedPassword,
          name: "Administrator",
          role: "admin",
          grade: null,
        });
        console.log("✅ Default admin account created (admin/admin123)");
      }
    } catch (error) {
      console.error("Failed to create default admin:", error);
    }
  }
  
  // Initialize on startup
  await initializeDefaultAdmin();
  
  // ==================== AUTHENTICATION ====================
  
  // Register
  app.post("/api/auth/register", async (req, res) => {
    try {
      const data = insertUserSchema.parse(req.body);
      
      // Check if username exists
      const existing = await storage.getUserByUsername(data.username);
      if (existing) {
        return res.status(400).json({ error: "Username already exists" });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(data.password, 10);
      
      // Create user
      const user = await storage.createUser({
        ...data,
        password: hashedPassword,
      });

      // Create session
      req.session.userId = user.id;
      
      // Remove password from response
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Registration failed" });
    }
  });

  // Login
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;

      const user = await storage.getUserByUsername(username);
      if (!user) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      // Update last login and check streak
      const now = new Date();
      const lastLogin = user.lastLoginDate;
      let streak = user.streak;

      if (lastLogin) {
        const daysDiff = Math.floor((now.getTime() - lastLogin.getTime()) / (1000 * 60 * 60 * 24));
        if (daysDiff === 1) {
          streak += 1;
        } else if (daysDiff > 1) {
          streak = 1;
        }
      } else {
        streak = 1;
      }

      await storage.updateUser(user.id, {
        lastLoginDate: now,
        streak,
      });

      // Create session
      req.session.userId = user.id;

      // Remove password from response
      const { password: _, ...userWithoutPassword } = user;
      res.json({ ...userWithoutPassword, streak });
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Login failed" });
    }
  });

  // Logout
  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ error: "Logout failed" });
      }
      res.json({ message: "Logged out successfully" });
    });
  });

  // ==================== FILE UPLOAD ====================
  
  // Initialize multer for file uploads
  const upload = multer({ 
    storage: multer.memoryStorage(),
    limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
  });
  
  // Initialize Replit Object Storage client
  const objectStorageClient = new Client();

  // Upload file to object storage (server-side proxy upload)
  app.post("/api/objects/upload", upload.single("file"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }
      
      const fileId = randomUUID();
      const extension = req.file.originalname.split('.').pop() || '';
      const fileName = `uploads/${fileId}${extension ? '.' + extension : ''}`;
      
      const fileBuffer = req.file.buffer;
      if (!fileBuffer || fileBuffer.length === 0) {
        return res.status(400).json({ error: "Empty file buffer" });
      }

      const base64Data = fileBuffer.toString('base64');
      const { ok, error } = await objectStorageClient.uploadFromText(
        fileName,
        base64Data
      );
      
      if (!ok) {
        console.error("Upload error:", error);
        return res.status(500).json({ error: "Failed to upload file" });
      }
      
      res.json({ 
        success: true,
        objectPath: `/api/files/${fileName}`,
        fileName: req.file.originalname,
        fileSize: req.file.size
      });
    } catch (error: any) {
      console.error("Error uploading file:", error);
      res.status(500).json({ error: error.message || "Failed to upload file" });
    }
  });

  // Serve files from object storage (proxy download)
  app.get("/api/files/uploads/:filename", async (req, res) => {
    try {
      const filename = req.params.filename;
      
      // Security: Validate filename contains only safe characters (no path traversal)
      const safeFilenamePattern = /^[a-zA-Z0-9\-_.]+$/;
      if (!safeFilenamePattern.test(filename)) {
        return res.status(403).json({ error: "Invalid filename" });
      }
      
      // Construct the safe path - always in uploads/ directory
      const filePath = `uploads/${filename}`;
      
      const { ok, value, error } = await objectStorageClient.downloadAsText(filePath);
      
      if (!ok || !value) {
        console.error("Download error:", error);
        return res.status(404).json({ error: "File not found" });
      }
      
      const ext = filename.split('.').pop()?.toLowerCase();
      const contentTypes: Record<string, string> = {
        pdf: 'application/pdf',
        doc: 'application/msword',
        docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        ppt: 'application/vnd.ms-powerpoint',
        pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        xls: 'application/vnd.ms-excel',
        xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        png: 'image/png',
        jpg: 'image/jpeg',
        jpeg: 'image/jpeg',
        gif: 'image/gif',
      };
      
      const buffer = Buffer.from(value, 'base64');
      res.setHeader('Content-Type', contentTypes[ext || ''] || 'application/octet-stream');
      res.setHeader('Content-Length', buffer.length.toString());
      res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
      res.end(buffer);
    } catch (error: any) {
      console.error("Error serving file:", error);
      res.status(500).json({ error: "Error serving file" });
    }
  });

  // ==================== NOTES ====================
  
  app.get("/api/notes/:userId", async (req, res) => {
    try {
      const notes = await storage.getUserNotes(req.params.userId);
      res.json(notes);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/notes", async (req, res) => {
    try {
      const data = insertNoteSchema.parse(req.body);
      const note = await storage.createNote(data);
      res.json(note);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.put("/api/notes/:id", async (req, res) => {
    try {
      const note = await storage.updateNote(req.params.id, req.body);
      if (!note) {
        return res.status(404).json({ error: "Note not found" });
      }
      res.json(note);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/api/notes/:id", async (req, res) => {
    try {
      await storage.deleteNote(req.params.id);
      res.json({ message: "Note deleted" });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ==================== FLASHCARDS ====================
  
  app.get("/api/flashcards/:userId", async (req, res) => {
    try {
      const flashcards = await storage.getUserFlashcards(req.params.userId);
      res.json(flashcards);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/flashcards/due/:userId", async (req, res) => {
    try {
      const dueCards = await storage.getDueFlashcards(req.params.userId);
      res.json(dueCards);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/flashcards", async (req, res) => {
    try {
      const data = insertFlashcardSchema.parse(req.body);
      const flashcard = await storage.createFlashcard(data);
      res.json(flashcard);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.post("/api/flashcards/:id/review", async (req, res) => {
    try {
      const { quality } = req.body; // 0-5 (Again, Hard, Good, Easy)
      const flashcard = await storage.getFlashcard(req.params.id);
      
      if (!flashcard) {
        return res.status(404).json({ error: "Flashcard not found" });
      }

      const nextReview = calculateNextReview(quality, flashcard);
      const updated = await storage.updateFlashcard(req.params.id, nextReview);
      
      res.json(updated);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // ==================== QUIZZES ====================
  
  app.get("/api/quizzes/:userId", async (req, res) => {
    try {
      const quizzes = await storage.getUserQuizzes(req.params.userId);
      res.json(quizzes);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/quizzes/generate", async (req, res) => {
    try {
      const { userId, subject, difficulty, numQuestions, sourceNoteId } = req.body;

      // Get source note content if provided
      let sourceNoteContent;
      if (sourceNoteId && sourceNoteId !== 'none') {
        const note = await storage.getNote(sourceNoteId);
        if (note) {
          sourceNoteContent = note.content;
        }
      }

      // Generate quiz using OpenAI
      const questions = await generateQuiz({
        subject,
        difficulty,
        numQuestions: parseInt(numQuestions),
        sourceNoteContent,
      });

      // Save quiz to database
      const quiz = await storage.createQuiz({
        userId,
        title: `${subject} - ${difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}`,
        subject,
        difficulty,
        questions: questions as any, // JSONB field
        sourceNoteId,
      });

      res.json(quiz);
    } catch (error: any) {
      console.error("Quiz generation error:", error);
      res.status(500).json({ error: error.message || "Failed to generate quiz" });
    }
  });

  app.get("/api/quiz-attempts/:userId", async (req, res) => {
    try {
      const attempts = await storage.getUserQuizAttempts(req.params.userId);
      
      // Populate quiz data
      const attemptsWithQuizzes = await Promise.all(
        attempts.map(async (attempt) => {
          const quiz = await storage.getQuiz(attempt.quizId);
          return { ...attempt, quiz };
        })
      );
      
      res.json(attemptsWithQuizzes);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/quiz-attempts", async (req, res) => {
    try {
      const data = insertQuizAttemptSchema.parse(req.body);
      const attempt = await storage.createQuizAttempt(data);

      // Award XP based on performance
      const percentage = (data.score / data.totalQuestions) * 100;
      const xpEarned = Math.round(percentage / 2); // 0-50 XP per quiz
      
      const user = await storage.getUser(data.userId);
      if (user) {
        const newXp = user.xp + xpEarned;
        const newPoints = user.points + xpEarned;
        const newLevel = Math.floor(newXp / 100) + 1;

        await storage.updateUser(data.userId, {
          xp: newXp,
          points: newPoints,
          level: newLevel,
        });

        // Check for achievements
        await checkAchievements(data.userId);
      }

      res.json(attempt);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // ==================== AI TUTOR ====================
  
  app.get("/api/tutor-conversations/:userId", async (req, res) => {
    try {
      const conversations = await storage.getUserConversations(req.params.userId);
      res.json(conversations);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/tutor-conversations", async (req, res) => {
    try {
      const { userId } = req.body;
      const conversation = await storage.createConversation({
        userId,
        messages: [],
        subject: null,
      });
      res.json(conversation);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.post("/api/tutor/chat", async (req, res) => {
    try {
      const { conversationId, userId, message } = req.body;

      let conversation;
      
      // Create conversation if it doesn't exist
      if (!conversationId) {
        conversation = await storage.createConversation({
          userId,
          messages: [],
          subject: null,
        });
      } else {
        conversation = await storage.getConversation(conversationId);
        if (!conversation) {
          return res.status(404).json({ error: "Conversation not found" });
        }
      }

      // Add user message
      const messages = conversation.messages as any[] || [];
      messages.push({ role: "user", content: message });

      // Get AI response
      const aiResponse = await getTutorResponse({ messages });
      
      // Add assistant message
      messages.push({ role: "assistant", content: aiResponse });

      // Update conversation
      const updated = await storage.updateConversation(conversation.id, {
        messages: messages as any,
      });

      res.json({ conversation: updated });
    } catch (error: any) {
      console.error("AI tutor error:", error);
      res.status(500).json({ error: error.message || "AI tutor failed" });
    }
  });

  app.delete("/api/tutor-conversations/:id", async (req, res) => {
    try {
      await storage.deleteConversation(req.params.id);
      res.json({ message: "Conversation deleted" });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ==================== STUDY SESSIONS ====================
  
  app.post("/api/study-sessions", async (req, res) => {
    try {
      const data = insertStudySessionSchema.parse(req.body);
      const session = await storage.createStudySession(data);

      // Award XP for study session
      const xpEarned = data.duration; // 1 XP per minute
      const user = await storage.getUser(data.userId);
      
      if (user) {
        const newXp = user.xp + xpEarned;
        const newPoints = user.points + xpEarned;
        const newLevel = Math.floor(newXp / 100) + 1;

        await storage.updateUser(data.userId, {
          xp: newXp,
          points: newPoints,
          level: newLevel,
        });

        await checkAchievements(data.userId);
      }

      res.json(session);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // ==================== STATISTICS ====================
  
  app.get("/api/stats/:userId", async (req, res) => {
    try {
      const userId = req.params.userId;
      const sessions = await storage.getUserStudySessions(userId);
      const quizAttempts = await storage.getUserQuizAttempts(userId);

      // Calculate weekly activity
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      
      const weeklyActivity = [0, 0, 0, 0, 0, 0, 0];
      sessions.forEach(session => {
        if (session.completedAt && session.completedAt >= oneWeekAgo) {
          const dayIndex = session.completedAt.getDay();
          weeklyActivity[dayIndex] += session.duration;
        }
      });

      // Calculate subject scores
      const subjectScores: Record<string, { total: number; count: number }> = {};
      quizAttempts.forEach(attempt => {
        const quiz = attempt as any;
        const subject = quiz.subject || "Other";
        const score = (attempt.score / attempt.totalQuestions) * 100;
        
        if (!subjectScores[subject]) {
          subjectScores[subject] = { total: 0, count: 0 };
        }
        subjectScores[subject].total += score;
        subjectScores[subject].count += 1;
      });

      const subjectNames = Object.keys(subjectScores);
      const subjectScoresArray = subjectNames.map(
        subject => Math.round(subjectScores[subject].total / subjectScores[subject].count)
      );

      const totalStudyTime = Math.round(
        sessions.reduce((sum, s) => sum + s.duration, 0) / 60
      );

      const avgScore = quizAttempts.length > 0
        ? Math.round(
            quizAttempts.reduce((sum, a) => sum + (a.score / a.totalQuestions) * 100, 0) /
              quizAttempts.length
          )
        : 0;

      res.json({
        weeklyActivity,
        subjectNames,
        subjectScores: subjectScoresArray,
        totalQuizzes: quizAttempts.length,
        totalStudyTime,
        avgScore,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ==================== STUDY GROUPS ====================
  
  app.get("/api/study-groups/:userId", async (req, res) => {
    try {
      const groups = await storage.getUserStudyGroups(req.params.userId);
      res.json(groups);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/study-groups/all", async (req, res) => {
    try {
      const groups = await storage.getAllStudyGroups();
      res.json(groups);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/study-groups", async (req, res) => {
    try {
      const data = insertStudyGroupSchema.parse(req.body);
      // Generate unique 6-character group code
      const code = Math.random().toString(36).substring(2, 8).toUpperCase();
      const group = await storage.createStudyGroup({ ...data, code });
      res.json(group);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Join study group by code
  app.post("/api/study-groups/join-by-code", async (req, res) => {
    try {
      const { code, userId } = req.body;
      
      if (!code || !userId) {
        return res.status(400).json({ error: "Code and userId are required" });
      }
      
      const group = await storage.getStudyGroupByCode(code.toUpperCase());
      
      if (!group) {
        return res.status(404).json({ error: "Study group not found. Please check the code and try again." });
      }
      
      const memberIds = group.memberIds || [];
      if (memberIds.includes(userId)) {
        return res.status(400).json({ error: "You're already a member of this group" });
      }
      
      memberIds.push(userId);
      const updated = await storage.updateStudyGroup(group.id, { memberIds });
      
      res.json(updated);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.post("/api/study-groups/:id/join", async (req, res) => {
    try {
      const { userId } = req.body;
      const group = await storage.getStudyGroup(req.params.id);
      
      if (!group) {
        return res.status(404).json({ error: "Group not found" });
      }

      const memberIds = group.memberIds || [];
      if (memberIds.includes(userId)) {
        return res.status(400).json({ error: "Already a member" });
      }

      memberIds.push(userId);
      const updated = await storage.updateStudyGroup(req.params.id, { memberIds });
      
      res.json(updated);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.post("/api/study-groups/:id/leave", async (req, res) => {
    try {
      const { userId } = req.body;
      const group = await storage.getStudyGroup(req.params.id);
      
      if (!group) {
        return res.status(404).json({ error: "Group not found" });
      }

      const memberIds = (group.memberIds || []).filter(id => id !== userId);
      const updated = await storage.updateStudyGroup(req.params.id, { memberIds });
      
      res.json(updated);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // ==================== GROUP MESSAGES ====================
  app.get("/api/study-groups/:id/messages", async (req, res) => {
    try {
      const messages = await storage.getGroupMessages(req.params.id);
      res.json(messages);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.post("/api/study-groups/:id/messages", async (req, res) => {
    try {
      const validated = insertGroupMessageSchema.parse({
        groupId: req.params.id,
        userId: req.body.userId,
        userName: req.body.userName,
        content: req.body.content,
      });
      const message = await storage.createGroupMessage(validated);
      res.json(message);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/api/group-messages/:id", async (req, res) => {
    try {
      await storage.deleteGroupMessage(req.params.id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // ==================== GROUP NOTES ====================
  app.get("/api/study-groups/:id/notes", async (req, res) => {
    try {
      const notes = await storage.getGroupNotes(req.params.id);
      res.json(notes);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.post("/api/study-groups/:id/notes", async (req, res) => {
    try {
      const validated = insertGroupNoteSchema.parse({
        groupId: req.params.id,
        userId: req.body.userId,
        userName: req.body.userName,
        title: req.body.title,
        content: req.body.content,
      });
      const note = await storage.createGroupNote(validated);
      res.json(note);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.put("/api/group-notes/:id", async (req, res) => {
    try {
      const { title, content } = req.body;
      const note = await storage.updateGroupNote(req.params.id, { title, content });
      res.json(note);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/api/group-notes/:id", async (req, res) => {
    try {
      await storage.deleteGroupNote(req.params.id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // ==================== GROUP ANNOUNCEMENTS ====================
  app.get("/api/study-groups/:id/announcements", async (req, res) => {
    try {
      const announcements = await storage.getGroupAnnouncements(req.params.id);
      res.json(announcements);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.post("/api/study-groups/:id/announcements", async (req, res) => {
    try {
      const validated = insertGroupAnnouncementSchema.parse({
        groupId: req.params.id,
        userId: req.body.userId,
        userName: req.body.userName,
        title: req.body.title,
        content: req.body.content,
        pinned: req.body.pinned || false,
      });
      const announcement = await storage.createGroupAnnouncement(validated);
      res.json(announcement);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/api/group-announcements/:id", async (req, res) => {
    try {
      await storage.deleteGroupAnnouncement(req.params.id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // ==================== ACHIEVEMENTS ====================
  
  app.get("/api/achievements/:userId", async (req, res) => {
    try {
      const achievements = await storage.getUserAchievements(req.params.userId);
      res.json(achievements);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/achievements/progress/:userId", async (req, res) => {
    try {
      // Return achievement progress data
      // This could be expanded to show progress toward locked achievements
      res.json([]);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ==================== ADMIN ====================
  
  app.get("/api/admin/stats", async (req, res) => {
    try {
      const students = await storage.getAllStudents();
      
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      const activeToday = students.filter(
        s => s.lastLoginDate && s.lastLoginDate >= todayStart
      ).length;

      // Get all quiz attempts
      const allAttempts = await Promise.all(
        students.map(s => storage.getUserQuizAttempts(s.id))
      );
      const totalAttempts = allAttempts.flat().length;

      const avgPerformance = allAttempts.flat().length > 0
        ? Math.round(
            allAttempts.flat().reduce((sum, a) => sum + (a.score / a.totalQuestions) * 100, 0) /
              allAttempts.flat().length
          )
        : 0;

      res.json({
        totalStudents: students.length,
        activeToday,
        totalQuizAttempts: totalAttempts,
        avgPerformance,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Platform settings endpoints
  app.get("/api/admin/settings", async (req, res) => {
    try {
      const settings = await storage.getAllSettings();
      res.json(settings);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/admin/settings/:key", async (req, res) => {
    try {
      const setting = await storage.getSetting(req.params.key);
      res.json(setting || { key: req.params.key, value: null });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/admin/settings", async (req, res) => {
    try {
      const { key, value } = req.body;
      const setting = await storage.setSetting(key, value);
      res.json(setting);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Public endpoint for students to get FastBots config
  app.get("/api/settings/fastbots", async (req, res) => {
    try {
      const enabled = await storage.getSetting("fastbots_enabled");
      const botId = await storage.getSetting("fastbots_bot_id");
      
      res.json({
        enabled: enabled?.value === "true",
        botId: botId?.value || null,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/admin/students", async (req, res) => {
    try {
      const students = await storage.getAllStudents();
      // Remove passwords
      const sanitized = students.map(({ password, ...rest }) => rest);
      res.json(sanitized);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/admin/students/:id", async (req, res) => {
    try {
      await storage.deleteUser(req.params.id);
      res.json({ message: "Student deleted" });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/admin/students/:id/reset", async (req, res) => {
    try {
      await storage.updateUser(req.params.id, {
        points: 0,
        streak: 0,
        level: 1,
        xp: 0,
      });
      res.json({ message: "Progress reset" });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/admin/analytics", async (req, res) => {
    try {
      // Weekly activity
      const students = await storage.getAllStudents();
      const allSessions = await Promise.all(
        students.map(s => storage.getUserStudySessions(s.id))
      );
      
      const weeklyActivity = [0, 0, 0, 0, 0, 0, 0];
      allSessions.flat().forEach(session => {
        if (session.completedAt) {
          const dayIndex = session.completedAt.getDay();
          weeklyActivity[dayIndex] += 1;
        }
      });

      // Subject performance
      const allAttempts = await Promise.all(
        students.map(s => storage.getUserQuizAttempts(s.id))
      );
      
      const subjectPerformance = [75, 82, 88, 79, 81]; // Placeholder

      res.json({
        weeklyActivity,
        subjectPerformance,
        totalQuizzes: allAttempts.flat().length,
        totalStudyHours: Math.round(allSessions.flat().reduce((sum, s) => sum + s.duration, 0) / 60),
        quizzesThisWeek: 0,
        engagementRate: students.length > 0 ? Math.round((weeklyActivity.reduce((a, b) => a + b, 0) / students.length) * 100) : 0,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ==================== ACTIVITY RECENT ====================
  
  app.get("/api/activity/recent/:userId", async (req, res) => {
    try {
      // Return recent activity - placeholder for now
      res.json([]);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ==================== CLASS MANAGEMENT ====================

  // Get classes for current user (teacher or student)
  app.get("/api/classes/user/:userId", async (req, res) => {
    try {
      const user = await storage.getUser(req.params.userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      let classes;
      if (user.role === "teacher") {
        classes = await storage.getTeacherClasses(user.id);
      } else {
        classes = await storage.getStudentClasses(user.id);
      }

      // Add teacher info for each class
      const classesWithTeacher = await Promise.all(
        classes.map(async (cls) => {
          const teacher = await storage.getUser(cls.teacherId);
          return {
            ...cls,
            teacherName: teacher?.name || "Unknown",
          };
        })
      );

      res.json(classesWithTeacher);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get single class details
  app.get("/api/classes/:classId", async (req, res) => {
    try {
      const cls = await storage.getClass(req.params.classId);
      if (!cls) {
        return res.status(404).json({ error: "Class not found" });
      }

      const teacher = await storage.getUser(cls.teacherId);
      const students = await storage.getClassStudents(cls.id);

      res.json({
        ...cls,
        teacherName: teacher?.name || "Unknown",
        studentCount: students.length,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Create a new class (teacher only)
  app.post("/api/classes", async (req, res) => {
    try {
      const data = insertClassSchema.parse(req.body);
      
      // Generate unique class code
      const code = Math.random().toString(36).substring(2, 8).toUpperCase();
      
      const cls = await storage.createClass({
        ...data,
        code,
      });

      res.json(cls);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Update class (teacher only)
  app.put("/api/classes/:classId", async (req, res) => {
    try {
      const cls = await storage.updateClass(req.params.classId, req.body);
      res.json(cls);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Delete class (teacher only)
  app.delete("/api/classes/:classId", async (req, res) => {
    try {
      await storage.deleteClass(req.params.classId);
      res.json({ message: "Class deleted" });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Join class by code (student)
  app.post("/api/classes/join", async (req, res) => {
    try {
      const { code, studentId } = req.body;
      
      const cls = await storage.getClassByCode(code.toUpperCase());
      if (!cls) {
        return res.status(404).json({ error: "Class not found. Check the code and try again." });
      }

      // Check if already enrolled
      const isEnrolled = await storage.isStudentEnrolled(cls.id, studentId);
      if (isEnrolled) {
        return res.status(400).json({ error: "You are already enrolled in this class." });
      }

      await storage.enrollStudent(cls.id, studentId);
      res.json({ message: "Successfully joined class", class: cls });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get class students
  app.get("/api/classes/:classId/students", async (req, res) => {
    try {
      const students = await storage.getClassStudents(req.params.classId);
      const sanitized = students.map(({ password, ...s }) => s);
      res.json(sanitized);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Add student to class by username (teacher only)
  app.post("/api/classes/:classId/students", async (req, res) => {
    try {
      const { username } = req.body;
      const classId = req.params.classId;

      // Find student by username
      const student = await storage.getUserByUsername(username);
      if (!student) {
        return res.status(404).json({ error: "Student not found. Check the username and try again." });
      }

      if (student.role !== "student") {
        return res.status(400).json({ error: "Only students can be added to classes." });
      }

      // Check if already enrolled
      const isEnrolled = await storage.isStudentEnrolled(classId, student.id);
      if (isEnrolled) {
        return res.status(400).json({ error: "This student is already enrolled in this class." });
      }

      await storage.enrollStudent(classId, student.id);
      const { password, ...sanitizedStudent } = student;
      res.json({ message: "Student added successfully", student: sanitizedStudent });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Remove student from class (teacher only)
  app.delete("/api/classes/:classId/students/:studentId", async (req, res) => {
    try {
      const { classId, studentId } = req.params;

      // Check if student is enrolled
      const isEnrolled = await storage.isStudentEnrolled(classId, studentId);
      if (!isEnrolled) {
        return res.status(404).json({ error: "Student is not enrolled in this class." });
      }

      await storage.unenrollStudent(classId, studentId);
      res.json({ message: "Student removed successfully" });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ==================== TODOS ====================

  // Get todos for a class
  app.get("/api/classes/:classId/todos", async (req, res) => {
    try {
      const todos = await storage.getClassTodos(req.params.classId);
      res.json(todos);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get all todos for a student (across all enrolled classes)
  app.get("/api/todos/student/:studentId", async (req, res) => {
    try {
      const todos = await storage.getStudentTodos(req.params.studentId);
      
      // Add class info to each todo
      const todosWithClass = await Promise.all(
        todos.map(async (todo) => {
          const cls = await storage.getClass(todo.classId);
          return {
            ...todo,
            className: cls?.name || "Unknown",
            classSubject: cls?.subject || "Unknown",
          };
        })
      );

      res.json(todosWithClass);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Create todo (teacher only)
  app.post("/api/classes/:classId/todos", async (req, res) => {
    try {
      const data = insertTodoSchema.parse({
        ...req.body,
        classId: req.params.classId,
      });
      
      const todo = await storage.createTodo(data);
      res.json(todo);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Update todo (teacher only)
  app.put("/api/todos/:todoId", async (req, res) => {
    try {
      const todo = await storage.updateTodo(req.params.todoId, req.body);
      res.json(todo);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Delete todo (teacher only)
  app.delete("/api/todos/:todoId", async (req, res) => {
    try {
      await storage.deleteTodo(req.params.todoId);
      res.json({ message: "Todo deleted" });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ==================== EXAMS ====================

  // Get exams for a class
  app.get("/api/classes/:classId/exams", async (req, res) => {
    try {
      const exams = await storage.getClassExams(req.params.classId);
      res.json(exams);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get all upcoming exams for a student (across all enrolled classes)
  app.get("/api/exams/student/:studentId", async (req, res) => {
    try {
      const exams = await storage.getUpcomingExams(req.params.studentId);
      
      // Add class info to each exam
      const examsWithClass = await Promise.all(
        exams.map(async (exam) => {
          const cls = await storage.getClass(exam.classId);
          return {
            ...exam,
            className: cls?.name || "Unknown",
            classSubject: cls?.subject || "Unknown",
          };
        })
      );

      res.json(examsWithClass);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Create exam (teacher only)
  app.post("/api/classes/:classId/exams", async (req, res) => {
    try {
      const data = insertExamSchema.parse({
        ...req.body,
        classId: req.params.classId,
      });
      
      const exam = await storage.createExam(data);
      res.json(exam);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Update exam (teacher only)
  app.put("/api/exams/:examId", async (req, res) => {
    try {
      const exam = await storage.updateExam(req.params.examId, req.body);
      res.json(exam);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Delete exam (teacher only)
  app.delete("/api/exams/:examId", async (req, res) => {
    try {
      await storage.deleteExam(req.params.examId);
      res.json({ message: "Exam deleted" });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ==================== CLASS RESOURCES ====================

  // Get resources for a class
  app.get("/api/classes/:classId/resources", async (req, res) => {
    try {
      const resources = await storage.getClassResources(req.params.classId);
      res.json(resources);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Create resource (teacher only)
  app.post("/api/classes/:classId/resources", async (req, res) => {
    try {
      const data = insertClassResourceSchema.parse({
        ...req.body,
        classId: req.params.classId,
      });
      
      const resource = await storage.createResource(data);
      res.json(resource);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Delete resource (teacher only)
  app.delete("/api/resources/:resourceId", async (req, res) => {
    try {
      await storage.deleteResource(req.params.resourceId);
      res.json({ message: "Resource deleted" });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ==================== CLASS QUIZZES ====================

  // Get quizzes for a class
  app.get("/api/classes/:classId/quizzes", async (req, res) => {
    try {
      const allQuizzes = await storage.getUserQuizzes(req.params.classId);
      res.json(allQuizzes);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ==================== TEACHER QUIZZES ====================

  // Get teacher quizzes for a class
  app.get("/api/classes/:classId/teacher-quizzes", async (req, res) => {
    try {
      const quizzes = await storage.getClassTeacherQuizzes(req.params.classId);
      res.json(quizzes);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get a specific teacher quiz
  app.get("/api/teacher-quizzes/:quizId", async (req, res) => {
    try {
      const quiz = await storage.getTeacherQuiz(req.params.quizId);
      if (!quiz) {
        return res.status(404).json({ error: "Quiz not found" });
      }
      res.json(quiz);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Create teacher quiz
  app.post("/api/classes/:classId/teacher-quizzes", async (req, res) => {
    try {
      const validationSchema = insertTeacherQuizSchema.extend({
        questions: z.array(z.object({
          id: z.string(),
          question: z.string().min(1, "Question text is required"),
          type: z.enum(["mcq", "multiple_select", "short_answer", "essay"]),
          points: z.number().min(1),
          options: z.array(z.string()).optional(),
          correctAnswer: z.number().optional(),
          correctAnswers: z.array(z.number()).optional(),
          acceptedAnswers: z.array(z.string()).optional(),
          rubric: z.string().optional(),
          maxWords: z.number().optional(),
        })).min(1, "At least one question is required"),
      });
      
      const data = {
        ...req.body,
        classId: req.params.classId,
      };
      
      const validated = validationSchema.parse(data);
      const quiz = await storage.createTeacherQuiz(validated);
      res.json(quiz);
    } catch (error: any) {
      if (error.name === "ZodError") {
        return res.status(400).json({ error: error.errors[0]?.message || "Invalid quiz data" });
      }
      res.status(400).json({ error: error.message });
    }
  });

  // Update teacher quiz
  app.put("/api/teacher-quizzes/:quizId", async (req, res) => {
    try {
      const quiz = await storage.updateTeacherQuiz(req.params.quizId, req.body);
      res.json(quiz);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Delete teacher quiz
  app.delete("/api/teacher-quizzes/:quizId", async (req, res) => {
    try {
      await storage.deleteTeacherQuiz(req.params.quizId);
      res.json({ message: "Quiz deleted" });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get student's available quizzes
  app.get("/api/student/:studentId/teacher-quizzes", async (req, res) => {
    try {
      const quizzes = await storage.getStudentTeacherQuizzes(req.params.studentId);
      res.json(quizzes);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ==================== TEACHER QUIZ ATTEMPTS ====================

  // Get all attempts for a quiz (teacher view)
  app.get("/api/teacher-quizzes/:quizId/attempts", async (req, res) => {
    try {
      const attempts = await storage.getQuizAttempts(req.params.quizId);
      
      // Add student info to each attempt
      const attemptsWithStudent = await Promise.all(
        attempts.map(async (attempt) => {
          const student = await storage.getUser(attempt.studentId);
          return {
            ...attempt,
            studentName: student?.name || "Unknown",
            studentUsername: student?.username || "unknown",
          };
        })
      );
      
      res.json(attemptsWithStudent);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get student's attempt for a quiz
  app.get("/api/teacher-quizzes/:quizId/attempts/:studentId", async (req, res) => {
    try {
      const attempt = await storage.getStudentQuizAttempt(req.params.quizId, req.params.studentId);
      res.json(attempt || null);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Submit quiz attempt (student)
  app.post("/api/teacher-quizzes/:quizId/attempts", async (req, res) => {
    try {
      const { studentId, answers, timeSpent, autoScore } = req.body;
      
      // Check if student already submitted
      const existing = await storage.getStudentQuizAttempt(req.params.quizId, studentId);
      if (existing) {
        return res.status(400).json({ error: "You have already submitted this quiz" });
      }
      
      const attempt = await storage.createTeacherQuizAttempt({
        quizId: req.params.quizId,
        studentId,
        answers,
        timeSpent,
        autoScore: autoScore || 0,
        status: "submitted",
      });
      
      res.json(attempt);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Grade quiz attempt (teacher)
  app.put("/api/teacher-quiz-attempts/:attemptId/grade", async (req, res) => {
    try {
      const { manualScore, answers, gradedBy } = req.body;
      
      const attempt = await storage.updateTeacherQuizAttempt(req.params.attemptId, {
        manualScore,
        answers,
        totalScore: (req.body.autoScore || 0) + (manualScore || 0),
        status: "graded",
        gradedBy,
        gradedAt: new Date(),
      });
      
      res.json(attempt);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ==================== MIND MAPS ====================

  app.get("/api/mind-maps/:userId", async (req, res) => {
    try {
      const maps = await storage.getUserMindMaps(req.params.userId);
      res.json(maps);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/mind-maps/detail/:id", async (req, res) => {
    try {
      const map = await storage.getMindMap(req.params.id);
      if (!map) return res.status(404).json({ error: "Mind map not found" });
      res.json(map);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/mind-maps", async (req, res) => {
    try {
      const data = insertMindMapSchema.parse(req.body);
      const map = await storage.createMindMap(data);
      res.json(map);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.put("/api/mind-maps/:id", async (req, res) => {
    try {
      const { title, nodes, subject } = req.body;
      const map = await storage.updateMindMap(req.params.id, { title, nodes, subject });
      if (!map) return res.status(404).json({ error: "Mind map not found" });
      res.json(map);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/mind-maps/:id", async (req, res) => {
    try {
      await storage.deleteMindMap(req.params.id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ==================== INSTRUCTION MANUAL PDF ====================
  
  // Generate and download instruction manual as PDF
  app.get("/api/instruction-manual/pdf", async (req, res) => {
    try {
      const manualPath = path.join(process.cwd(), "INSTRUCTION_MANUAL.md");
      
      if (!fs.existsSync(manualPath)) {
        return res.status(404).json({ error: "Instruction manual not found" });
      }
      
      // Get system Chromium path for production compatibility
      const chromiumPath = getChromiumPath();
      
      const pdf = await mdToPdf(
        { path: manualPath },
        {
          launch_options: {
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu', '--disable-dev-shm-usage'],
            ...(chromiumPath && { executablePath: chromiumPath }),
          },
          pdf_options: {
            format: "A4",
            margin: { top: "20mm", right: "20mm", bottom: "20mm", left: "20mm" },
            printBackground: true,
          },
          css: `
            body { 
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
              line-height: 1.6;
              color: #333;
            }
            h1 { 
              color: #16a34a; 
              border-bottom: 2px solid #16a34a;
              padding-bottom: 10px;
            }
            h2 { 
              color: #15803d; 
              margin-top: 30px;
              border-bottom: 1px solid #ddd;
              padding-bottom: 8px;
            }
            h3 { color: #166534; }
            table { 
              border-collapse: collapse; 
              width: 100%; 
              margin: 20px 0;
            }
            th, td { 
              border: 1px solid #ddd; 
              padding: 12px; 
              text-align: left; 
            }
            th { 
              background-color: #16a34a; 
              color: white; 
            }
            tr:nth-child(even) { background-color: #f9f9f9; }
            code { 
              background-color: #f4f4f4; 
              padding: 2px 6px; 
              border-radius: 3px;
              font-family: monospace;
            }
            blockquote {
              border-left: 4px solid #16a34a;
              padding-left: 16px;
              color: #666;
              margin: 20px 0;
            }
            strong { color: #111; }
            hr { 
              border: none; 
              border-top: 2px solid #16a34a; 
              margin: 30px 0; 
            }
          `,
        }
      );
      
      if (pdf) {
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", "attachment; filename=Hibiscus_StudyPal_Instruction_Manual.pdf");
        res.send(pdf.content);
      } else {
        res.status(500).json({ error: "Failed to generate PDF" });
      }
    } catch (error: any) {
      console.error("PDF generation error:", error);
      res.status(500).json({ error: "Failed to generate PDF: " + error.message });
    }
  });

  // ==================== NEWS & UPDATES ====================

  app.get("/api/news", async (req, res) => {
    try {
      const userId = req.query.userId as string | undefined;
      const user = userId ? await storage.getUser(userId) : null;
      const isAdmin = user?.role === "admin";

      const posts = isAdmin
        ? await storage.getAllNewsPosts()
        : await storage.getPublishedNewsPosts();

      const postsWithMeta = await Promise.all(
        posts.map(async (post) => {
          const likeCount = await storage.getPostLikeCount(post.id);
          const commentCount = await storage.getPostCommentCount(post.id);
          const userLike = userId
            ? await storage.getUserLikeForPost(post.id, userId)
            : undefined;
          return {
            ...post,
            likeCount,
            commentCount,
            isLikedByUser: !!userLike,
          };
        })
      );

      res.json(postsWithMeta);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/news/:id", async (req, res) => {
    try {
      const post = await storage.getNewsPost(req.params.id);
      if (!post) return res.status(404).json({ error: "Post not found" });

      const userId = req.query.userId as string | undefined;
      const user = userId ? await storage.getUser(userId) : null;
      const isAdmin = user?.role === "admin";

      if (!isAdmin) {
        const isVisible =
          post.status === "published" ||
          (post.status === "scheduled" && post.scheduledAt && new Date(post.scheduledAt) <= new Date());
        if (!isVisible) {
          return res.status(404).json({ error: "Post not found" });
        }
      }

      const likeCount = await storage.getPostLikeCount(post.id);
      const commentCount = await storage.getPostCommentCount(post.id);
      const userLike = userId
        ? await storage.getUserLikeForPost(post.id, userId)
        : undefined;

      res.json({
        ...post,
        likeCount,
        commentCount,
        isLikedByUser: !!userLike,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/news", async (req, res) => {
    try {
      const { authorId } = req.body;
      if (!authorId) return res.status(401).json({ error: "Unauthorized" });
      const user = await storage.getUser(authorId);
      if (!user || user.role !== "admin") {
        return res.status(403).json({ error: "Only admins can create posts" });
      }

      const parsed = insertNewsPostSchema.parse(req.body);
      const post = await storage.createNewsPost(parsed);
      res.status(201).json(post);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.patch("/api/news/:id", async (req, res) => {
    try {
      const { userId } = req.body;
      if (!userId) return res.status(401).json({ error: "Unauthorized" });
      const user = await storage.getUser(userId);
      if (!user || user.role !== "admin") {
        return res.status(403).json({ error: "Only admins can update posts" });
      }

      const updateSchema = z.object({
        userId: z.string(),
        type: z.enum(["newsletter", "video"]).optional(),
        title: z.string().optional(),
        body: z.string().nullable().optional(),
        imageUrl: z.string().nullable().optional(),
        attachmentUrl: z.string().nullable().optional(),
        attachmentName: z.string().nullable().optional(),
        videoUrl: z.string().nullable().optional(),
        videoProvider: z.string().nullable().optional(),
        videoOrientation: z.string().nullable().optional(),
        authorName: z.string().optional(),
        authorRole: z.string().optional(),
        status: z.enum(["published", "scheduled", "draft"]).optional(),
        scheduledAt: z.coerce.date().nullable().optional(),
      });

      const parsed = updateSchema.parse(req.body);
      const { userId: _, ...updates } = parsed;
      const post = await storage.updateNewsPost(req.params.id, updates);
      if (!post) return res.status(404).json({ error: "Post not found" });
      res.json(post);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/api/news/:id", async (req, res) => {
    try {
      const userId = req.query.userId as string;
      if (!userId) return res.status(401).json({ error: "Unauthorized" });
      const user = await storage.getUser(userId);
      if (!user || user.role !== "admin") {
        return res.status(403).json({ error: "Only admins can delete posts" });
      }

      await storage.deleteNewsPost(req.params.id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/news/:id/like", async (req, res) => {
    try {
      const { userId } = req.body;
      if (!userId) return res.status(401).json({ error: "Unauthorized" });

      const liked = await storage.toggleNewsLike(req.params.id, userId);
      const likeCount = await storage.getPostLikeCount(req.params.id);
      res.json({ liked, likeCount });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/news/:id/comments", async (req, res) => {
    try {
      const comments = await storage.getPostComments(req.params.id);
      res.json(comments);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/news/:id/comments", async (req, res) => {
    try {
      const { userId, userName, content } = req.body;
      if (!userId) return res.status(401).json({ error: "Unauthorized" });

      const parsed = insertNewsCommentSchema.parse({
        postId: req.params.id,
        userId,
        userName,
        content,
      });
      const comment = await storage.createNewsComment(parsed);
      res.status(201).json(comment);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/api/news/:id/comments/:commentId", async (req, res) => {
    try {
      const userId = req.query.userId as string;
      if (!userId) return res.status(401).json({ error: "Unauthorized" });

      const user = await storage.getUser(userId);
      if (!user) return res.status(401).json({ error: "Unauthorized" });

      const comments = await storage.getPostComments(req.params.id);
      const comment = comments.find(c => c.id === req.params.commentId);
      if (!comment) return res.status(404).json({ error: "Comment not found" });

      if (comment.userId !== userId && user.role !== "admin") {
        return res.status(403).json({ error: "You can only delete your own comments" });
      }

      await storage.deleteNewsComment(req.params.commentId);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ==================== TRAINING HUB - TOPICS ====================

  app.get("/api/training/topics", async (req, res) => {
    try {
      const topics = await storage.getAllTrainingTopics();
      res.json(topics);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/training/topics", async (req, res) => {
    try {
      const userId = req.body.createdBy;
      if (!userId) return res.status(401).json({ error: "Unauthorized" });
      const user = await storage.getUser(userId);
      if (!user || user.role !== "admin") {
        return res.status(403).json({ error: "Only admins can create topics" });
      }

      const data = insertTrainingTopicSchema.parse(req.body);
      const topic = await storage.createTrainingTopic(data);
      res.status(201).json(topic);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.patch("/api/training/topics/:id", async (req, res) => {
    try {
      const userId = req.body.userId || req.query.userId as string;
      if (!userId) return res.status(401).json({ error: "Unauthorized" });
      const user = await storage.getUser(userId);
      if (!user || user.role !== "admin") {
        return res.status(403).json({ error: "Only admins can update topics" });
      }

      const { title, position } = req.body;
      const updates: Record<string, any> = {};
      if (title !== undefined) updates.title = title;
      if (position !== undefined) updates.position = position;
      const topic = await storage.updateTrainingTopic(req.params.id, updates);
      if (!topic) return res.status(404).json({ error: "Topic not found" });
      res.json(topic);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/api/training/topics/:id", async (req, res) => {
    try {
      const userId = req.query.userId as string;
      if (!userId) return res.status(401).json({ error: "Unauthorized" });
      const user = await storage.getUser(userId);
      if (!user || user.role !== "admin") {
        return res.status(403).json({ error: "Only admins can delete topics" });
      }

      await storage.deleteTrainingTopic(req.params.id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ==================== TRAINING HUB - ITEMS ====================

  app.get("/api/training/items", async (req, res) => {
    try {
      const items = await storage.getAllTrainingItems();
      res.json(items);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/training/items", async (req, res) => {
    try {
      const userId = req.body.createdBy;
      if (!userId) return res.status(401).json({ error: "Unauthorized" });
      const user = await storage.getUser(userId);
      if (!user || user.role !== "admin") {
        return res.status(403).json({ error: "Only admins can create items" });
      }

      const data = insertTrainingItemSchema.parse(req.body);
      const item = await storage.createTrainingItem(data);
      res.status(201).json(item);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.patch("/api/training/items/:id", async (req, res) => {
    try {
      const userId = req.body.userId || req.query.userId as string;
      if (!userId) return res.status(401).json({ error: "Unauthorized" });
      const user = await storage.getUser(userId);
      if (!user || user.role !== "admin") {
        return res.status(403).json({ error: "Only admins can update items" });
      }

      const { title, description, content, topicId, status, attachmentUrl, attachmentName, attachmentPath, videoUrl, type, questions } = req.body;
      const updates: Record<string, any> = {};
      if (title !== undefined) updates.title = title;
      if (description !== undefined) updates.description = description;
      if (content !== undefined) updates.content = content;
      if (topicId !== undefined) updates.topicId = topicId;
      if (status !== undefined) updates.status = status;
      if (videoUrl !== undefined) updates.videoUrl = videoUrl;
      if (attachmentUrl !== undefined) updates.attachmentUrl = attachmentUrl;
      if (attachmentName !== undefined) updates.attachmentName = attachmentName;
      if (attachmentPath !== undefined) updates.attachmentPath = attachmentPath;
      if (type !== undefined) updates.type = type;
      if (questions !== undefined) updates.questions = questions;
      const item = await storage.updateTrainingItem(req.params.id, updates);
      if (!item) return res.status(404).json({ error: "Item not found" });
      res.json(item);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/api/training/items/:id", async (req, res) => {
    try {
      const userId = req.query.userId as string;
      if (!userId) return res.status(401).json({ error: "Unauthorized" });
      const user = await storage.getUser(userId);
      if (!user || user.role !== "admin") {
        return res.status(403).json({ error: "Only admins can delete items" });
      }

      await storage.deleteTrainingItem(req.params.id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/training/progress", async (req, res) => {
    try {
      const userId = req.query.userId as string;
      if (userId) {
        const progress = await storage.getTrainingProgressByUser(userId);
        return res.json(progress);
      }
      const progress = await storage.getAllTrainingProgress();
      res.json(progress);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/training/progress/toggle", async (req, res) => {
    try {
      const { userId, itemId } = req.body;
      if (!userId || !itemId) return res.status(400).json({ error: "userId and itemId required" });
      const progress = await storage.toggleTrainingProgress(userId, itemId);
      res.json(progress);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/training/progress/all-teachers", async (req, res) => {
    try {
      const userId = req.query.userId as string;
      if (!userId) return res.status(401).json({ error: "Unauthorized" });
      const user = await storage.getUser(userId);
      if (!user || user.role !== "admin") {
        return res.status(403).json({ error: "Admin only" });
      }
      const teachers = await storage.getTeachers();
      const allProgress = await storage.getAllTrainingProgress();
      const items = await storage.getAllTrainingItems();
      const postedItems = items.filter(i => i.status === "posted");

      const teacherProgress = teachers.map(teacher => {
        const teacherCompletions = allProgress.filter(p => p.userId === teacher.id && p.completed);
        const completedItemIds = new Set(teacherCompletions.map(p => p.itemId));
        const completedCount = postedItems.filter(i => completedItemIds.has(i.id)).length;
        return {
          id: teacher.id,
          name: teacher.name,
          username: teacher.username,
          completedCount,
          totalItems: postedItems.length,
          percentage: postedItems.length > 0 ? Math.round((completedCount / postedItems.length) * 100) : 0,
          completions: teacherCompletions.map(p => ({
            itemId: p.itemId,
            completedAt: p.completedAt,
          })),
        };
      });

      res.json(teacherProgress);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ==================== TRAINING QUIZ ROUTES ====================

  app.post("/api/training/quiz/:itemId/attempt", async (req, res) => {
    try {
      const { userId, answers } = req.body;
      if (!userId) return res.status(401).json({ error: "Unauthorized" });

      const allItems = await storage.getAllTrainingItems();
      const item = allItems.find(i => i.id === req.params.itemId);
      if (!item) return res.status(404).json({ error: "Quiz not found" });

      const questions = (item.questions as any[]) || [];
      if (questions.length === 0) {
        return res.status(400).json({ error: "This quiz has no questions" });
      }

      let score = 0;
      const gradedAnswers = answers.map((a: { questionId: string; selectedAnswer: number }) => {
        const question = questions.find((q: any) => q.id === a.questionId);
        const isCorrect = question && a.selectedAnswer === question.correctAnswer;
        if (isCorrect) score++;
        return { ...a, isCorrect };
      });

      const attempt = await storage.createTrainingQuizAttempt({
        userId,
        itemId: req.params.itemId,
        answers: gradedAnswers,
        score,
        totalQuestions: questions.length,
      });

      const percentage = Math.round((score / questions.length) * 100);
      if (percentage >= 70) {
        const existingProgress = await storage.getTrainingProgressByUser(userId);
        const itemProgress = existingProgress.find(p => p.itemId === req.params.itemId);
        if (!itemProgress || !itemProgress.completed) {
          await storage.toggleTrainingProgress(userId, req.params.itemId);
        }
      }

      res.status(201).json(attempt);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/training/quiz/:itemId/attempts", async (req, res) => {
    try {
      const attempts = await storage.getTrainingQuizAttemptsByItem(req.params.itemId);
      const users = await Promise.all(
        [...new Set(attempts.map(a => a.userId))].map(id => storage.getUser(id))
      );
      const userMap = Object.fromEntries(users.filter(Boolean).map(u => [u!.id, u!]));

      const enriched = attempts.map(a => ({
        ...a,
        userName: userMap[a.userId]?.name || "Unknown",
      }));
      res.json(enriched);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/training/quiz/:itemId/my-attempt", async (req, res) => {
    try {
      const userId = req.query.userId as string;
      if (!userId) return res.status(401).json({ error: "Unauthorized" });
      const attempt = await storage.getTrainingQuizAttemptByUser(userId, req.params.itemId);
      res.json(attempt || null);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/training/quiz/ai-generate", async (req, res) => {
    try {
      const { userId, topic, numQuestions, difficulty } = req.body;
      if (!userId) return res.status(401).json({ error: "Unauthorized" });
      const user = await storage.getUser(userId);
      if (!user || user.role !== "admin") {
        return res.status(403).json({ error: "Admin only" });
      }

      const { generateTrainingQuiz } = await import("./openai");
      const questions = await generateTrainingQuiz({
        topic,
        numQuestions: numQuestions || 5,
        difficulty: difficulty || "medium",
      });
      res.json(questions);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ==================== SUPPORT MESSAGES ====================
  app.get("/api/support/conversations", async (req, res) => {
    try {
      const conversations = await storage.getSupportConversations();
      res.json(conversations);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/support/messages/:userId", async (req, res) => {
    try {
      const messages = await storage.getSupportMessages(req.params.userId);
      res.json(messages);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/support/messages", async (req, res) => {
    try {
      const { userId, senderId, senderRole, message } = req.body;
      if (!userId || !senderId || !senderRole || !message) {
        return res.status(400).json({ error: "Missing required fields" });
      }
      const created = await storage.createSupportMessage({ userId, senderId, senderRole, message, read: false });
      res.status(201).json(created);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.patch("/api/support/messages/read", async (req, res) => {
    try {
      const { userId, readerRole } = req.body;
      if (!userId || !readerRole) {
        return res.status(400).json({ error: "Missing required fields" });
      }
      await storage.markSupportMessagesRead(userId, readerRole);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/support/unread/:userId", async (req, res) => {
    try {
      const count = await storage.getSupportUnreadCount(req.params.userId);
      res.json({ count });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ==================== AI TEACHER TOOLS ====================
  app.post("/api/ai/lesson-plan", async (req, res) => {
    try {
      const { grade, subject, topic, duration } = req.body;
      if (!grade || !subject || !topic) {
        return res.status(400).json({ error: "grade, subject, and topic are required" });
      }
      const { generateLessonPlan } = await import("./openai");
      const content = await generateLessonPlan({ grade, subject, topic, duration });
      res.json({ content });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/ai/study-notes", async (req, res) => {
    try {
      const { grade, subject, topic } = req.body;
      if (!grade || !subject || !topic) {
        return res.status(400).json({ error: "grade, subject, and topic are required" });
      }
      const { generateTeacherNotes } = await import("./openai");
      const content = await generateTeacherNotes({ grade, subject, topic });
      res.json({ content });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/ai/generate-slides", async (req, res) => {
    try {
      const { content, title } = req.body;
      if (!content) return res.status(400).json({ error: "Content is required" });
      const { generateSlideContent } = await import("./openai");
      const result = await generateSlideContent(content, title || "Lesson Plan");
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ==================== AI NOTE TOOLS ====================
  app.post("/api/notes/:id/summarize", async (req, res) => {
    try {
      const note = await storage.getNote(req.params.id);
      if (!note) return res.status(404).json({ error: "Note not found" });
      if (!note.content) return res.status(400).json({ error: "Note has no content to summarize" });
      const { summarizeNotes } = await import("./openai");
      const summary = await summarizeNotes(note.content, note.title);
      res.json({ summary });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/notes/:id/study-guide", async (req, res) => {
    try {
      const note = await storage.getNote(req.params.id);
      if (!note) return res.status(404).json({ error: "Note not found" });
      if (!note.content) return res.status(400).json({ error: "Note has no content" });
      const { generateStudyGuide } = await import("./openai");
      const guide = await generateStudyGuide(note.content, note.title);
      res.json({ guide });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/notes/:id/generate-flashcards", async (req, res) => {
    try {
      const note = await storage.getNote(req.params.id);
      if (!note) return res.status(404).json({ error: "Note not found" });
      if (!note.content) return res.status(400).json({ error: "Note has no content" });
      const { generateFlashcardsFromNotes } = await import("./openai");
      const cards = await generateFlashcardsFromNotes(note.content, note.title);
      const created = [];
      for (const card of cards) {
        const flashcard = await storage.createFlashcard({
          userId: note.userId,
          front: card.front,
          back: card.back,
          subject: note.subject || "General",
          tags: note.tags || [],
        });
        created.push(flashcard);
      }
      res.json({ count: created.length, flashcards: created });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/notes/:id/generate-podcast", async (req, res) => {
    try {
      const note = await storage.getNote(req.params.id);
      if (!note) return res.status(404).json({ error: "Note not found" });
      if (!note.content) return res.status(400).json({ error: "Note has no content" });
      const { generatePodcastScript, generateSpeech } = await import("./openai");
      const script = await generatePodcastScript(note.content, note.title);
      const audioBuffer = await generateSpeech(script);
      const base64Audio = audioBuffer.toString("base64");
      res.json({ script, audio: base64Audio });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/notes/:id/generate-illustration", async (req, res) => {
    try {
      const note = await storage.getNote(req.params.id);
      if (!note) return res.status(404).json({ error: "Note not found" });
      if (!note.content) return res.status(400).json({ error: "Note has no content" });
      const { generateIllustrationPrompt } = await import("./openai");
      const prompt = await generateIllustrationPrompt(note.content, note.title);
      res.json({ prompt, noteTitle: note.title });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
