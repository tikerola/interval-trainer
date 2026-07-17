import { create } from "zustand";
import type { Note } from "@/lib/music/notes";
import { NOTES } from "@/lib/music/notes";
import { getIntervalNote, INTERVALS } from "@/lib/music/intervals";

function randomDifferentNote(current: Note): Note {
  const others = NOTES.filter((n) => n !== current);
  return others[Math.floor(Math.random() * others.length)];
}

function randomDifferentStringIndex(current: number): number {
  const others = [0, 1, 2, 3, 4, 5].filter((i) => i !== current);
  return others[Math.floor(Math.random() * others.length)];
}

function randomIntervalSemitones(): number {
  return INTERVALS[Math.floor(Math.random() * INTERVALS.length)].semitones;
}

export interface EarTrainerState {
  active: boolean;
  intervalSemitones: number;
  randomizeInterval: boolean;
  timerSeconds: number; // 0 = timer off, advance only via spacebar
  rootNote: Note;
  stringIndex: number;
  targetNote: Note;
  roundId: number; // bumped every round; engine effect keys off this
  timeLeft: number; // seconds remaining in the current round's countdown, -1 = not counting

  setIntervalSemitones: (semitones: number) => void;
  setRandomizeInterval: (v: boolean) => void;
  setTimerSeconds: (seconds: number) => void;
  setTimeLeft: (seconds: number) => void;
  start: () => void;
  stop: () => void;
  nextRound: () => void;
}

export const useEarTrainerStore = create<EarTrainerState>((set, get) => ({
  active: false,
  intervalSemitones: 7,
  randomizeInterval: false,
  timerSeconds: 5,
  rootNote: "C",
  stringIndex: 0,
  targetNote: "G",
  roundId: 0,
  timeLeft: -1,

  setIntervalSemitones: (semitones) => set({ intervalSemitones: semitones }),

  setRandomizeInterval: (v) => set({ randomizeInterval: v }),

  setTimerSeconds: (seconds) => set({ timerSeconds: seconds }),

  setTimeLeft: (seconds) => set({ timeLeft: seconds }),

  start: () => {
    const rootNote = NOTES[Math.floor(Math.random() * NOTES.length)];
    const stringIndex = Math.floor(Math.random() * 6);
    const semitones = get().randomizeInterval ? randomIntervalSemitones() : get().intervalSemitones;
    const targetNote = getIntervalNote(rootNote, semitones);
    set({
      active: true,
      rootNote,
      stringIndex,
      intervalSemitones: semitones,
      targetNote,
      roundId: get().roundId + 1,
      timeLeft: -1,
    });
  },

  stop: () => set({ active: false, timeLeft: -1 }),

  nextRound: () => {
    const { rootNote, stringIndex, intervalSemitones, randomizeInterval } = get();
    const newRoot = randomDifferentNote(rootNote);
    const newStringIndex = randomDifferentStringIndex(stringIndex);
    const newSemitones = randomizeInterval ? randomIntervalSemitones() : intervalSemitones;
    const targetNote = getIntervalNote(newRoot, newSemitones);
    set({
      rootNote: newRoot,
      stringIndex: newStringIndex,
      intervalSemitones: newSemitones,
      targetNote,
      roundId: get().roundId + 1,
      timeLeft: -1,
    });
  },
}));
