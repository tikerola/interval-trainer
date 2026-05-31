# CLAUDE.md

## Project

Guitar Trainer

A browser-based guitar practice application focused on:

1. Fretboard mastery
2. Interval recognition
3. Blues improvisation skills (future phases)

The first version is intentionally narrow in scope and should feel polished, fast, and visually appealing.

---

# Tech Stack

Preferred stack:

- Next.js
- TypeScript
- Tailwind CSS
- React
- Zustand for state management

No backend required for MVP.

All logic should run client-side.

---

# Design Goals

The application should feel:

- Modern
- Minimal
- Fast
- Professional
- Similar quality level to modern music-production tools

Visual inspiration:

- Dark theme
- Warm wood-toned fretboard
- Clear fret markers
- Bright note highlights
- Responsive layout

Avoid:

- Cartoon aesthetics
- Excessive gradients
- Cluttered interfaces

---

# MVP Features

## Feature 1: Interactive Fretboard

Create a visually accurate electric guitar fretboard.

Display:

- 6 strings
- Frets 0–15
- Standard tuning:
  - E
  - A
  - D
  - G
  - B
  - E

Requirements:

- User can click any fret position
- Clicking highlights the selected note
- Highlight remains visible for 1000ms
- Highlight then fades out

Visual states:

- Default
- Hover
- Active

Active state should clearly show:

- Note name
- Selected position

Example:

User clicks:

- G string
- 5th fret

Application calculates:

- Note = C

Highlight displays:

"C"

for approximately 1 second.

---

# Music Theory Engine

Create reusable utilities.

Required functions:

getNoteAtPosition(
stringIndex,
fretNumber
)

Returns:

{
note: "C",
octave: 4
}

---

Store note values internally using:

[
"C",
"C#",
"D",
"D#",
"E",
"F",
"F#",
"G",
"G#",
"A",
"A#",
"B"
]

Use sharps only in MVP.

---

# Feature 2: Exercise Hub

Create a control panel below the fretboard.

Section title:

"Interval Trainer"

Controls:

### Root Note

Dropdown

Values:

C
C#
D
D#
E
F
F#
G
G#
A
A#
B

### Interval

Dropdown

Values:

Minor 2nd
Major 2nd
Minor 3rd
Major 3rd
Perfect 4th
Tritone
Perfect 5th
Minor 6th
Major 6th
Minor 7th
Major 7th
Octave

### Start Exercise Button

Starts training mode.

---

# Feature 3: Interval Exercise

Example:

Root note = D

Interval = Minor 3rd

Application calculates:

Target note = F

All F notes across the fretboard become valid answers.

---

# Exercise Rules

After pressing Start:

1. Fretboard enters Exercise Mode
2. User must click exactly one valid target note on each string
3. Total required answers = 6
4. One answer per string

Example:

String 1:
User selects F

String locked.

Cannot select another answer on that string.

---

# Feedback

Correct answer:

- Green highlight

Incorrect answer:

- Red highlight

Immediate feedback.

---

# Completion

Exercise completes when:

All 6 strings have a correct answer.

Display:

"Exercise Complete"

Show:

- Accuracy
- Total mistakes
- Time taken

---

# State Model

interface ExerciseState {
rootNote: string;
interval: number;
targetNote: string;

active: boolean;

answers: {
stringIndex: number;
fret: number;
correct: boolean;
}[];

mistakes: number;

startedAt: number;
}

---

# Components

/components

Fretboard.tsx

Fret.tsx

StringRow.tsx

ExerciseHub.tsx

ExerciseResults.tsx

---

# Utilities

/lib/music

notes.ts

intervals.ts

fretboard.ts

exercise.ts

---

# Required Utility Functions

getNoteAtPosition()

getIntervalNote()

isCorrectExerciseAnswer()

generateFretboard()

---

# UX Requirements

The user should never need instructions.

The interface should make the exercise obvious.

Priorities:

1. Responsiveness
2. Clarity
3. Immediate feedback
4. Beautiful fretboard rendering

Animations should be subtle.

No unnecessary modal dialogs.

---

# Phase 2 (Do Not Build Yet)

Future ideas:

- Blues trainer
- Chord-tone trainer
- 12-bar blues backing track
- Ear training
- Daily challenges
- Progress tracking
- User profiles

Only implement MVP features first.
