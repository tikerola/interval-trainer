import { create } from "zustand";
import type { Note } from "@/lib/music/notes";
import { DEFAULT_SCALE, isHeptatonic, type ScaleDefinition } from "@/lib/music/scales";

interface TriadState {
  selectedKey: Note;
  selectedScale: ScaleDefinition;
  selectedDegree: number | null;
  labelMode: "note" | "degree";
  showScale: boolean;
  setKey: (key: Note) => void;
  setScale: (scale: ScaleDefinition) => void;
  setDegree: (degree: number | null) => void;
  setLabelMode: (mode: "note" | "degree") => void;
  setShowScale: (show: boolean) => void;
}

export const useTriadStore = create<TriadState>((set) => ({
  selectedKey: "C",
  selectedScale: DEFAULT_SCALE,
  selectedDegree: 1,
  labelMode: "note",
  showScale: true,
  setKey: (key) => set({ selectedKey: key, selectedDegree: 1 }),
  setScale: (scale) =>
    set({
      selectedScale: scale,
      selectedDegree: isHeptatonic(scale) ? 1 : null,
      showScale: true, // always reveal the full scale so differences are immediately visible
    }),
  setDegree: (degree) =>
    set((s) => ({ selectedDegree: s.selectedDegree === degree ? null : degree })),
  setLabelMode: (mode) => set({ labelMode: mode }),
  setShowScale: (show) => set({ showScale: show }),
}));
