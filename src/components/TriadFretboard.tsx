"use client";

import { useMemo } from "react";
import { OPEN_STRINGS, getNoteAtPosition, type Note } from "@/lib/music/notes";
import { useTriadStore } from "@/store/triadStore";
import { getDiatonicTriads } from "@/lib/music/triads";
import { getScaleDegree, type ScaleDefinition } from "@/lib/music/scales";
import { getCagedBox } from "@/lib/music/caged";

const FRET_COUNT = 15;
const FRET_MARKERS = [3, 5, 7, 9, 12, 15];
const DOUBLE_MARKERS = [12];
const DISPLAY_ORDER = [...Array(OPEN_STRINGS.length)].map((_, i) => OPEN_STRINGS.length - 1 - i);
const STRING_HEIGHTS = [3.5, 3, 2.5, 2, 1.5, 1];
const STRING_LABELS = ["E", "A", "D", "G", "B", "e"];
const WOUND = new Set([0, 1, 2, 3]);

type TriadNotes = [Note, Note, Note] | null;
type Role = "root" | "third" | "fifth";
type LabelMode = "note" | "degree";

const ROLE_DEGREE_LABEL: Record<Role, string> = { root: "1", third: "3", fifth: "5" };

const ROLE_COLORS: Record<Role, { bg: string; glow: string; text: string }> = {
  root:  { bg: "#fbbf24",               glow: "0 0 10px rgba(251,191,36,0.85)", text: "#ffffff" },
  third: { bg: "rgba(56,189,248,0.45)", glow: "0 0 6px rgba(56,189,248,0.3)",  text: "#ffffff" },
  fifth: { bg: "rgba(52,211,153,0.45)", glow: "0 0 6px rgba(52,211,153,0.3)",  text: "#ffffff" },
};

function getRole(note: Note, triadNotes: TriadNotes): Role | null {
  if (!triadNotes) return null;
  if (note === triadNotes[0]) return "root";
  if (note === triadNotes[1]) return "third";
  if (note === triadNotes[2]) return "fifth";
  return null;
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

function NoteDot({ role, label }: { role: Role; label: string }) {
  const colors = ROLE_COLORS[role];
  return (
    <div
      data-testid="note-dot"
      className="w-6 h-6 rounded-full flex items-center justify-center"
      style={{ background: colors.bg, boxShadow: colors.glow }}
    >
      <span className="text-[10px] font-black select-none" style={{ color: colors.text }}>
        {label}
      </span>
    </div>
  );
}

function ScaleDot({ label }: { label: string }) {
  return (
    <div
      data-testid="scale-dot"
      className="w-5 h-5 rounded-full flex items-center justify-center"
      style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)" }}
    >
      <span className="text-[8px] font-semibold select-none text-white/50">{label}</span>
    </div>
  );
}

function FretCell({
  stringIndex,
  fretNumber,
  triadNotes,
  labelMode,
  showScale,
  selectedKey,
  selectedScale,
}: {
  stringIndex: number;
  fretNumber: number;
  triadNotes: TriadNotes;
  labelMode: LabelMode;
  showScale: boolean;
  selectedKey: Note;
  selectedScale: ScaleDefinition;
}) {
  const { note } = getNoteAtPosition(stringIndex, fretNumber);
  const role = getRole(note, triadNotes);
  const scaleDeg = !role && showScale ? getScaleDegree(note, selectedKey, selectedScale) : null;

  return (
    <div className="flex-1 flex items-center justify-center relative" style={{ minHeight: "30px" }}>
      {role ? (
        <div className="absolute z-30">
          <NoteDot role={role} label={labelMode === "degree" ? ROLE_DEGREE_LABEL[role] : note} />
        </div>
      ) : scaleDeg !== null ? (
        <div className="absolute z-30">
          <ScaleDot label={labelMode === "degree" ? scaleDeg! : note} />
        </div>
      ) : null}
    </div>
  );
}

function StringRow({
  stringIndex,
  fretCount,
  isFirst,
  isLast,
  triadNotes,
  labelMode,
  showScale,
  selectedKey,
  selectedScale,
}: {
  stringIndex: number;
  fretCount: number;
  isFirst: boolean;
  isLast: boolean;
  triadNotes: TriadNotes;
  labelMode: LabelMode;
  showScale: boolean;
  selectedKey: Note;
  selectedScale: ScaleDefinition;
}) {
  const h = STRING_HEIGHTS[stringIndex];
  const openNote = getNoteAtPosition(stringIndex, 0).note;
  const openRole = getRole(openNote, triadNotes);
  const openScaleDeg =
    !openRole && showScale ? getScaleDegree(openNote, selectedKey, selectedScale) : null;

  return (
    <div
      className="relative flex items-center"
      style={{ paddingTop: isFirst ? "8px" : "2px", paddingBottom: isLast ? "8px" : "2px" }}
    >
      <div className="w-10 shrink-0 flex items-center justify-center z-30">
        {openRole ? (
          <NoteDot
            role={openRole}
            label={labelMode === "degree" ? ROLE_DEGREE_LABEL[openRole] : openNote}
          />
        ) : openScaleDeg !== null ? (
          <ScaleDot label={labelMode === "degree" ? openScaleDeg! : openNote} />
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
        {Array.from({ length: fretCount }, (_, i) => (
          <FretCell
            key={i}
            stringIndex={stringIndex}
            fretNumber={i + 1}
            triadNotes={triadNotes}
            labelMode={labelMode}
            showScale={showScale}
            selectedKey={selectedKey}
            selectedScale={selectedScale}
          />
        ))}
      </div>
    </div>
  );
}

function InlayDot() {
  return (
    <div
      className="w-2.5 h-2.5 rounded-full"
      style={{
        background:
          "radial-gradient(circle at 35% 32%, #f5f0e8 0%, #d8cdb8 45%, #b0a490 75%, #887c70 100%)",
        boxShadow:
          "inset 0 1px 2px rgba(255,255,255,0.5), inset 0 -1px 1px rgba(0,0,0,0.3), 0 1px 3px rgba(0,0,0,0.6)",
      }}
    />
  );
}

export default function TriadFretboard() {
  const { selectedKey, selectedScale, selectedDegree, labelMode, showScale, selectedCagedShape } =
    useTriadStore();

  const cagedBox = selectedCagedShape ? getCagedBox(selectedKey, selectedCagedShape, selectedScale) : null;

  const triadNotes = useMemo<TriadNotes>(() => {
    if (selectedDegree === null) return null;
    const triad = getDiatonicTriads(selectedKey, selectedScale).find(
      (t) => t.degree === selectedDegree
    );
    return triad ? triad.notes : null;
  }, [selectedKey, selectedScale, selectedDegree]);

  return (
    <div className="w-full max-w-5xl">
      <div className="flex mb-1 pl-10">
        {Array.from({ length: FRET_COUNT }, (_, i) => (
          <div key={i} className="flex-1 text-center text-[10px] text-stone-500 font-mono">
            {i + 1}
          </div>
        ))}
      </div>

      {/* Wrapper — CAGED box overlay lives here as a sibling, outside the polygon clip */}
      <div className="relative">

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
        <div
          className="absolute top-0 left-10 right-0 pointer-events-none z-[5]"
          style={{
            height: "1px",
            background:
              "linear-gradient(90deg, transparent, rgba(255,255,255,0.08) 20%, rgba(255,255,255,0.13) 50%, rgba(255,255,255,0.08) 80%, transparent)",
          }}
        />

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

        <div className="relative z-20">
          {DISPLAY_ORDER.map((stringIndex, displayPos) => (
            <StringRow
              key={stringIndex}
              stringIndex={stringIndex}
              fretCount={FRET_COUNT}
              isFirst={displayPos === 0}
              isLast={displayPos === DISPLAY_ORDER.length - 1}
              triadNotes={triadNotes}
              labelMode={labelMode}
              showScale={showScale}
              selectedKey={selectedKey}
              selectedScale={selectedScale}
            />
          ))}
        </div>

        <div className="absolute inset-0 flex pointer-events-none z-0">
          <div className="w-10 shrink-0 relative">
            <div
              className="absolute right-0 top-0 bottom-0"
              style={{
                width: "3px",
                background:
                  "linear-gradient(90deg, #b0a080 0%, #ede0c4 38%, #e8d8b8 55%, #c0a878 100%)",
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
                  background:
                    "linear-gradient(90deg, #383838 0%, #b8b8b8 30%, #e8e8e8 50%, #b8b8b8 70%, #383838 100%)",
                  boxShadow: "1px 0 4px rgba(0,0,0,0.55)",
                }}
              />
            </div>
          ))}
        </div>
      </div>

      {/* CAGED box highlight — no clipPath so the rectangle border is never clipped */}
      {cagedBox && (
        <div className="absolute inset-0 pointer-events-none z-[35]">
          <div
            className="absolute top-0 bottom-0 rounded-sm"
            style={{
              left:  cagedBox.start === 0 ? '0px' : `calc(40px + ${cagedBox.start - 1} / ${FRET_COUNT} * (100% - 40px))`,
              width: cagedBox.start === 0
                ? `calc(40px + ${cagedBox.end} / ${FRET_COUNT} * (100% - 40px))`
                : `calc(${cagedBox.end - cagedBox.start + 1} / ${FRET_COUNT} * (100% - 40px))`,
              border:     "2px solid rgba(56,189,248,0.8)",
              background: "rgba(56,189,248,0.06)",
              boxShadow:  "0 0 16px rgba(56,189,248,0.25)",
              transition: "left 0.3s ease-out, width 0.3s ease-out",
            }}
          />
        </div>
      )}
      </div>{/* end wrapper */}

      <div className="flex mt-1 pl-10">
        {Array.from({ length: FRET_COUNT }, (_, i) => {
          const fret = i + 1;
          return (
            <div key={i} className="flex-1 text-center text-[10px] font-mono">
              {FRET_MARKERS.includes(fret) ? (
                <span
                  className={
                    DOUBLE_MARKERS.includes(fret) ? "text-amber-200/50" : "text-stone-500"
                  }
                >
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
