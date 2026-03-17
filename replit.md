# Hibiscus StudyPal - Enhanced Learning Platform

## Overview
Hibiscus StudyPal is a comprehensive, AI-powered learning platform designed to help students study smarter through gamification, intelligent quiz generation, spaced repetition, and collaborative features. It aims to provide an engaging and effective learning experience, supporting students with advanced study tools and teachers with content creation and progress tracking. Key capabilities include AI-generated quizzes, an AI tutor, collaborative study groups, and a unified content feed for news and updates. The platform also offers extensive administrative tools for student management, analytics, and content configuration.

## User Preferences
- Clean, modern design with glassmorphism
- Hibiscus color scheme (red, yellow, green)
- Gamification and motivation features
- AI-powered learning tools
- Mobile-responsive design

## System Architecture
The application is built with a React (TypeScript) frontend utilizing Tailwind CSS, Wouter for routing, and TanStack Query for data fetching. UI components are built with Shadcn/ui, customized with a Hibiscus theme. The backend uses Express.js and Node.js. Data is currently stored in-memory using MemStorage, with plans for persistence.

### UI/UX Decisions
The platform features a distinctive glassmorphic design with a vibrant Hibiscus color scheme (primary green, red, and yellow) for a visually engaging user experience. It supports responsive design for various screen sizes and includes dark mode. Typography uses the Inter font for clarity and readability.

### Technical Implementations
- **AI Integration**: Leverages OpenAI GPT-5 via Replit AI Integrations for core functionalities like AI-powered quiz generation, an AI Tutor for homework help, and AI study tools (note summarization, study guide generation, flashcard generation from notes, podcast/audio creation from notes, and illustration prompt generation).
- **Gamification**: Includes XP points, a leveling system, daily streaks, achievement badges, and leaderboards to motivate users.
- **Spaced Repetition**: Implements the SM-2 algorithm for flashcards to optimize learning and retention.
- **Content Management**: Features a "Training Hub" for admins to create and manage modules, quizzes, and assignments, supporting various content types including videos, PDFs, and external links.
- **Real-time Communication**: Includes a contact admin support chat with real-time messaging and unread indicators, and group chat functionality within study groups.
- **File Management**: Supports secure file uploads and downloads for resources and exams using `@replit/object-storage`.
- **Teacher Progress Tracking**: Admins can monitor teacher completion of training items with detailed progress views.

### Feature Specifications
- **Student Dashboard**: Provides an overview of stats, activity, achievements, and quick access to study tools (notes with AI-powered tools, flashcards, quizzes, Pomodoro timer, AI tutor, study groups, analytics).
- **AI Study Tools on Notes**: Each note card has AI-powered buttons: Summarize, Study Guide, Generate Flashcards (creates real flashcard records), Generate Quiz (navigates to Quiz tab with note pre-selected), Podcast (generates audio via TTS), and Illustrate (generates image prompt). Results shown in dialogs. Backend routes: `/api/notes/:id/summarize`, `/study-guide`, `/generate-flashcards`, `/generate-podcast`, `/generate-illustration`.
- **AI Lesson Planner (Teachers)**: Teachers can generate full lesson plans and student study notes using AI by specifying grade/level, subject, topic, and (for lesson plans) duration. Results can be downloaded as a `.txt` file or printed/saved as PDF via the browser's print dialog. The planner appears on the main classes page and also as an "AI Planner" tab inside every class dashboard. Backend routes: `POST /api/ai/lesson-plan`, `POST /api/ai/study-notes`. Component: `client/src/components/teacher/ai-lesson-planner.tsx`.
- **Admin Dashboard**: Offers student management, platform-wide analytics, and configuration for features like the FastBots Chatbot.
- **News & Updates**: A unified content feed for newsletters and video posts, including like, comment, and scheduling features.
- **Online Quiz System**: Supports three quiz creation methods (PDF upload, manual entry, AI generation) and allows teachers to take and retake quizzes, with admin oversight of results.

## External Dependencies
- **OpenAI GPT-5**: Integrated for AI-powered quiz generation and AI tutoring.
- **Replit AI Integrations**: Used to connect with OpenAI services.
- **@replit/object-storage**: Utilized for handling file uploads and downloads.
- **FastBots.ai**: Integrated for a configurable, embeddable AI chatbot.
- **Chart.js**: Used with `react-chartjs-2` for data visualization.
- **YouTube/Vimeo**: Video embedding from these platforms.