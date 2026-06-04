"use client";

import StringRow from "./StringRow";
import { OPEN_STRINGS } from "@/lib/music/notes";
import { useShallow } from "zustand/react/shallow";
import { useExerciseStore } from "@/store/exerciseStore";

const FRET_COUNT = 15; // frets 1–15, open string (0) removed
const FRET_MARKERS = [3, 5, 7, 9, 12, 15];
const DOUBLE_MARKERS = [12];

// Display order: high e at top → low E at bottom (standard tab notation)
const DISPLAY_ORDER = [...Array(OPEN_STRINGS.length)].map(
  (_, i) => OPEN_STRINGS.length - 1 - i
);

export default function Fretboard() {
  const { active, fretWindow } = useExerciseStore(
    useShallow((s) => ({ active: s.active, fretWindow: s.fretWindow }))
  );

  return (
    <div className="w-full max-w-5xl">
      {/* Top fret number labels */}
      <div className="flex mb-1 pl-10">
        {Array.from({ length: FRET_COUNT }, (_, i) => (
          <div key={i} className="flex-1 text-center text-[10px] text-stone-500 font-mono">
            {i + 1}
          </div>
        ))}
      </div>

      {/* Fretboard body */}
      <div
        className="relative rounded-r-lg overflow-hidden border border-stone-800/80"
        style={{
          clipPath: "polygon(0% 7%, 100% 0%, 100% 100%, 0% 93%)",
          background: `
            repeating-linear-gradient(180deg,
              transparent 0px,
              transparent 28px,
              rgba(0,0,0,0.05) 28px,
              rgba(0,0,0,0.05) 29px,
              transparent 29px,
              transparent 48px,
              rgba(10,3,0,0.04) 48px,
              rgba(10,3,0,0.04) 49px
            ),
            repeating-linear-gradient(178.5deg,
              transparent 0px,
              transparent 65px,
              rgba(255,255,255,0.012) 65px,
              rgba(255,255,255,0.012) 67px
            ),
            linear-gradient(180deg, #1c0d07 0%, #2c1508 30%, #381a08 50%, #2c1508 70%, #1c0d07 100%)
          `,
        }}
      >
        {/* Subtle top-edge lacquer reflection */}
        <div
          className="absolute top-0 left-10 right-0 pointer-events-none z-[5]"
          style={{
            height: "1px",
            background:
              "linear-gradient(90deg, transparent, rgba(255,255,255,0.08) 20%, rgba(255,255,255,0.13) 50%, rgba(255,255,255,0.08) 80%, transparent)",
          }}
        />

        {/* Fret marker dots (inlays) */}
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

        {/* Strings — high e at top, low E at bottom */}
        <div className="relative z-20">
          {DISPLAY_ORDER.map((stringIndex, displayPos) => (
            <StringRow
              key={stringIndex}
              stringIndex={stringIndex}
              fretCount={FRET_COUNT}
              isFirst={displayPos === 0}
              isLast={displayPos === DISPLAY_ORDER.length - 1}
            />
          ))}
        </div>

        {/* Fret lines — metallic nickel wire */}
        <div className="absolute inset-0 flex pointer-events-none z-0">
          {/* Nut — bone/synthetic ivory */}
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
          {/* Individual fret wires */}
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

        {/* Active window highlight border */}
        {active && fretWindow && (
          <div
            className="absolute top-0 bottom-0 border border-amber-400/50 rounded-sm pointer-events-none z-[35]"
            style={{
              left: `calc(40px + ${fretWindow.start - 1} / ${FRET_COUNT} * (100% - 40px))`,
              width: `calc(${fretWindow.end - fretWindow.start + 1} / ${FRET_COUNT} * (100% - 40px))`,
              boxShadow:
                "inset 0 0 0 1px rgba(245,158,11,0.15), 0 0 12px rgba(245,158,11,0.12)",
              transition: "left 0.35s ease-out, width 0.35s ease-out",
            }}
          />
        )}
      </div>

      {/* Bottom position markers */}
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
