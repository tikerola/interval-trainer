import { NOTES, type Note } from "./notes";
import { getScaleNotes, SCALES } from "./scales";

export const BLUES_PROGRESSION = [1, 1, 1, 1, 4, 4, 1, 1, 5, 4, 1, 5] as const;

export type BluesDegree = 1 | 4 | 5;
export type BluesRole = "root" | "third" | "fifth" | "seventh" | "blue3" | "blue5" | "majpent" | "minpent";

const MAJ_PENT = SCALES.find((s) => s.name === "Maj Pent")!;
const MIN_PENT = SCALES.find((s) => s.name === "Min Pent")!;

function semitones(from: Note, to: Note): number {
  return ((NOTES.indexOf(to) - NOTES.indexOf(from) + 12) % 12 + 12) % 12;
}

function offsetNote(root: Note, steps: number): Note {
  return NOTES[((NOTES.indexOf(root) + steps) % 12 + 12) % 12];
}

export function getChordRoot(key: Note, degree: BluesDegree): Note {
  const offsets: Record<BluesDegree, number> = { 1: 0, 4: 5, 5: 7 };
  return offsetNote(key, offsets[degree]);
}

export function getDom7Notes(root: Note): [Note, Note, Note, Note] {
  return [root, offsetNote(root, 4), offsetNote(root, 7), offsetNote(root, 10)];
}

export function getChordForBar(
  key: Note,
  bar: number,
  progression: readonly BluesDegree[] = BLUES_PROGRESSION,
): {
  root: Note;
  degree: BluesDegree;
  name: string;
  notes: [Note, Note, Note, Note];
} {
  const degree = progression[(bar - 1) % progression.length];
  const root = getChordRoot(key, degree);
  return { root, degree, name: `${root}7`, notes: getDom7Notes(root) };
}

export function getBlueNotes(key: Note): Note[] {
  return [offsetNote(key, 3), offsetNote(key, 6)]; // b3, b5
}

export function getBluesNoteRole(
  note: Note,
  chordNotes: [Note, Note, Note, Note],
  key: Note
): BluesRole | null {
  if (note === chordNotes[0]) return "root";
  if (note === chordNotes[1]) return "third";
  if (note === chordNotes[2]) return "fifth";
  if (note === chordNotes[3]) return "seventh";

  const blues = getBlueNotes(key);
  if (note === blues[0]) return "blue3"; // b3
  if (note === blues[1]) return "blue5"; // b5

  if (getScaleNotes(key, MAJ_PENT).includes(note)) return "majpent";
  if (getScaleNotes(key, MIN_PENT).includes(note)) return "minpent";

  return null;
}

// Chord voicing for Tone.js: root at octave 3, others voiced above it
export function getChordVoicing(root: Note, notes: [Note, Note, Note, Note]): string[] {
  const rootIdx = NOTES.indexOf(root);
  return notes.map((note) => {
    const noteIdx = NOTES.indexOf(note);
    const octave = noteIdx < rootIdx ? 4 : 3;
    return `${note}${octave}`;
  });
}

export const FRET_PRESETS = [
  { label: "0–4",   start: 0,  end: 4  },
  { label: "5–9",   start: 5,  end: 9  },
  { label: "7–12",  start: 7,  end: 12 },
  { label: "10–15", start: 10, end: 15 },
] as const;
