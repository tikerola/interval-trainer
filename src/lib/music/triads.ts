import { NOTES, type Note } from "./notes";
import type { ScaleDefinition } from "./scales";

export type ChordQuality = "major" | "minor" | "diminished" | "augmented";

export interface DiatonicTriad {
  degree: number;
  label: string;
  quality: ChordQuality;
  notes: [Note, Note, Note];
}

function offsetNote(rootIdx: number, semitones: number): Note {
  return NOTES[((rootIdx + semitones) % 12 + 12) % 12];
}

function triadQuality(third: number, fifth: number): ChordQuality {
  if (third === 3 && fifth === 6) return "diminished";
  if (third === 3 && fifth === 7) return "minor";
  if (third === 4 && fifth === 8) return "augmented";
  return "major";
}

function degreeLabel(position: number, quality: ChordQuality): string {
  const numerals = ["I", "II", "III", "IV", "V", "VI", "VII"];
  const n = numerals[position];
  const upper = quality === "major" || quality === "augmented";
  return (upper ? n : n.toLowerCase()) +
    (quality === "diminished" ? "°" : quality === "augmented" ? "+" : "");
}

// Returns the 7 diatonic triads for any heptatonic scale, or [] for others.
export function getDiatonicTriads(keyRoot: Note, scale: ScaleDefinition): DiatonicTriad[] {
  if (scale.semitones.length !== 7) return [];
  const rootIdx = NOTES.indexOf(keyRoot);
  const s = scale.semitones as readonly number[];

  return Array.from({ length: 7 }, (_, i) => {
    const root = s[i];
    const thirdRaw = s[(i + 2) % 7];
    const fifthRaw = s[(i + 4) % 7];
    const thirdOffset = ((thirdRaw - root) % 12 + 12) % 12;
    const fifthOffset = ((fifthRaw - root) % 12 + 12) % 12;
    const quality = triadQuality(thirdOffset, fifthOffset);

    return {
      degree: i + 1,
      label: degreeLabel(i, quality),
      quality,
      notes: [
        offsetNote(rootIdx, root),
        offsetNote(rootIdx, root + thirdOffset),
        offsetNote(rootIdx, root + fifthOffset),
      ],
    };
  });
}
