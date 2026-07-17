"use client";

import { useShallow } from "zustand/react/shallow";
import { useEarTrainerStore } from "@/store/earTrainerStore";
import { useEarTrainerEngine } from "@/hooks/useEarTrainerEngine";
import { INTERVALS } from "@/lib/music/intervals";
import { STRING_LABELS } from "@/lib/music/notes";

const TIMER_OPTIONS = [
  { value: 0, label: "Off" },
  { value: 3, label: "3s" },
  { value: 5, label: "5s" },
  { value: 8, label: "8s" },
  { value: 12, label: "12s" },
];

export default function EarTrainer() {
  useEarTrainerEngine();

  const {
    active,
    intervalSemitones,
    randomizeInterval,
    timerSeconds,
    rootNote,
    stringIndex,
    timeLeft,
    setIntervalSemitones,
    setRandomizeInterval,
    setTimerSeconds,
    start,
    stop,
  } = useEarTrainerStore(
    useShallow((s) => ({
      active: s.active,
      intervalSemitones: s.intervalSemitones,
      randomizeInterval: s.randomizeInterval,
      timerSeconds: s.timerSeconds,
      rootNote: s.rootNote,
      stringIndex: s.stringIndex,
      timeLeft: s.timeLeft,
      setIntervalSemitones: s.setIntervalSemitones,
      setRandomizeInterval: s.setRandomizeInterval,
      setTimerSeconds: s.setTimerSeconds,
      start: s.start,
      stop: s.stop,
    }))
  );

  const selectedInterval = INTERVALS.find((i) => i.semitones === intervalSemitones);

  return (
    <div className="w-full max-w-5xl">
      <div className="rounded-xl border border-stone-700/60 bg-stone-900/80 px-6 py-5">
        <h2 className="text-xs font-semibold tracking-widest uppercase text-stone-400 mb-5">
          Ear Training
        </h2>

        <div className="flex flex-wrap items-end gap-6">
          {/* Interval */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-stone-500 tracking-wide">Interval</label>
            <select
              value={randomizeInterval ? "random" : intervalSemitones}
              onChange={(e) => {
                const v = e.target.value;
                if (v === "random") {
                  setRandomizeInterval(true);
                } else {
                  setRandomizeInterval(false);
                  setIntervalSemitones(Number(v));
                }
              }}
              disabled={active}
              className="bg-stone-800 border border-stone-700 text-amber-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500/60 disabled:opacity-50 cursor-pointer min-w-[140px]"
            >
              <option value="random">Random</option>
              {INTERVALS.map((i) => (
                <option key={i.semitones} value={i.semitones}>{i.label}</option>
              ))}
            </select>
          </div>

          {/* Timer */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-stone-500 tracking-wide">Timer</label>
            <select
              value={timerSeconds}
              onChange={(e) => setTimerSeconds(Number(e.target.value))}
              disabled={active}
              className="bg-stone-800 border border-stone-700 text-amber-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500/60 disabled:opacity-50 cursor-pointer min-w-[90px]"
            >
              {TIMER_OPTIONS.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          <div className="flex-1" />

          {/* Countdown */}
          {active && (
            <div className="flex flex-col gap-1.5 items-center">
              <label className="text-xs text-stone-500 tracking-wide">Time</label>
              <div className="text-2xl font-bold tabular-nums min-w-[3rem] text-center text-amber-300">
                {timeLeft >= 0 ? timeLeft : "–"}
              </div>
            </div>
          )}

          {/* Start / Stop button */}
          {!active ? (
            <button
              onClick={start}
              className="px-5 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-stone-900 font-semibold text-sm transition-colors duration-150 shadow-[0_0_20px_rgba(245,158,11,0.3)]"
            >
              Start Listening
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

        {/* Active round hint — no target note revealed, ear is the only judge */}
        {active && (
          <p className="mt-4 text-xs text-stone-500">
            Find it on the{" "}
            <span className="text-amber-300 font-medium">{STRING_LABELS[stringIndex]}</span> string
            &nbsp;&mdash;&nbsp;{selectedInterval?.label} of{" "}
            <span className="text-amber-300 font-medium">{rootNote}</span>.{" "}
            Press <span className="text-stone-300">Space</span> for the next one.
          </p>
        )}
      </div>
    </div>
  );
}
