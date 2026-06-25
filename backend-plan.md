# CLAUDE.md

## Project: Interactive Blues Solo Library & Analysis Platform

### Vision

Build an application that helps guitarists understand, learn, and eventually create blues solos.

The initial goal is NOT AI-generated solos.

The initial goal is to build a rich library of blues solos and automatically analyze what makes them sound bluesy.

The application should function as both:

- A blues solo player
- A blues solo learning tool

Future AI generation features can be built on top of the collected analysis data.

---

# Core Philosophy

Most guitar players do not struggle because they lack notes.

They struggle because they do not understand:

- phrase construction
- motif repetition
- call and response
- resolution
- blues vocabulary
- chord targeting

The purpose of this application is to expose those ingredients visually and interactively.

---

# MVP Goals

The system must:

1. Import blues solo tablatures and transcriptions
2. Parse solos into structured note data
3. Play solos back
4. Display notes on a guitar fretboard
5. Analyze musical ingredients
6. Explain why a solo sounds bluesy

The system should prioritize educational value over AI generation.

---

# User Experience

A user selects a blues solo.

The application displays:

- Solo title
- Key
- Tempo
- Difficulty
- Fretboard visualization
- Playback controls
- Musical analysis

The user can:

- Play the solo
- Pause
- Slow down playback
- Loop sections
- View phrase explanations
- Highlight recurring motifs

---

# Example Solo Page

Title:
"Shuffle In A - Solo 1"

Metadata:

- Key: A Blues
- Tempo: 90 BPM
- Difficulty: Beginner
- Primary Position: Pentatonic Box 1

Analysis Summary:

- Uses Minor Pentatonic Scale
- Uses Blues Note
- Contains Repeated Motifs
- Uses Call and Response
- Resolves to Tonic
- Targets Chord Changes

---

# Data Model

Each solo is stored as:

{
"id": "solo_001",
"title": "Shuffle In A - Solo 1",
"key": "A",
"tempo": 90,
"bars": []
}

---

# Bar Model

{
"bar": 1,
"chord": "A7",
"notes": []
}

---

# Note Model

{
"pitch": "A4",
"start": 0,
"duration": 0.5
}

---

# Fretboard Model

{
"string": 3,
"fret": 7
}

Every note should be mappable to one or more fretboard positions.

---

# Musical Ingredient Analysis

The system should automatically identify:

## Scale Usage

Examples:

- Minor Pentatonic
- Major Pentatonic
- Blues Scale
- Mixolydian

For each solo:

- Percentage of notes inside scale
- Scale notes used
- Out-of-scale notes

---

## Blues Note Detection

Detect usage of:

b5 (flat five)

Example in A Blues:

Eb

Explain:

"The blue note creates tension before resolution."

---

## Motif Detection

A motif is a short musical idea that appears multiple times.

The system should:

- Detect repeated note sequences
- Detect rhythmic repetitions
- Group motif occurrences

Example:

Motif A appears in:

- Bar 1
- Bar 3
- Bar 7

Explanation:

"The player repeats this phrase to create cohesion."

---

## Call and Response Detection

Detect phrase pairs where:

- Phrase A presents an idea
- Phrase B answers or varies the idea

Explanation:

"This creates a conversational feel common in blues."

---

## Resolution Detection

Detect phrases ending on:

- Root note
- Chord tone

Tag:

- Strong Resolution
- Weak Resolution

Explanation:

"The phrase resolves tension and creates a feeling of completion."

---

## Chord Targeting

Analyze how the solo follows the harmony.

Example:

A7 chord:
A C# E G

D7 chord:
D F# A C

Detect:

- Chord tones emphasized
- Chord changes acknowledged
- Chord-tone resolutions

Explanation:

"The player follows the progression instead of using one scale throughout."

---

## Position Analysis

Determine which fretboard areas are used.

Example:

- Box 1
- Box 2
- Box 3

Metrics:

- Primary box
- Box transitions
- Neck coverage

Explanation:

"The solo stays mostly in Box 1 and briefly shifts to Box 2 for higher-register phrases."

---

## Phrase Analysis

For each phrase calculate:

- Length
- Note count
- Direction (ascending, descending, mixed)
- Resolution strength
- Rhythm complexity

---

# Educational Ingredient Cards

Every detected concept should generate a human-readable explanation.

Example:

## Repetition

"This solo repeats the same phrase several times with small variations. Repetition is one of the most important blues improvisation techniques."

---

## Space

"The player leaves pauses between phrases. Space makes the solo easier to understand and creates tension."

---

## Blues Note

"The flat five is used to create tension before resolving back into the scale."

---

## Chord Targeting

"The solo changes emphasis when the chord progression changes, making the improvisation sound connected to the harmony."

---

# Playback Features

Support:

- Play
- Pause
- Stop
- Tempo adjustment
- Loop bars
- Loop phrase
- Loop motif

Playback should remain synchronized with fretboard visualization.

---

# Solo Library

The application should maintain a searchable library.

Filters:

- Key
- Difficulty
- Tempo
- Scale
- Position
- Artist
- Blues Style

Examples:

- Texas Blues
- Chicago Blues
- Slow Blues
- Shuffle Blues

---

# Future AI Features

The analysis database will eventually become training data for generation systems.

Potential future features:

## Motif Library

Store reusable motifs with metadata.

Example:

{
"motifId": "motif_001",
"key": "A",
"containsBlueNote": true,
"position": "Box1"
}

---

## Solo Builder

Generate new solos using:

- Existing motifs
- Call/response templates
- Resolution rules
- Chord targeting rules

---

## AI Blues Coach

Provide feedback:

- Too many notes
- Missing resolutions
- Strong motif usage
- Better chord targeting opportunities

---

# Non-Goals (MVP)

The MVP should NOT include:

- Deep learning
- Neural network training
- Audio transcription
- Real-time improvisation generation

The focus is:

Understanding and visualizing why blues solos work.

---

# Success Criteria

A user can load a blues solo and immediately understand:

- What scale is being used
- Which motifs are repeated
- Where phrases resolve
- How the solo follows the chords
- Which fretboard positions are used
- Why the solo sounds bluesy

If the application can teach these concepts clearly, the MVP is successful.
