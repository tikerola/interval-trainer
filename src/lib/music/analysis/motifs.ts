import { NOTES } from "../notes";
import type { SoloNote } from "../soloNote";
import type { TranscribedSolo } from "../solos/types";

interface ShapeNote {
  semitoneDelta: number; // interval from this bar's first note, octave-aware
  beatDelta: number;     // beat offset from this bar's first note
}

function barShape(notes: SoloNote[]): ShapeNote[] {
  if (notes.length === 0) return [];
  const first = notes[0];
  const firstPitch = NOTES.indexOf(first.note) + first.octave * 12;
  return notes.map((n) => ({
    semitoneDelta: NOTES.indexOf(n.note) + n.octave * 12 - firstPitch,
    beatDelta: Math.round((n.beatOffset - first.beatOffset) * 12) / 12,
  }));
}

// Fraction of the longer shape's notes that line up (same interval, same rhythmic
// position) with the shorter shape — lets a truncated repeat (e.g. a 4-note phrase
// that's the first 4 notes of a 5-note one elsewhere) still count as the same motif.
function similarity(a: ShapeNote[], b: ShapeNote[]): number {
  const len = Math.min(a.length, b.length);
  if (len === 0) return 0;
  let matches = 0;
  for (let i = 0; i < len; i++) {
    if (a[i].semitoneDelta === b[i].semitoneDelta && Math.abs(a[i].beatDelta - b[i].beatDelta) < 0.2) {
      matches++;
    }
  }
  return matches / Math.max(a.length, b.length);
}

export interface MotifGroup {
  id: string;
  bars: number[];
  noteCount: number;
  description: string;
}

const SIMILARITY_THRESHOLD = 0.7;
const MIN_NOTES_FOR_MOTIF = 3; // ignore trivial 1-2 note "shapes" — too common to be meaningful

/** Groups bars whose melodic+rhythmic shape repeats (allowing transposition over different chords). */
export function detectMotifs(solo: TranscribedSolo): MotifGroup[] {
  const barNumbers = [...solo.bars.keys()].sort((a, b) => a - b);
  const shapes = new Map<number, ShapeNote[]>();
  for (const bar of barNumbers) {
    const notes = solo.bars.get(bar) ?? [];
    if (notes.length >= MIN_NOTES_FOR_MOTIF) shapes.set(bar, barShape(notes));
  }

  const clusters: { representative: number; bars: number[] }[] = [];
  for (const bar of shapes.keys()) {
    const shape = shapes.get(bar)!;
    const cluster = clusters.find((c) => similarity(shape, shapes.get(c.representative)!) >= SIMILARITY_THRESHOLD);
    if (cluster) cluster.bars.push(bar);
    else clusters.push({ representative: bar, bars: [bar] });
  }

  return clusters
    .filter((c) => c.bars.length >= 2)
    .sort((a, b) => b.bars.length - a.bars.length)
    .map((c, i) => {
      const noteCount = shapes.get(c.representative)!.length;
      return {
        id: `motif-${i}`,
        bars: c.bars,
        noteCount,
        description: `A ${noteCount}-note lick repeated across ${c.bars.length} bars`,
      };
    });
}
