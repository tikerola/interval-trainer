"use client";

import { useRef, useEffect } from "react";
import { getBluesNoteRole, type BluesRole } from "@/lib/music/blues";
import { getChordAtSlot, getSectionStartSlot, getTotalSlots } from "@/lib/music/phraseBuilder";
import type { Note } from "@/lib/music/notes";
import type { ChordSection, PendingSlot, PhraseNote, PhraseGrid } from "@/store/phraseBuilderStore";

const ROLE_COLOR: Record<BluesRole, string> = {
  root:    "#d97706",
  third:   "#0284c7",
  fifth:   "#059669",
  seventh: "#ea580c",
  blue3:   "#a21caf",
  blue5:   "#a21caf",
  majpent: "#78716c",
  minpent: "#64748b",
};

function noteBlockColor(phraseNote: PhraseNote, keyNote: Note, sections: ChordSection[], grid: PhraseGrid): string {
  const chord = getChordAtSlot(keyNote, sections, phraseNote.slot, grid);
  const role = getBluesNoteRole(phraseNote.note as Note, chord.notes, keyNote);
  return role ? ROLE_COLOR[role] : "#57534e";
}

const MIN_SLOT_PX = 22;

export default function PhraseTimeline({
  keyNote,
  sections,
  notes,
  pendingSlots = [],
  activePendingId = null,
  phraseGrid,
  slotsPerBar,
  slotsPerBeat,
  cursorSlot,
  playheadSlot,
  isPlaying,
  selectedNoteIds,
  onSlotClick,
  onNoteSelect,
  onNoteRemove,
}: {
  keyNote: Note;
  sections: ChordSection[];
  notes: PhraseNote[];
  pendingSlots?: PendingSlot[];
  activePendingId?: string | null;
  phraseGrid: PhraseGrid;
  slotsPerBar: number;
  slotsPerBeat: number;
  cursorSlot: number;
  playheadSlot: number;
  isPlaying: boolean;
  selectedNoteIds: string[];
  onSlotClick: (slot: number) => void;
  onNoteSelect: (ids: string[]) => void;
  onNoteRemove: (id: string) => void;
}) {
  const totalSlots = getTotalSlots(sections, phraseGrid);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!scrollRef.current || totalSlots === 0) return;
    const el = scrollRef.current;
    const targetSlot = isPlaying ? playheadSlot : cursorSlot;
    const slotPx = el.scrollWidth / totalSlots;
    const x = targetSlot * slotPx;
    const margin = el.clientWidth * 0.25;
    if (x < el.scrollLeft + margin || x > el.scrollLeft + el.clientWidth - margin) {
      el.scrollLeft = Math.max(0, x - el.clientWidth * 0.3);
    }
  }, [playheadSlot, cursorSlot, isPlaying, totalSlots]);

  if (totalSlots === 0) return null;

  const minWidth = totalSlots * MIN_SLOT_PX;

  return (
    <div className="w-full space-y-0.5">
      <div ref={scrollRef} className="overflow-x-auto rounded-sm">
        <div style={{ minWidth: `${minWidth}px` }}>

          {/* Section headers */}
          <div className="flex border-b border-stone-700/40 mb-px">
            {sections.map((sec, sIdx) => {
              const secSlots = sec.bars * slotsPerBar;
              const chord = getChordAtSlot(keyNote, sections, getSectionStartSlot(sections, sIdx, phraseGrid), phraseGrid);
              const pct = (secSlots / totalSlots) * 100;
              return (
                <div
                  key={sec.id}
                  className="flex items-center gap-1.5 px-1.5 py-0.5 border-l-2 border-stone-700/50 first:border-l-0"
                  style={{ width: `${pct}%` }}
                >
                  <span className="text-[11px] font-bold font-mono text-amber-300/80">{chord.name}</span>
                  <span className="text-[9px] font-mono text-stone-500 uppercase">{sec.bars}b</span>
                </div>
              );
            })}
          </div>

          {/* Grid + note blocks */}
          <div className="relative" style={{ height: "52px" }}>

            {/* Slot cells */}
            <div className="absolute inset-0 flex">
              {Array.from({ length: totalSlots }, (_, i) => {
                const isBarStart   = i % slotsPerBar === 0 && i > 0;
                const isBeatStart  = i % slotsPerBeat === 0;
                const isCursor     = !isPlaying && cursorSlot === i;
                const occupied     = notes.some((n) => i >= n.slot && i < n.slot + n.durationSlots);
                const clickable    = !isPlaying && !occupied;

                return (
                  <div
                    key={i}
                    className={[
                      "flex-1 h-full transition-colors",
                      isBarStart  ? "border-l-2 border-l-stone-600/70" : "",
                      isBeatStart ? "border-r border-r-stone-700/50 bg-stone-800/35" : "border-r border-r-stone-800/50 bg-stone-900/20",
                      isCursor    ? "!bg-amber-400/10" : "",
                      clickable   ? "cursor-pointer hover:bg-white/[0.05]" : "",
                    ].join(" ")}
                    onClick={clickable ? () => { onSlotClick(i); onNoteSelect([]); } : undefined}
                  />
                );
              })}
            </div>

            {/* Note blocks */}
            {notes.map((n) => {
              const color = noteBlockColor(n, keyNote, sections, phraseGrid);
              const isSelected = selectedNoteIds.includes(n.id);
              return (
                <div
                  key={n.id}
                  className="absolute top-1.5 bottom-1.5 rounded flex items-center justify-center text-[10px] font-bold font-mono cursor-pointer select-none transition-all duration-100"
                  style={{
                    left:  `${(n.slot / totalSlots) * 100}%`,
                    width: `${(n.durationSlots / totalSlots) * 100}%`,
                    background: isSelected ? color + "50" : color + "28",
                    border: isSelected ? `1.5px solid ${color}` : `1.5px solid ${color}88`,
                    boxShadow: isSelected ? `0 0 6px ${color}66` : undefined,
                    color,
                  }}
                  title={`${n.note}${n.octave} — str ${n.stringIndex + 1}, fret ${n.fretNumber}`}
                  onClick={(e) => {
                    if (isPlaying) return;
                    e.stopPropagation();
                    onNoteSelect(
                      isSelected
                        ? selectedNoteIds.filter((id) => id !== n.id)
                        : [...selectedNoteIds, n.id],
                    );
                  }}
                >
                  <span className="truncate px-0.5 leading-none">
                    {n.note}{n.bend ? `↑${n.bend === 1 ? "½" : "1"}` : ""}
                  </span>
                  {isSelected && !isPlaying && (
                    <button
                      className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 rounded-full bg-stone-900 border border-stone-600 flex items-center justify-center hover:bg-red-900/60 hover:border-red-500 transition-colors z-10"
                      onClick={(e) => { e.stopPropagation(); onNoteRemove(n.id); }}
                    >
                      <span className="text-[8px] text-stone-300 leading-none">×</span>
                    </button>
                  )}
                </div>
              );
            })}

            {/* Pending slots (tap rhythm placeholders) */}
            {pendingSlots.map((p) => {
              const isActive = p.id === activePendingId;
              return (
                <div
                  key={p.id}
                  className="absolute top-1.5 bottom-1.5 rounded flex items-center justify-center text-[10px] font-bold font-mono pointer-events-none"
                  style={{
                    left:  `${(p.slot / totalSlots) * 100}%`,
                    width: `${(p.durationSlots / totalSlots) * 100}%`,
                    background: isActive ? "rgba(251,191,36,0.12)" : "rgba(120,113,108,0.15)",
                    border: isActive ? "1.5px solid rgba(251,191,36,0.7)" : "1.5px dashed rgba(120,113,108,0.5)",
                    color: isActive ? "#fbbf24" : "#78716c",
                  }}
                >
                  {p.bend ? `↑${p.bend === 1 ? "½" : "1"}` : "?"}
                </div>
              );
            })}

            {/* Cursor line */}
            {!isPlaying && cursorSlot < totalSlots && (
              <div
                className="absolute top-0 bottom-0 w-px pointer-events-none"
                style={{ left: `${(cursorSlot / totalSlots) * 100}%`, background: "rgba(251,191,36,0.55)" }}
              />
            )}

            {/* Playhead */}
            {isPlaying && (
              <div
                className="absolute top-0 bottom-0 w-px pointer-events-none"
                style={{
                  left: `${(playheadSlot / totalSlots) * 100}%`,
                  background: "#fbbf24",
                  boxShadow: "0 0 4px rgba(251,191,36,0.6)",
                }}
              />
            )}
          </div>

          {/* Beat numbers */}
          <div className="flex mt-px">
            {Array.from({ length: totalSlots }, (_, i) => {
              if (i % slotsPerBeat !== 0) return <div key={i} className="flex-1" />;
              const beatInBar = Math.floor((i % slotsPerBar) / slotsPerBeat) + 1;
              const isBar = i % slotsPerBar === 0;
              return (
                <div
                  key={i}
                  className="flex-1 text-center font-mono"
                  style={{ fontSize: "8px", color: isBar ? "#a8a29e" : "#57534e" }}
                >
                  {beatInBar}
                </div>
              );
            })}
          </div>

        </div>
      </div>
    </div>
  );
}
