import { NOTES, type Note } from "./notes";

export interface ScaleDefinition {
  name: string;
  semitones: readonly number[];
}

export const SCALES: readonly ScaleDefinition[] = [
  { name: "Major",            semitones: [0, 2, 4, 5, 7, 9, 11] },
  { name: "Minor",            semitones: [0, 2, 3, 5, 7, 8, 10] },
  { name: "Dorian",           semitones: [0, 2, 3, 5, 7, 9, 10] },
  { name: "Phrygian",         semitones: [0, 1, 3, 5, 7, 8, 10] },
  { name: "Lydian",           semitones: [0, 2, 4, 6, 7, 9, 11] },
  { name: "Mixolydian",       semitones: [0, 2, 4, 5, 7, 9, 10] },
  { name: "Locrian",          semitones: [0, 1, 3, 5, 6, 8, 10] },
  { name: "Maj Pent",         semitones: [0, 2, 4, 7, 9]        },
  { name: "Min Pent",         semitones: [0, 3, 5, 7, 10]       },
  { name: "Blues Maj",        semitones: [0, 2, 3, 4, 7, 9]     },
  { name: "Blues Min",        semitones: [0, 3, 5, 6, 7, 10]    },
];

export const DEFAULT_SCALE = SCALES[0];

export function isHeptatonic(scale: ScaleDefinition): boolean {
  return scale.semitones.length === 7;
}

export function getScaleNotes(root: Note, scale: ScaleDefinition): Note[] {
  const rootIdx = NOTES.indexOf(root);
  return scale.semitones.map((s) => NOTES[((rootIdx + s) % 12 + 12) % 12]);
}

const SEMITONE_DEGREE_LABEL: Record<number, string> = {
  0: "1", 1: "b2", 2: "2", 3: "b3", 4: "3",
  5: "4", 6: "b5", 7: "5", 8: "b6", 9: "6",
  10: "b7", 11: "7",
};

export function getScaleDegree(
  note: Note,
  root: Note,
  scale: ScaleDefinition
): string | null {
  const rootIdx = NOTES.indexOf(root);
  const offset = ((NOTES.indexOf(note) - rootIdx) % 12 + 12) % 12;
  return (scale.semitones as readonly number[]).includes(offset)
    ? SEMITONE_DEGREE_LABEL[offset]
    : null;
}
