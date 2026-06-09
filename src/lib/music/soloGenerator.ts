import { NOTES, getNoteAtPosition, type Note } from "./notes";
import { getScaleNotes, SCALES } from "./scales";

export type SoloRhythm = "shuffle" | "straight" | "slow" | "fast";
export type PhraseRole = "call" | "response";

export interface SoloNote {
  stringIndex: number;
  fretNumber: number;
  note: Note;
  octave: number;
  duration: string;
  beatOffset: number; // beats from bar start (0–3.99)
}

// MIDI pitch for ordering. Standard tuning open strings: E2 A2 D3 G3 B3 E4
const OPEN_MIDI = [40, 45, 50, 55, 59, 64];
function midiOf(s: number, f: number) { return OPEN_MIDI[s] + f; }

// These are always the full pentatonic scales — independent of the chordTonesOnly display flag.
const MAJ_PENT = SCALES.find(s => s.name === "Maj Pent")!;
const MIN_PENT = SCALES.find(s => s.name === "Min Pent")!;

function shiftNote(root: Note, semis: number): Note {
  return NOTES[((NOTES.indexOf(root) + semis) % 12 + 12) % 12];
}

type Pos = { s: number; f: number; pitch: number };

function findPositions(
  note: Note,
  fretStart: number, fretEnd: number,
  strStart: number, strEnd: number,
): Pos[] {
  const out: Pos[] = [];
  for (let s = strStart; s <= strEnd; s++) {
    for (let f = fretStart; f <= fretEnd; f++) {
      if (getNoteAtPosition(s, f).note === note) {
        out.push({ s, f, pitch: midiOf(s, f) });
      }
    }
  }
  return out;
}

// One position per pitch (prefer strings 2–4 = D/G/B for lead character).
function buildPool(scaleNotes: Note[], fretStart: number, fretEnd: number, strStart: number, strEnd: number): Pos[] {
  const all = scaleNotes.flatMap(n => findPositions(n, fretStart, fretEnd, strStart, strEnd));
  const byPitch = new Map<number, Pos>();
  for (const p of all) {
    const existing = byPitch.get(p.pitch);
    if (!existing) {
      byPitch.set(p.pitch, p);
    } else {
      // Prefer strings closer to mid-neck (index 2–3 = D/G)
      if (Math.abs(p.s - 2.5) < Math.abs(existing.s - 2.5)) {
        byPitch.set(p.pitch, p);
      }
    }
  }
  return [...byPitch.values()].sort((a, b) => a.pitch - b.pitch);
}

// Greedy: nearest available pitch in the requested direction. Prefers small intervals.
function nearestStep(current: number, pool: Pos[], used: Set<number>, dir: "up" | "down"): Pos | null {
  const candidates = pool.filter(p =>
    !used.has(p.pitch) && (dir === "up" ? p.pitch > current : p.pitch < current)
  );
  if (candidates.length === 0) return null;
  // sort by distance → smallest interval wins
  return candidates.sort((a, b) => Math.abs(a.pitch - current) - Math.abs(b.pitch - current))[0];
}

// Beat grid: [beatOffset, Tone.js duration string]
type Grid = [number, string][];

const GRIDS: Record<SoloRhythm, Grid> = {
  shuffle:  [[0,"8t"],[0.333,"8t"],[1,"8t"],[1.333,"8t"],[2,"8t"],[2.333,"8t"],[3,"8t"],[3.333,"8t"]],
  straight: [[0,"8n"],[0.5,"8n"],[1,"8n"],[1.5,"8n"],[2,"8n"],[2.5,"8n"],[3,"8n"],[3.5,"8n"]],
  slow:     [[0,"4n"],[1,"4n"],[2,"2n"]],
  fast:     [[0,"16n"],[0.25,"16n"],[0.5,"16n"],[0.75,"16n"],[1,"16n"],[1.25,"16n"],[1.5,"16n"],[2,"16n"],[2.5,"16n"],[3,"16n"],[3.25,"16n"],[3.5,"16n"]],
};

export const SOLO_RHYTHM_LABELS: Record<SoloRhythm, string> = {
  shuffle:  "Shuffle",
  straight: "Straight",
  slow:     "Slow",
  fast:     "Fast",
};

export function generateBarPhrase(
  chordRoot: Note,
  fretStart: number, fretEnd: number,
  strStart: number, strEnd: number,
  rhythm: SoloRhythm,
  role: PhraseRole,
): SoloNote[] {
  const majPool = buildPool(getScaleNotes(chordRoot, MAJ_PENT), fretStart, fretEnd, strStart, strEnd);
  const minPool = buildPool(getScaleNotes(chordRoot, MIN_PENT), fretStart, fretEnd, strStart, strEnd);

  if (majPool.length === 0) return [];

  const grid   = GRIDS[rhythm];
  const total  = grid.length;
  const ascN   = Math.round(total * 0.38);
  const descN  = Math.round(total * 0.38);
  const resN   = total - ascN - descN;

  const used = new Set<number>();
  const seq: Pos[] = [];

  // ── Phase 1: ascend with major pentatonic ──────────────────────────────
  // Start in the lower half of the available pitch range for room to climb.
  const midPitch = (majPool[0].pitch + majPool[majPool.length - 1].pitch) / 2;
  const startPool = majPool.filter(p => p.pitch <= midPitch);
  const seed = startPool[Math.floor(Math.random() * startPool.length)] ?? majPool[0];

  seq.push(seed);
  used.add(seed.pitch);

  for (let i = 1; i < ascN; i++) {
    const next = nearestStep(seq[seq.length - 1].pitch, majPool, used, "up");
    if (!next) break;
    seq.push(next);
    used.add(next.pitch);
  }

  // ── Phase 2: descend with minor pentatonic ─────────────────────────────
  // Hand-off: find the minor pent note nearest to the ascent peak (up or down).
  const peak = seq[seq.length - 1].pitch;
  const descSeed = [...minPool]
    .filter(p => !used.has(p.pitch))
    .sort((a, b) => Math.abs(a.pitch - peak) - Math.abs(b.pitch - peak))[0];

  if (descSeed) {
    seq.push(descSeed);
    used.add(descSeed.pitch);

    for (let i = 1; i < descN; i++) {
      const next = nearestStep(seq[seq.length - 1].pitch, minPool, used, "down");
      if (!next) break;
      seq.push(next);
      used.add(next.pitch);
    }
  }

  // ── Phase 3: resolution ───────────────────────────────────────────────
  const landing = seq[seq.length - 1]?.pitch ?? midPitch;

  if (role === "response") {
    // b3 → major 3rd (classic blues curl): pick both positions closest to landing.
    const b3all = findPositions(shiftNote(chordRoot, 3), fretStart, fretEnd, strStart, strEnd)
      .sort((a, b) => Math.abs(a.pitch - landing) - Math.abs(b.pitch - landing));
    const m3all = findPositions(shiftNote(chordRoot, 4), fretStart, fretEnd, strStart, strEnd);

    if (b3all.length > 0 && resN >= 1) {
      seq.push(b3all[0]);
      if (m3all.length > 0 && resN >= 2) {
        // Pick the m3 closest to the b3 we just chose (ideally same string, one fret up)
        const b3pitch = b3all[0].pitch;
        const best = m3all.sort((a, b) => Math.abs(a.pitch - b3pitch) - Math.abs(b.pitch - b3pitch))[0];
        seq.push(best);
      }
    } else {
      const rootAll = findPositions(chordRoot, fretStart, fretEnd, strStart, strEnd)
        .sort((a, b) => Math.abs(a.pitch - landing) - Math.abs(b.pitch - landing));
      if (rootAll.length > 0) seq.push(rootAll[0]);
    }
  } else {
    // Call: leave phrase open on nearest 5th or b7
    const target = Math.random() < 0.5 ? shiftNote(chordRoot, 7) : shiftNote(chordRoot, 10);
    const tAll = findPositions(target, fretStart, fretEnd, strStart, strEnd)
      .sort((a, b) => Math.abs(a.pitch - landing) - Math.abs(b.pitch - landing));
    if (tAll.length > 0) seq.push(tAll[0]);
  }

  return seq.slice(0, total).map((pos, i) => {
    const [beatOffset, duration] = grid[i];
    const { note, octave } = getNoteAtPosition(pos.s, pos.f);
    return { stringIndex: pos.s, fretNumber: pos.f, note, octave, duration, beatOffset };
  });
}
