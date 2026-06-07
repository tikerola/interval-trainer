"use client";

import { useMemo } from "react";
import { NOTES } from "@/lib/music/notes";
import { useBluesStore } from "@/store/bluesStore";
import { useBluesEngine } from "@/hooks/useBluesEngine";
import { getChordForBar, BLUES_PROGRESSION, DURATION_OPTIONS, FRET_PRESETS } from "@/lib/music/blues";
import BluesFretboard from "./BluesFretboard";

const ALL_STRINGS = [
  { label: "All (1–6)", start: 0, end: 5 },
  { label: "Low (1–3)", start: 0, end: 2 },
  { label: "Mid (2–5)", start: 1, end: 4 },
  { label: "High (4–6)", start: 3, end: 5 },
] as const;

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function BpmStepper() {
  const { bpm, setBpm, isPlaying } = useBluesStore();
  return (
    <div className="flex items-center gap-1">
      <button
        disabled={isPlaying || bpm <= 40}
        onClick={() => setBpm(Math.max(40, bpm - 5))}
        className="w-7 h-7 rounded bg-stone-800 text-stone-300 hover:bg-stone-700 disabled:opacity-30 font-mono text-sm transition-colors"
      >−</button>
      <span className="w-14 text-center font-mono text-sm text-stone-200">{bpm} BPM</span>
      <button
        disabled={isPlaying || bpm >= 220}
        onClick={() => setBpm(Math.min(220, bpm + 5))}
        className="w-7 h-7 rounded bg-stone-800 text-stone-300 hover:bg-stone-700 disabled:opacity-30 font-mono text-sm transition-colors"
      >+</button>
    </div>
  );
}

export default function BluesTrainer() {
  useBluesEngine();

  const {
    key, bpm, durationSeconds, fretStart, fretEnd, stringStart, stringEnd,
    isPlaying, isCountIn, countInBeat, currentBar, currentBeat, elapsedSeconds,
    setKey, setDuration, setFretRange, setStringRange, setIsPlaying, stop,
  } = useBluesStore();

  const currentChord = useMemo(() => getChordForBar(key, currentBar), [key, currentBar]);

  const nextBarIndex = (currentBar % 12); // 0-indexed next bar (wraps to 0 = bar 1)
  const nextDegree = BLUES_PROGRESSION[nextBarIndex];
  const showNextChord = nextDegree !== BLUES_PROGRESSION[currentBar - 1];
  const nextChord = useMemo(
    () => getChordForBar(key, nextBarIndex === 0 ? 1 : nextBarIndex + 1),
    [key, nextBarIndex]
  );

  const remaining = Math.max(0, durationSeconds - elapsedSeconds);
  const activeStringPreset = ALL_STRINGS.find((s) => s.start === stringStart && s.end === stringEnd);
  const activeFretPreset = FRET_PRESETS.find((p) => p.start === fretStart && p.end === fretEnd);

  return (
    <div className="w-full max-w-5xl flex flex-col gap-6">

      {/* Session header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        {/* Key selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-stone-400 uppercase tracking-widest font-mono">Key</span>
          <div className="flex flex-wrap gap-1">
            {NOTES.map((n) => (
              <button
                key={n}
                onClick={() => !isPlaying && setKey(n)}
                disabled={isPlaying}
                className={`px-2.5 py-1 rounded font-mono text-xs transition-all duration-150 ${
                  key === n
                    ? "bg-amber-400 text-stone-900 font-bold"
                    : "bg-stone-800 text-stone-300 hover:bg-stone-700 disabled:opacity-40"
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        {/* BPM + Timer */}
        <div className="flex items-center gap-6">
          <BpmStepper />
          <div className="text-right">
            <div className="text-2xl font-mono text-stone-200 tabular-nums">
              {isPlaying ? formatTime(remaining) : formatTime(durationSeconds)}
            </div>
            <div className="text-[10px] text-stone-500 uppercase tracking-widest font-mono">
              {isPlaying ? "remaining" : "duration"}
            </div>
          </div>
        </div>
      </div>

      {/* Chord display */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div>
            <div
              className="text-5xl font-black font-mono tabular-nums tracking-tight transition-all duration-300"
              style={{ color: isPlaying ? "#fbbf24" : "rgba(251,191,36,0.35)" }}
            >
              {currentChord.name}
            </div>
            <div className="text-xs text-stone-500 font-mono uppercase tracking-widest mt-0.5">
              current chord
            </div>
          </div>

          {showNextChord && isPlaying && (
            <div className="animate-pulse">
              <div className="text-2xl font-bold font-mono text-stone-400">
                → {nextChord.name}
              </div>
              <div className="text-xs text-stone-600 font-mono uppercase tracking-widest mt-0.5">
                next
              </div>
            </div>
          )}
        </div>

        <div className="text-right">
          <div className="text-xl font-mono text-stone-400">
            {isCountIn ? (
              <span className="text-stone-500 tracking-widest text-sm">COUNT IN</span>
            ) : isPlaying ? (
              <>
                <span className="text-stone-200">Bar {currentBar}</span>
                <span className="text-stone-600"> / 12</span>
              </>
            ) : (
              <span className="text-stone-600">— / 12</span>
            )}
          </div>
          {(isCountIn || isPlaying) && (
            <div className="flex gap-1 justify-end mt-1">
              {[1, 2, 3, 4].map((b) => {
                const active = isCountIn ? b === countInBeat : b === currentBeat;
                const color = isCountIn ? "rgba(255,255,255,0.7)" : "#fbbf24";
                const glow = isCountIn ? "0 0 6px rgba(255,255,255,0.5)" : "0 0 6px rgba(251,191,36,0.8)";
                return (
                  <div
                    key={b}
                    className="w-2 h-2 rounded-full transition-all duration-75"
                    style={{
                      background: active ? color : "rgba(255,255,255,0.1)",
                      boxShadow: active ? glow : "none",
                    }}
                  />
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Fretboard */}
      <BluesFretboard
        keyNote={key}
        chordNotes={currentChord.notes}
        fretStart={fretStart}
        fretEnd={fretEnd}
        stringStart={stringStart}
        stringEnd={stringEnd}
      />

      {/* Controls */}
      <div className="flex flex-wrap gap-x-8 gap-y-4 items-start">

        {/* Duration */}
        <div className="flex flex-col gap-2">
          <span className="text-xs text-stone-400 uppercase tracking-widest font-mono">Duration</span>
          <div className="flex gap-1.5">
            {DURATION_OPTIONS.map((d) => (
              <button
                key={d.seconds}
                disabled={isPlaying}
                onClick={() => setDuration(d.seconds)}
                className={`px-3 py-1.5 rounded font-mono text-xs transition-all duration-150 ${
                  durationSeconds === d.seconds
                    ? "bg-stone-500 text-stone-100 font-bold"
                    : "bg-stone-800 text-stone-400 hover:bg-stone-700 disabled:opacity-40"
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>

        {/* Fret range */}
        <div className="flex flex-col gap-2">
          <span className="text-xs text-stone-400 uppercase tracking-widest font-mono">Fret Range</span>
          <div className="flex gap-1.5">
            {FRET_PRESETS.map((p) => (
              <button
                key={p.label}
                onClick={() => setFretRange(p.start, p.end)}
                className={`px-3 py-1.5 rounded font-mono text-xs transition-all duration-150 ${
                  activeFretPreset?.label === p.label
                    ? "bg-stone-500 text-stone-100 font-bold"
                    : "bg-stone-800 text-stone-400 hover:bg-stone-700"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* String range */}
        <div className="flex flex-col gap-2">
          <span className="text-xs text-stone-400 uppercase tracking-widest font-mono">Strings</span>
          <div className="flex gap-1.5">
            {ALL_STRINGS.map((s) => (
              <button
                key={s.label}
                onClick={() => setStringRange(s.start, s.end)}
                className={`px-3 py-1.5 rounded font-mono text-xs transition-all duration-150 ${
                  activeStringPreset?.label === s.label
                    ? "bg-stone-500 text-stone-100 font-bold"
                    : "bg-stone-800 text-stone-400 hover:bg-stone-700"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Start / Stop */}
      <div className="flex gap-3">
        {!isPlaying ? (
          <button
            onClick={() => setIsPlaying(true)}
            className="px-8 py-3 rounded bg-amber-400 text-stone-900 font-bold font-mono tracking-wide hover:bg-amber-300 transition-colors text-sm"
          >
            ▶ Start Session
          </button>
        ) : (
          <button
            onClick={() => stop()}
            className="px-8 py-3 rounded bg-stone-700 text-stone-200 font-bold font-mono tracking-wide hover:bg-stone-600 transition-colors text-sm"
          >
            ■ Stop
          </button>
        )}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-x-5 gap-y-1.5 text-[10px] font-mono text-stone-500">
        <span><span className="text-amber-400">●</span> Root</span>
        <span><span className="text-sky-400">●</span> 3rd</span>
        <span><span className="text-emerald-400">●</span> 5th</span>
        <span><span className="text-orange-400">●</span> b7</span>
        <span><span className="text-fuchsia-400">●</span> Blue note</span>
        <span><span className="text-amber-400/40">●</span> Maj pentatonic</span>
        <span><span className="text-indigo-400/60">●</span> Min pentatonic</span>
      </div>

    </div>
  );
}
