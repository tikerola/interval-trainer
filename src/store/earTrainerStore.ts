import { create } from "zustand";
import type { Note } from "@/lib/music/notes";
import { NOTES } from "@/lib/music/notes";
import { getIntervalNote } from "@/lib/music/intervals";

function randomDifferentNote(current: Note): Note {
  const others = NOTES.filter((n) => n !== current);
  return others[Math.floor(Math.random() * others.length)];
}

function randomDifferentStringIndex(current: number): number {
  const others = [0, 1, 2, 3, 4, 5].filter((i) => i !== current);
  return others[Math.floor(Math.random() * others.length)];
}

export interface EarTrainerState {
  active: boolean;
  intervalSemitones: number;
  timerSeconds: number; // 0 = timer off, advance only via spacebar
  rootNote: Note;
  stringIndex: number;
  targetNote: Note;
  roundId: number; // bumped every round; engine effect keys off this
  timeLeft: number; // seconds remaining in the current round's countdown, -1 = not counting

  setIntervalSemitones: (semitones: number) => void;
  setTimerSeconds: (seconds: number) => void;
  setTimeLeft: (seconds: number) => void;
  start: () => void;
  stop: () => void;
  nextRound: () => void;
}

export const useEarTrainerStore = create<EarTrainerState>((set, get) => ({
  active: false,
  intervalSemitones: 7,
  timerSeconds: 5,
  rootNote: "C",
  stringIndex: 0,
  targetNote: "G",
  roundId: 0,
  timeLeft: -1,

  setIntervalSemitones: (semitones) => set({ intervalSemitones: semitones }),

  setTimerSeconds: (seconds) => set({ timerSeconds: seconds }),

  setTimeLeft: (seconds) => set({ timeLeft: seconds }),

  start: () => {
    const rootNote = NOTES[Math.floor(Math.random() * NOTES.length)];
    const stringIndex = Math.floor(Math.random() * 6);
    const targetNote = getIntervalNote(rootNote, get().intervalSemitones);
    set({
      active: true,
      rootNote,
      stringIndex,
      targetNote,
      roundId: get().roundId + 1,
      timeLeft: -1,
    });
  },

  stop: () => set({ active: false, timeLeft: -1 }),

  nextRound: () => {
    const { rootNote, stringIndex, intervalSemitones } = get();
    const newRoot = randomDifferentNote(rootNote);
    const newStringIndex = randomDifferentStringIndex(stringIndex);
    const targetNote = getIntervalNote(newRoot, intervalSemitones);
    set({
      rootNote: newRoot,
      stringIndex: newStringIndex,
      targetNote,
      roundId: get().roundId + 1,
      timeLeft: -1,
    });
  },
}));
