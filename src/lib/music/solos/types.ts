import { getNoteAtPosition } from "../notes";
import type { Note } from "../notes";
import type { SoloNote } from "../soloNote";
import type { BluesDegree } from "../blues";

export interface TranscribedSolo {
  id: string;
  title: string;
  artist: string;
  key: Note;
  bpm: number;
  /** Chord degree for each bar, as actually played — may diverge from the generic 12-bar form. */
  chordProgression: BluesDegree[];
  bars: Map<number, SoloNote[]>;
  /** Named sections (e.g. "Chorus 1"), keyed by their starting bar. */
  sectionMarkers?: { bar: number; label: string }[];
}

/** Builds a SoloNote from a fretboard position, deriving pitch instead of hand-typing it. */
export function note(
  stringIndex: number,
  fretNumber: number,
  beatOffset: number,
  duration: string,
  extra?: Partial<Pick<SoloNote, "bend" | "slideToNext">>,
): SoloNote {
  const { note: pitch, octave } = getNoteAtPosition(stringIndex, fretNumber);
  return { stringIndex, fretNumber, note: pitch, octave, beatOffset, duration, ...extra };
}
