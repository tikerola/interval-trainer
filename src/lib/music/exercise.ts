import { getNoteAtPosition } from "./notes";
import type { Note } from "./notes";

export interface FretWindow {
  start: number; // inclusive, fret 1–15
  end: number;
}

export function isCorrectExerciseAnswer(
  targetNote: Note,
  stringIndex: number,
  fretNumber: number
): boolean {
  const { note } = getNoteAtPosition(stringIndex, fretNumber);
  return note === targetNote;
}

export function generateFretWindow(targetNote: Note, windowWidth: number): FretWindow {
  const FRET_MAX = 15;

  // Collect fret positions (1–15) where targetNote appears on at least one string
  const validFrets: number[] = [];
  for (let fret = 1; fret <= FRET_MAX; fret++) {
    for (let str = 0; str < 6; str++) {
      if (getNoteAtPosition(str, fret).note === targetNote) {
        validFrets.push(fret);
        break;
      }
    }
  }

  // Find all window starts where [start, start+windowWidth-1] contains a valid fret
  const maxStart = FRET_MAX - windowWidth + 1;
  const validStarts: number[] = [];
  for (let start = 1; start <= maxStart; start++) {
    const end = start + windowWidth - 1;
    if (validFrets.some((f) => f >= start && f <= end)) {
      validStarts.push(start);
    }
  }

  if (validStarts.length === 0) return { start: 1, end: windowWidth };

  const start = validStarts[Math.floor(Math.random() * validStarts.length)];
  return { start, end: start + windowWidth - 1 };
}
