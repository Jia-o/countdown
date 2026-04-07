# App Specification

## Overview
A mobile countdown app where allows users can create, view, and track upcoming events and review past events.

## Core Features
- Create countdown events with a name, date/time, and description
- Display all upcoming countdowns from soonest to latest
- Show live updating countdown timers (days / hours / minutes / seconds)
- Allow users to edit and delete events
- Automatically move expired events to a “Past Events” screen
- Display how long ago past events occurred (e.g., “2 days ago”)
- Persist data locally on device

## Screens & Navigation
- Countdown Screen (home): Displays name and timer for all upcoming countdowns sorted by soonest event
- Add Screen: Form to create a new countdown with name, date/time, and description
- Past Events Screen: Displays expired countdowns sorted by most recently passed, showing how long ago they occurred

## Data Model

### Entities

CountdownEvent (chatGPT helped suggest these)
- id: string (UUID)
- name: string
- description: string (optional)
- targetDate: string (ISO datetime)
- createdAt: string (ISO datetime)

Derived Fields (not stored)
- timeRemaining: computed (targetDate - now)
- isPast: boolean (targetDate < now)
- timeSince: computed for past events (now - targetDate)

## API & Backend
- Local storage using AsyncStorage or Expo SecureStore

## Design & Branding

- **Color palette:** (chatGPT helped with this too)
  - Primary: #A78BFA (soft lavender)
  - Secondary: #F9A8D4 (pastel pink)
  - Accent 1: #93C5FD (baby blue)
  - Accent 2: #6EE7B7 (mint green)
  - Accent 3: #FDE68A (soft yellow)
  - Background: #FFF7FB (very light pink/cream)
  - Surface (cards): #FFFFFF
  - Text Primary: #374151 (soft dark gray)
  - Text Secondary: #6B7280 (muted gray)
  - Past Events: #FCA5A5 (soft pastel red)
 
- **Style direction:**
  - Cute, soft, and elegant with a pastel aesthetic
  - Card-based UI with rounded corners (12–20px radius)
  - Cards have gradients and shadows
  - Decorative sparkles!
  - Smooth animations
  - Colour-coded countdown cards (random pastel accent per event)

## Platform Targets
- iOS

## Offline Behavior
- All data stored locally
- Countdown timers continue to update

## Constraints & Non-Goals
- Must run in Expo environment and iOS simulator
