# Blues Triad Trainer - Product Specification

## Overview

Build a guitar practice application focused on learning and internalizing triads within a 12-bar blues progression.

The application acts as a backing practice tool that:

- Plays a 12-bar blues progression using simple chord voicings ("mini chords").
- Plays a metronome.
- Guides the player through chord changes.
- Displays triads and scale tones within a configurable fretboard region.
- Encourages soloing using triads, major pentatonic, minor pentatonic, and blue notes.
- Runs for a configurable training duration.

---

# Core Features

## 1. 12-Bar Blues Progression

### Requirements

- Support a standard 12-bar blues progression.
- User can select the key.
- All displayed notes, triads, and scales should automatically adapt to the selected key.

### Example Progression

| Bar | Function       |
| --- | -------------- |
| 1   | I              |
| 2   | I              |
| 3   | I              |
| 4   | I              |
| 5   | IV             |
| 6   | IV             |
| 7   | I              |
| 8   | I              |
| 9   | V              |
| 10  | IV             |
| 11  | I              |
| 12  | V (turnaround) |

---

## 2. Backing Track

### Requirements

The application should generate:

- A metronome click.
- Simple mini-chord accompaniment.
- Synchronized playback of both.

### Configuration

User can adjust:

- Tempo (BPM)
  - Default: 80 BPM
  - Range: 40–220 BPM

---

## 3. Practice Session Timer

### Requirements

A practice session runs for a configurable duration.

### Defaults

- Default duration: 2 minutes

### Configuration

Allow users to select:

- 1 minute
- 2 minutes
- 5 minutes
- 10 minutes
- Custom duration

### Behavior

When the timer expires:

- Playback stops.
- Metronome stops.
- Session ends cleanly.
- Optional summary screen can be shown.

---

## 4. Chord Guidance Display

### Requirements

The UI should always display:

### Current Chord

Example:

```text
Current Chord: A7
```

### Current Bar

Example:

```text
Bar 5 / 12
```

### Upcoming Chord

One bar before a chord change, display the next chord.

Example:

```text
Next Chord: D7
```

If the chord remains unchanged in the next bar, no preview is necessary.

---

## 5. Interactive Fretboard

### Requirements

Display a guitar fretboard visualization.

The fretboard should support configurable:

- Fret range
- String range

---

## 6. Fret Range Configuration

### Requirements

User selects a practice region.

Examples:

- Frets 1–5
- Frets 5–9
- Frets 7–12

Only notes within the selected range should be highlighted.

---

## 7. String Range Configuration

### Requirements

User can limit the strings used during practice.

Examples:

- Strings 1–3
- Strings 2–4
- Strings 1–6

The visualization should only emphasize notes inside the selected string range.

---

## 8. Triad Visualization

### Goal

Help users visualize chord tones during the blues progression.

### Requirements

For the currently active chord:

- Highlight all available triad shapes within the selected fret and string range.
- Show all inversions that fit inside the visible area.

### Visual Priority

Triad notes should be the most visually prominent elements on the fretboard.

Suggested hierarchy:

1. Active triad notes
2. Scale notes
3. Other fretboard markers

---

## 9. Scale Visualization

### Goal

Provide a soloing framework around the current chord.

### Requirements

Display:

- Major pentatonic scale
- Minor pentatonic scale
- Blue notes

All notes must be calculated relative to the selected key.

### Visual Treatment

Scale notes should be visible but less prominent than triad notes.

---

## 10. Combined Blues Scale View

The fretboard should present:

- Current chord triads
- Major pentatonic notes
- Minor pentatonic notes
- Blue notes

simultaneously.

This allows users to connect:

- Chord tones
- Major blues sounds
- Minor blues sounds
- Passing tones

within one visual framework.

---

# User Interface

## Main Layout

### Header

Display:

- Key
- Tempo
- Remaining session time

### Center

Display:

- Current chord
- Current bar
- Next chord (when applicable)

### Fretboard

Interactive fretboard visualization showing:

- Triads
- Pentatonic scales
- Blue notes

### Controls

- Start session
- Pause session
- Stop session
- Tempo selector
- Key selector
- Fret range selector
- String range selector
- Session duration selector

---

# Example Session

Configuration:

- Key: A
- Tempo: 90 BPM
- Duration: 2 minutes
- Fret Range: 5–9
- String Range: 1–4

Session starts:

Bar 1:

- Current chord: A7

Bar 4:

- Display:
  - Current chord: A7
  - Next chord: D7

Bar 5:

- Current chord changes to D7
- Fretboard updates triad highlights

Bar 8:

- Display:
  - Next chord: E7

Bar 9:

- Current chord changes to E7

Session continues until timer reaches zero.

Playback stops automatically.

---

# Future Enhancements (Not Required for MVP)

- Chord-tone targeting exercises
- Random key mode
- Voice-leading trainer
- Triad inversion drills
- Progress tracking
- Accuracy scoring
- MIDI guitar support
- Microphone pitch detection
- Loop selected bars
- Custom blues forms
- Jazz blues progression mode
- Export practice statistics
