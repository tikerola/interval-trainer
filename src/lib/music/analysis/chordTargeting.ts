import { getDom7Notes, getChordForBar } from "../blues";
import type { TranscribedSolo } from "../solos/types";

export interface ChordTargetingStat {
  bar: number;
  chordName: string;
  chordChanged: boolean;
  percentChordTones: number;
  firstNoteIsChordTone: boolean | null; // null when the bar has no notes
}

/** For each bar, how much the melody emphasizes that bar's own chord tones (root/3rd/5th/b7). */
export function analyzeChordTargeting(solo: TranscribedSolo): ChordTargetingStat[] {
  const barNumbers = [...solo.bars.keys()].sort((a, b) => a - b);
  const stats: ChordTargetingStat[] = [];
  let prevDegree: number | null = null;

  for (const bar of barNumbers) {
    const notes = solo.bars.get(bar) ?? [];
    const chord = getChordForBar(solo.key, bar, solo.chordProgression);
    const chordTones = new Set<string>(getDom7Notes(chord.root));
    const chordToneCount = notes.filter((n) => chordTones.has(n.note)).length;
    const chordChanged = prevDegree !== null && prevDegree !== chord.degree;

    stats.push({
      bar,
      chordName: chord.name,
      chordChanged,
      percentChordTones: notes.length === 0 ? 0 : Math.round((chordToneCount / notes.length) * 100),
      firstNoteIsChordTone: notes.length === 0 ? null : chordTones.has(notes[0].note),
    });
    prevDegree = chord.degree;
  }

  return stats;
}
