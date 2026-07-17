import { create } from "zustand";
import type { Note } from "@/lib/music/notes";
import { NOTES } from "@/lib/music/notes";
import { getIntervalNote, INTERVALS } from "@/lib/music/intervals";
import {
  isCorrectExerciseAnswer,
  generateFretWindow,
  type FretWindow,
} from "@/lib/music/exercise";

export type { FretWindow };

export interface ExerciseState {
  rootNote: Note;
  intervalSemitones: number;
  randomizeInterval: boolean;
  targetNote: Note;
  active: boolean;
  stopped: boolean;
  fretWindow: FretWindow | null;
  windowWidth: number;
  duration: number; // seconds
  roundTransitioning: boolean;
  lastCorrectAnswer: { stringIndex: number; fret: number } | null;
  points: number;
  correctCount: number;
  mistakes: number;
  startedAt: number;
  stoppedAt: number;

  setRootNote: (note: Note) => void;
  setInterval: (semitones: number) => void;
  setRandomizeInterval: (v: boolean) => void;
  setWindowWidth: (w: number) => void;
  setDuration: (s: number) => void;
  startExercise: () => void;
  submitAnswer: (stringIndex: number, fret: number) => "correct" | "wrong" | "disabled";
  stop: () => void;
  reset: () => void;
}

function randomDifferentNote(current: Note): Note {
  const others = NOTES.filter((n) => n !== current);
  return others[Math.floor(Math.random() * others.length)];
}

function randomIntervalSemitones(): number {
  return INTERVALS[Math.floor(Math.random() * INTERVALS.length)].semitones;
}

export const useExerciseStore = create<ExerciseState>((set, get) => ({
  rootNote: "C",
  intervalSemitones: 7,
  randomizeInterval: false,
  targetNote: "G",
  active: false,
  stopped: false,
  fretWindow: null,
  windowWidth: 4,
  duration: 120,
  roundTransitioning: false,
  lastCorrectAnswer: null,
  points: 0,
  correctCount: 0,
  mistakes: 0,
  startedAt: 0,
  stoppedAt: 0,

  setRootNote: (note) =>
    set({ rootNote: note, targetNote: getIntervalNote(note, get().intervalSemitones) }),

  setInterval: (semitones) =>
    set({ intervalSemitones: semitones, targetNote: getIntervalNote(get().rootNote, semitones) }),

  setRandomizeInterval: (v) => set({ randomizeInterval: v }),

  setWindowWidth: (w) => set({ windowWidth: w }),

  setDuration: (s) => set({ duration: s }),

  startExercise: () => {
    const { rootNote, intervalSemitones, randomizeInterval, windowWidth } = get();
    const semitones = randomizeInterval ? randomIntervalSemitones() : intervalSemitones;
    const targetNote = getIntervalNote(rootNote, semitones);
    const fretWindow = generateFretWindow(targetNote, windowWidth);
    set({
      active: true,
      stopped: false,
      intervalSemitones: semitones,
      targetNote,
      fretWindow,
      roundTransitioning: false,
      lastCorrectAnswer: null,
      points: 0,
      correctCount: 0,
      mistakes: 0,
      startedAt: Date.now(),
      stoppedAt: 0,
    });
  },

  submitAnswer: (stringIndex, fret) => {
    const { active, roundTransitioning, fretWindow, targetNote, points, correctCount, mistakes } =
      get();
    if (!active || roundTransitioning) return "disabled";
    if (!fretWindow || fret < fretWindow.start || fret > fretWindow.end) return "disabled";

    const correct = isCorrectExerciseAnswer(targetNote, stringIndex, fret);

    if (correct) {
      set({
        points: points + 1,
        correctCount: correctCount + 1,
        roundTransitioning: true,
        lastCorrectAnswer: { stringIndex, fret },
      });
      setTimeout(() => {
        if (!get().active) return;
        const newRoot = randomDifferentNote(get().rootNote);
        const newSemitones = get().randomizeInterval
          ? randomIntervalSemitones()
          : get().intervalSemitones;
        const newTarget = getIntervalNote(newRoot, newSemitones);
        const newWindow = generateFretWindow(newTarget, get().windowWidth);
        set({
          rootNote: newRoot,
          intervalSemitones: newSemitones,
          targetNote: newTarget,
          fretWindow: newWindow,
          roundTransitioning: false,
          lastCorrectAnswer: null,
        });
      }, 700);
      return "correct";
    } else {
      set({ mistakes: mistakes + 1, points: points - 1 });
      return "wrong";
    }
  },

  stop: () =>
    set({
      active: false,
      stopped: true,
      stoppedAt: Date.now(),
      roundTransitioning: false,
    }),

  reset: () =>
    set({
      active: false,
      stopped: false,
      fretWindow: null,
      roundTransitioning: false,
      lastCorrectAnswer: null,
      points: 0,
      correctCount: 0,
      mistakes: 0,
      startedAt: 0,
      stoppedAt: 0,
    }),
}));
