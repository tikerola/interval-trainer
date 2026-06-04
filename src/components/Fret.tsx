"use client";

import { useState, useCallback, useRef } from "react";
import { useShallow } from "zustand/react/shallow";
import { getNoteAtPosition } from "@/lib/music/notes";
import { useExerciseStore } from "@/store/exerciseStore";

interface Props {
  stringIndex: number;
  fretNumber: number;
}

export default function Fret({ stringIndex, fretNumber }: Props) {
  // Free-mode: drive opacity via ref so we never insert/remove the dot element.
  // Removing a partially-faded element causes a blink; inserting the hover ghost
  // while the mouse is already over it skips the CSS transition and flashes.
  const freeDotRef = useRef<HTMLDivElement>(null);
  const freeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [wrongFlash, setWrongFlash] = useState(false);
  const wrongTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { note } = getNoteAtPosition(stringIndex, fretNumber);

  const { active, fretWindow, roundTransitioning, lastCorrectAnswer, submitAnswer } =
    useExerciseStore(
      useShallow((s) => ({
        active: s.active,
        fretWindow: s.fretWindow,
        roundTransitioning: s.roundTransitioning,
        lastCorrectAnswer: s.lastCorrectAnswer,
        submitAnswer: s.submitAnswer,
      }))
    );

  const inWindow =
    !active ||
    !fretWindow ||
    (fretNumber >= fretWindow.start && fretNumber <= fretWindow.end);

  const isCorrectlyAnswered =
    !!lastCorrectAnswer &&
    lastCorrectAnswer.stringIndex === stringIndex &&
    lastCorrectAnswer.fret === fretNumber;

  const isDisabled = active && (!inWindow || roundTransitioning);
  const isHoverable = active ? inWindow && !roundTransitioning : true;

  const handleClick = useCallback(() => {
    if (active) {
      if (isDisabled) return;
      const result = submitAnswer(stringIndex, fretNumber);
      if (result === "wrong") {
        setWrongFlash(true);
        if (wrongTimer.current) clearTimeout(wrongTimer.current);
        wrongTimer.current = setTimeout(() => setWrongFlash(false), 900);
      }
    } else {
      // Free-mode: manipulate opacity directly on the DOM node — no React state,
      // no element swap, no transition-on-insertion issues.
      const el = freeDotRef.current;
      if (!el) return;
      if (freeTimer.current) clearTimeout(freeTimer.current);

      el.style.transition = "none";
      el.style.opacity = "1";

      freeTimer.current = setTimeout(() => {
        const el = freeDotRef.current;
        if (!el) return;
        el.style.transition = "opacity 500ms";
        el.style.opacity = "0";
      }, 800);
    }
  }, [active, isDisabled, submitAnswer, stringIndex, fretNumber]);

  return (
    <div
      className={`flex-1 flex items-center justify-center relative z-20 group ${
        isDisabled ? "cursor-default" : "cursor-pointer"
      }`}
      style={{
        minHeight: "40px",
        opacity: active && !inWindow ? 0.28 : 1,
        transition: "opacity 0.3s ease-out",
      }}
      onClick={handleClick}
    >
      {/* Hover ring */}
      {isHoverable && (
        <div className="absolute w-7 h-7 rounded-full border border-amber-400/0 group-hover:border-amber-400/50 transition-colors duration-150" />
      )}

      {/* Correct answer star — exercise mode */}
      {isCorrectlyAnswered && (
        <>
          {/* Star shape */}
          <div
            className="absolute w-8 h-8 z-30 pointer-events-none"
            style={{ animation: "star-pop 0.42s cubic-bezier(0.34, 1.56, 0.64, 1) forwards" }}
          >
            {/* Glow behind the star */}
            <div
              className="absolute inset-0 rounded-full bg-emerald-400/50 pointer-events-none"
              style={{ filter: "blur(7px)", transform: "scale(1.6)" }}
            />
            {/* The star polygon */}
            <div
              className="absolute inset-0 bg-emerald-400"
              style={{
                clipPath:
                  "polygon(50% 0%, 62% 34%, 98% 35%, 69% 56%, 79% 91%, 50% 70%, 21% 91%, 31% 56%, 2% 35%, 38% 34%)",
                filter: "drop-shadow(0 0 4px rgba(52,211,153,0.9))",
              }}
            />
            {/* Note label */}
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-[8px] font-black text-stone-900 select-none leading-none">
                {note}
              </span>
            </div>
          </div>

          {/* Sparkle burst particles */}
          {([0, 1, 2, 3, 4, 5] as const).map((i) => {
            const angle = ((i * 60 - 90) * Math.PI) / 180;
            return (
              <div
                key={i}
                className="absolute w-1.5 h-1.5 rounded-full bg-emerald-300 z-[29] pointer-events-none"
                style={{
                  animation: `sparkle-burst 0.45s ${i * 45}ms ease-out both`,
                  "--sx": `${Math.cos(angle) * 18}px`,
                  "--sy": `${Math.sin(angle) * 18}px`,
                } as React.CSSProperties}
              />
            );
          })}
        </>
      )}

      {/* Wrong answer flash — exercise mode */}
      {active && wrongFlash && !isCorrectlyAnswered && (
        <div className="absolute w-7 h-7 rounded-full bg-red-400 shadow-[0_0_12px_rgba(248,113,113,0.8)] flex items-center justify-center z-30">
          <span className="text-[10px] font-bold text-stone-900 select-none">{note}</span>
        </div>
      )}

      {/* Free-mode flash dot — permanently in DOM (opacity 0 when idle).
          Never inserted/removed mid-animation, so no blink on fade-out. */}
      {!active && (
        <div
          ref={freeDotRef}
          className="absolute w-7 h-7 rounded-full bg-amber-300 shadow-[0_0_14px_rgba(252,211,77,0.9)] flex items-center justify-center z-30 pointer-events-none"
          style={{ opacity: 0 }}
        >
          <span className="text-[10px] font-bold text-stone-900 select-none">{note}</span>
        </div>
      )}

      {/* Hover ghost — always in DOM when hoverable so it never flashes on insertion. */}
      {isHoverable && !isCorrectlyAnswered && !(active && wrongFlash) && (
        <div className="absolute w-6 h-6 rounded-full bg-amber-300/0 group-hover:bg-amber-300/20 transition-colors duration-150 flex items-center justify-center z-[29]">
          <span className="text-[9px] font-medium text-amber-200/0 group-hover:text-amber-200/60 transition-colors duration-150 select-none">
            {note}
          </span>
        </div>
      )}
    </div>
  );
}
