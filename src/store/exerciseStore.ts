import { create } from "zustand";
import type { Note } from "@/lib/music/notes";
import { NOTES } from "@/lib/music/notes";
import { getIntervalNote } from "@/lib/music/intervals";
import { isCorrectExerciseAnswer } from "@/lib/music/exercise";

export interface CorrectAnswer {
  stringIndex: number;
  fret: number;
}

export interface ExerciseState {
  rootNote: Note;
  intervalSemitones: number;
  targetNote: Note;
  active: boolean;
  stopped: boolean;
  correctAnswers: CorrectAnswer[];
  mistakes: number;
  points: number;
  startedAt: number;
  stoppedAt: number;

  setRootNote: (note: Note) => void;
  setInterval: (semitones: number) => void;
  startExercise: () => void;
  submitAnswer: (stringIndex: number, fret: number) => "correct" | "wrong" | "already_answered";
  stop: () => void;
  reset: () => void;
}

function randomDifferentNote(current: Note): Note {
  const others = NOTES.filter((n) => n !== current);
  return others[Math.floor(Math.random() * others.length)];
}

export const useExerciseStore = create<ExerciseState>((set, get) => ({
  rootNote: "C",
  intervalSemitones: 7,
  targetNote: "G",
  active: false,
  stopped: false,
  correctAnswers: [],
  mistakes: 0,
  points: 0,
  startedAt: 0,
  stoppedAt: 0,

  setRootNote: (note) =>
    set({ rootNote: note, targetNote: getIntervalNote(note, get().intervalSemitones) }),

  setInterval: (semitones) =>
    set({ intervalSemitones: semitones, targetNote: getIntervalNote(get().rootNote, semitones) }),

  startExercise: () =>
    set({
      active: true,
      stopped: false,
      correctAnswers: [],
      mistakes: 0,
      points: 0,
      startedAt: Date.now(),
      stoppedAt: 0,
    }),

  submitAnswer: (stringIndex, fret) => {
    const { targetNote, correctAnswers, mistakes, points, active } = get();
    if (!active) return "wrong";

    const alreadyAnswered = correctAnswers.some((a) => a.stringIndex === stringIndex);
    if (alreadyAnswered) return "already_answered";

    const correct = isCorrectExerciseAnswer(targetNote, stringIndex, fret);

    if (correct) {
      const newAnswers = [...correctAnswers, { stringIndex, fret }];
      const newPoints = points + 1;

      if (newAnswers.length === 6) {
        set({ correctAnswers: newAnswers, points: newPoints });
        // Auto-advance after brief pause to let green dots register
        setTimeout(() => {
          if (!get().active) return;
          const newRoot = randomDifferentNote(get().rootNote);
          const newTarget = getIntervalNote(newRoot, get().intervalSemitones);
          set({ rootNote: newRoot, targetNote: newTarget, correctAnswers: [] });
        }, 700);
      } else {
        set({ correctAnswers: newAnswers, points: newPoints });
      }
      return "correct";
    } else {
      set({ mistakes: mistakes + 1 });
      return "wrong";
    }
  },

  stop: () =>
    set({
      active: false,
      stopped: true,
      stoppedAt: Date.now(),
    }),

  reset: () =>
    set({
      active: false,
      stopped: false,
      correctAnswers: [],
      mistakes: 0,
      points: 0,
      startedAt: 0,
      stoppedAt: 0,
    }),
}));
