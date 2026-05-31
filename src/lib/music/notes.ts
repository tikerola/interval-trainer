export const NOTES = [
  "C", "C#", "D", "D#", "E", "F",
  "F#", "G", "G#", "A", "A#", "B",
] as const;

export type Note = (typeof NOTES)[number];

// Standard tuning open strings (low E to high E)
export const OPEN_STRINGS: Note[] = ["E", "A", "D", "G", "B", "E"];

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
