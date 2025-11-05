# ShareHop Ride-Sharing Platform - Design Guidelines

## Design Approach

**Selected Approach**: Reference-Based, drawing from Uber, Lyft, and Grab

**Rationale**: Ride-sharing apps require immediate trust, safety perception, and seamless utility-first experiences. Users need effortless ride booking and tracking, while drivers need clear ride management.

**Core Principles**:
- Trust through clarity: Zero ambiguity in ride status and pricing
- Map-first design: Location/tracking as the primary interface element
- Instant recognition: Standard ride-sharing patterns for zero learning curve
- Safety visibility: Driver verification, trip sharing, emergency access always present

---

## Typography System

**Font Stack**: Inter via Google Fonts CDN (clean, professional, excellent mobile legibility)

**Hierarchy**:
- **App Title/Branding**: 1.5rem (24px), weight 700
- **Location Headers**: 1.25rem (20px), weight 600
- **Ride Details/Driver Names**: 1.125rem (18px), weight 600
- **Body/Addresses**: 1rem (16px), weight 400, line-height 1.5
- **Pricing/ETAs**: 1.75rem (28px), weight 700, tabular-nums
- **Labels/Metadata**: 0.875rem (14px), weight 500
- **Micro-text/Status**: 0.75rem (12px), weight 500, uppercase letter-spacing

---

## Layout System

**Spacing Primitives**: 2, 4, 6, 8, 12, 16 units (Tailwind)
- Component padding: p-4, p-6
- Card gaps: gap-3, gap-4
- Section spacing: mb-6, mb-8
- Map overlays: absolute positioning with safe area padding (p-4)

**Primary Layouts**:

**Rider Interface**:
- Full-screen map (h-screen)
- Bottom sheet overlays (rounded-t-3xl) with drag handles
- Floating action buttons: top-right (profile/menu), bottom-center (ride type selector)
- Location inputs: sticky top bar over map with backdrop blur

**Driver Interface**:
- Split view: top 40% map, bottom 60% ride list/details
- Horizontal status bar (online/offline toggle)
- Persistent earnings widget: top-right corner

**Container Patterns**:
- Bottom sheets: slide up in 3 states (collapsed: h-24, partial: h-1/2, full: h-5/6)
- Modal overlays: max-w-lg, centered, p-6
- Map info cards: floating, max-w-sm, absolute positioning

---

## Component Library

### Map Interface

**Map View**:
- Full viewport height minus bottom sheet/nav bars
- User location marker: pulsing circle (w-4 h-4) with outer ring animation
- Driver markers: car icons with directional rotation
- Pickup/dropoff pins: custom markers with labels
- Route polyline: dashed during request, solid during trip

**Location Search Bar**:
- Sticky header over map: backdrop-blur, p-3
- Rounded-full input fields (h-14)
- Icons: left (search/location), right (favorite/recent)
- Autocomplete dropdown: full-width, max-h-80, overflow-scroll
- Current location button: circular (w-12 h-12), positioned bottom-right of search

### Ride Booking Flow

**Ride Type Selector** (Bottom Sheet):
- Horizontal scroll cards: flex gap-3, snap-x
- Each card: min-w-72, rounded-2xl, p-4
- Content: Vehicle icon (top), service name, capacity, ETA, price estimate
- Selected state: border-2 with elevated shadow

**Confirm Ride Card**:
- Route summary: pickup/dropoff addresses with dotted line between
- Estimated arrival: large display (2rem), centered
- Price breakdown: expandable accordion
- Payment method: single-line selector with right chevron
- Primary CTA: full-width button (h-14), rounded-xl, weight 600

### Active Ride Interface

**Driver Info Card** (Rider View):
- Driver photo: rounded-full (w-16 h-16), left-aligned
- Name + rating (stars inline): weight 600, 1.125rem
- Vehicle details: make, model, plate (0.875rem)
- Call/message buttons: icon-only (w-10 h-10), rounded-full, right-aligned

**Live Tracking Panel**:
- Progress bar: multi-step (Arriving → Pickup → Dropoff)
- Current step highlighted with animation
- ETA countdown: tabular-nums, weight 700, 1.5rem
- Share trip button: ghost button style, top-right

**Trip Summary** (Post-Ride):
- Map snapshot: static image (h-48)
- Route details: distance, duration, pickup/dropoff times
- Price breakdown: itemized list with total emphasized
- Driver rating: 5-star selector (w-12 h-12 per star)
- Tip options: chip buttons (rounded-full, px-4, py-2)

### Driver-Specific Components

**Ride Request Card**:
- Time-sensitive design: countdown timer (top-right, circular progress)
- Rider photo + name + rating
- Pickup address (truncated, weight 600)
- Distance to pickup + estimated fare
- Accept/Decline: full-width split buttons (h-12)

**Earnings Dashboard**:
- Today's earnings: hero metric (3rem, weight 700)
- Trip count + online hours: 2-column grid
- Weekly chart: line graph (h-40)
- Cash out button: sticky bottom CTA

**Trip History List**:
- Card-based: rounded-xl, p-4, mb-3
- Left: pickup/dropoff (vertical layout with connector line)
- Right: fare amount (weight 600), timestamp (0.75rem)
- Expandable for trip details

### Navigation & Headers

**Rider App Header**:
- Transparent over map (backdrop-blur)
- Left: menu icon (hamburger)
- Center: destination search trigger
- Right: profile avatar (w-10 h-10, rounded-full)

**Driver App Nav**:
- Bottom tab bar (h-16): Home, Earnings, Account
- Active tab: icon fill + label weight change
- Badge notifications on tab icons

### Overlays & Modals

**Safety Features Panel**:
- Emergency button: always visible (floating bottom-left, w-12 h-12)
- Safety modal: contact list, trip sharing, emergency call
- Trust badges: driver verification, insurance info
- Share trip: contacts list with quick-send buttons

**Payment Methods**:
- Card list: stacked cards (rounded-lg, p-4)
- Default indicator: checkmark icon (right-aligned)
- Add payment: dashed border card
- Delete swipe action: reveal red background with icon

---

## Responsive Behavior

**Mobile-First** (320px - 768px):
- Single-column layouts throughout
- Bottom sheets as primary interaction pattern
- Full-width buttons (h-12 minimum)
- Map: 60-100vh depending on sheet state

**Tablet/Desktop** (768px+):
- Rider: 2-column split (map: 60%, booking panel: 40%)
- Driver: Side navigation + main content area
- Larger touch targets: h-14 buttons
- Enhanced map controls: zoom buttons, layer toggles

---

## Accessibility & Interaction

- All touchable elements: minimum 44x44px
- Color-independent status (icons + text labels)
- Screen reader announcements for ride status changes
- High-contrast mode support for map markers
- Haptic feedback on ride request acceptance/decline
- Voice-over compatibility for all interactive elements
- Emergency button: always reachable, high contrast

---

## Animation

**Critical Animations**:
- Driver marker movement: smooth position updates (300ms ease)
- Bottom sheet drag: spring physics with resistance
- Ride request acceptance: confetti + haptic
- Price update: number counter animation
- Map zoom on pickup/dropoff selection

**Performance**: Transform/opacity only, respect prefers-reduced-motion, 60fps guarantee

---

## Images

**Hero Image**: No traditional hero section; app is map-first, full-screen interface

**Required Images**:
- Driver/Rider profile photos: Circular avatars (32px-80px)
- Vehicle type icons: Illustrated cars for ride selection (w-20 h-20)
- Safety feature illustrations: Emergency modal graphics
- Empty state illustrations: "No trips yet" for history (max-w-xs, centered)
- Payment method logos: Credit card brand icons (h-6)

**Icon Library**: Heroicons (outline for most UI, solid for active states, maps icons for location markers)