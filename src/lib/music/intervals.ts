import { NOTES, Note } from "./notes";

export const INTERVALS = [
  { label: "Minor 2nd", semitones: 1 },
  { label: "Major 2nd", semitones: 2 },
  { label: "Minor 3rd", semitones: 3 },
  { label: "Major 3rd", semitones: 4 },
  { label: "Perfect 4th", semitones: 5 },
  { label: "Tritone", semitones: 6 },
  { label: "Perfect 5th", semitones: 7 },
  { label: "Minor 6th", semitones: 8 },
  { label: "Major 6th", semitones: 9 },
  { label: "Minor 7th", semitones: 10 },
  { label: "Major 7th", semitones: 11 },
  { label: "Octave", semitones: 12 },
] as const;

export type IntervalLabel = (typeof INTERVALS)[number]["label"];

export function getIntervalNote(root: Note, semitones: number): Note {
  const rootIndex = NOTES.indexOf(root);
  return NOTES[(rootIndex + semitones) % 12];
}
