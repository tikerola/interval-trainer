"use client";

import { useRef, useCallback } from "react";
import { OPEN_STRINGS, NOTES, getNoteAtPosition, type Note } from "@/lib/music/notes";
import { getBluesNoteRole, type BluesRole } from "@/lib/music/blues";

const FRET_COUNT = 15;
const FRET_MARKERS = [3, 5, 7, 9, 12, 15];
const DOUBLE_MARKERS = [12];
const DISPLAY_ORDER = [...Array(OPEN_STRINGS.length)].map((_, i) => OPEN_STRINGS.length - 1 - i);
const STRING_HEIGHTS = [3.5, 3, 2.5, 2, 1.5, 1];
const STRING_LABELS = ["E", "A", "D", "G", "B", "e"];
const WOUND = new Set([0, 1, 2, 3]);
const MIN_SPAN = 2;

const ROLE_STYLES: Record<BluesRole, { bg: string; ring?: string; text: string; size: string }> = {
  root:    { bg: "#c87d10",                                        text: "#1c0901", size: "w-6 h-6" },
  third:   { bg: "#1e6fa8",                                        text: "#e8f4ff", size: "w-5 h-5" },
  fifth:   { bg: "#197a52",                                        text: "#e8fff5", size: "w-5 h-5" },
  seventh: { bg: "#b84718",                                        text: "#fff4ee", size: "w-5 h-5" },
  blue3:   { bg: "rgba(176,110,214,0.15)", ring: "1.5px solid #b06ed6", text: "#c490e0", size: "w-5 h-5" },
  blue5:   { bg: "rgba(176,110,214,0.15)", ring: "1.5px solid #b06ed6", text: "#c490e0", size: "w-5 h-5" },
  majpent: { bg: "rgba(139,105,20,0.15)",  ring: "1px solid #8b6914",   text: "#b89030", size: "w-5 h-5" },
  minpent: { bg: "rgba(82,84,168,0.15)",   ring: "1px solid #5254a8",   text: "#8486cc", size: "w-5 h-5" },
};

const ROLE_LABEL: Record<BluesRole, string> = {
  root: "R", third: "3", fifth: "5", seventh: "b7",
  blue3: "b3", blue5: "b5",
  majpent: "·", minpent: "·",
};

const SEMITONE_DEGREE: Record<number, string> = {
  0: "1", 1: "b2", 2: "2", 3: "b3", 4: "3", 5: "4",
  6: "b5", 7: "5", 8: "b6", 9: "6", 10: "b7", 11: "7",
};

function getKeyDegree(note: Note, key: Note): string {
  const semis = ((NOTES.indexOf(note) - NOTES.indexOf(key)) % 12 + 12) % 12;
  return SEMITONE_DEGREE[semis] ?? "·";
}

function getStringStyle(stringIndex: number, height: number): React.CSSProperties {
  if (WOUND.has(stringIndex)) {
    return {
      height: `${height}px`,
      background: `repeating-linear-gradient(90deg,transparent 0px,transparent 2px,rgba(0,0,0,0.10) 2px,rgba(0,0,0,0.10) 3px),linear-gradient(180deg,#f0e8cc 0%,#c8a870 12%,#8c5e2a 38%,#6a4018 52%,#8c5e2a 65%,#c8a870 88%,#f0e8cc 100%)`,
      boxShadow: `0 ${Math.ceil(height / 2)}px ${height * 2}px rgba(0,0,0,0.65),0 0 ${height}px rgba(200,170,100,0.18)`,
    };
  }
  return {
    height: `${height}px`,
    background: `linear-gradient(180deg,#f8f8f8 0%,#d4d4d4 12%,#909090 38%,#707070 52%,#909090 65%,#d4d4d4 88%,#f8f8f8 100%)`,
    boxShadow: `0 ${Math.ceil(height / 2)}px ${height * 2}px rgba(0,0,0,0.55),0 0 ${height}px rgba(210,210,210,0.15)`,
  };
}

function NoteDot({ role, label }: { role: BluesRole; label?: string }) {
  const s = ROLE_STYLES[role];
  return (
    <div
      className={`${s.size} rounded-full flex items-center justify-center`}
      style={{ background: s.bg, border: s.ring }}
    >
      <span className="text-[9px] font-bold select-none" style={{ color: s.text }}>
        {label ?? ROLE_LABEL[role]}
      </span>
    </div>
  );
}

function InlayDot() {
  return (
    <div
      className="w-2.5 h-2.5 rounded-full"
      style={{
        background: "radial-gradient(circle at 35% 32%, #f5f0e8 0%, #d8cdb8 45%, #b0a490 75%, #887c70 100%)",
        boxShadow: "inset 0 1px 2px rgba(255,255,255,0.5), inset 0 -1px 1px rgba(0,0,0,0.3), 0 1px 3px rgba(0,0,0,0.6)",
      }}
    />
  );
}

const CHORD_TONE_ROLES = new Set(["root", "third", "fifth", "seventh"]);

function ActiveNotePing() {
  return (
    <div className="relative w-6 h-6 flex items-center justify-center">
      <div className="absolute w-6 h-6 rounded-full bg-white/30 animate-ping" />
      <div className="w-5 h-5 rounded-full bg-white border-2 border-amber-300 shadow-[0_0_8px_rgba(255,255,255,0.9)]" />
    </div>
  );
}

function FretCell({
  stringIndex,
  fretNumber,
  chordNotes,
  keyNote,
  inRange,
  chordTonesOnly,
  activeSoloNote,
}: {
  stringIndex: number;
  fretNumber: number;
  chordNotes: [Note, Note, Note, Note] | null;
  keyNote: Note;
  inRange: boolean;
  chordTonesOnly: boolean;
  activeSoloNote: { stringIndex: number; fretNumber: number } | null;
}) {
  const { note } = getNoteAtPosition(stringIndex, fretNumber);
  const rawRole = inRange && chordNotes ? getBluesNoteRole(note, chordNotes, keyNote) : null;
  const role = rawRole && chordTonesOnly && !CHORD_TONE_ROLES.has(rawRole) ? null : rawRole;
  const pentLabel = (role === "majpent" || role === "minpent") ? getKeyDegree(note, keyNote) : undefined;
  const isActive = activeSoloNote?.stringIndex === stringIndex && activeSoloNote?.fretNumber === fretNumber;

  return (
    <div className="flex-1 flex items-center justify-center relative" style={{ minHeight: "30px" }}>
      {isActive && (
        <div className="absolute z-40">
          <ActiveNotePing />
        </div>
      )}
      {role && !isActive && (
        <div className="absolute z-30">
          <NoteDot role={role} label={pentLabel} />
        </div>
      )}
    </div>
  );
}

function StringRow({
  stringIndex,
  isFirst,
  isLast,
  chordNotes,
  keyNote,
  fretStart,
  fretEnd,
  inStringRange,
  chordTonesOnly,
  activeSoloNote,
}: {
  stringIndex: number;
  isFirst: boolean;
  isLast: boolean;
  chordNotes: [Note, Note, Note, Note] | null;
  keyNote: Note;
  fretStart: number;
  fretEnd: number;
  inStringRange: boolean;
  chordTonesOnly: boolean;
  activeSoloNote: { stringIndex: number; fretNumber: number } | null;
}) {
  const h = STRING_HEIGHTS[stringIndex];
  const openNote = getNoteAtPosition(stringIndex, 0).note;
  const openInRange = inStringRange && fretStart === 0 && chordNotes !== null;
  const rawOpenRole = openInRange ? getBluesNoteRole(openNote, chordNotes!, keyNote) : null;
  const openRole = rawOpenRole && chordTonesOnly && !CHORD_TONE_ROLES.has(rawOpenRole) ? null : rawOpenRole;

  return (
    <div
      className="relative flex items-center"
      style={{ paddingTop: isFirst ? "8px" : "2px", paddingBottom: isLast ? "8px" : "2px" }}
    >
      <div className="w-10 shrink-0 flex items-center justify-center z-40">
        {activeSoloNote?.stringIndex === stringIndex && activeSoloNote?.fretNumber === 0 ? (
          <ActiveNotePing />
        ) : openRole ? (
          <NoteDot
            role={openRole}
            label={(openRole === "majpent" || openRole === "minpent") ? getKeyDegree(openNote, keyNote) : undefined}
          />
        ) : (
          <span className="text-xs text-amber-200/60 font-mono">{STRING_LABELS[stringIndex]}</span>
        )}
      </div>

      <div
        className="absolute left-10 right-0 pointer-events-none z-10"
        style={{
          top: isFirst ? "calc(50% + 3px)" : isLast ? "calc(50% - 3px)" : "50%",
          transform: "translateY(-50%)",
          ...getStringStyle(stringIndex, h),
        }}
      />

      <div className="flex flex-1">
        {Array.from({ length: FRET_COUNT }, (_, i) => {
          const fret = i + 1;
          const inRange = inStringRange && fret >= fretStart && fret <= fretEnd;
          return (
            <FretCell
              key={i}
              stringIndex={stringIndex}
              fretNumber={fret}
              chordNotes={chordNotes}
              keyNote={keyNote}
              inRange={inRange}
              chordTonesOnly={chordTonesOnly}
              activeSoloNote={activeSoloNote}
            />
          );
        })}
      </div>
    </div>
  );
}

export default function BluesFretboard({
  keyNote,
  chordNotes,
  fretStart,
  fretEnd,
  stringStart,
  stringEnd,
  chordTonesOnly,
  activeSoloNote,
  onFretRangeChange,
}: {
  keyNote: Note;
  chordNotes: [Note, Note, Note, Note] | null;
  fretStart: number;
  fretEnd: number;
  stringStart: number;
  stringEnd: number;
  chordTonesOnly: boolean;
  activeSoloNote: { stringIndex: number; fretNumber: number } | null;
  onFretRangeChange?: (start: number, end: number) => void;
}) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{
    type: "move" | "left" | "right";
    startX: number;
    startFretStart: number;
    startFretEnd: number;
  } | null>(null);

  const startDrag = useCallback(
    (e: React.PointerEvent, type: "move" | "left" | "right") => {
      e.preventDefault();
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      dragRef.current = { type, startX: e.clientX, startFretStart: fretStart, startFretEnd: fretEnd };
    },
    [fretStart, fretEnd]
  );

  const onDragMove = useCallback(
    (e: React.PointerEvent) => {
      const drag = dragRef.current;
      if (!drag || !onFretRangeChange || !wrapperRef.current) return;
      const fretWidth = (wrapperRef.current.getBoundingClientRect().width - 40) / FRET_COUNT;
      const delta = Math.round((e.clientX - drag.startX) / fretWidth);
      if (drag.type === "move") {
        const span = drag.startFretEnd - drag.startFretStart;
        const newStart = Math.max(0, Math.min(FRET_COUNT - span, drag.startFretStart + delta));
        onFretRangeChange(newStart, newStart + span);
      } else if (drag.type === "left") {
        const newStart = Math.max(0, Math.min(drag.startFretEnd - MIN_SPAN, drag.startFretStart + delta));
        onFretRangeChange(newStart, drag.startFretEnd);
      } else {
        const newEnd = Math.min(FRET_COUNT, Math.max(drag.startFretStart + MIN_SPAN, drag.startFretEnd + delta));
        onFretRangeChange(drag.startFretStart, newEnd);
      }
    },
    [onFretRangeChange]
  );

  const onDragEnd = useCallback(() => { dragRef.current = null; }, []);

  return (
    <div className="w-full max-w-5xl">
      <div className="flex mb-1 pl-10">
        {Array.from({ length: FRET_COUNT }, (_, i) => (
          <div key={i} className="flex-1 text-center text-[10px] text-stone-500 font-mono">
            {i + 1}
          </div>
        ))}
      </div>

      {/* Wrapper so curtains sit outside the clipPath */}
      <div ref={wrapperRef} className="relative">

      <div
        className="relative rounded-r-lg overflow-hidden border border-stone-800/80"
        style={{
          clipPath: "polygon(0% 3%, 100% 0%, 100% 100%, 0% 97%)",
          background: `
            repeating-linear-gradient(180deg,
              transparent 0px,transparent 28px,
              rgba(0,0,0,0.05) 28px,rgba(0,0,0,0.05) 29px,
              transparent 29px,transparent 48px,
              rgba(10,3,0,0.04) 48px,rgba(10,3,0,0.04) 49px
            ),
            repeating-linear-gradient(178.5deg,
              transparent 0px,transparent 65px,
              rgba(255,255,255,0.012) 65px,rgba(255,255,255,0.012) 67px
            ),
            linear-gradient(180deg, #1c0d07 0%, #2c1508 30%, #381a08 50%, #2c1508 70%, #1c0d07 100%)
          `,
        }}
      >
        {/* Top highlight */}
        <div
          className="absolute top-0 left-10 right-0 pointer-events-none z-[5]"
          style={{
            height: "1px",
            background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.08) 20%, rgba(255,255,255,0.13) 50%, rgba(255,255,255,0.08) 80%, transparent)",
          }}
        />

        {/* Inlay dots */}
        <div className="absolute inset-0 flex pointer-events-none z-10">
          <div className="w-10 shrink-0" />
          {Array.from({ length: FRET_COUNT }, (_, i) => {
            const fret = i + 1;
            return (
              <div key={i} className="flex-1 flex flex-col items-center justify-center gap-1.5">
                {FRET_MARKERS.includes(fret) && (
                  <>
                    <InlayDot />
                    {DOUBLE_MARKERS.includes(fret) && <InlayDot />}
                  </>
                )}
              </div>
            );
          })}
        </div>

        {/* Strings */}
        <div className="relative z-20">
          {DISPLAY_ORDER.map((stringIndex, displayPos) => (
            <StringRow
              key={stringIndex}
              stringIndex={stringIndex}
              isFirst={displayPos === 0}
              isLast={displayPos === DISPLAY_ORDER.length - 1}
              chordNotes={chordNotes}
              keyNote={keyNote}
              fretStart={fretStart}
              fretEnd={fretEnd}
              inStringRange={stringIndex >= stringStart && stringIndex <= stringEnd}
              chordTonesOnly={chordTonesOnly}
              activeSoloNote={activeSoloNote}
            />
          ))}
        </div>

        {/* Fret wires */}
        <div className="absolute inset-0 flex pointer-events-none z-0">
          <div className="w-10 shrink-0 relative">
            <div
              className="absolute right-0 top-0 bottom-0"
              style={{
                width: "3px",
                background: "linear-gradient(90deg, #b0a080 0%, #ede0c4 38%, #e8d8b8 55%, #c0a878 100%)",
                boxShadow: "-1px 0 5px rgba(0,0,0,0.7)",
              }}
            />
          </div>
          {Array.from({ length: FRET_COUNT }, (_, i) => (
            <div key={i} className="flex-1 relative">
              <div
                className="absolute right-0 top-0 bottom-0"
                style={{
                  width: "2px",
                  background: "linear-gradient(90deg, #383838 0%, #b8b8b8 30%, #e8e8e8 50%, #b8b8b8 70%, #383838 100%)",
                  boxShadow: "1px 0 4px rgba(0,0,0,0.55)",
                }}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Fret-range curtains — outside clipPath so they stay rectangular */}
      <div className="absolute inset-0 pointer-events-none z-[33]">
        {fretStart > 0 && (
          <div
            className="absolute top-0 bottom-0"
            style={{
              left: 0,
              width: `calc(40px + ${fretStart - 1} / ${FRET_COUNT} * (100% - 40px))`,
              background: "rgba(0,0,0,0.6)",
            }}
          />
        )}
        {fretEnd < FRET_COUNT && (
          <div
            className="absolute top-0 bottom-0"
            style={{
              left: `calc(40px + ${fretEnd} / ${FRET_COUNT} * (100% - 40px))`,
              right: 0,
              background: "rgba(0,0,0,0.6)",
            }}
          />
        )}
      </div>

      {/* Draggable range overlay */}
      {onFretRangeChange && (
        <div
          className="absolute top-0 bottom-0 z-[34] pointer-events-none"
          style={{
            left: fretStart === 0
              ? "0px"
              : `calc(40px + ${fretStart - 1} / ${FRET_COUNT} * (100% - 40px))`,
            right: fretEnd === FRET_COUNT
              ? "0px"
              : `calc(${FRET_COUNT - fretEnd} / ${FRET_COUNT} * (100% - 40px))`,
          }}
        >
          {/* Left resize handle */}
          <div
            className="absolute left-0 top-0 bottom-0 w-3 cursor-ew-resize pointer-events-auto group"
            onPointerDown={(e) => startDrag(e, "left")}
            onPointerMove={onDragMove}
            onPointerUp={onDragEnd}
          >
            <div className="absolute inset-y-0 left-[5px] w-px bg-amber-400/25 group-hover:bg-amber-400/55 transition-colors" />
          </div>

          {/* Center move handle */}
          <div
            className="absolute inset-y-0 left-3 right-3 cursor-grab active:cursor-grabbing pointer-events-auto"
            onPointerDown={(e) => startDrag(e, "move")}
            onPointerMove={onDragMove}
            onPointerUp={onDragEnd}
          />

          {/* Right resize handle */}
          <div
            className="absolute right-0 top-0 bottom-0 w-3 cursor-ew-resize pointer-events-auto group"
            onPointerDown={(e) => startDrag(e, "right")}
            onPointerMove={onDragMove}
            onPointerUp={onDragEnd}
          >
            <div className="absolute inset-y-0 right-[5px] w-px bg-amber-400/25 group-hover:bg-amber-400/55 transition-colors" />
          </div>
        </div>
      )}

      </div>{/* end wrapper */}

      <div className="flex mt-1 pl-10">
        {Array.from({ length: FRET_COUNT }, (_, i) => {
          const fret = i + 1;
          return (
            <div key={i} className="flex-1 text-center text-[10px] font-mono">
              {FRET_MARKERS.includes(fret) ? (
                <span className={DOUBLE_MARKERS.includes(fret) ? "text-amber-200/50" : "text-stone-500"}>
                  {fret}
                </span>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
