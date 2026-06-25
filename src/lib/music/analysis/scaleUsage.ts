import type { Note } from "../notes";
import { SCALES, getScaleNotes } from "../scales";
import { getBlueNotes } from "../blues";
import type { FlatNote } from "./flatten";

export interface ScaleFit {
  scaleName: string;
  percentInScale: number;
  notesUsed: Note[];
}

export interface BlueNoteOccurrence {
  bar: number;
  beatOffset: number;
  note: Note;
  degree: "b3" | "b5";
}

export interface ScaleUsage {
  bestFit: ScaleFit;
  fits: ScaleFit[];
  blueNotes: BlueNoteOccurrence[];
}

// The scales actually relevant to a blues solo's vocabulary — not the full SCALES list.
const CANDIDATE_SCALE_NAMES = ["Min Pent", "Maj Pent", "Blues Min", "Blues Maj", "Mixolydian"];

export function analyzeScaleUsage(notes: FlatNote[], key: Note): ScaleUsage {
  const candidates = SCALES.filter((s) => CANDIDATE_SCALE_NAMES.includes(s.name));

  const fits: ScaleFit[] = candidates.map((scale) => {
    const scaleNotes = new Set(getScaleNotes(key, scale));
    const matching = notes.filter((n) => scaleNotes.has(n.note));
    return {
      scaleName: scale.name,
      percentInScale: notes.length === 0 ? 0 : Math.round((matching.length / notes.length) * 100),
      notesUsed: [...new Set(matching.map((n) => n.note))],
    };
  });

  const bestFit = fits.reduce((best, f) => (f.percentInScale > best.percentInScale ? f : best), fits[0]);

  const [b3, b5] = getBlueNotes(key);
  const blueNotes: BlueNoteOccurrence[] = notes
    .filter((n) => n.note === b3 || n.note === b5)
    .map((n) => ({ bar: n.bar, beatOffset: n.beatOffset, note: n.note, degree: n.note === b3 ? "b3" as const : "b5" as const }));

  return { bestFit, fits, blueNotes };
}
