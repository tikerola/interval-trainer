"use client";

import Fret from "./Fret";
import { useShallow } from "zustand/react/shallow";
import { useExerciseStore } from "@/store/exerciseStore";

interface Props {
  stringIndex: number;
  fretCount: number;
  isFirst: boolean;
  isLast: boolean;
}

// Index 0 = low E (thickest), index 5 = high e (thinnest)
const STRING_HEIGHTS = [3.5, 3, 2.5, 2, 1.5, 1];
const STRING_LABELS = ["E", "A", "D", "G", "B", "e"];

export default function StringRow({ stringIndex, fretCount, isFirst, isLast }: Props) {
  const stringHeight = STRING_HEIGHTS[stringIndex];

  const { active, correctAnswers } = useExerciseStore(
    useShallow((s) => ({ active: s.active, correctAnswers: s.correctAnswers }))
  );

  const isLocked = active && correctAnswers.some((a) => a.stringIndex === stringIndex);

  return (
    <div
      className="relative flex items-center transition-opacity duration-300"
      style={{
        paddingTop: isFirst ? "12px" : "4px",
        paddingBottom: isLast ? "12px" : "4px",
        opacity: isLocked ? 0.4 : 1,
      }}
    >
      {/* String label */}
      <div className="w-10 shrink-0 text-center text-xs text-amber-200/60 font-mono z-30">
        {STRING_LABELS[stringIndex]}
      </div>

      {/* The string line */}
      {/* top must compensate for asymmetric padding: flex items-center centers within
          the content box, but `50%` is relative to the full box including padding.
          Offset = (paddingTop - paddingBottom) / 2 */}
      <div
        className="absolute left-10 right-0 pointer-events-none z-10"
        style={{
          height: `${stringHeight}px`,
          top: isFirst ? "calc(50% + 4px)" : isLast ? "calc(50% - 4px)" : "50%",
          transform: "translateY(-50%)",
          background: "linear-gradient(180deg, #d4c5a0 0%, #a08060 50%, #d4c5a0 100%)",
          boxShadow: `0 0 ${stringHeight}px rgba(200,180,140,0.3)`,
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
