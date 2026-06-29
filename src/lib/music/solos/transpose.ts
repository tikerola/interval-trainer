import { NOTES, getNoteAtPosition, type Note } from "../notes";
import { semitones } from "../blues";
import type { SoloNote } from "../soloNote";
import type { TranscribedSolo } from "./types";

export function getFretRange(solo: TranscribedSolo): { min: number; max: number } {
  let min = Infinity;
  let max = -Infinity;
  for (const notes of solo.bars.values()) {
    for (const n of notes) {
      if (n.fretNumber < min) min = n.fretNumber;
      if (n.fretNumber > max) max = n.fretNumber;
    }
  }
  return { min, max };
}

/**
 * The semitone shift (applied uniformly, same string throughout) that moves `solo`
 * into `targetKey`, or null if neither shift direction keeps every note's fret within
 * [0, maxFret] — i.e. the key isn't reachable without re-fingering onto other strings.
 */
function shiftFor(solo: TranscribedSolo, targetKey: Note, maxFret: number): number | null {
  const up = semitones(solo.key, targetKey);
  if (up === 0) return 0;
  const down = up - 12;
  const { min, max } = getFretRange(solo);

  const upOk = max + up <= maxFret;
  const downOk = min + down >= 0;
  if (upOk && downOk) return Math.abs(up) <= Math.abs(down) ? up : down;
  if (upOk) return up;
  if (downOk) return down;
  return null;
}

/** Keys reachable by a uniform same-string fret shift without falling outside [0, maxFret]. */
export function getAvailableKeys(solo: TranscribedSolo, maxFret: number): Note[] {
  return NOTES.filter((key) => shiftFor(solo, key, maxFret) !== null);
}

export function transposeSolo(solo: TranscribedSolo, targetKey: Note, maxFret: number): TranscribedSolo {
  const shift = shiftFor(solo, targetKey, maxFret);
  if (!shift) return solo;

  const bars = new Map<number, SoloNote[]>();
  for (const [bar, notes] of solo.bars) {
    bars.set(
      bar,
      notes.map((n) => {
        const fretNumber = n.fretNumber + shift;
        const { note, octave } = getNoteAtPosition(n.stringIndex, fretNumber);
        return { ...n, fretNumber, note, octave };
      }),
    );
  }

  return { ...solo, key: targetKey, bars };
}
