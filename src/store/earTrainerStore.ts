import { create } from "zustand";
import type { Note } from "@/lib/music/notes";
import { NOTES, findLowestFret } from "@/lib/music/notes";
import { getIntervalNote, INTERVALS } from "@/lib/music/intervals";

export type EarTrainerMode = "single" | "progression" | "scale";
export type RunDirection = "up" | "down";

// Major scale degrees (1-7) as semitone offsets from the key — the pool the
// blind 4-note run in Ear Training mode is drawn from.
const MAJOR_SCALE_OFFSETS = [0, 2, 4, 5, 7, 9, 11];

// Dominant-7 chord tones available as the resolution target in Chord Resolution mode.
export const CHORD_TONES = [
  { label: "Root", degree: "1", semitones: 0, spoken: "the root" },
  { label: "Major 3rd", degree: "3", semitones: 4, spoken: "major third" },
  { label: "Perfect 5th", degree: "5", semitones: 7, spoken: "perfect fifth" },
  { label: "Minor 7th", degree: "b7", semitones: 10, spoken: "minor seventh" },
] as const;

// Major pentatonic scale degrees (1, 2, 3, 5, 6) as semitone offsets from the
// chord root — the starting note of the 3-note run in Chord Resolution mode.
export const PENTATONIC_DEGREES = [
  { label: "Root", degree: "1", semitones: 0, spoken: "the root" },
  { label: "2nd", degree: "2", semitones: 2, spoken: "second" },
  { label: "3rd", degree: "3", semitones: 4, spoken: "third" },
  { label: "5th", degree: "5", semitones: 7, spoken: "fifth" },
  { label: "6th", degree: "6", semitones: 9, spoken: "sixth" },
] as const;

const PENTATONIC_OFFSETS: number[] = PENTATONIC_DEGREES.map((d) => d.semitones);

// The only chord moves that occur between adjacent bars of a 12-bar blues:
// I->IV, I->V, IV->I, V->IV. Expressed as semitone offsets from a random key.
// The (from, to) pair — not just their semitone difference — determines the
// label: I->V and IV->I both move the root by +7 semitones mod 12, so the
// label has to come from which pair was actually picked, not be derived
// after the fact from the two chord roots.
const CHORD_MOVES: { label: string; offsets: [number, number] }[] = [
  { label: "I → IV", offsets: [0, 5] },
  { label: "I → V", offsets: [0, 7] },
  { label: "IV → I", offsets: [5, 0] },
  { label: "V → IV", offsets: [7, 5] },
];

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

function randomChordToneSemitones(): number {
  return CHORD_TONES[Math.floor(Math.random() * CHORD_TONES.length)].semitones;
}

function randomStartDegreeSemitones(): number {
  return PENTATONIC_DEGREES[Math.floor(Math.random() * PENTATONIC_DEGREES.length)].semitones;
}

function randomRunDirection(): RunDirection {
  return Math.random() < 0.5 ? "up" : "down";
}

function randomChordMove(): { label: string; offsets: [number, number] } {
  return CHORD_MOVES[Math.floor(Math.random() * CHORD_MOVES.length)];
}

// Degree index (into `offsets`) and absolute semitone offset (can span
// octaves) of the scale degree `steps` positions away from `startIndex`.
function scaleDegreeStep(
  offsets: number[],
  startIndex: number,
  steps: number
): { degreeIndex: number; offset: number } {
  const len = offsets.length;
  const rawIndex = startIndex + steps;
  const octaveShift = Math.floor(rawIndex / len);
  const degreeIndex = ((rawIndex % len) + len) % len;
  return { degreeIndex, offset: offsets[degreeIndex] + octaveShift * 12 };
}

// Fret positions (on a single string) for a scale run of `noteCount` notes
// starting at `startIndex` in `offsets`, anchored so every note stays at
// fret >= 0 regardless of direction, plus the degree index of each note.
function computeScaleRun(
  stringIndex: number,
  root: Note,
  offsets: number[],
  startIndex: number,
  direction: RunDirection,
  noteCount: number
): { runFrets: number[]; runDegreeIndices: number[] } {
  const steps = Array.from({ length: noteCount }, (_, i) => (direction === "up" ? i : -i));
  const runSteps = steps.map((s) => scaleDegreeStep(offsets, startIndex, s));
  const startNote = getIntervalNote(root, runSteps[0].offset);
  // Descending runs can dip well below the start note; anchoring an octave
  // higher keeps every fret in the run non-negative.
  const anchorFret = findLowestFret(stringIndex, startNote) + (direction === "down" ? 12 : 0);
  return {
    runFrets: runSteps.map((s) => anchorFret + (s.offset - runSteps[0].offset)),
    runDegreeIndices: runSteps.map((s) => s.degreeIndex),
  };
}

// Fret positions (on a single string) for the 3-note pentatonic run, anchored
// so every note in the run stays at fret >= 0 regardless of direction, plus
// the degree index (into PENTATONIC_DEGREES) of each note for display.
function computeRun(
  stringIndex: number,
  chordARoot: Note,
  startDegreeSemitones: number,
  direction: RunDirection
): { runFrets: number[]; runDegreeIndices: number[] } {
  const startIndex = PENTATONIC_OFFSETS.indexOf(startDegreeSemitones);
  return computeScaleRun(stringIndex, chordARoot, PENTATONIC_OFFSETS, startIndex, direction, 3);
}

// The fret for `note` on `stringIndex` nearest to `referenceFret` — a pitch
// class repeats every 12 frets, so the resolution note should land on
// whichever octave keeps the voice leading smooth instead of always the
// lowest occurrence (which can jump an octave away from the run's last note).
function closestFret(stringIndex: number, note: Note, referenceFret: number): number {
  const base = findLowestFret(stringIndex, note);
  let best = base;
  let bestDist = Math.abs(base - referenceFret);
  for (let k = -3; k <= 3; k++) {
    const candidate = base + k * 12;
    if (candidate < 0) continue;
    const dist = Math.abs(candidate - referenceFret);
    if (dist < bestDist) {
      best = candidate;
      bestDist = dist;
    }
  }
  return best;
}

interface ProgressionRound {
  chordARoot: Note;
  chordBRoot: Note;
  chordMoveLabel: string;
  semitonesA: number;
  semitonesB: number;
  targetNote: Note;
  resolutionNote: Note;
  runDirection: RunDirection;
  runFrets: number[];
  runDegreeIndices: number[];
  resolutionFret: number;
}

function generateProgressionRound(
  stringIndex: number,
  startDegreeSemitones: number,
  randomizeStartDegree: boolean,
  chordToneSemitones: number,
  randomizeChordTone: boolean
): ProgressionRound {
  const key = NOTES[Math.floor(Math.random() * NOTES.length)];
  const { label: chordMoveLabel, offsets: [fromOffset, toOffset] } = randomChordMove();
  const chordARoot = getIntervalNote(key, fromOffset);
  const chordBRoot = getIntervalNote(key, toOffset);
  const semitonesA = randomizeStartDegree ? randomStartDegreeSemitones() : startDegreeSemitones;
  const semitonesB = randomizeChordTone ? randomChordToneSemitones() : chordToneSemitones;
  const runDirection = randomRunDirection();
  const { runFrets, runDegreeIndices } = computeRun(stringIndex, chordARoot, semitonesA, runDirection);
  const resolutionNote = getIntervalNote(chordBRoot, semitonesB);
  const resolutionFret = closestFret(stringIndex, resolutionNote, runFrets[runFrets.length - 1]);
  return {
    chordARoot,
    chordBRoot,
    chordMoveLabel,
    semitonesA,
    semitonesB,
    targetNote: getIntervalNote(chordARoot, semitonesA),
    resolutionNote,
    runDirection,
    runFrets,
    runDegreeIndices,
    resolutionFret,
  };
}

interface ScaleRound {
  key: Note;
  runFrets: number[];
  keyFret: number;
}

// Scale-degree "positions" relative to the key, spanning exactly one octave
// below (-7) through one octave above (6) — i.e. every major-scale degree in
// both the octave below the root and the octave above it, never further.
const SCALE_POS_MIN = -7;
const SCALE_POS_MAX = 6;
// Small step sizes only (1-2 scale degrees) so consecutive notes stay close
// together instead of leaping around the octave.
const WALK_STEPS = [-2, -1, 1, 2];

// A blind 4-note major-scale sequence for Ear Training mode (played after the
// root note): random key, a bounded random walk across scale degrees (small
// steps, never straying past an octave above/below the root) — no note names
// are surfaced anywhere until the player reveals them. keyFret is the root
// note played first, as a tonal reference the sequence can be judged against.
function generateScaleRound(stringIndex: number): ScaleRound {
  const key = NOTES[Math.floor(Math.random() * NOTES.length)];
  // Anchoring the root an octave above its lowest occurrence guarantees both
  // "an octave below" (keyFret - 12) and "an octave above" (keyFret + 11)
  // stay on the fretboard, so every note can freely go either direction.
  const keyFret = findLowestFret(stringIndex, key) + 12;

  let pos = Math.floor(Math.random() * (SCALE_POS_MAX - SCALE_POS_MIN + 1)) + SCALE_POS_MIN;
  const runFrets = Array.from({ length: 4 }, (_, i) => {
    if (i > 0) {
      const step = WALK_STEPS[Math.floor(Math.random() * WALK_STEPS.length)];
      const next = pos + step;
      // Bounce off the octave boundary rather than clamping, so the step
      // size (and therefore the "closeness" of consecutive notes) stays
      // consistent even right at the edge of the range.
      pos = next < SCALE_POS_MIN || next > SCALE_POS_MAX ? pos - step : next;
    }
    // Hard floor at fret 0 — belt-and-suspenders on top of the bounds above,
    // since nothing should ever be able to fret below the open string.
    return Math.max(0, keyFret + scaleDegreeStep(MAJOR_SCALE_OFFSETS, 0, pos).offset);
  });

  return { key, runFrets, keyFret: Math.max(0, keyFret) };
}

export interface EarTrainerState {
  active: boolean;
  mode: EarTrainerMode;
  intervalSemitones: number;
  randomizeInterval: boolean;
  startDegreeSemitones: number;
  randomizeStartDegree: boolean;
  chordToneSemitones: number;
  randomizeChordTone: boolean;
  timerSeconds: number; // 0 = timer off, advance only via spacebar
  rootNote: Note; // chord A root (or the only chord's root, in Single Note mode)
  targetChordRoot: Note; // chord B root — only meaningful in Chord Resolution mode
  chordMoveLabel: string; // e.g. "I → IV" — only meaningful in Chord Resolution mode
  stringIndex: number;
  targetNote: Note; // departure note (Single Note mode) / run start note (Chord Resolution mode)
  resolutionNote: Note; // resolution note — only meaningful in Chord Resolution mode
  runDirection: RunDirection; // only meaningful in Chord Resolution mode
  runFrets: number[]; // 3 fret positions on stringIndex for the pentatonic run
  runDegreeIndices: number[]; // 3 indices into PENTATONIC_DEGREES, for display
  resolutionFret: number; // fret for resolutionNote closest to the run's last note
  keyFret: number; // fret for the key/root reference tone — only meaningful in Ear Training mode
  roundId: number; // bumped every round; engine effect keys off this
  timeLeft: number; // seconds remaining in the current round's countdown, -1 = not counting

  setMode: (mode: EarTrainerMode) => void;
  setIntervalSemitones: (semitones: number) => void;
  setRandomizeInterval: (v: boolean) => void;
  setStartDegreeSemitones: (semitones: number) => void;
  setRandomizeStartDegree: (v: boolean) => void;
  setChordToneSemitones: (semitones: number) => void;
  setRandomizeChordTone: (v: boolean) => void;
  setTimerSeconds: (seconds: number) => void;
  setTimeLeft: (seconds: number) => void;
  start: () => void;
  stop: () => void;
  nextRound: () => void;
}

export const useEarTrainerStore = create<EarTrainerState>((set, get) => ({
  active: false,
  mode: "single",
  intervalSemitones: 7,
  randomizeInterval: false,
  startDegreeSemitones: 0,
  randomizeStartDegree: false,
  chordToneSemitones: 0,
  randomizeChordTone: false,
  timerSeconds: 5,
  rootNote: "C",
  targetChordRoot: "F",
  chordMoveLabel: "I → IV",
  stringIndex: 0,
  targetNote: "G",
  resolutionNote: "F",
  runDirection: "up",
  runFrets: [],
  runDegreeIndices: [],
  resolutionFret: 0,
  keyFret: 0,
  roundId: 0,
  timeLeft: -1,

  setMode: (mode) => set({ mode }),

  setIntervalSemitones: (semitones) => set({ intervalSemitones: semitones }),

  setRandomizeInterval: (v) => set({ randomizeInterval: v }),

  setStartDegreeSemitones: (semitones) => set({ startDegreeSemitones: semitones }),

  setRandomizeStartDegree: (v) => set({ randomizeStartDegree: v }),

  setChordToneSemitones: (semitones) => set({ chordToneSemitones: semitones }),

  setRandomizeChordTone: (v) => set({ randomizeChordTone: v }),

  setTimerSeconds: (seconds) => set({ timerSeconds: seconds }),

  setTimeLeft: (seconds) => set({ timeLeft: seconds }),

  start: () => {
    const {
      mode,
      intervalSemitones,
      randomizeInterval,
      startDegreeSemitones,
      randomizeStartDegree,
      chordToneSemitones,
      randomizeChordTone,
    } = get();
    const stringIndex = Math.floor(Math.random() * 6);

    if (mode === "progression") {
      const round = generateProgressionRound(
        stringIndex,
        startDegreeSemitones,
        randomizeStartDegree,
        chordToneSemitones,
        randomizeChordTone
      );
      set({
        active: true,
        stringIndex,
        rootNote: round.chordARoot,
        targetChordRoot: round.chordBRoot,
        chordMoveLabel: round.chordMoveLabel,
        startDegreeSemitones: round.semitonesA,
        chordToneSemitones: round.semitonesB,
        targetNote: round.targetNote,
        resolutionNote: round.resolutionNote,
        runDirection: round.runDirection,
        runFrets: round.runFrets,
        runDegreeIndices: round.runDegreeIndices,
        resolutionFret: round.resolutionFret,
        roundId: get().roundId + 1,
        timeLeft: -1,
      });
      return;
    }

    if (mode === "scale") {
      const round = generateScaleRound(stringIndex);
      set({
        active: true,
        stringIndex,
        rootNote: round.key,
        runFrets: round.runFrets,
        keyFret: round.keyFret,
        roundId: get().roundId + 1,
        timeLeft: -1,
      });
      return;
    }

    const rootNote = NOTES[Math.floor(Math.random() * NOTES.length)];
    const semitones = randomizeInterval ? randomIntervalSemitones() : intervalSemitones;
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
    const {
      mode,
      rootNote,
      stringIndex,
      intervalSemitones,
      randomizeInterval,
      startDegreeSemitones,
      randomizeStartDegree,
      chordToneSemitones,
      randomizeChordTone,
    } = get();
    const newStringIndex = randomDifferentStringIndex(stringIndex);

    if (mode === "progression") {
      const round = generateProgressionRound(
        newStringIndex,
        startDegreeSemitones,
        randomizeStartDegree,
        chordToneSemitones,
        randomizeChordTone
      );
      set({
        stringIndex: newStringIndex,
        rootNote: round.chordARoot,
        targetChordRoot: round.chordBRoot,
        chordMoveLabel: round.chordMoveLabel,
        startDegreeSemitones: round.semitonesA,
        chordToneSemitones: round.semitonesB,
        targetNote: round.targetNote,
        resolutionNote: round.resolutionNote,
        runDirection: round.runDirection,
        runFrets: round.runFrets,
        runDegreeIndices: round.runDegreeIndices,
        resolutionFret: round.resolutionFret,
        roundId: get().roundId + 1,
        timeLeft: -1,
      });
      return;
    }

    if (mode === "scale") {
      const round = generateScaleRound(newStringIndex);
      set({
        stringIndex: newStringIndex,
        rootNote: round.key,
        runFrets: round.runFrets,
        keyFret: round.keyFret,
        roundId: get().roundId + 1,
        timeLeft: -1,
      });
      return;
    }

    const newRoot = randomDifferentNote(rootNote);
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
