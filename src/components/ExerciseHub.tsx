"use client";

import { useState, useEffect } from "react";
import { useShallow } from "zustand/react/shallow";
import { useExerciseStore } from "@/store/exerciseStore";
import { NOTES } from "@/lib/music/notes";
import { INTERVALS } from "@/lib/music/intervals";
import type { Note } from "@/lib/music/notes";

export default function ExerciseHub() {
  const [showTarget, setShowTarget] = useState(false);

  const {
    rootNote,
    intervalSemitones,
    targetNote,
    active,
    correctAnswers,
    points,
    setRootNote,
    setInterval,
    startExercise,
    stop,
  } = useExerciseStore(
    useShallow((s) => ({
      rootNote: s.rootNote,
      intervalSemitones: s.intervalSemitones,
      targetNote: s.targetNote,
      active: s.active,
      correctAnswers: s.correctAnswers,
      points: s.points,
      setRootNote: s.setRootNote,
      setInterval: s.setInterval,
      startExercise: s.startExercise,
      stop: s.stop,
    }))
  );

  // Hide target note whenever a new exercise session starts
  useEffect(() => {
    if (active) setShowTarget(false);
  }, [active]);

  const selectedInterval = INTERVALS.find((i) => i.semitones === intervalSemitones);

  return (
    <div className="w-full max-w-5xl">
      <div className="rounded-xl border border-stone-700/60 bg-stone-900/80 px-6 py-5">
        <h2 className="text-xs font-semibold tracking-widest uppercase text-stone-400 mb-5">
          Interval Trainer
        </h2>

        <div className="flex flex-wrap items-end gap-6">
          {/* Root Note */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-stone-500 tracking-wide">Root Note</label>
            <select
              value={rootNote}
              onChange={(e) => setRootNote(e.target.value as Note)}
              disabled={active}
              className="bg-stone-800 border border-stone-700 text-amber-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500/60 disabled:opacity-50 cursor-pointer min-w-[90px]"
            >
              {NOTES.map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </div>

          {/* Interval */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-stone-500 tracking-wide">Interval</label>
            <select
              value={intervalSemitones}
              onChange={(e) => setInterval(Number(e.target.value))}
              disabled={active}
              className="bg-stone-800 border border-stone-700 text-amber-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500/60 disabled:opacity-50 cursor-pointer min-w-[140px]"
            >
              {INTERVALS.map((i) => (
                <option key={i.semitones} value={i.semitones}>{i.label}</option>
              ))}
            </select>
          </div>

          {/* Target note — hidden by default */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-stone-500 tracking-wide">Target Note</label>
            <div className="flex items-center gap-1.5">
              <div className="bg-stone-800/50 border border-stone-700/50 rounded-lg px-4 py-2 min-w-[56px] text-center">
                <span
                  className="text-lg font-bold text-amber-300 select-none transition-all duration-200"
                  style={{ filter: showTarget ? "none" : "blur(6px)" }}
                >
                  {targetNote}
                </span>
              </div>
              <button
                onClick={() => setShowTarget((v) => !v)}
                className="text-[10px] tracking-wide text-stone-500 hover:text-stone-300 transition-colors duration-150 px-1 py-0.5"
              >
                {showTarget ? "hide" : "show"}
              </button>
            </div>
          </div>

          <div className="flex-1" />

          {/* Points counter */}
          {active && (
            <div className="flex flex-col gap-1.5 items-center">
              <label className="text-xs text-stone-500 tracking-wide">Points</label>
              <div className="text-2xl font-bold text-amber-300 tabular-nums min-w-[2.5rem] text-center">
                {points}
              </div>
            </div>
          )}

          {/* Round progress dots */}
          {active && (
            <div className="flex flex-col gap-1.5 items-center">
              <label className="text-xs text-stone-500 tracking-wide">Round</label>
              <div className="flex gap-1.5 items-center">
                {Array.from({ length: 6 }, (_, i) => {
                  const answered = correctAnswers.some((a) => a.stringIndex === i);
                  return (
                    <div
                      key={i}
                      className={`w-2.5 h-2.5 rounded-full transition-colors duration-200 ${
                        answered ? "bg-emerald-400" : "bg-stone-700"
                      }`}
                    />
                  );
                })}
              </div>
            </div>
          )}

          {/* Start / Stop button */}
          {!active ? (
            <button
              onClick={startExercise}
              className="px-5 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-stone-900 font-semibold text-sm transition-colors duration-150 shadow-[0_0_20px_rgba(245,158,11,0.3)]"
            >
              Start Exercise
            </button>
          ) : (
            <button
              onClick={stop}
              className="px-5 py-2 rounded-lg border border-stone-600 hover:border-red-500/60 text-stone-400 hover:text-red-400 font-medium text-sm transition-colors duration-150"
            >
              Stop
            </button>
          )}
        </div>

        {/* Active exercise hint */}
        {active && (
          <p className="mt-4 text-xs text-stone-500">
            Find the{" "}
            {showTarget ? (
              <span className="text-amber-300 font-medium">{targetNote}</span>
            ) : (
              <span className="text-stone-600 font-medium">[hidden]</span>
            )}{" "}
            note on every string. ({selectedInterval?.label} from {rootNote})
          </p>
        )}
      </div>
    </div>
  );
}
