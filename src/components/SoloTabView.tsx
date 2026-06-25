"use client";

import { memo, useMemo } from "react";
import { getChordForBar } from "@/lib/music/blues";
import { toneDurationToBeats } from "@/lib/music/duration";
import type { SoloNote } from "@/lib/music/soloNote";
import type { TranscribedSolo } from "@/lib/music/solos";
import { useBluesStore } from "@/store/bluesStore";

// 24, not 12: still the same rhythmic grid (every 16th/8th-triplet/16th-triplet/quarter
// value lands on an integer column), but with enough room that two adjacent two-digit
// fret numbers (e.g. a grace-note hammer like "14"->"15" a sixteenth-triplet apart)
// don't overlap and garble into a single run of digits.
const COLS_PER_BEAT = 24;
const COLS_PER_BAR = COLS_PER_BEAT * 4;
const STRING_LABELS = ["E", "A", "D", "G", "B", "e"]; // index 0 (low E) .. 5 (high e)
const DISPLAY_ORDER = [5, 4, 3, 2, 1, 0]; // top of tab = high e
const CELL_WIDTH = "6px";

function buildStringCells(stringIndex: number, notes: SoloNote[]): string[] {
  const cells = new Array<string>(COLS_PER_BAR + 2).fill("-");
  const onString = notes
    .filter((n) => n.stringIndex === stringIndex)
    .sort((a, b) => a.beatOffset - b.beatOffset);

  for (let idx = 0; idx < onString.length; idx++) {
    const n = onString[idx];
    const col = Math.round(n.beatOffset * COLS_PER_BEAT);
    const digits = String(n.fretNumber);
    for (let d = 0; d < digits.length; d++) cells[col + d] = digits[d];

    const next = onString[idx + 1];
    if (!next) continue;
    const connectorCol = col + digits.length;
    const nextCol = Math.round(next.beatOffset * COLS_PER_BEAT);
    if (connectorCol >= nextCol) continue; // no room between them

    const thisEnd = n.beatOffset + toneDurationToBeats(n.duration);
    const isLegato = n.slideToNext || Math.abs(thisEnd - next.beatOffset) < 0.05;
    if (!isLegato) continue;

    cells[connectorCol] = n.slideToNext
      ? next.fretNumber > n.fretNumber ? "/" : "\\"
      : next.fretNumber > n.fretNumber ? "h" : "p";
  }

  return cells;
}

// Fixed pixel widths (not character-grid alignment) so every row lines up exactly,
// regardless of any per-glyph width quirks ("h"/"p" vs "-" vs digits) in the font.
function TabCell({ char }: { char: string }) {
  const isDash = char === "-";
  const isConnector = char === "h" || char === "p" || char === "/" || char === "\\";
  return (
    <span
      className={`inline-block text-center font-mono text-[11px] shrink-0 ${
        isDash ? "text-stone-700" : isConnector ? "text-amber-400 font-bold" : "text-stone-200"
      }`}
      style={{ width: CELL_WIDTH }}
    >
      {char}
    </span>
  );
}

function TabRow({ label, cells }: { label: string; cells: string[] }) {
  return (
    <div className="flex items-center">
      <span className="inline-block text-center font-mono text-[11px] text-stone-400 shrink-0" style={{ width: "14px" }}>{label}</span>
      <span className="inline-block text-center font-mono text-[11px] text-stone-600 shrink-0" style={{ width: CELL_WIDTH }}>|</span>
      {cells.map((ch, i) => <TabCell key={i} char={ch} />)}
      <span className="inline-block text-center font-mono text-[11px] text-stone-600 shrink-0" style={{ width: CELL_WIDTH }}>|</span>
    </div>
  );
}

function BarPlayControls({ bar }: { bar: number }) {
  // Selectors, not the whole store: this only needs to re-render on play/stop/bar-switch,
  // not on every beat/note tick the engine fires during playback.
  const isPlaying = useBluesStore((s) => s.isPlaying);
  const playRange = useBluesStore((s) => s.playRange);
  const playBar = useBluesStore((s) => s.playBar);
  const stop = useBluesStore((s) => s.stop);
  const isThisBarActive = isPlaying && playRange?.bar === bar;

  return (
    <div className="flex gap-1">
      <button
        title="Play this bar once"
        onClick={() => (isThisBarActive && !playRange?.loop ? stop() : playBar(bar, false))}
        className={`w-5 h-5 rounded text-[10px] flex items-center justify-center transition-colors ${
          isThisBarActive && !playRange?.loop
            ? "bg-amber-400 text-stone-900"
            : "bg-stone-800 text-stone-400 hover:bg-stone-700 hover:text-stone-200"
        }`}
      >▶</button>
      <button
        title="Loop this bar"
        onClick={() => (isThisBarActive && playRange?.loop ? stop() : playBar(bar, true))}
        className={`w-5 h-5 rounded text-[10px] flex items-center justify-center transition-colors ${
          isThisBarActive && playRange?.loop
            ? "bg-amber-400 text-stone-900"
            : "bg-stone-800 text-stone-400 hover:bg-stone-700 hover:text-stone-200"
        }`}
      >↻</button>
    </div>
  );
}

interface BarBlockProps {
  bar: number;
  notes: SoloNote[];
  chordName: string;
  section?: string;
  isCurrent: boolean;
}

// Memoized so that when the playhead moves to a new bar, only the bar block that
// actually gained or lost the highlight re-renders and rebuilds its tab cells —
// not all 24 bars, which is what made this view costly to keep open during playback.
const BarBlock = memo(function BarBlock({ bar, notes, chordName, section, isCurrent }: BarBlockProps) {
  return (
    <div className="shrink-0">
      {section && (
        <div className="text-amber-400 font-mono text-xs font-bold uppercase tracking-widest mb-1">{section}</div>
      )}
      <div className="flex items-baseline gap-2 mb-0.5">
        <span className="text-stone-500 font-mono text-[10px] w-10">bar {bar}</span>
        <span className="text-amber-300/80 font-mono text-xs font-bold w-8 inline-block">{chordName}</span>
        <BarPlayControls bar={bar} />
      </div>
      <div className={`inline-block rounded px-2 py-1.5 transition-colors ${isCurrent ? "bg-amber-400/10 ring-1 ring-amber-400/40" : "bg-stone-900/40"}`}>
        {DISPLAY_ORDER.map((stringIndex) => (
          <TabRow key={stringIndex} label={STRING_LABELS[stringIndex]} cells={buildStringCells(stringIndex, notes)} />
        ))}
      </div>
    </div>
  );
});

function SoloTabView({ solo }: { solo: TranscribedSolo }) {
  const barNumbers = useMemo(() => [...solo.bars.keys()].sort((a, b) => a - b), [solo]);
  const sectionByBar = useMemo(
    () => new Map((solo.sectionMarkers ?? []).map((s) => [s.bar, s.label])),
    [solo],
  );
  // Bar chords are static for a given solo — compute once instead of on every render.
  const chordNameByBar = useMemo(() => {
    const map = new Map<number, string>();
    for (const bar of barNumbers) map.set(bar, getChordForBar(solo.key, bar, solo.chordProgression).name);
    return map;
  }, [solo, barNumbers]);

  // Selectors: only re-render when the bar actually changes (once per bar), not on
  // every beat/note tick (setCurrentBeat/setActiveSoloNote etc fire far more often).
  const isPlaying = useBluesStore((s) => s.isPlaying);
  const currentBar = useBluesStore((s) => s.currentBar);

  return (
    <div className="flex flex-col gap-4 max-h-[480px] overflow-y-auto overflow-x-auto pr-1">
      {barNumbers.map((bar) => (
        <BarBlock
          key={bar}
          bar={bar}
          notes={solo.bars.get(bar) ?? []}
          chordName={chordNameByBar.get(bar)!}
          section={sectionByBar.get(bar)}
          isCurrent={isPlaying && currentBar === bar}
        />
      ))}
    </div>
  );
}

export default memo(SoloTabView);
