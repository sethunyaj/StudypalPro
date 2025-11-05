# Hibiscus StudyPal - Design Guidelines

## Design Approach

**Selected Approach**: Reference-Based, drawing from Duolingo (gamification), Notion (clean productivity), Quizlet (learning tools), and modern EdTech platforms

**Rationale**: Educational platforms require motivating aesthetics to combat study fatigue while maintaining focus and clarity. Gamification elements need visual reward, but learning content demands readability.

**Core Principles**:
- Motivation through visual delight: Glassmorphic elements, gradients, and celebratory micro-interactions
- Progress visibility: XP bars, streaks, achievements always accessible
- Clean learning zones: Distraction-free reading/study areas with content hierarchy
- Reward immediacy: Instant visual feedback for completed tasks

---

## Typography System

**Font Stack**: 
- Primary: Poppins (600, 700 for headings, gamification)
- Body: Inter (400, 500 for content, UI elements)
Both via Google Fonts CDN

**Hierarchy**:
- **Hero Headlines**: 3rem (48px), weight 700, tight leading
- **Dashboard Headers**: 2rem (32px), weight 600
- **Card Titles/Lesson Names**: 1.5rem (24px), weight 600
- **Body Content/Questions**: 1.125rem (18px), weight 400, line-height 1.7
- **Labels/Stats**: 0.875rem (14px), weight 500
- **XP/Points Display**: 1.75rem (28px), weight 700, tabular-nums
- **Micro-text/Badges**: 0.75rem (12px), weight 600, uppercase

---

## Layout System

**Spacing Primitives**: 2, 4, 6, 8, 12, 16, 20 units (Tailwind)
- Card padding: p-6, p-8
- Section spacing: space-y-8, space-y-12
- Grid gaps: gap-4, gap-6

**Container Structure**:
- Marketing pages: Full-width sections with inner max-w-7xl
- Dashboard: max-w-screen-2xl, sidebar + main content
- Learning content: max-w-4xl for optimal reading
- Modals/overlays: max-w-2xl, centered

**Primary Layouts**:

**Landing Page** (5-7 sections):
- Hero: Full viewport (h-screen) with gradient background, central CTA, floating glassmorphic cards showcasing features
- Features Grid: 3-column (lg), 2-column (md), stacked mobile, icon + title + description
- Gamification Showcase: Visual demonstration of XP system, leaderboards, achievements with animated mockups
- Social Proof: 2-column testimonial cards with student photos
- Interactive Demo: Embedded quiz preview or flashcard flip animation
- Pricing/CTA: Centered with plan comparison cards
- Footer: Newsletter signup, quick links, social media (3-column desktop)

**Dashboard Layout**:
- Left sidebar (w-64): Navigation, streak counter, XP progress
- Top bar: Search, notifications, profile with level badge
- Main area: 2-column grid (70/30 split) - learning content + activity sidebar

---

## Component Library

### Landing Page Components

**Hero Section**:
- Gradient background with glassmorphic overlay panels
- Central headline + subheading + dual CTAs (primary + ghost)
- Floating cards (absolute positioned): achievement badges, flashcard preview, XP notification - all with backdrop-blur-lg
- Background image: Abstract study scene or diverse students collaborating, slightly desaturated with gradient overlay

**Feature Cards**:
- Glassmorphic containers: rounded-2xl, backdrop-blur-md, border with semi-transparency
- Icon: Gradient-filled, w-14 h-14, rounded-xl with subtle shadow
- Hover: Lift effect (translateY), enhanced glow

**Social Proof**:
- Student testimonial cards with photo (rounded-full, w-16), quote, name, university
- Star ratings with gradient fill
- Staggered layout for visual interest

### Dashboard Components

**Study Card** (Main Learning Item):
- Glassmorphic card: rounded-3xl, p-6, backdrop-blur
- Top: Subject tag (chip style), difficulty indicator (color-coded dots)
- Middle: Title (1.5rem), progress bar (rounded-full, gradient fill), completion percentage
- Bottom: Due date, estimated time, "Continue" button

**XP & Progress System**:
- XP Bar: Full-width sticky top element, gradient fill, level milestones marked
- Streak Counter: Fire icon + number, glassmorphic badge (top-right)
- Achievement Popup: Modal overlay with confetti animation, badge illustration, XP gained
- Leaderboard: Ranked list with position badges (1st: gold, 2nd: silver, 3rd: bronze)

### Learning Interface Components

**Quiz Interface**:
- Question card: Centered (max-w-3xl), clean white/glassmorphic background
- Multiple choice: Large tap targets (h-14), rounded-xl, hover states with gradient borders
- Progress indicator: Top bar showing question number + total
- Timer: Circular progress (top-right) if timed mode
- Feedback overlay: Full-screen celebration for correct (green gradient pulse), gentle shake for incorrect

**Flashcard Component**:
- 3D flip card: perspective transform, rounded-2xl
- Front/Back: Large centered text, "Tap to flip" hint
- Navigation: Arrow buttons (left/right), progress dots
- Actions: Know it/Review later buttons (bottom)
- Deck info: Card count, mastery percentage (top bar)

**AI Tutor Chat**:
- Chat interface: Left-aligned AI messages (glassmorphic bubbles), right-aligned user messages
- Input: Bottom-fixed, rounded-full with send button
- Suggested questions: Chip buttons above input
- Code/formula rendering: Syntax highlighting, copy button

**Mind Map Builder**:
- Canvas area: Infinite scroll, zoom controls (bottom-right)
- Node types: Central (large, gradient), branch (medium), leaf (small)
- Connectors: Curved bezier lines with arrow heads
- Toolbar: Top floating panel with node creation, color picker, export
- Templates: Sidebar with pre-built structures

**Study Group Cards**:
- Member avatars: Overlapping circles (w-10), max 4 visible + count
- Active status: Green dot indicator
- Group name + subject tags
- Join/Message buttons
- Recent activity feed within expanded view

### Navigation & Headers

**Landing Navigation**:
- Transparent header with backdrop-blur on scroll
- Logo (left), nav links (center), Sign In + CTA button (right)
- Mobile: Hamburger with full-screen overlay menu

**Dashboard Sidebar**:
- Logo + user profile card (avatar with level badge, name, total XP)
- Nav items: Icon + label, active state with gradient accent
- Daily goal widget: Circular progress with tasks completed
- Quick stats: Streak, total study time, achievements count

### Modals & Overlays

**Achievement Modal**:
- Centered overlay (max-w-md)
- Animated badge illustration (enters with scale + rotate)
- Title, description, XP reward display
- Confetti animation background
- Share button + Close

**Level Up Celebration**:
- Full-screen takeover with gradient background
- Large level number (8rem), celebration copy
- Unlocked features list
- Continue button

**Settings Panel**:
- Slide-in from right (w-96)
- Sections: Account, Notifications, Study Preferences, Appearance
- Toggle switches for gamification features
- Theme selector (cards with preview)

---

## Glassmorphic Implementation

**Standard Glass Card**:
- backdrop-blur-lg or backdrop-blur-xl
- Semi-transparent background (bg-white/10 or bg-black/10)
- Border: 1px solid with white/20 opacity
- Shadow: Multi-layer for depth
- Applied to: Feature cards, modals, floating elements, dashboard widgets

**Gradient Backgrounds**:
- Landing sections: Diagonal gradients using Hibiscus palette
- Buttons: Gradient fills for primary CTAs
- Progress bars: Animated gradient shifts
- Card accents: Gradient borders on hover

---

## Responsive Behavior

**Mobile** (320px-768px):
- Single column layouts
- Bottom navigation (fixed, h-16) for dashboard
- Collapsible sidebar becomes slide-in drawer
- Stacked flashcards, full-width quiz cards

**Desktop** (1024px+):
- Multi-column grids (2-3 columns)
- Persistent sidebar navigation
- Side-by-side quiz review (question history + current)
- Floating action buttons for quick actions

---

## Images & Illustrations

**Hero Image**: Yes - Abstract gradient mesh background with study-themed overlay or diverse students in modern learning environment (full-screen, slight blur with gradient overlay)

**Required Images**:
- Achievement badges: Custom illustrated icons for each milestone (w-24 h-24)
- Subject icons: Illustrated category markers (Math, Science, Languages) - gradient style
- Empty states: Friendly illustrations for "No flashcards yet", "Join a study group" (max-w-sm)
- Student testimonial photos: Authentic portraits (w-16 rounded-full)
- Feature mockups: Animated screen captures of quiz/flashcard interfaces

**Icon Library**: Heroicons (primary UI), with gradient overlays for gamification elements

---

## Animation & Interaction

**Key Animations**:
- XP gain: Number counter + progress bar fill (800ms)
- Achievement unlock: Badge scale-in + confetti burst
- Flashcard flip: 3D perspective transform (400ms)
- Streak fire: Subtle pulse animation (infinite)
- Correct answer: Green pulse overlay + haptic
- Level up: Full-screen gradient animation with particles

**Performance**: Respect prefers-reduced-motion, use transform/opacity, 60fps minimum

---

## Accessibility

- WCAG AA contrast on all text despite gradients (overlay adjustment)
- Keyboard navigation for all quiz/flashcard interactions
- Screen reader announcements for XP gains, streak updates
- Focus indicators visible on glassmorphic backgrounds
- High-contrast mode: Disable transparency, use solid backgrounds
- Timer: Visual + text indication, pause option