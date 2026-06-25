import { create } from "zustand";
import type { Note } from "@/lib/music/notes";

export type BluesDegree = 1 | 4 | 5;
export type AppMode = "jam" | "record" | "solo";
export type PhraseGrid = "straight" | "triplet";
export type RecordPhase = "idle" | "tapping" | "pitching";

export interface PendingSlot {
  id: string;
  slot: number;
  durationSlots: number;
  duration: NoteDuration;
  bend?: number; // semitones: 1 = half step, 2 = full step
}

export function snapToNearestDuration(rawSlots: number, grid: PhraseGrid): { duration: NoteDuration; slots: number } {
  const options = AVAILABLE_DURATIONS[grid].map((d) => ({
    duration: d,
    slots: DURATION_SLOTS[grid][d] ?? 1,
  }));
  return options.reduce((best, cur) =>
    Math.abs(cur.slots - rawSlots) < Math.abs(best.slots - rawSlots) ? cur : best,
  );
}
export type NoteDuration = "2n" | "4n" | "8n" | "16n" | "8t" | "16t";

// Slots per bar for each grid mode
export const SLOTS_PER_BAR: Record<PhraseGrid, number> = {
  straight: 16,  // 4 slots/beat × 4 beats
  triplet:  24,  // 6 slots/beat × 4 beats (16t resolution)
};

export const SLOTS_PER_BEAT: Record<PhraseGrid, number> = {
  straight: 4,
  triplet:  6,
};

// How many grid slots each duration occupies (grid-dependent)
export const DURATION_SLOTS: Record<PhraseGrid, Partial<Record<NoteDuration, number>>> = {
  straight: { "16n": 1, "8n": 2, "4n": 4, "2n": 8 },
  triplet:  { "16t": 1, "8t": 2, "4n": 6, "2n": 12 },
};

export const AVAILABLE_DURATIONS: Record<PhraseGrid, NoteDuration[]> = {
  straight: ["16n", "8n", "4n", "2n"],
  triplet:  ["16t", "8t", "4n", "2n"],
};

export const DURATION_LABELS: Record<NoteDuration, string> = {
  "2n":  "1/2",
  "4n":  "1/4",
  "8n":  "1/8",
  "16n": "1/16",
  "8t":  "8T",
  "16t": "16T",
};

export interface ChordSection {
  id: string;
  degree: BluesDegree;
  bars: number; // 1–4
}

export interface PhraseNote {
  id: string;
  slot: number;          // grid slot from phrase start (0-based)
  fretNumber: number;
  stringIndex: number;
  note: string;
  octave: number;
  duration: NoteDuration;
  durationSlots: number;
  bend?: number; // semitones: 1 = half step, 2 = full step
}

function uid(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return Math.random().toString(36).slice(2);
}

interface PhraseBuilderState {
  key: Note;
  bpm: number;
  mode: AppMode;
  phraseGrid: PhraseGrid;
  sections: ChordSection[];
  notes: PhraseNote[];
  selectedDuration: NoteDuration;
  cursorSlot: number;
  fretStart: number;
  fretEnd: number;
  isPlaying: boolean;
  playheadSlot: number;
  activePhraseNote: { stringIndex: number; fretNumber: number } | null;

  recordPhase: RecordPhase;
  pendingSlots: PendingSlot[];
  tapPreRollBar: number;

  setKey: (key: Note) => void;
  setBpm: (bpm: number) => void;
  setMode: (m: AppMode) => void;
  setGrid: (grid: PhraseGrid) => void;
  setRecordPhase: (phase: RecordPhase) => void;
  setTapPreRollBar: (n: number) => void;
  addPendingSlot: (slot: number, durationSlots: number, duration: NoteDuration, bend?: number) => void;
  removePendingSlot: (id: string) => void;
  clearPendingSlots: () => void;
  promotePendingSlot: (id: string, fretNumber: number, stringIndex: number, note: string, octave: number) => void;
  addSection: () => void;
  removeSection: (id: string) => void;
  updateSection: (id: string, patch: Partial<Pick<ChordSection, "degree" | "bars">>) => void;
  setSections: (defs: { degree: BluesDegree; bars: number }[]) => void;
  setSelectedDuration: (d: NoteDuration) => void;
  setCursorSlot: (slot: number) => void;
  setFretRange: (start: number, end: number) => void;
  placeNote: (fretNumber: number, stringIndex: number, note: string, octave: number) => void;
  removeNote: (id: string) => void;
  updateNote: (id: string, duration: NoteDuration) => void;
  updateNotes: (ids: string[], duration: NoteDuration) => void;
  clearNotes: () => void;
  setIsPlaying: (v: boolean) => void;
  setPlayheadSlot: (slot: number) => void;
  setActivePhraseNote: (n: { stringIndex: number; fretNumber: number } | null) => void;
  stop: () => void;
}

export const usePhraseBuilderStore = create<PhraseBuilderState>((set) => ({
  key: "A" as Note,
  bpm: 80,
  mode: "record" as AppMode,
  recordPhase: "idle" as RecordPhase,
  pendingSlots: [] as PendingSlot[],
  tapPreRollBar: 0,
  phraseGrid: "triplet" as PhraseGrid,
  sections: [
    { id: uid(), degree: 1 as BluesDegree, bars: 2 },
    { id: uid(), degree: 4 as BluesDegree, bars: 1 },
  ],
  notes: [],
  selectedDuration: "8t" as NoteDuration,
  cursorSlot: 0,
  fretStart: 0,
  fretEnd: 12,
  isPlaying: false,
  playheadSlot: 0,
  activePhraseNote: null,

  setKey: (key) => set({ key }),
  setBpm: (bpm) => set({ bpm }),
  setMode: (mode) => set({ mode }),
  setRecordPhase: (recordPhase) => set({ recordPhase }),
  setTapPreRollBar: (tapPreRollBar) => set({ tapPreRollBar }),

  addPendingSlot: (slot, durationSlots, duration, bend) => set((s) => {
    const spb = SLOTS_PER_BAR[s.phraseGrid];
    const totalSlots = s.sections.reduce((sum, sec) => sum + sec.bars * spb, 0);
    if (totalSlots === 0) return s;
    const normalizedSlot = ((slot % totalSlots) + totalSlots) % totalSlots;
    const cappedSlots = Math.min(durationSlots, totalSlots - normalizedSlot);
    const filtered = s.pendingSlots.filter(
      (p) => !(p.slot < normalizedSlot + cappedSlots && p.slot + p.durationSlots > normalizedSlot),
    );
    return {
      pendingSlots: [
        ...filtered,
        { id: uid(), slot: normalizedSlot, durationSlots: cappedSlots, duration, bend },
      ].sort((a, b) => a.slot - b.slot),
    };
  }),

  removePendingSlot: (id) => set((s) => ({ pendingSlots: s.pendingSlots.filter((p) => p.id !== id) })),
  clearPendingSlots: () => set({ pendingSlots: [] }),

  promotePendingSlot: (id, fretNumber, stringIndex, note, octave) => set((s) => {
    const pending = s.pendingSlots.find((p) => p.id === id);
    if (!pending) return s;
    const spb = SLOTS_PER_BAR[s.phraseGrid];
    const totalSlots = s.sections.reduce((sum, sec) => sum + sec.bars * spb, 0);
    const newEnd = pending.slot + pending.durationSlots;
    const existingFiltered = s.notes.filter(
      (n) => !(n.slot < newEnd && n.slot + n.durationSlots > pending.slot),
    );
    const newNote: PhraseNote = {
      id: uid(),
      slot: pending.slot,
      fretNumber, stringIndex, note, octave,
      duration: pending.duration,
      durationSlots: pending.durationSlots,
      bend: pending.bend,
    };
    void totalSlots;
    return {
      pendingSlots: s.pendingSlots.filter((p) => p.id !== id),
      notes: [...existingFiltered, newNote].sort((a, b) => a.slot - b.slot),
    };
  }),

  setGrid: (phraseGrid) => set((s) => {
    if (s.phraseGrid === phraseGrid) return s;

    const DURATION_CONVERT: Record<PhraseGrid, Partial<Record<NoteDuration, NoteDuration>>> = {
      triplet:  { "16n": "16t", "8n": "8t", "4n": "4n", "2n": "2n" },
      straight: { "16t": "16n", "8t": "8n", "4n": "4n", "2n": "2n" },
    };
    const ratio = SLOTS_PER_BAR[phraseGrid] / SLOTS_PER_BAR[s.phraseGrid];
    const convertMap = DURATION_CONVERT[phraseGrid];

    const spb = SLOTS_PER_BAR[phraseGrid];
    const totalSlots = s.sections.reduce((sum, sec) => sum + sec.bars * spb, 0);

    const notes = s.notes
      .map((n) => {
        const newSlot = Math.round(n.slot * ratio);
        const newDuration = (convertMap[n.duration] ?? n.duration) as NoteDuration;
        const newDurationSlots = DURATION_SLOTS[phraseGrid][newDuration] ?? 1;
        return { ...n, slot: newSlot, duration: newDuration, durationSlots: newDurationSlots };
      })
      .filter((n) => n.slot >= 0 && n.slot + n.durationSlots <= totalSlots);

    const available = AVAILABLE_DURATIONS[phraseGrid];
    const selectedDuration: NoteDuration = available.includes(s.selectedDuration)
      ? s.selectedDuration
      : phraseGrid === "straight" ? "8n" : "8t";

    return {
      phraseGrid,
      notes,
      cursorSlot: Math.min(Math.round(s.cursorSlot * ratio), Math.max(0, totalSlots - 1)),
      selectedDuration,
    };
  }),

  addSection: () => set((s) => {
    if (s.sections.length >= 8) return s;
    return { sections: [...s.sections, { id: uid(), degree: 1 as BluesDegree, bars: 1 }] };
  }),

  setSections: (defs) => set((s) => {
    const sections = defs.map((d) => ({ id: uid(), degree: d.degree, bars: d.bars }));
    const spb = SLOTS_PER_BAR[s.phraseGrid];
    const totalSlots = sections.reduce((sum, sec) => sum + sec.bars * spb, 0);
    return { sections, notes: [], cursorSlot: 0, playheadSlot: 0,
             activePhraseNote: null, isPlaying: false };
  }),

  removeSection: (id) => set((s) => {
    if (s.sections.length <= 1) return s;
    const sections = s.sections.filter((sec) => sec.id !== id);
    const spb = SLOTS_PER_BAR[s.phraseGrid];
    const totalSlots = sections.reduce((sum, sec) => sum + sec.bars * spb, 0);
    const notes = s.notes.filter((n) => n.slot + n.durationSlots <= totalSlots);
    return { sections, notes, cursorSlot: Math.min(s.cursorSlot, Math.max(0, totalSlots - 1)) };
  }),

  updateSection: (id, patch) => set((s) => {
    const sections = s.sections.map((sec) => (sec.id === id ? { ...sec, ...patch } : sec));
    const spb = SLOTS_PER_BAR[s.phraseGrid];
    const totalSlots = sections.reduce((sum, sec) => sum + sec.bars * spb, 0);
    const notes = s.notes.filter((n) => n.slot + n.durationSlots <= totalSlots);
    return { sections, notes, cursorSlot: Math.min(s.cursorSlot, Math.max(0, totalSlots - 1)) };
  }),

  setSelectedDuration: (d) => set({ selectedDuration: d }),
  setCursorSlot: (slot) => set({ cursorSlot: slot }),
  setFretRange: (fretStart, fretEnd) => set({ fretStart, fretEnd }),

  placeNote: (fretNumber, stringIndex, note, octave) => set((s) => {
    const { cursorSlot, selectedDuration, notes, sections, phraseGrid } = s;
    const spb = SLOTS_PER_BAR[phraseGrid];
    const durationSlots = DURATION_SLOTS[phraseGrid][selectedDuration] ?? 1;
    const totalSlots = sections.reduce((acc, sec) => acc + sec.bars * spb, 0);

    if (cursorSlot >= totalSlots) return s;
    if (cursorSlot + durationSlots > totalSlots) return s;

    const newEnd = cursorSlot + durationSlots;
    const filtered = notes.filter((n) => !(n.slot < newEnd && n.slot + n.durationSlots > cursorSlot));

    const newNote: PhraseNote = {
      id: uid(),
      slot: cursorSlot,
      fretNumber,
      stringIndex,
      note,
      octave,
      duration: selectedDuration,
      durationSlots,
    };

    const nextSlot = Math.min(cursorSlot + durationSlots, totalSlots - 1);
    return {
      notes: [...filtered, newNote].sort((a, b) => a.slot - b.slot),
      cursorSlot: nextSlot,
    };
  }),

  removeNote: (id) => set((s) => ({ notes: s.notes.filter((n) => n.id !== id) })),

  updateNote: (id, duration) => set((s) => {
    const target = s.notes.find((n) => n.id === id);
    if (!target) return s;

    const newDurationSlots = DURATION_SLOTS[s.phraseGrid][duration] ?? 1;
    const delta = newDurationSlots - target.durationSlots;
    const spb = SLOTS_PER_BAR[s.phraseGrid];
    const totalSlots = s.sections.reduce((sum, sec) => sum + sec.bars * spb, 0);

    const notes = s.notes
      .map((n) => {
        if (n.id === id) return { ...n, duration, durationSlots: newDurationSlots };
        // shift notes that start at or after the old end of the edited note
        if (n.slot >= target.slot + target.durationSlots) return { ...n, slot: n.slot + delta };
        return n;
      })
      .filter((n) => n.slot >= 0 && n.slot + n.durationSlots <= totalSlots)
      .sort((a, b) => a.slot - b.slot);

    return { notes };
  }),

  updateNotes: (ids, duration) => set((s) => {
    const idSet = new Set(ids);
    const newDurationSlots = DURATION_SLOTS[s.phraseGrid][duration] ?? 1;
    const spb = SLOTS_PER_BAR[s.phraseGrid];
    const totalSlots = s.sections.reduce((sum, sec) => sum + sec.bars * spb, 0);

    // Process notes in slot order, accumulating shift as each selected note is resized
    let shift = 0;
    const notes = [...s.notes]
      .sort((a, b) => a.slot - b.slot)
      .map((n) => {
        const newSlot = n.slot + shift;
        if (idSet.has(n.id)) {
          shift += newDurationSlots - n.durationSlots;
          return { ...n, slot: newSlot, duration, durationSlots: newDurationSlots };
        }
        return { ...n, slot: newSlot };
      })
      .filter((n) => n.slot >= 0 && n.slot + n.durationSlots <= totalSlots);

    return { notes };
  }),

  clearNotes: () => set({ notes: [], cursorSlot: 0 }),
  setIsPlaying: (v) => set({ isPlaying: v }),
  setPlayheadSlot: (slot) => set({ playheadSlot: slot }),
  setActivePhraseNote: (n) => set({ activePhraseNote: n }),
  stop: () => set({ isPlaying: false, playheadSlot: 0, activePhraseNote: null, tapPreRollBar: 0 }),
}));
