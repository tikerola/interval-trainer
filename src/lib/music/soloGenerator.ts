import { NOTES, getNoteAtPosition, type Note } from "./notes";
import { LICKS, type ChordDegree } from "./lickLibrary";
import type { BluesDegree } from "./blues";

export type { SoloRhythm } from "./lickLibrary";
export type PhraseRole = "call" | "response";

export interface SoloNote {
  stringIndex: number;
  fretNumber: number;
  note: Note;
  octave: number;
  duration: string;
  beatOffset: number;
  bend?: number;          // semitones to pitch up during this note
  slideToNext?: boolean;  // ramp pitch into the following note
}

export const SOLO_RHYTHM_LABELS: Record<import("./lickLibrary").SoloRhythm, string> = {
  shuffle:  "Shuffle",
  straight: "Straight",
  slow:     "Slow",
  fast:     "Fast",
};

// Standard tuning open-string MIDI pitches: E2 A2 D3 G3 B3 E4
const OPEN_MIDI = [40, 45, 50, 55, 59, 64];
function midiOf(s: number, f: number) { return OPEN_MIDI[s] + f; }

type Pos = { s: number; f: number; pitch: number };

function findPositions(note: Note, fretStart: number, fretEnd: number, strStart: number, strEnd: number): Pos[] {
  const out: Pos[] = [];
  for (let s = strStart; s <= strEnd; s++) {
    for (let f = fretStart; f <= fretEnd; f++) {
      if (getNoteAtPosition(s, f).note === note) {
        out.push({ s, f, pitch: midiOf(s, f) });
      }
    }
  }
  return out;
}

function shiftNote(root: Note, semis: number): Note {
  return NOTES[((NOTES.indexOf(root) + semis) % 12 + 12) % 12];
}

// Anchor: the chord root closest to the centre of the fret range on a
// mid-neck string (D/G), giving the lick a natural lead hand position.
function getAnchorMidi(root: Note, fretStart: number, fretEnd: number, strStart: number, strEnd: number): number {
  const midFret = (fretStart + fretEnd) / 2;
  let positions = findPositions(root, fretStart, fretEnd, strStart, strEnd);
  if (positions.length === 0) positions = findPositions(root, 0, 15, 0, 5);
  if (positions.length === 0) return 60;

  return positions.sort((a, b) => {
    const da = Math.abs(a.f - midFret) + Math.abs(a.s - 2.5) * 0.5;
    const db = Math.abs(b.f - midFret) + Math.abs(b.s - 2.5) * 0.5;
    return da - db;
  })[0].pitch;
}

function degreeToChordDegree(d: BluesDegree): ChordDegree {
  return d === 1 ? "I" : d === 4 ? "IV" : "V";
}

let lastLickId: string | null = null;

export function generateBarPhrase(
  chordRoot: Note,
  degree: BluesDegree,
  fretStart: number, fretEnd: number,
  strStart: number, strEnd: number,
  rhythm: import("./lickLibrary").SoloRhythm,
  role: PhraseRole,
): SoloNote[] {
  const chordDegree = degreeToChordDegree(degree);

  const candidates = (strictChord: boolean, strictRole: boolean) =>
    LICKS.filter(
      (l) =>
        (!strictChord || l.suitableFor.includes(chordDegree)) &&
        l.feels.includes(rhythm) &&
        (!strictRole || (role === "call" ? l.character !== "response" : l.character !== "call")) &&
        l.id !== lastLickId,
    );

  const pool =
    candidates(true, true).length  > 0 ? candidates(true, true)  :
    candidates(true, false).length  > 0 ? candidates(true, false)  :
    candidates(false, true).length  > 0 ? candidates(false, true)  :
    LICKS;

  const lick = pool[Math.floor(Math.random() * pool.length)];
  lastLickId = lick.id;

  const anchorMidi = getAnchorMidi(chordRoot, fretStart, fretEnd, strStart, strEnd);
  const notes: SoloNote[] = [];

  for (const ln of lick.notes) {
    const targetNote = shiftNote(chordRoot, ((ln.interval % 12) + 12) % 12);
    const targetMidi = anchorMidi + ln.interval;

    const positions = findPositions(targetNote, fretStart, fretEnd, strStart, strEnd);
    if (positions.length === 0) continue;

    // Pick the fretboard position whose MIDI pitch is closest to the target.
    // This keeps octave-higher intervals landing high on the neck rather than
    // mapping back to the same low root.
    const pos = positions.sort((a, b) =>
      Math.abs(a.pitch - targetMidi) - Math.abs(b.pitch - targetMidi),
    )[0];

    const { note, octave } = getNoteAtPosition(pos.s, pos.f);
    notes.push({
      stringIndex: pos.s,
      fretNumber:  pos.f,
      note,
      octave,
      duration:    ln.duration,
      beatOffset:  ln.beat,
      bend:        ln.bend,
      slideToNext: ln.slideToNext,
    });
  }

  return notes;
}
