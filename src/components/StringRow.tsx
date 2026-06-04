"use client";

import Fret from "./Fret";

interface Props {
  stringIndex: number;
  fretCount: number;
  isFirst: boolean;
  isLast: boolean;
}

// Index 0 = low E (thickest), index 5 = high e (thinnest)
const STRING_HEIGHTS = [3.5, 3, 2.5, 2, 1.5, 1];
const STRING_LABELS = ["E", "A", "D", "G", "B", "e"];

// Strings 0–3 (low E, A, D, G) are nickel-wound; 4–5 (B, e) are plain steel
const WOUND = new Set([0, 1, 2, 3]);

function getStringStyle(stringIndex: number, height: number): React.CSSProperties {
  if (WOUND.has(stringIndex)) {
    // Nickel-wound: warm bronze-silver with a coil texture overlay
    return {
      height: `${height}px`,
      background: `
        repeating-linear-gradient(90deg,
          transparent 0px,
          transparent 2px,
          rgba(0,0,0,0.10) 2px,
          rgba(0,0,0,0.10) 3px
        ),
        linear-gradient(180deg,
          #f0e8cc 0%,
          #c8a870 12%,
          #8c5e2a 38%,
          #6a4018 52%,
          #8c5e2a 65%,
          #c8a870 88%,
          #f0e8cc 100%
        )
      `,
      boxShadow: `0 ${Math.ceil(height / 2)}px ${height * 2}px rgba(0,0,0,0.65), 0 0 ${height}px rgba(200,170,100,0.18)`,
    };
  } else {
    // Plain steel: cool silver, sharper highlight
    return {
      height: `${height}px`,
      background: `
        linear-gradient(180deg,
          #f8f8f8 0%,
          #d4d4d4 12%,
          #909090 38%,
          #707070 52%,
          #909090 65%,
          #d4d4d4 88%,
          #f8f8f8 100%
        )
      `,
      boxShadow: `0 ${Math.ceil(height / 2)}px ${height * 2}px rgba(0,0,0,0.55), 0 0 ${height}px rgba(210,210,210,0.15)`,
    };
  }
}

export default function StringRow({ stringIndex, fretCount, isFirst, isLast }: Props) {
  const stringHeight = STRING_HEIGHTS[stringIndex];

  return (
    <div
      className="relative flex items-center"
      style={{
        paddingTop: isFirst ? "8px" : "2px",
        paddingBottom: isLast ? "8px" : "2px",
      }}
    >
      {/* String label */}
      <div className="w-10 shrink-0 text-center text-xs text-amber-200/60 font-mono z-30">
        {STRING_LABELS[stringIndex]}
      </div>

      {/* The string line */}
      {/* top compensates for asymmetric padding on first/last rows: offset = (paddingTop - paddingBottom) / 2 */}
      <div
        className="absolute left-10 right-0 pointer-events-none z-10"
        style={{
          top: isFirst ? "calc(50% + 3px)" : isLast ? "calc(50% - 3px)" : "50%",
          transform: "translateY(-50%)",
          ...getStringStyle(stringIndex, stringHeight),
        }}
      />

      {/* Fret cells */}
      <div className="flex flex-1">
        {Array.from({ length: fretCount }, (_, fretIndex) => (
          <Fret key={fretIndex} stringIndex={stringIndex} fretNumber={fretIndex + 1} />
        ))}
      </div>
    </div>
  );
}
