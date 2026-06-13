import { create } from "zustand";
import type { Note } from "@/lib/music/notes";
import type { SoloRhythm } from "@/lib/music/soloGenerator";

interface BluesState {
  key: Note;
  bpm: number;
  durationSeconds: number;
  fretStart: number;
  fretEnd: number;
  stringStart: number; // 0 = low E, 5 = high e
  stringEnd: number;
  chordTonesOnly: boolean;
  soloEnabled: boolean;
  soloRhythm: SoloRhythm;
  activeSoloNote: { stringIndex: number; fretNumber: number } | null;
  // Secondary highlight: where a bend resolves to or where a slide is heading
  activeSoloNoteSecondary: { stringIndex: number; fretNumber: number; type: "bend" | "slide" } | null;

  isPlaying: boolean;
  isCountIn: boolean;
  countInBeat: number; // 1–4 during count-in, 0 otherwise
  currentBar: number; // 1–12
  currentBeat: number; // 1–4
  elapsedSeconds: number;

  setKey: (key: Note) => void;
  setBpm: (bpm: number) => void;
  setDuration: (seconds: number) => void;
  setFretRange: (start: number, end: number) => void;
  setStringRange: (start: number, end: number) => void;
  setChordTonesOnly: (v: boolean) => void;
  setSoloEnabled: (v: boolean) => void;
  setSoloRhythm: (r: SoloRhythm) => void;
  setActiveSoloNote: (note: { stringIndex: number; fretNumber: number } | null) => void;
  setActiveSoloNoteSecondary: (note: { stringIndex: number; fretNumber: number; type: "bend" | "slide" } | null) => void;
  setIsPlaying: (v: boolean) => void;
  setIsCountIn: (v: boolean) => void;
  setCountInBeat: (beat: number) => void;
  setCurrentBar: (bar: number) => void;
  setCurrentBeat: (beat: number) => void;
  setElapsedSeconds: (s: number) => void;
  stop: () => void;
}

export const useBluesStore = create<BluesState>((set) => ({
  key: "A",
  bpm: 80,
  durationSeconds: 120,
  fretStart: 0,
  fretEnd: 4,
  stringStart: 0,
  stringEnd: 5,
  chordTonesOnly: true,
  soloEnabled: false,
  soloRhythm: "shuffle" as SoloRhythm,
  activeSoloNote: null,
  activeSoloNoteSecondary: null,

  isPlaying: false,
  isCountIn: false,
  countInBeat: 0,
  currentBar: 1,
  currentBeat: 1,
  elapsedSeconds: 0,

  setKey: (key) => set({ key }),
  setBpm: (bpm) => set({ bpm }),
  setDuration: (seconds) => set({ durationSeconds: seconds }),
  setFretRange: (start, end) => set({ fretStart: start, fretEnd: end }),
  setStringRange: (start, end) => set({ stringStart: start, stringEnd: end }),
  setChordTonesOnly: (v) => set({ chordTonesOnly: v }),
  setSoloEnabled: (v) => set({ soloEnabled: v }),
  setSoloRhythm: (r) => set({ soloRhythm: r }),
  setActiveSoloNote: (note) => set({ activeSoloNote: note }),
  setActiveSoloNoteSecondary: (note) => set({ activeSoloNoteSecondary: note }),
  setIsPlaying: (v) => set({ isPlaying: v }),
  setIsCountIn: (v) => set({ isCountIn: v }),
  setCountInBeat: (beat) => set({ countInBeat: beat }),
  setCurrentBar: (bar) => set({ currentBar: bar }),
  setCurrentBeat: (beat) => set({ currentBeat: beat }),
  setElapsedSeconds: (s) => set({ elapsedSeconds: s }),
  stop: () => set({ isPlaying: false, isCountIn: false, countInBeat: 0, currentBar: 1, currentBeat: 1, elapsedSeconds: 0, activeSoloNote: null, activeSoloNoteSecondary: null }),
}));
