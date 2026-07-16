import { NOTES, Note } from "./notes";

export const INTERVALS = [
  { label: "Minor 2nd", semitones: 1, spoken: "minor second" },
  { label: "Major 2nd", semitones: 2, spoken: "major second" },
  { label: "Minor 3rd", semitones: 3, spoken: "minor third" },
  { label: "Major 3rd", semitones: 4, spoken: "major third" },
  { label: "Perfect 4th", semitones: 5, spoken: "perfect fourth" },
  { label: "Tritone", semitones: 6, spoken: "tritone" },
  { label: "Perfect 5th", semitones: 7, spoken: "perfect fifth" },
  { label: "Minor 6th", semitones: 8, spoken: "minor sixth" },
  { label: "Major 6th", semitones: 9, spoken: "major sixth" },
  { label: "Minor 7th", semitones: 10, spoken: "minor seventh" },
  { label: "Major 7th", semitones: 11, spoken: "major seventh" },
  { label: "Octave", semitones: 12, spoken: "octave" },
] as const;

export type IntervalLabel = (typeof INTERVALS)[number]["label"];

export function getIntervalNote(root: Note, semitones: number): Note {
  const rootIndex = NOTES.indexOf(root);
  return NOTES[(rootIndex + semitones) % 12];
}
