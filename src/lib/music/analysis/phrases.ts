import type { FlatNote } from "./flatten";

export interface Phrase {
  notes: FlatNote[];
  startBar: number;
  endBar: number;
  startBeat: number; // absoluteBeat of first note
  endBeat: number;   // absoluteBeat + duration of last note
}

// A gap longer than this (in beats) between one note's end and the next note's
// start reads as a breath/rest rather than a continuous phrase.
const GAP_THRESHOLD_BEATS = 0.4;

/** Splits a flattened note stream into phrases, breaking wherever a rest exceeds the gap threshold. */
export function segmentPhrases(notes: FlatNote[]): Phrase[] {
  const phrases: Phrase[] = [];
  let current: FlatNote[] = [];

  const flush = () => {
    if (current.length === 0) return;
    const first = current[0];
    const last = current[current.length - 1];
    phrases.push({
      notes: current,
      startBar: first.bar,
      endBar: last.bar,
      startBeat: first.absoluteBeat,
      endBeat: last.absoluteBeat + last.durationBeats,
    });
    current = [];
  };

  for (const n of notes) {
    if (current.length > 0) {
      const prev = current[current.length - 1];
      const gap = n.absoluteBeat - (prev.absoluteBeat + prev.durationBeats);
      if (gap > GAP_THRESHOLD_BEATS) flush();
    }
    current.push(n);
  }
  flush();

  return phrases;
}
