# Hibiscus StudyPal - Enhanced Learning Platform

## Overview
Hibiscus StudyPal is a comprehensive, AI-powered learning platform designed to help students study smarter through gamification, intelligent quiz generation, spaced repetition, and collaborative features. Built with a beautiful glassmorphic UI using the Hibiscus color scheme (red, yellow, green).

## Tech Stack
- **Frontend**: React + TypeScript, Tailwind CSS, Wouter (routing), TanStack Query
- **Backend**: Express.js, Node.js
- **AI**: OpenAI GPT-5 via Replit AI Integrations (for quiz generation and AI tutoring)
- **Storage**: In-memory storage (MemStorage)
- **UI Components**: Shadcn/ui with custom Hibiscus theme
- **Charts**: Chart.js with react-chartjs-2

## Recent Changes (March 09, 2026)
- **COMPLETED**: Teacher Progress Tracking
  - Admin can track which training items each teacher has completed
  - New "Teacher Progress" tab on admin dashboard with summary stats (Total Teachers, Avg Completion %, Fully Completed count)
  - Teacher list with progress bars, completion counts, and click-to-view details
  - Detail dialog shows each posted training item with checkmark/circle for completion status
  - Teachers see "Mark as Complete" button in training item detail dialogs
  - Completed items show green checkmark on card grid and green ring border
  - Toggle completion on/off for each training item
  - New table: `training_progress` (userId, itemId, completed, completedAt)
  - New storage method: `getTeachers()` returns all users with role "teacher"
  - API endpoints: `/api/training/progress` (GET), `/api/training/progress/toggle` (POST), `/api/training/progress/all-teachers` (GET, admin-only)
  - Component: `client/src/components/admin/teacher-progress.tsx`

- **COMPLETED**: Training Hub (Google Classroom-style)
  - Visible to both teachers and admins on the Classes page
  - Only admins can create, edit, and delete content — teachers view/attend only
  - Compact card grid layout (3 columns on desktop, 2 on tablet, 1 on mobile)
  - YouTube video thumbnails on cards, full embed in detail dialog
  - Click cards to open detail dialog (not inline expansion)
  - Create Modules, Quizzes, and Assignments organized by Topics
  - Collapsible topic sections with item count badges
  - Draft/Posted status tracking with visual indicators
  - Video embedding: YouTube/Vimeo URLs render as embedded players
  - File uploads: Upload PDFs, Word docs, PowerPoints, images via Object Storage
  - External links: Link to Google Docs, Slides, or any URL
  - New tables: `training_topics`, `training_items` (with videoUrl, attachmentPath columns)
  - API endpoints: `/api/training/topics`, `/api/training/items` (GET/POST/PATCH/DELETE, admin-only mutations)
  - Component: `client/src/components/training/training-hub.tsx`

## Previous Changes (March 06, 2026)
- **COMPLETED**: Video Orientation Support
  - Video embeds now support landscape (16:9), portrait (9:16), and square (1:1) orientations
  - Orientation selector in video post create/edit dialog with live preview
  - New `videoOrientation` column in `news_posts` table (defaults to "landscape")
  - Existing videos default to landscape orientation

## Previous Changes (March 05, 2026)
- **COMPLETED**: News & Updates Feature
  - Unified content feed for newsletters and video posts
  - Newsletter posts: title, body, optional image, optional PDF attachment
  - Video posts: title, description, embedded YouTube/Vimeo, author name/role
  - Like and comment system for all users
  - Post scheduling (publish now or schedule for future dates)
  - Admin-only post creation, editing, and deletion
  - Accessible via "News" tab in dashboard navigation
  - New route: `/news`
  - New tables: `news_posts`, `news_likes`, `news_comments`
  - API endpoints: `/api/news`, `/api/news/:id`, `/api/news/:id/like`, `/api/news/:id/comments`

## Previous Changes (February 05, 2026)
- **COMPLETED**: Study Group Interactive Features
  - Group Chat: Real-time messaging within study groups
  - Shared Notes: Collaborative note-sharing with group members
  - Announcements: Group creators can post announcements (with pin support)
  - Members Tab: View all group members with creator badge
  - Leaderboard: Group XP leaderboard for gamification
  - Shareable 6-character group codes for easy invites
  - Tabbed interface (Chat, Notes, Announcements, Members, Leaderboard)

## Previous Changes (November 30, 2025)
- Complete redesign with Hibiscus theme (red, yellow, green gradient)
- Added comprehensive data schemas for all features
- Implemented glassmorphic design system
- Created full student dashboard with all study tools
- Built admin dashboard for student management and analytics
- Integrated OpenAI for AI-powered features
- FastBots Chatbot Integration - Admins can configure and embed a custom FastBots chatbot
- **COMPLETED**: File Upload Support for Resources and Exams
  - Resources tab supports "File Upload" type alongside links and text notes
  - Exams tab allows attaching files (exam papers, revision guides, timetables)
  - Uses @replit/object-storage with server-side proxy upload/download
  - ObjectUploader component with progress bar and file validation
  - Secure file serving with filename sanitization
  - Supported file types: PDF, Word, PowerPoint, Excel, Images (max 50MB)

## Project Structure
```
├── client/
│   ├── src/
│   │   ├── components/
│   │   │   ├── dashboard/     # Student dashboard components
│   │   │   │   ├── overview.tsx
│   │   │   │   ├── notes.tsx
│   │   │   │   ├── flashcards.tsx
│   │   │   │   ├── quiz.tsx
│   │   │   │   ├── pomodoro.tsx
│   │   │   │   ├── ai-tutor.tsx
│   │   │   │   ├── study-groups.tsx
│   │   │   │   ├── mind-map.tsx
│   │   │   │   ├── study-planner.tsx
│   │   │   │   ├── analytics.tsx
│   │   │   │   └── achievements.tsx
│   │   │   ├── admin/        # Admin dashboard components
│   │   │   │   ├── student-management.tsx
│   │   │   │   ├── content-management.tsx (FastBots config)
│   │   │   │   └── admin-analytics.tsx
│   │   │   ├── chatbot/      # Chatbot integration
│   │   │   │   └── fastbots-widget.tsx
│   │   │   └── ui/           # Shadcn UI components
│   │   ├── pages/
│   │   │   ├── login.tsx
│   │   │   ├── dashboard.tsx
│   │   │   └── admin.tsx
│   │   ├── lib/
│   │   │   └── queryClient.ts
│   │   └── App.tsx
│   └── index.html
├── server/
│   ├── routes.ts             # API endpoints (to be implemented)
│   ├── storage.ts            # Data storage interface
│   └── openai.ts             # OpenAI integration (to be created)
├── shared/
│   └── schema.ts             # Data models and types
└── design_guidelines.md      # Design system documentation
```

## Features

### Student Features
1. **Dashboard**: Stats overview, activity charts, achievements, quick actions
2. **Notes**: Create, edit, search, and organize study notes
3. **Flashcards**: Spaced repetition system using SM-2 algorithm
4. **Quiz**: AI-powered quiz generation with multiple difficulty levels
5. **Pomodoro Timer**: Focus sessions with customizable durations
6. **AI Tutor**: Chat with AI for homework help and explanations
7. **Study Groups**: Create and join collaborative learning groups
8. **Mind Map**: Visual concept mapping (coming soon)
9. **Achievements**: Unlock badges and track progress
10. **Analytics**: Detailed performance insights

### Admin Features
1. **Student Management**: View, search, sort, and manage students
2. **Analytics Dashboard**: Platform-wide usage and performance metrics
3. **FastBots Chatbot Configuration**: Configure and embed a custom AI chatbot from FastBots.ai that appears for all students
4. **Export Data**: CSV export of student data

### Gamification
- XP points and leveling system
- Daily streak tracking
- Achievement badges
- Leaderboards in study groups
- Progress visualization

## Design System

### Colors (Hibiscus Theme)
- **Primary Green**: `hsl(142 76% 36%)` - Main actions, success states
- **Hibiscus Red**: `hsl(0 84% 60%)` - Destructive actions, errors
- **Hibiscus Yellow**: `hsl(45 93% 52%)` - Warnings, highlights
- **Charts**: Using all three colors for data visualization

### Visual Style
- Glassmorphic cards with backdrop blur
- Gradient backgrounds using Hibiscus colors
- Smooth hover and active states
- Responsive design for all screen sizes
- Dark mode support (built-in)

### Typography
- Primary font: Inter
- Hierarchy clearly defined
- Tabular numbers for stats
- Consistent spacing

## API Endpoints (To Be Implemented)

### Authentication
- `POST /api/auth/register` - Create new account
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout

### Notes
- `GET /api/notes/:userId` - Get all notes
- `POST /api/notes` - Create note
- `PUT /api/notes/:id` - Update note
- `DELETE /api/notes/:id` - Delete note

### Flashcards
- `GET /api/flashcards/:userId` - Get all flashcards
- `GET /api/flashcards/due/:userId` - Get due flashcards
- `POST /api/flashcards` - Create flashcard
- `POST /api/flashcards/:id/review` - Submit review (SM-2)

### Quizzes
- `GET /api/quizzes/:userId` - Get all quizzes
- `POST /api/quizzes/generate` - Generate AI quiz (uses OpenAI)
- `POST /api/quiz-attempts` - Submit quiz attempt
- `GET /api/quiz-attempts/:userId` - Get quiz history

### AI Tutor
- `GET /api/tutor-conversations/:userId` - Get conversations
- `POST /api/tutor/chat` - Send message (uses OpenAI)
- `DELETE /api/tutor-conversations/:id` - Delete conversation

### Study Sessions
- `POST /api/study-sessions` - Log study session
- `GET /api/stats/:userId` - Get student statistics

### Study Groups
- `GET /api/study-groups/:userId` - Get user's groups
- `GET /api/study-groups/all` - Get all groups
- `POST /api/study-groups` - Create group
- `POST /api/study-groups/:id/join` - Join group
- `POST /api/study-groups/:id/leave` - Leave group

### Achievements
- `GET /api/achievements/:userId` - Get achievements
- `GET /api/achievements/progress/:userId` - Get progress

### Admin
- `GET /api/admin/stats` - Platform statistics
- `GET /api/admin/students` - All students
- `DELETE /api/admin/students/:id` - Remove student
- `POST /api/admin/students/:id/reset` - Reset progress
- `GET /api/admin/analytics` - Detailed analytics

## Environment Variables
- `AI_INTEGRATIONS_OPENAI_BASE_URL` - Automatically set by Replit
- `AI_INTEGRATIONS_OPENAI_API_KEY` - Automatically set by Replit
- `SESSION_SECRET` - For session management

## Development

### Running the Application
```bash
npm run dev
```
This starts both the Express backend and Vite frontend on the same port.

### Default Accounts
- **Admin**: admin / admin123
- **Demo Student**: demo / demo123 (created via UI)

## AI Integration

### OpenAI Features
1. **Quiz Generation**: Creates context-aware questions based on subjects and notes
2. **AI Tutor**: Provides homework help and explanations
3. **Difficulty Levels**: Easy, Medium, Hard, Expert

### Spaced Repetition (SM-2 Algorithm)
- Tracks ease factor, interval, and repetitions for each flashcard
- Calculates next review date based on performance
- Quality ratings: Again (0), Hard (3), Good (4), Easy (5)

## Next Steps
1. Implement all backend API endpoints
2. Create OpenAI service for quiz generation and AI tutor
3. Implement SM-2 spaced repetition logic
4. Add achievement unlock logic
5. Implement data persistence
6. Add real-time features (optional)
7. Complete mind map and study planner features

## User Preferences
- Clean, modern design with glassmorphism
- Hibiscus color scheme (red, yellow, green)
- Gamification and motivation features
- AI-powered learning tools
- Mobile-responsive design
