import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { generateQuiz, getTutorResponse } from "./openai";
import bcrypt from "bcrypt";
import multer from "multer";
import { Client } from "@replit/object-storage";
import { randomUUID } from "crypto";
import path from "path";
import {
  insertUserSchema,
  insertNoteSchema,
  insertFlashcardSchema,
  insertQuizSchema,
  insertQuizAttemptSchema,
  insertStudySessionSchema,
  insertStudyGroupSchema,
  insertClassSchema,
  insertTodoSchema,
  insertExamSchema,
  insertClassResourceSchema,
  insertTeacherQuizSchema,
  insertTeacherQuizAttemptSchema,
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
      
      const { ok, error } = await objectStorageClient.uploadFromBytes(
        fileName,
        req.file.buffer
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
      
      const { ok, value, error } = await objectStorageClient.downloadAsBytes(filePath);
      
      if (!ok || !value) {
        console.error("Download error:", error);
        return res.status(404).json({ error: "File not found" });
      }
      
      // Determine content type from extension
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
      
      res.setHeader('Content-Type', contentTypes[ext || ''] || 'application/octet-stream');
      res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
      res.send(Buffer.from(value));
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
      const group = await storage.createStudyGroup(data);
      res.json(group);
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

  const httpServer = createServer(app);
  return httpServer;
}
