import { getAllCagedBoxes, type CagedBox, type CagedShape } from "../caged";
import { SCALES } from "../scales";
import type { TranscribedSolo } from "../solos/types";

const MIN_PENT = SCALES.find((s) => s.name === "Min Pent")!;

export interface PositionUsage {
  boxesUsed: { shape: CagedShape | "unboxed"; noteCount: number }[];
  primaryBox: CagedShape | "unboxed";
  fretRange: { min: number; max: number };
  transitions: number; // how many times consecutive notes moved to a different box
}

// A fret can fall inside more than one overlapping box; the tightest-fitting one is
// the most likely "intended" position.
function boxForFret(boxes: CagedBox[], fret: number): CagedBox | null {
  const containing = boxes.filter((b) => fret >= b.start && fret <= b.end);
  if (containing.length === 0) return null;
  return containing.reduce((best, b) => (b.end - b.start < best.end - best.start ? b : best));
}

/** Tallies which CAGED pentatonic box(es) the solo's notes fall into, and how often it shifts. */
export function analyzePosition(solo: TranscribedSolo): PositionUsage {
  const boxes = getAllCagedBoxes(solo.key, MIN_PENT);
  const barNumbers = [...solo.bars.keys()].sort((a, b) => a - b);

  const counts = new Map<CagedShape | "unboxed", number>();
  let min = Infinity;
  let max = -Infinity;
  let transitions = 0;
  let lastShape: CagedShape | "unboxed" | null = null;

  for (const bar of barNumbers) {
    for (const n of solo.bars.get(bar) ?? []) {
      min = Math.min(min, n.fretNumber);
      max = Math.max(max, n.fretNumber);
      const shape = boxForFret(boxes, n.fretNumber)?.shape ?? "unboxed";
      counts.set(shape, (counts.get(shape) ?? 0) + 1);
      if (lastShape && lastShape !== shape) transitions++;
      lastShape = shape;
    }
  }

  const boxesUsed = [...counts.entries()]
    .map(([shape, noteCount]) => ({ shape, noteCount }))
    .sort((a, b) => b.noteCount - a.noteCount);

  return {
    boxesUsed,
    primaryBox: boxesUsed[0]?.shape ?? "unboxed",
    fretRange: { min: Number.isFinite(min) ? min : 0, max: Number.isFinite(max) ? max : 0 },
    transitions,
  };
}
