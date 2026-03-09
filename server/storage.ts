import { db } from "./db";
import { eq, and, lte, sql, desc } from "drizzle-orm";
import {
  users,
  notes,
  flashcards,
  quizzes,
  quizAttempts,
  studySessions,
  achievements,
  studyGroups,
  groupMessages,
  groupNotes,
  groupAnnouncements,
  tutorConversations,
  mindMaps,
  platformSettings,
  classes,
  classEnrollments,
  todos,
  exams,
  classResources,
  teacherQuizzes,
  teacherQuizAttempts,
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
  type GroupMessage,
  type InsertGroupMessage,
  type GroupNote,
  type InsertGroupNote,
  type GroupAnnouncement,
  type InsertGroupAnnouncement,
  type TutorConversation,
  type InsertTutorConversation,
  type MindMap,
  type InsertMindMap,
  type PlatformSetting,
  type Class,
  type InsertClass,
  type ClassEnrollment,
  type InsertClassEnrollment,
  type Todo,
  type InsertTodo,
  type Exam,
  type InsertExam,
  type ClassResource,
  type InsertClassResource,
  type TeacherQuiz,
  type InsertTeacherQuiz,
  type TeacherQuizAttempt,
  type InsertTeacherQuizAttempt,
  newsPosts,
  newsLikes,
  newsComments,
  type NewsPost,
  type InsertNewsPost,
  type NewsLike,
  type InsertNewsLike,
  type NewsComment,
  type InsertNewsComment,
  trainingTopics,
  trainingItems,
  type TrainingTopic,
  type InsertTrainingTopic,
  type TrainingItem,
  type InsertTrainingItem,
} from "@shared/schema";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User | undefined>;
  getAllStudents(): Promise<User[]>;
  deleteUser(id: string): Promise<void>;

  getUserNotes(userId: string): Promise<Note[]>;
  getNote(id: string): Promise<Note | undefined>;
  createNote(note: InsertNote): Promise<Note>;
  updateNote(id: string, updates: Partial<Note>): Promise<Note | undefined>;
  deleteNote(id: string): Promise<void>;

  getUserFlashcards(userId: string): Promise<Flashcard[]>;
  getDueFlashcards(userId: string): Promise<Flashcard[]>;
  getFlashcard(id: string): Promise<Flashcard | undefined>;
  createFlashcard(flashcard: InsertFlashcard): Promise<Flashcard>;
  updateFlashcard(id: string, updates: Partial<Flashcard>): Promise<Flashcard | undefined>;
  deleteFlashcard(id: string): Promise<void>;

  getUserQuizzes(userId: string): Promise<Quiz[]>;
  getQuiz(id: string): Promise<Quiz | undefined>;
  createQuiz(quiz: InsertQuiz): Promise<Quiz>;
  deleteQuiz(id: string): Promise<void>;

  getUserQuizAttempts(userId: string): Promise<QuizAttempt[]>;
  createQuizAttempt(attempt: InsertQuizAttempt): Promise<QuizAttempt>;

  getUserStudySessions(userId: string): Promise<StudySession[]>;
  createStudySession(session: InsertStudySession): Promise<StudySession>;

  getUserAchievements(userId: string): Promise<Achievement[]>;
  createAchievement(achievement: InsertAchievement): Promise<Achievement>;

  getUserStudyGroups(userId: string): Promise<StudyGroup[]>;
  getAllStudyGroups(): Promise<StudyGroup[]>;
  getStudyGroup(id: string): Promise<StudyGroup | undefined>;
  getStudyGroupByCode(code: string): Promise<StudyGroup | undefined>;
  createStudyGroup(group: InsertStudyGroup & { code: string }): Promise<StudyGroup>;
  updateStudyGroup(id: string, updates: Partial<StudyGroup>): Promise<StudyGroup | undefined>;
  deleteStudyGroup(id: string): Promise<void>;

  // Group messages
  getGroupMessages(groupId: string): Promise<GroupMessage[]>;
  createGroupMessage(message: InsertGroupMessage): Promise<GroupMessage>;
  deleteGroupMessage(id: string): Promise<void>;

  // Group notes
  getGroupNotes(groupId: string): Promise<GroupNote[]>;
  createGroupNote(note: InsertGroupNote): Promise<GroupNote>;
  updateGroupNote(id: string, updates: Partial<GroupNote>): Promise<GroupNote | undefined>;
  deleteGroupNote(id: string): Promise<void>;

  // Group announcements
  getGroupAnnouncements(groupId: string): Promise<GroupAnnouncement[]>;
  createGroupAnnouncement(announcement: InsertGroupAnnouncement): Promise<GroupAnnouncement>;
  deleteGroupAnnouncement(id: string): Promise<void>;

  getUserConversations(userId: string): Promise<TutorConversation[]>;
  getConversation(id: string): Promise<TutorConversation | undefined>;
  createConversation(conversation: InsertTutorConversation): Promise<TutorConversation>;
  updateConversation(id: string, updates: Partial<TutorConversation>): Promise<TutorConversation | undefined>;
  deleteConversation(id: string): Promise<void>;

  getUserMindMaps(userId: string): Promise<MindMap[]>;
  getMindMap(id: string): Promise<MindMap | undefined>;
  createMindMap(mindMap: InsertMindMap): Promise<MindMap>;
  updateMindMap(id: string, updates: Partial<MindMap>): Promise<MindMap | undefined>;
  deleteMindMap(id: string): Promise<void>;

  getSetting(key: string): Promise<PlatformSetting | undefined>;
  setSetting(key: string, value: string): Promise<PlatformSetting>;
  getAllSettings(): Promise<PlatformSetting[]>;

  // CLASS MANAGEMENT
  getTeacherClasses(teacherId: string): Promise<Class[]>;
  getStudentClasses(studentId: string): Promise<Class[]>;
  getClass(classId: string): Promise<Class | undefined>;
  createClass(classData: InsertClass): Promise<Class>;
  updateClass(classId: string, updates: Partial<Class>): Promise<Class | undefined>;
  deleteClass(classId: string): Promise<void>;
  getClassByCode(code: string): Promise<Class | undefined>;

  // CLASS ENROLLMENTS
  enrollStudent(classId: string, studentId: string): Promise<ClassEnrollment>;
  unenrollStudent(classId: string, studentId: string): Promise<void>;
  getClassStudents(classId: string): Promise<User[]>;
  isStudentEnrolled(classId: string, studentId: string): Promise<boolean>;

  // TODOS
  getClassTodos(classId: string): Promise<Todo[]>;
  getTodo(todoId: string): Promise<Todo | undefined>;
  createTodo(todo: InsertTodo): Promise<Todo>;
  updateTodo(todoId: string, updates: Partial<Todo>): Promise<Todo | undefined>;
  deleteTodo(todoId: string): Promise<void>;
  getStudentTodos(studentId: string): Promise<Todo[]>; // Todos for all enrolled classes

  // EXAMS
  getClassExams(classId: string): Promise<Exam[]>;
  getExam(examId: string): Promise<Exam | undefined>;
  createExam(exam: InsertExam): Promise<Exam>;
  updateExam(examId: string, updates: Partial<Exam>): Promise<Exam | undefined>;
  deleteExam(examId: string): Promise<void>;
  getUpcomingExams(studentId: string): Promise<Exam[]>; // Exams for all enrolled classes

  // CLASS RESOURCES
  getClassResources(classId: string): Promise<ClassResource[]>;
  getResource(resourceId: string): Promise<ClassResource | undefined>;
  createResource(resource: InsertClassResource): Promise<ClassResource>;
  deleteResource(resourceId: string): Promise<void>;

  // TEACHER QUIZZES
  getClassTeacherQuizzes(classId: string): Promise<TeacherQuiz[]>;
  getTeacherQuiz(quizId: string): Promise<TeacherQuiz | undefined>;
  createTeacherQuiz(quiz: InsertTeacherQuiz): Promise<TeacherQuiz>;
  updateTeacherQuiz(quizId: string, updates: Partial<TeacherQuiz>): Promise<TeacherQuiz | undefined>;
  deleteTeacherQuiz(quizId: string): Promise<void>;
  getStudentTeacherQuizzes(studentId: string): Promise<TeacherQuiz[]>;

  // TEACHER QUIZ ATTEMPTS
  getQuizAttempts(quizId: string): Promise<TeacherQuizAttempt[]>;
  getStudentQuizAttempt(quizId: string, studentId: string): Promise<TeacherQuizAttempt | undefined>;
  createTeacherQuizAttempt(attempt: InsertTeacherQuizAttempt): Promise<TeacherQuizAttempt>;
  updateTeacherQuizAttempt(attemptId: string, updates: Partial<TeacherQuizAttempt>): Promise<TeacherQuizAttempt | undefined>;

  // NEWS & UPDATES
  getPublishedNewsPosts(): Promise<NewsPost[]>;
  getAllNewsPosts(): Promise<NewsPost[]>;
  getNewsPost(id: string): Promise<NewsPost | undefined>;
  createNewsPost(post: InsertNewsPost): Promise<NewsPost>;
  updateNewsPost(id: string, updates: Partial<NewsPost>): Promise<NewsPost | undefined>;
  deleteNewsPost(id: string): Promise<void>;

  // NEWS LIKES
  getPostLikeCount(postId: string): Promise<number>;
  getUserLikeForPost(postId: string, userId: string): Promise<NewsLike | undefined>;
  toggleNewsLike(postId: string, userId: string): Promise<boolean>;

  // NEWS COMMENTS
  getPostComments(postId: string): Promise<NewsComment[]>;
  createNewsComment(comment: InsertNewsComment): Promise<NewsComment>;
  deleteNewsComment(id: string): Promise<void>;
  getPostCommentCount(postId: string): Promise<number>;

  // TRAINING HUB - TOPICS
  getAllTrainingTopics(): Promise<TrainingTopic[]>;
  createTrainingTopic(topic: InsertTrainingTopic): Promise<TrainingTopic>;
  updateTrainingTopic(id: string, updates: Partial<TrainingTopic>): Promise<TrainingTopic | undefined>;
  deleteTrainingTopic(id: string): Promise<void>;

  // TRAINING HUB - ITEMS
  getAllTrainingItems(): Promise<TrainingItem[]>;
  getTrainingItemsByTopic(topicId: string | null): Promise<TrainingItem[]>;
  createTrainingItem(item: InsertTrainingItem): Promise<TrainingItem>;
  updateTrainingItem(id: string, updates: Partial<TrainingItem>): Promise<TrainingItem | undefined>;
  deleteTrainingItem(id: string): Promise<void>;
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

  async getAllStudents(): Promise<User[]> {
    return await db.select().from(users).where(eq(users.role, "student"));
  }

  async deleteUser(id: string): Promise<void> {
    await db.delete(users).where(eq(users.id, id));
  }

  // ==================== NOTES ====================
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

  // ==================== FLASHCARDS ====================
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

  // ==================== QUIZZES ====================
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

  // ==================== QUIZ ATTEMPTS ====================
  async getUserQuizAttempts(userId: string): Promise<QuizAttempt[]> {
    return await db.select().from(quizAttempts).where(eq(quizAttempts.userId, userId));
  }

  async createQuizAttempt(insertQuizAttempt: InsertQuizAttempt): Promise<QuizAttempt> {
    const [attempt] = await db.insert(quizAttempts).values(insertQuizAttempt).returning();
    return attempt;
  }

  // ==================== STUDY SESSIONS ====================
  async getUserStudySessions(userId: string): Promise<StudySession[]> {
    return await db.select().from(studySessions).where(eq(studySessions.userId, userId));
  }

  async createStudySession(insertStudySession: InsertStudySession): Promise<StudySession> {
    const [session] = await db.insert(studySessions).values(insertStudySession).returning();
    return session;
  }

  // ==================== ACHIEVEMENTS ====================
  async getUserAchievements(userId: string): Promise<Achievement[]> {
    return await db.select().from(achievements).where(eq(achievements.userId, userId));
  }

  async createAchievement(insertAchievement: InsertAchievement): Promise<Achievement> {
    const [achievement] = await db.insert(achievements).values(insertAchievement).returning();
    return achievement;
  }

  // ==================== STUDY GROUPS ====================
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

  async getStudyGroupByCode(code: string): Promise<StudyGroup | undefined> {
    const [group] = await db.select().from(studyGroups).where(eq(studyGroups.code, code));
    return group;
  }

  async createStudyGroup(insertStudyGroup: InsertStudyGroup & { code: string }): Promise<StudyGroup> {
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

  // ==================== GROUP MESSAGES ====================
  async getGroupMessages(groupId: string): Promise<GroupMessage[]> {
    return await db.select().from(groupMessages).where(eq(groupMessages.groupId, groupId)).orderBy(groupMessages.createdAt);
  }

  async createGroupMessage(message: InsertGroupMessage): Promise<GroupMessage> {
    const [newMessage] = await db.insert(groupMessages).values(message).returning();
    return newMessage;
  }

  async deleteGroupMessage(id: string): Promise<void> {
    await db.delete(groupMessages).where(eq(groupMessages.id, id));
  }

  // ==================== GROUP NOTES ====================
  async getGroupNotes(groupId: string): Promise<GroupNote[]> {
    return await db.select().from(groupNotes).where(eq(groupNotes.groupId, groupId)).orderBy(desc(groupNotes.createdAt));
  }

  async createGroupNote(note: InsertGroupNote): Promise<GroupNote> {
    const [newNote] = await db.insert(groupNotes).values(note).returning();
    return newNote;
  }

  async updateGroupNote(id: string, updates: Partial<GroupNote>): Promise<GroupNote | undefined> {
    const [note] = await db.update(groupNotes).set({ ...updates, updatedAt: new Date() }).where(eq(groupNotes.id, id)).returning();
    return note;
  }

  async deleteGroupNote(id: string): Promise<void> {
    await db.delete(groupNotes).where(eq(groupNotes.id, id));
  }

  // ==================== GROUP ANNOUNCEMENTS ====================
  async getGroupAnnouncements(groupId: string): Promise<GroupAnnouncement[]> {
    return await db.select().from(groupAnnouncements).where(eq(groupAnnouncements.groupId, groupId)).orderBy(desc(groupAnnouncements.createdAt));
  }

  async createGroupAnnouncement(announcement: InsertGroupAnnouncement): Promise<GroupAnnouncement> {
    const [newAnnouncement] = await db.insert(groupAnnouncements).values(announcement).returning();
    return newAnnouncement;
  }

  async deleteGroupAnnouncement(id: string): Promise<void> {
    await db.delete(groupAnnouncements).where(eq(groupAnnouncements.id, id));
  }

  // ==================== TUTOR CONVERSATIONS ====================
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

  // ==================== MIND MAPS ====================
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

  // ==================== PLATFORM SETTINGS ====================
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

  // ==================== CLASSES ====================
  async getTeacherClasses(teacherId: string): Promise<Class[]> {
    return await db.select().from(classes).where(eq(classes.teacherId, teacherId));
  }

  async getStudentClasses(studentId: string): Promise<Class[]> {
    return await db
      .select()
      .from(classes)
      .innerJoin(classEnrollments, eq(classes.id, classEnrollments.classId))
      .where(eq(classEnrollments.studentId, studentId))
      .then(results => results.map(r => r.classes));
  }

  async getClass(classId: string): Promise<Class | undefined> {
    const [cls] = await db.select().from(classes).where(eq(classes.id, classId));
    return cls;
  }

  async createClass(insertClass: InsertClass): Promise<Class> {
    const [cls] = await db.insert(classes).values(insertClass).returning();
    return cls;
  }

  async updateClass(classId: string, updates: Partial<Class>): Promise<Class | undefined> {
    const [cls] = await db.update(classes).set(updates).where(eq(classes.id, classId)).returning();
    return cls;
  }

  async deleteClass(classId: string): Promise<void> {
    await db.delete(classes).where(eq(classes.id, classId));
  }

  async getClassByCode(code: string): Promise<Class | undefined> {
    const [cls] = await db.select().from(classes).where(eq(classes.code, code));
    return cls;
  }

  // ==================== CLASS ENROLLMENTS ====================
  async enrollStudent(classId: string, studentId: string): Promise<ClassEnrollment> {
    const [enrollment] = await db.insert(classEnrollments).values({ classId, studentId }).returning();
    return enrollment;
  }

  async unenrollStudent(classId: string, studentId: string): Promise<void> {
    await db.delete(classEnrollments).where(
      and(eq(classEnrollments.classId, classId), eq(classEnrollments.studentId, studentId))
    );
  }

  async getClassStudents(classId: string): Promise<User[]> {
    return await db
      .select()
      .from(users)
      .innerJoin(classEnrollments, eq(users.id, classEnrollments.studentId))
      .where(eq(classEnrollments.classId, classId))
      .then(results => results.map(r => r.users));
  }

  async isStudentEnrolled(classId: string, studentId: string): Promise<boolean> {
    const [enrollment] = await db
      .select()
      .from(classEnrollments)
      .where(and(eq(classEnrollments.classId, classId), eq(classEnrollments.studentId, studentId)));
    return !!enrollment;
  }

  // ==================== TODOS ====================
  async getClassTodos(classId: string): Promise<Todo[]> {
    return await db
      .select()
      .from(todos)
      .where(eq(todos.classId, classId))
      .orderBy(todos.dueDate);
  }

  async getTodo(todoId: string): Promise<Todo | undefined> {
    const [todo] = await db.select().from(todos).where(eq(todos.id, todoId));
    return todo;
  }

  async createTodo(insertTodo: InsertTodo): Promise<Todo> {
    const [todo] = await db.insert(todos).values(insertTodo).returning();
    return todo;
  }

  async updateTodo(todoId: string, updates: Partial<Todo>): Promise<Todo | undefined> {
    const [todo] = await db.update(todos).set(updates).where(eq(todos.id, todoId)).returning();
    return todo;
  }

  async deleteTodo(todoId: string): Promise<void> {
    await db.delete(todos).where(eq(todos.id, todoId));
  }

  async getStudentTodos(studentId: string): Promise<Todo[]> {
    return await db
      .select()
      .from(todos)
      .innerJoin(classEnrollments, eq(todos.classId, classEnrollments.classId))
      .where(eq(classEnrollments.studentId, studentId))
      .orderBy(desc(todos.dueDate))
      .then(results => results.map(r => r.todos));
  }

  // ==================== EXAMS ====================
  async getClassExams(classId: string): Promise<Exam[]> {
    return await db
      .select()
      .from(exams)
      .where(eq(exams.classId, classId))
      .orderBy(exams.date);
  }

  async getExam(examId: string): Promise<Exam | undefined> {
    const [exam] = await db.select().from(exams).where(eq(exams.id, examId));
    return exam;
  }

  async createExam(insertExam: InsertExam): Promise<Exam> {
    const [exam] = await db.insert(exams).values(insertExam).returning();
    return exam;
  }

  async updateExam(examId: string, updates: Partial<Exam>): Promise<Exam | undefined> {
    const [exam] = await db.update(exams).set(updates).where(eq(exams.id, examId)).returning();
    return exam;
  }

  async deleteExam(examId: string): Promise<void> {
    await db.delete(exams).where(eq(exams.id, examId));
  }

  async getUpcomingExams(studentId: string): Promise<Exam[]> {
    return await db
      .select()
      .from(exams)
      .innerJoin(classEnrollments, eq(exams.classId, classEnrollments.classId))
      .where(and(
        eq(classEnrollments.studentId, studentId),
      ))
      .orderBy(exams.date)
      .then(results => results.map(r => r.exams));
  }

  // ==================== CLASS RESOURCES ====================
  async getClassResources(classId: string): Promise<ClassResource[]> {
    return await db
      .select()
      .from(classResources)
      .where(eq(classResources.classId, classId))
      .orderBy(desc(classResources.createdAt));
  }

  async getResource(resourceId: string): Promise<ClassResource | undefined> {
    const [resource] = await db.select().from(classResources).where(eq(classResources.id, resourceId));
    return resource;
  }

  async createResource(insertResource: InsertClassResource): Promise<ClassResource> {
    const [resource] = await db.insert(classResources).values(insertResource).returning();
    return resource;
  }

  async deleteResource(resourceId: string): Promise<void> {
    await db.delete(classResources).where(eq(classResources.id, resourceId));
  }

  // ==================== TEACHER QUIZZES ====================
  async getClassTeacherQuizzes(classId: string): Promise<TeacherQuiz[]> {
    return await db
      .select()
      .from(teacherQuizzes)
      .where(eq(teacherQuizzes.classId, classId))
      .orderBy(desc(teacherQuizzes.createdAt));
  }

  async getTeacherQuiz(quizId: string): Promise<TeacherQuiz | undefined> {
    const [quiz] = await db.select().from(teacherQuizzes).where(eq(teacherQuizzes.id, quizId));
    return quiz;
  }

  async createTeacherQuiz(insertQuiz: InsertTeacherQuiz): Promise<TeacherQuiz> {
    const [quiz] = await db.insert(teacherQuizzes).values(insertQuiz).returning();
    return quiz;
  }

  async updateTeacherQuiz(quizId: string, updates: Partial<TeacherQuiz>): Promise<TeacherQuiz | undefined> {
    const [quiz] = await db.update(teacherQuizzes).set({ ...updates, updatedAt: new Date() }).where(eq(teacherQuizzes.id, quizId)).returning();
    return quiz;
  }

  async deleteTeacherQuiz(quizId: string): Promise<void> {
    await db.delete(teacherQuizAttempts).where(eq(teacherQuizAttempts.quizId, quizId));
    await db.delete(teacherQuizzes).where(eq(teacherQuizzes.id, quizId));
  }

  async getStudentTeacherQuizzes(studentId: string): Promise<TeacherQuiz[]> {
    return await db
      .select()
      .from(teacherQuizzes)
      .innerJoin(classEnrollments, eq(teacherQuizzes.classId, classEnrollments.classId))
      .where(and(
        eq(classEnrollments.studentId, studentId),
        eq(teacherQuizzes.isPublished, true)
      ))
      .orderBy(desc(teacherQuizzes.createdAt))
      .then(results => results.map(r => r.teacher_quizzes));
  }

  // ==================== TEACHER QUIZ ATTEMPTS ====================
  async getQuizAttempts(quizId: string): Promise<TeacherQuizAttempt[]> {
    return await db
      .select()
      .from(teacherQuizAttempts)
      .where(eq(teacherQuizAttempts.quizId, quizId))
      .orderBy(desc(teacherQuizAttempts.submittedAt));
  }

  async getStudentQuizAttempt(quizId: string, studentId: string): Promise<TeacherQuizAttempt | undefined> {
    const [attempt] = await db
      .select()
      .from(teacherQuizAttempts)
      .where(and(
        eq(teacherQuizAttempts.quizId, quizId),
        eq(teacherQuizAttempts.studentId, studentId)
      ));
    return attempt;
  }

  async createTeacherQuizAttempt(insertAttempt: InsertTeacherQuizAttempt): Promise<TeacherQuizAttempt> {
    const [attempt] = await db.insert(teacherQuizAttempts).values(insertAttempt).returning();
    return attempt;
  }

  async updateTeacherQuizAttempt(attemptId: string, updates: Partial<TeacherQuizAttempt>): Promise<TeacherQuizAttempt | undefined> {
    const [attempt] = await db.update(teacherQuizAttempts).set(updates).where(eq(teacherQuizAttempts.id, attemptId)).returning();
    return attempt;
  }

  // ==================== NEWS & UPDATES ====================
  async getPublishedNewsPosts(): Promise<NewsPost[]> {
    return await db
      .select()
      .from(newsPosts)
      .where(
        sql`(${newsPosts.status} = 'published') OR (${newsPosts.status} = 'scheduled' AND ${newsPosts.scheduledAt} <= NOW())`
      )
      .orderBy(desc(newsPosts.createdAt));
  }

  async getAllNewsPosts(): Promise<NewsPost[]> {
    return await db.select().from(newsPosts).orderBy(desc(newsPosts.createdAt));
  }

  async getNewsPost(id: string): Promise<NewsPost | undefined> {
    const [post] = await db.select().from(newsPosts).where(eq(newsPosts.id, id));
    return post;
  }

  async createNewsPost(post: InsertNewsPost): Promise<NewsPost> {
    const [newPost] = await db.insert(newsPosts).values(post).returning();
    return newPost;
  }

  async updateNewsPost(id: string, updates: Partial<NewsPost>): Promise<NewsPost | undefined> {
    const [post] = await db.update(newsPosts).set(updates).where(eq(newsPosts.id, id)).returning();
    return post;
  }

  async deleteNewsPost(id: string): Promise<void> {
    await db.delete(newsComments).where(eq(newsComments.postId, id));
    await db.delete(newsLikes).where(eq(newsLikes.postId, id));
    await db.delete(newsPosts).where(eq(newsPosts.id, id));
  }

  // ==================== NEWS LIKES ====================
  async getPostLikeCount(postId: string): Promise<number> {
    const result = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(newsLikes)
      .where(eq(newsLikes.postId, postId));
    return result[0]?.count ?? 0;
  }

  async getUserLikeForPost(postId: string, userId: string): Promise<NewsLike | undefined> {
    const [like] = await db
      .select()
      .from(newsLikes)
      .where(and(eq(newsLikes.postId, postId), eq(newsLikes.userId, userId)));
    return like;
  }

  async toggleNewsLike(postId: string, userId: string): Promise<boolean> {
    const existing = await this.getUserLikeForPost(postId, userId);
    if (existing) {
      await db.delete(newsLikes).where(eq(newsLikes.id, existing.id));
      return false;
    } else {
      await db.insert(newsLikes).values({ postId, userId });
      return true;
    }
  }

  // ==================== NEWS COMMENTS ====================
  async getPostComments(postId: string): Promise<NewsComment[]> {
    return await db
      .select()
      .from(newsComments)
      .where(eq(newsComments.postId, postId))
      .orderBy(desc(newsComments.createdAt));
  }

  async createNewsComment(comment: InsertNewsComment): Promise<NewsComment> {
    const [newComment] = await db.insert(newsComments).values(comment).returning();
    return newComment;
  }

  async deleteNewsComment(id: string): Promise<void> {
    await db.delete(newsComments).where(eq(newsComments.id, id));
  }

  async getPostCommentCount(postId: string): Promise<number> {
    const result = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(newsComments)
      .where(eq(newsComments.postId, postId));
    return result[0]?.count ?? 0;
  }

  // ==================== TRAINING HUB - TOPICS ====================
  async getAllTrainingTopics(): Promise<TrainingTopic[]> {
    return await db.select().from(trainingTopics).orderBy(trainingTopics.position);
  }

  async createTrainingTopic(topic: InsertTrainingTopic): Promise<TrainingTopic> {
    const [newTopic] = await db.insert(trainingTopics).values(topic).returning();
    return newTopic;
  }

  async updateTrainingTopic(id: string, updates: Partial<TrainingTopic>): Promise<TrainingTopic | undefined> {
    const [topic] = await db.update(trainingTopics).set(updates).where(eq(trainingTopics.id, id)).returning();
    return topic;
  }

  async deleteTrainingTopic(id: string): Promise<void> {
    await db.update(trainingItems).set({ topicId: null }).where(eq(trainingItems.topicId, id));
    await db.delete(trainingTopics).where(eq(trainingTopics.id, id));
  }

  // ==================== TRAINING HUB - ITEMS ====================
  async getAllTrainingItems(): Promise<TrainingItem[]> {
    return await db.select().from(trainingItems).orderBy(desc(trainingItems.createdAt));
  }

  async getTrainingItemsByTopic(topicId: string | null): Promise<TrainingItem[]> {
    if (topicId === null) {
      return await db.select().from(trainingItems).where(sql`${trainingItems.topicId} IS NULL`).orderBy(desc(trainingItems.createdAt));
    }
    return await db.select().from(trainingItems).where(eq(trainingItems.topicId, topicId)).orderBy(desc(trainingItems.createdAt));
  }

  async createTrainingItem(item: InsertTrainingItem): Promise<TrainingItem> {
    const [newItem] = await db.insert(trainingItems).values(item).returning();
    return newItem;
  }

  async updateTrainingItem(id: string, updates: Partial<TrainingItem>): Promise<TrainingItem | undefined> {
    const [item] = await db.update(trainingItems).set({ ...updates, updatedAt: new Date() }).where(eq(trainingItems.id, id)).returning();
    return item;
  }

  async deleteTrainingItem(id: string): Promise<void> {
    await db.delete(trainingItems).where(eq(trainingItems.id, id));
  }
}

export const storage = new DatabaseStorage();
