import { NOTES, OPEN_STRINGS, getNoteAtPosition, type Note } from "./notes";
import { getScaleNotes, type ScaleDefinition } from "./scales";

export type CagedShape = "C" | "A" | "G" | "E" | "D";
export const CAGED_SHAPES: readonly CagedShape[] = ["C", "A", "G", "E", "D"];

export interface CagedBox {
  shape: CagedShape;
  start: number; // lowest fret (1-indexed; open-string notes appear in the nut column)
  end: number;
}

// For each shape: the reference string that carries the root, and the
// fret-window offsets relative to that root fret.
// The window contains all the scale notes for the position; min/max of
// those notes across all 6 strings becomes the actual box start/end.
const SHAPE_CONFIG: Record<CagedShape, { stringIdx: number; wsOff: number; weOff: number }> = {
  C: { stringIdx: 4, wsOff: -1, weOff: 3 }, // root on B string
  A: { stringIdx: 1, wsOff: -1, weOff: 3 }, // root on A string
  G: { stringIdx: 0, wsOff: -4, weOff: 0 }, // root on low E
  E: { stringIdx: 0, wsOff: -1, weOff: 2 }, // root on low E
  D: { stringIdx: 2, wsOff: -1, weOff: 3 }, // root on D string
};

function rootFretOnString(root: Note, stringIdx: number): number {
  const openIdx = NOTES.indexOf(OPEN_STRINGS[stringIdx]);
  return ((NOTES.indexOf(root) - openIdx) % 12 + 12) % 12;
}

export function getCagedBox(root: Note, shape: CagedShape, scale: ScaleDefinition): CagedBox {
  const { stringIdx, wsOff, weOff } = SHAPE_CONFIG[shape];
  let rf = rootFretOnString(root, stringIdx);
  let ws = rf + wsOff;
  let we = rf + weOff;

  // Shift up an octave when the window sits mostly below the nut
  if (ws < -1) {
    rf += 12;
    ws = rf + wsOff;
    we = rf + weOff;
  }

  ws = Math.max(0, ws); // allow open strings (fret 0)

  const scaleNoteSet = new Set(getScaleNotes(root, scale));
  let minFret = we + 1;  // sentinels
  let maxFret = ws - 1;

  for (let s = 0; s < OPEN_STRINGS.length; s++) {
    for (let f = ws; f <= we; f++) {
      if (scaleNoteSet.has(getNoteAtPosition(s, f).note)) {
        if (f < minFret) minFret = f;
        if (f > maxFret) maxFret = f;
      }
    }
  }

  return { shape, start: minFret, end: maxFret };
}

export function getAllCagedBoxes(root: Note, scale: ScaleDefinition): CagedBox[] {
  return CAGED_SHAPES.map((shape) => getCagedBox(root, shape, scale));
}
