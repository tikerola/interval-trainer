import { create } from "zustand";
import { FRET_COUNT, type Note } from "@/lib/music/notes";
import type { TranscribedSolo } from "@/lib/music/solos";
import { SHUFFLE_IN_A_SOLO_1 } from "@/lib/music/solos/shuffleInA";
import { transposeSolo } from "@/lib/music/solos/transpose";

interface BluesState {
  /** Canonical, untransposed source data — re-transposed from here on every key change. */
  baseSolo: TranscribedSolo;
  solo: TranscribedSolo;
  bpm: number;
  // All notes currently sounding (more than one when the solo plays a double-stop).
  activeSoloNotes: { stringIndex: number; fretNumber: number }[];
  // Secondary highlight: where a bend resolves to or where a slide is heading
  activeSoloNoteSecondary: { stringIndex: number; fretNumber: number; type: "bend" | "slide" } | null;

  isPlaying: boolean;
  isCountIn: boolean;
  countInBeat: number; // 1–4 during count-in, 0 otherwise
  currentBar: number;  // 1-based, within the solo's own bar count
  currentBeat: number; // 1–4

  // null = play the whole solo. Set = restrict playback to one bar, either once or looped.
  // The engine picks this up live (see useBluesEngine's playRangeRef) so switching
  // bars while already playing doesn't need to be reflected here as a separate signal.
  playRange: { bar: number; loop: boolean } | null;

  loadSolo: (solo: TranscribedSolo) => void;
  setKey: (key: Note) => void;
  setBpm: (bpm: number) => void;
  setActiveSoloNotes: (notes: { stringIndex: number; fretNumber: number }[]) => void;
  setActiveSoloNoteSecondary: (note: { stringIndex: number; fretNumber: number; type: "bend" | "slide" } | null) => void;
  setIsPlaying: (v: boolean) => void;
  setIsCountIn: (v: boolean) => void;
  setCountInBeat: (beat: number) => void;
  setCurrentBar: (bar: number) => void;
  setCurrentBeat: (beat: number) => void;
  playFull: () => void;
  playBar: (bar: number, loop: boolean) => void;
  stop: () => void;
}

export const useBluesStore = create<BluesState>((set) => ({
  baseSolo: SHUFFLE_IN_A_SOLO_1,
  solo: SHUFFLE_IN_A_SOLO_1,
  bpm: SHUFFLE_IN_A_SOLO_1.bpm,
  activeSoloNotes: [],
  activeSoloNoteSecondary: null,

  isPlaying: false,
  isCountIn: false,
  countInBeat: 0,
  currentBar: 1,
  currentBeat: 1,
  playRange: null,

  loadSolo: (solo) => set({ baseSolo: solo, solo, bpm: solo.bpm }),
  setKey: (key) => set((s) => ({ solo: transposeSolo(s.baseSolo, key, FRET_COUNT) })),
  setBpm: (bpm) => set({ bpm }),
  setActiveSoloNotes: (notes) => set({ activeSoloNotes: notes }),
  setActiveSoloNoteSecondary: (note) => set({ activeSoloNoteSecondary: note }),
  setIsPlaying: (v) => set({ isPlaying: v }),
  setIsCountIn: (v) => set({ isCountIn: v }),
  setCountInBeat: (beat) => set({ countInBeat: beat }),
  setCurrentBar: (bar) => set({ currentBar: bar }),
  setCurrentBeat: (beat) => set({ currentBeat: beat }),
  playFull: () => set({ playRange: null, isPlaying: true }),
  playBar: (bar, loop) => set({ playRange: { bar, loop }, isPlaying: true }),
  stop: () => set({ isPlaying: false, isCountIn: false, countInBeat: 0, currentBar: 1, currentBeat: 1, activeSoloNotes: [], activeSoloNoteSecondary: null, playRange: null }),
}));
