"use client";

import StringRow from "./StringRow";
import { OPEN_STRINGS } from "@/lib/music/notes";

const FRET_COUNT = 15; // frets 1–15, open string (0) removed
const FRET_MARKERS = [3, 5, 7, 9, 12, 15];
const DOUBLE_MARKERS = [12];

// Display order: high e at top → low E at bottom (standard tab notation)
const DISPLAY_ORDER = [...Array(OPEN_STRINGS.length)].map(
  (_, i) => OPEN_STRINGS.length - 1 - i
);

export default function Fretboard() {
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
        className="relative rounded-lg overflow-hidden border border-stone-700/60"
        style={{ background: "linear-gradient(180deg, #2e1c10 0%, #3d2514 50%, #2e1c10 100%)" }}
      >
        {/* Fret marker dots (inlays) */}
        <div className="absolute inset-0 flex pointer-events-none z-10">
          <div className="w-10 shrink-0" />
          {Array.from({ length: FRET_COUNT }, (_, i) => {
            const fret = i + 1;
            return (
              <div key={i} className="flex-1 flex flex-col items-center justify-center gap-1">
                {FRET_MARKERS.includes(fret) && (
                  <>
                    <div className="w-2 h-2 rounded-full bg-stone-600/60" />
                    {DOUBLE_MARKERS.includes(fret) && (
                      <div className="w-2 h-2 rounded-full bg-stone-600/60" />
                    )}
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

        {/* Fret lines */}
        <div className="absolute inset-0 flex pointer-events-none z-0">
          <div className="w-10 shrink-0 border-r-2 border-stone-400/30" />
          {Array.from({ length: FRET_COUNT }, (_, i) => (
            <div key={i} className="flex-1 border-r border-stone-600/50" />
          ))}
        </div>
      </div>

      {/* Bottom position markers — fret numbers at marker positions, next to low E */}
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
