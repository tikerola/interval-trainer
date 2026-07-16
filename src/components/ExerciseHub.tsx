"use client";

import { useState, useEffect } from "react";
import { useShallow } from "zustand/react/shallow";
import { useExerciseStore } from "@/store/exerciseStore";
import { useEarTrainerStore } from "@/store/earTrainerStore";
import { NOTES } from "@/lib/music/notes";
import { INTERVALS } from "@/lib/music/intervals";
import type { Note } from "@/lib/music/notes";
import EarTrainer from "./EarTrainer";

type Mode = "practice" | "ear";

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export default function ExerciseHub() {
  const [mode, setMode] = useState<Mode>("practice");
  const [showTarget, setShowTarget] = useState(false);
  const [timeLeft, setTimeLeft] = useState(120);

  const earActive = useEarTrainerStore((s) => s.active);
  const earStop = useEarTrainerStore((s) => s.stop);

  const {
    rootNote,
    intervalSemitones,
    targetNote,
    active,
    points,
    windowWidth,
    duration,
    setRootNote,
    setInterval,
    setWindowWidth,
    setDuration,
    startExercise,
    stop,
    startedAt,
  } = useExerciseStore(
    useShallow((s) => ({
      rootNote: s.rootNote,
      intervalSemitones: s.intervalSemitones,
      targetNote: s.targetNote,
      active: s.active,
      points: s.points,
      windowWidth: s.windowWidth,
      duration: s.duration,
      setRootNote: s.setRootNote,
      setInterval: s.setInterval,
      setWindowWidth: s.setWindowWidth,
      setDuration: s.setDuration,
      startExercise: s.startExercise,
      stop: s.stop,
      startedAt: s.startedAt,
    }))
  );

  // Hide target note whenever a new exercise session starts
  useEffect(() => {
    if (active) setShowTarget(false);
  }, [active]);

  // Countdown timer — auto-stops when time runs out
  useEffect(() => {
    if (!active) return;

    const tick = () => {
      const elapsed = Math.floor((Date.now() - startedAt) / 1000);
      const remaining = Math.max(0, duration - elapsed);
      setTimeLeft(remaining);
      if (remaining <= 0) stop();
    };

    tick();
    const id = window.setInterval(tick, 500);
    return () => window.clearInterval(id);
  }, [active, startedAt, duration, stop]);

  const selectedInterval = INTERVALS.find((i) => i.semitones === intervalSemitones);

  const timerColor =
    timeLeft <= 10 ? "text-red-400" : timeLeft <= 30 ? "text-orange-400" : "text-amber-300";

  function switchMode(next: Mode) {
    if (next === mode) return;
    if (mode === "practice" && active) stop();
    if (mode === "ear" && earActive) earStop();
    setMode(next);
  }

  if (mode === "ear") {
    return (
      <div className="w-full max-w-5xl flex flex-col gap-3">
        <ModeToggle mode={mode} onChange={switchMode} />
        <EarTrainer />
      </div>
    );
  }

  return (
    <div className="w-full max-w-5xl flex flex-col gap-3">
      <ModeToggle mode={mode} onChange={switchMode} />
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

          {/* Area Width */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-stone-500 tracking-wide">Area Width</label>
            <select
              value={windowWidth}
              onChange={(e) => setWindowWidth(Number(e.target.value))}
              disabled={active}
              className="bg-stone-800 border border-stone-700 text-amber-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500/60 disabled:opacity-50 cursor-pointer min-w-[90px]"
            >
              {[3, 4, 5, 6].map((w) => (
                <option key={w} value={w}>{w} frets</option>
              ))}
            </select>
          </div>

          {/* Duration */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-stone-500 tracking-wide">Duration</label>
            <select
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              disabled={active}
              className="bg-stone-800 border border-stone-700 text-amber-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500/60 disabled:opacity-50 cursor-pointer min-w-[90px]"
            >
              <option value={60}>1 min</option>
              <option value={120}>2 min</option>
              <option value={180}>3 min</option>
              <option value={300}>5 min</option>
            </select>
          </div>

          <div className="flex-1" />

          {/* Points counter */}
          {active && (
            <div className="flex flex-col gap-1.5 items-center">
              <label className="text-xs text-stone-500 tracking-wide">Score</label>
              <div
                className="text-2xl font-bold tabular-nums min-w-[2.5rem] text-center transition-colors duration-200"
                style={{ color: points < 0 ? "#f87171" : "#fcd34d" }}
              >
                {points}
              </div>
            </div>
          )}

          {/* Countdown timer */}
          {active && (
            <div className="flex flex-col gap-1.5 items-center">
              <label className="text-xs text-stone-500 tracking-wide">Time</label>
              <div className={`text-2xl font-bold tabular-nums min-w-[3rem] text-center ${timerColor}`}>
                {formatTime(timeLeft)}
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
            Find{" "}
            {showTarget ? (
              <span className="text-amber-300 font-medium">{targetNote}</span>
            ) : (
              <span className="text-stone-600 font-medium">[hidden]</span>
            )}{" "}
            in the highlighted area. ({selectedInterval?.label} from {rootNote})
          </p>
        )}
      </div>
    </div>
  );
}

function ModeToggle({ mode, onChange }: { mode: Mode; onChange: (m: Mode) => void }) {
  const options: { id: Mode; label: string }[] = [
    { id: "practice", label: "Practice" },
    { id: "ear", label: "Ear Training" },
  ];
  return (
    <div className="inline-flex self-start rounded-lg border border-stone-700/60 bg-stone-900/60 p-1">
      {options.map((o) => (
        <button
          key={o.id}
          onClick={() => onChange(o.id)}
          className={`px-3 py-1.5 rounded-md text-xs font-medium tracking-wide transition-colors duration-150 ${
            mode === o.id
              ? "bg-amber-500 text-stone-900"
              : "text-stone-400 hover:text-stone-200"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
