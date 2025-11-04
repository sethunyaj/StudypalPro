# StudyPal Learning Platform - Design Guidelines

## Design Approach

**Selected System**: Material Design 3 with educational platform patterns inspired by Google Classroom, Duolingo, and Khan Academy

**Rationale**: Educational productivity tool requiring clear information hierarchy, accessibility, and scalable component system for multi-user management and complex feature interactions.

**Core Principles**:
- Clarity over decoration: Information must be instantly scannable
- Progressive disclosure: Complex features revealed contextually
- Consistency across student and admin experiences
- Data visualization prominence for analytics and progress tracking

---

## Typography System

**Font Stack**: Inter via Google Fonts CDN (primary), system fallbacks
- Excellent readability for extended study sessions
- Wide weight range for clear hierarchy
- Optimized for data-dense interfaces

**Hierarchy**:
- **Hero/Page Titles**: 2.5rem (40px), weight 700, tight letter-spacing (-0.02em)
- **Section Headers**: 1.75rem (28px), weight 600
- **Card Titles/Subsections**: 1.25rem (20px), weight 600
- **Body Text**: 1rem (16px), weight 400, line-height 1.6
- **Labels/Metadata**: 0.875rem (14px), weight 500
- **Captions/Hints**: 0.75rem (12px), weight 400

**Special Treatments**:
- Stats/Scores: Tabular numbers, weight 700, 2rem+
- Quiz Questions: 1.125rem, weight 500, line-height 1.8
- Code/Technical Content: Monospace fallback, 0.9em

---

## Layout System

**Spacing Primitives** (Tailwind units):
- Core rhythm: 4, 8, 16, 24, 32 units
- Component padding: p-4, p-6, p-8
- Section gaps: gap-4, gap-6, gap-8
- Margins: mb-4, mb-6, mb-8, mb-12

**Grid Patterns**:
- **Dashboard Cards**: 3-column on desktop (grid-cols-3), 1-column mobile
- **Content Areas**: 2-column sidebar layout (sidebar: w-64, main: flex-1)
- **Admin Tables**: Full-width with horizontal scroll on mobile
- **Quiz Interface**: Single-column centered, max-w-3xl
- **Analytics Panels**: 2x2 grid for key metrics, flexible below

**Container Widths**:
- Main app container: max-w-7xl
- Content reading areas: max-w-4xl
- Forms/Quiz: max-w-2xl
- Modals: max-w-lg to max-w-3xl based on content

---

## Component Library

### Navigation & Structure

**Student Navigation**:
- Horizontal tab bar with icons + labels
- Active state: underline indicator (3px), elevated background
- Mobile: Collapsible hamburger menu with full-height drawer
- Sticky header with blur backdrop effect

**Admin Navigation**:
- Persistent left sidebar (w-64) on desktop
- Collapsible on tablet/mobile
- Hierarchical menu structure with expandable sections
- Active page highlighted with left border accent (4px)

### Cards & Panels

**Glass Card Standard** (retain existing glassmorphism):
- Rounded corners: 16px (rounded-2xl)
- Consistent padding: p-6
- Subtle shadow: elevation system (2dp, 4dp, 8dp for hover)
- Hover: translateY(-2px) + enhanced shadow

**Dashboard Stat Cards**:
- Icon above metric (4rem size)
- Large number display (3rem, weight 700)
- Descriptive label below (0.875rem)
- Minimal padding for number prominence

**Content Cards**:
- Header with title + action buttons
- Body with 1.5rem padding
- Optional footer for metadata/actions

### Forms & Inputs

**Input Fields**:
- Height: h-12 (48px) for touch targets
- Border: 2px solid, rounded-lg
- Focus state: ring-2, ring-offset-2
- Labels: above input, weight 500, mb-2
- Error states: border change + message below (text-sm)

**Buttons**:
- Primary: px-6, py-3, rounded-lg, font-medium
- Secondary: outlined variant, same sizing
- Icon buttons: w-10, h-10, rounded-full
- Minimum touch target: 44x44px

**Select Menus**:
- Match input field styling
- Dropdown: max-h-60, overflow-auto
- Options: p-3, hover state

### Data Display

**Tables** (Admin Dashboard):
- Zebra striping for row differentiation
- Fixed header on scroll
- Row hover: subtle background change
- Actions column: right-aligned, icon buttons
- Responsive: card layout on mobile (stack row data)

**Charts/Graphs**:
- Chart.js integration (already present)
- Minimum height: 300px for desktop, 200px mobile
- Legend positioned top-right or bottom
- Grid lines: subtle, non-distracting
- Tooltips on hover with data point details

**Progress Indicators**:
- Linear: h-2 or h-4, rounded-full, animated fill
- Circular: for completion percentages, 80-120px diameter
- Micro-progress: badge-style inline indicators

### Interactive Elements

**Quiz Interface**:
- Question card: elevated, centered, max-w-2xl
- Answer options: full-width buttons, min-h-16, left-aligned text
- Option spacing: gap-3
- Selection state: border + background change
- Correct/Incorrect feedback: border + icon (✓/✗)
- Navigation: fixed bottom bar with prev/next

**Flashcards**:
- Card: aspect-ratio 3:2, perspective flip animation
- Front/back: centered text, p-8
- Controls: below card, centered button group
- Deck progress: linear indicator above card

**AI Tutor Chat**:
- Message bubbles: max-w-lg, rounded-2xl
- User messages: right-aligned, ml-auto
- AI messages: left-aligned, mr-auto
- Timestamps: text-xs, opacity-70
- Input: sticky bottom, h-14, rounded-full

### Admin-Specific Components

**Student Management Table**:
- Columns: Avatar, Name, ID, Grade, Points, Streak, Quizzes, Actions
- Bulk actions: checkbox column, action bar appears when selected
- Search/Filter bar: sticky above table
- Export button: top-right

**Analytics Dashboard**:
- KPI cards: 4-column grid (grid-cols-4)
- Large charts: full-width sections below KPIs
- Date range picker: top-right corner
- Comparison toggles: chip-style buttons

**Content Management**:
- Quiz builder: multi-step form with progress indicator
- Question list: draggable cards for reordering
- Preview panel: right sidebar showing live preview
- Bulk import: drag-drop zone (min-h-64, dashed border)

### Gamification Elements

**Achievement Badges**:
- Grid display: 4-6 columns (grid-cols-4 lg:grid-cols-6)
- Badge size: w-20 h-20, rounded-full
- Unlocked: full opacity
- Locked: opacity-40, grayscale filter
- Name below: text-xs, text-center

**Leaderboard**:
- Top 3: larger cards with ranks (1st, 2nd, 3rd)
- Remaining: compact list with position, avatar, name, score
- Current user: highlighted row with border
- Update animation: smooth counter increment

**XP Progress Bar**:
- Positioned below user profile in header
- Current level indicator (left)
- Next level target (right)
- Animated fill on XP gain

---

## Responsive Breakpoints

- **Mobile**: Base styles, single-column layouts
- **Tablet** (md: 768px): 2-column grids, expanded navigation
- **Desktop** (lg: 1024px): 3-column grids, full sidebar navigation
- **Large** (xl: 1280px): Optimized data tables, expanded charts

---

## Accessibility Standards

- All interactive elements: minimum 44x44px touch targets
- Form inputs: associated labels, clear error messages
- Keyboard navigation: visible focus states, logical tab order
- Screen reader: ARIA labels on icon-only buttons, live regions for dynamic content
- Contrast: ensure text meets WCAG AA standards (handled by color system)

---

## Animation & Transitions

**Use Sparingly**:
- Page transitions: 200ms fade-in
- Card hover: 200ms transform + shadow
- Modal open/close: 300ms scale + fade
- Chart data: 400ms eased entrance
- Avoid: Scroll-triggered animations, decorative movements

**Performance**:
- Transform and opacity only
- will-change on animated elements
- Respect prefers-reduced-motion

---

## Image Guidelines

**Profile Avatars**:
- Circular (rounded-full)
- Sizes: 32px (list), 48px (cards), 80px (profile headers)
- Fallback: Initials in placeholder

**Illustrations** (Optional):
- Empty states: centered, max-w-xs
- Achievement unlocks: modal overlays
- Onboarding: multi-step wizard illustrations

**Icons**:
- Heroicons via CDN (outline style for most UI, solid for filled states)
- Consistent 20-24px sizing in navigation/buttons
- 16px for inline text icons