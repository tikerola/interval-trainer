export const NOTES = [
  "C", "C#", "D", "D#", "E", "F",
  "F#", "G", "G#", "A", "A#", "B",
] as const;

export type Note = (typeof NOTES)[number];

// Standard tuning open strings (low E to high E)
export const OPEN_STRINGS: Note[] = ["E", "A", "D", "G", "B", "E"];

// Spoken/display names for each string index, low E to high E
export const STRING_LABELS = ["low E", "A", "D", "G", "B", "high E"];

// Fretboard display range used throughout the app (matches the longest transcribed solo).
export const FRET_COUNT = 17;

export function getNoteAtPosition(
  stringIndex: number,
  fretNumber: number
): { note: Note; octave: number } {
  const openNote = OPEN_STRINGS[stringIndex];
  const openIndex = NOTES.indexOf(openNote);
  const noteIndex = (openIndex + fretNumber) % 12;
  const note = NOTES[noteIndex];

  // Octave calculation: open string octaves (low E=2, A=2, D=3, G=3, B=3, E=4)
  const openOctaves = [2, 2, 3, 3, 3, 4];
  const openOctave = openOctaves[stringIndex];
  const octave = openOctave + Math.floor((openIndex + fretNumber) / 12);

  return { note, octave };
}

// Lowest fret (0–11) on the given string where targetNote occurs.
export function findLowestFret(stringIndex: number, targetNote: Note): number {
  for (let fret = 0; fret <= 11; fret++) {
    if (getNoteAtPosition(stringIndex, fret).note === targetNote) return fret;
  }
  return 0;
}
