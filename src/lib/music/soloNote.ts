import type { Note } from "./notes";

export interface SoloNote {
  stringIndex: number;
  fretNumber: number;
  note: Note;
  octave: number;
  duration: string | number; // Tone.Time accepts both a duration string ("8n") or plain seconds
  beatOffset: number;
  bend?: number;          // semitones to pitch up during this note
  slideToNext?: boolean;  // ramp pitch into the following note
}
