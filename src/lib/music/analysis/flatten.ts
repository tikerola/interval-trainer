import { NOTES, type Note } from "../notes";
import { getChordForBar, type BluesDegree } from "../blues";
import { toneDurationToBeats } from "../duration";
import type { TranscribedSolo } from "../solos/types";

export interface FlatNote {
  bar: number;
  beatOffset: number;
  absoluteBeat: number; // global ordering across the whole solo
  durationBeats: number;
  stringIndex: number;
  fretNumber: number;
  note: Note;
  octave: number;
  absolutePitch: number; // NOTES index + octave*12, safe for interval math (no chroma wraparound)
  slideToNext?: boolean;
  chordRoot: Note;
  chordDegree: BluesDegree;
}

/** Flattens a transcribed solo into a single time-ordered note list, each tagged with its bar's chord context. */
export function flattenSolo(solo: TranscribedSolo): FlatNote[] {
  const out: FlatNote[] = [];
  const barNumbers = [...solo.bars.keys()].sort((a, b) => a - b);

  for (const bar of barNumbers) {
    const notes = solo.bars.get(bar) ?? [];
    const chord = getChordForBar(solo.key, bar, solo.chordProgression);
    for (const n of notes) {
      out.push({
        bar,
        beatOffset: n.beatOffset,
        absoluteBeat: (bar - 1) * 4 + n.beatOffset,
        durationBeats: toneDurationToBeats(n.duration),
        stringIndex: n.stringIndex,
        fretNumber: n.fretNumber,
        note: n.note,
        octave: n.octave,
        absolutePitch: NOTES.indexOf(n.note) + n.octave * 12,
        slideToNext: n.slideToNext,
        chordRoot: chord.root,
        chordDegree: chord.degree,
      });
    }
  }

  return out.sort((a, b) => a.absoluteBeat - b.absoluteBeat);
}
