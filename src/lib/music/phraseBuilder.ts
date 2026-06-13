import { getChordRoot, getDom7Notes } from "./blues";
import type { Note } from "./notes";
import { SLOTS_PER_BAR, type BluesDegree, type ChordSection, type PhraseGrid } from "@/store/phraseBuilderStore";

export function getTotalSlots(sections: ChordSection[], grid: PhraseGrid): number {
  const spb = SLOTS_PER_BAR[grid];
  return sections.reduce((sum, s) => sum + s.bars * spb, 0);
}

export function getSectionStartSlot(sections: ChordSection[], sectionIdx: number, grid: PhraseGrid): number {
  const spb = SLOTS_PER_BAR[grid];
  return sections.slice(0, sectionIdx).reduce((sum, s) => sum + s.bars * spb, 0);
}

export function getChordAtSlot(
  key: Note,
  sections: ChordSection[],
  slot: number,
  grid: PhraseGrid = "straight",
): { root: Note; degree: BluesDegree; name: string; notes: [Note, Note, Note, Note] } {
  const totalSlots = getTotalSlots(sections, grid);
  if (totalSlots === 0 || sections.length === 0) {
    return { root: key, degree: 1, name: `${key}7`, notes: getDom7Notes(key) };
  }
  const safe = ((slot % totalSlots) + totalSlots) % totalSlots;
  let rem = safe;
  for (const sec of sections) {
    const secSlots = sec.bars * SLOTS_PER_BAR[grid];
    if (rem < secSlots) {
      const root = getChordRoot(key, sec.degree);
      return { root, degree: sec.degree, name: `${root}7`, notes: getDom7Notes(root) };
    }
    rem -= secSlots;
  }
  const root = getChordRoot(key, sections[0].degree);
  return { root, degree: sections[0].degree, name: `${root}7`, notes: getDom7Notes(root) };
}
