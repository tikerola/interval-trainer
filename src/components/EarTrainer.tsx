"use client";

import { useEffect, useState } from "react";
import { useShallow } from "zustand/react/shallow";
import {
  useEarTrainerStore,
  CHORD_TONES,
  PENTATONIC_DEGREES,
  type EarTrainerMode,
} from "@/store/earTrainerStore";
import { useEarTrainerEngine } from "@/hooks/useEarTrainerEngine";
import { INTERVALS } from "@/lib/music/intervals";
import { STRING_LABELS, getNoteAtPosition } from "@/lib/music/notes";

const TIMER_OPTIONS = [
  { value: 0, label: "Off" },
  { value: 3, label: "3s" },
  { value: 5, label: "5s" },
  { value: 8, label: "8s" },
  { value: 12, label: "12s" },
];

const MODE_OPTIONS: { value: EarTrainerMode; label: string }[] = [
  { value: "single", label: "Single Note" },
  { value: "progression", label: "Chord Resolution" },
  { value: "scale", label: "Ear Training" },
];

export default function EarTrainer() {
  useEarTrainerEngine();

  const [revealed, setRevealed] = useState(false);

  const {
    active,
    mode,
    intervalSemitones,
    randomizeInterval,
    startDegreeSemitones,
    randomizeStartDegree,
    chordToneSemitones,
    randomizeChordTone,
    timerSeconds,
    rootNote,
    targetChordRoot,
    chordMoveLabel,
    stringIndex,
    runFrets,
    runDegreeIndices,
    roundId,
    timeLeft,
    setMode,
    setIntervalSemitones,
    setRandomizeInterval,
    setStartDegreeSemitones,
    setRandomizeStartDegree,
    setChordToneSemitones,
    setRandomizeChordTone,
    setTimerSeconds,
    start,
    stop,
  } = useEarTrainerStore(
    useShallow((s) => ({
      active: s.active,
      mode: s.mode,
      intervalSemitones: s.intervalSemitones,
      randomizeInterval: s.randomizeInterval,
      startDegreeSemitones: s.startDegreeSemitones,
      randomizeStartDegree: s.randomizeStartDegree,
      chordToneSemitones: s.chordToneSemitones,
      randomizeChordTone: s.randomizeChordTone,
      timerSeconds: s.timerSeconds,
      rootNote: s.rootNote,
      targetChordRoot: s.targetChordRoot,
      chordMoveLabel: s.chordMoveLabel,
      stringIndex: s.stringIndex,
      runFrets: s.runFrets,
      runDegreeIndices: s.runDegreeIndices,
      roundId: s.roundId,
      timeLeft: s.timeLeft,
      setMode: s.setMode,
      setIntervalSemitones: s.setIntervalSemitones,
      setRandomizeInterval: s.setRandomizeInterval,
      setStartDegreeSemitones: s.setStartDegreeSemitones,
      setRandomizeStartDegree: s.setRandomizeStartDegree,
      setChordToneSemitones: s.setChordToneSemitones,
      setRandomizeChordTone: s.setRandomizeChordTone,
      setTimerSeconds: s.setTimerSeconds,
      start: s.start,
      stop: s.stop,
    }))
  );

  // Hide the revealed notes whenever a new round starts.
  useEffect(() => {
    setRevealed(false);
  }, [roundId]);

  const selectedInterval = INTERVALS.find((i) => i.semitones === intervalSemitones);
  const selectedChordTone = CHORD_TONES.find((t) => t.semitones === chordToneSemitones);
  const runDegreeLabels = runDegreeIndices.map((i) => PENTATONIC_DEGREES[i]?.degree ?? "?");
  const scaleNoteNames = runFrets.map((fret) => getNoteAtPosition(stringIndex, fret).note);
  const isProgression = mode === "progression";
  const isScale = mode === "scale";

  return (
    <div className="w-full max-w-5xl">
      <div className="rounded-xl border border-stone-700/60 bg-stone-900/80 px-6 py-5">
        <h2 className="text-xs font-semibold tracking-widest uppercase text-stone-400 mb-5">
          Fretboard Recall
        </h2>

        <div className="flex flex-wrap items-end gap-6">
          {/* Mode */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-stone-500 tracking-wide">Mode</label>
            <select
              value={mode}
              onChange={(e) => setMode(e.target.value as EarTrainerMode)}
              disabled={active}
              className="bg-stone-800 border border-stone-700 text-amber-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500/60 disabled:opacity-50 cursor-pointer min-w-[150px]"
            >
              {MODE_OPTIONS.map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </div>

          {/* Interval (Single Note) / Start Degree (Chord Resolution) — Ear Training has no manual controls, everything is randomized */}
          {isProgression ? (
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-stone-500 tracking-wide">Start Degree</label>
              <select
                value={randomizeStartDegree ? "random" : startDegreeSemitones}
                onChange={(e) => {
                  const v = e.target.value;
                  if (v === "random") {
                    setRandomizeStartDegree(true);
                  } else {
                    setRandomizeStartDegree(false);
                    setStartDegreeSemitones(Number(v));
                  }
                }}
                disabled={active}
                className="bg-stone-800 border border-stone-700 text-amber-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500/60 disabled:opacity-50 cursor-pointer min-w-[140px]"
              >
                <option value="random">Random</option>
                {PENTATONIC_DEGREES.map((d) => (
                  <option key={d.semitones} value={d.semitones}>{d.label}</option>
                ))}
              </select>
            </div>
          ) : !isScale ? (
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
          ) : null}

          {/* Resolution chord tone — Chord Resolution mode only */}
          {isProgression && (
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-stone-500 tracking-wide">To Chord Tone</label>
              <select
                value={randomizeChordTone ? "random" : chordToneSemitones}
                onChange={(e) => {
                  const v = e.target.value;
                  if (v === "random") {
                    setRandomizeChordTone(true);
                  } else {
                    setRandomizeChordTone(false);
                    setChordToneSemitones(Number(v));
                  }
                }}
                disabled={active}
                className="bg-stone-800 border border-stone-700 text-amber-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500/60 disabled:opacity-50 cursor-pointer min-w-[140px]"
              >
                <option value="random">Random</option>
                {CHORD_TONES.map((t) => (
                  <option key={t.semitones} value={t.semitones}>{t.label}</option>
                ))}
              </select>
            </div>
          )}

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

        {/* Chord Resolution visual aid — spoken prompt only names the string,
            so the degree/chord info that's too dense to track by ear is read
            off this card instead: "C: 3, 5, 6 → F: 3" plus the progression
            move (I → IV, etc.) so the harmonic context is clear at a glance. */}
        {active && isProgression && (
          <div className="mt-4 flex flex-wrap items-center gap-3 rounded-lg border border-stone-700/50 bg-stone-800/50 px-4 py-3">
            <span className="font-mono text-lg tracking-wide flex items-center gap-2">
              <span className="text-amber-300 font-semibold">{rootNote}</span>
              <span className="text-stone-500">:</span>
              <span className="text-stone-200">{runDegreeLabels.join(", ")}</span>
              <span className="text-stone-500 px-1">&rarr;</span>
              <span className="text-amber-300 font-semibold">{targetChordRoot}</span>
              <span className="text-stone-500">:</span>
              <span className="text-stone-200">{selectedChordTone?.degree}</span>
            </span>
            <span className="text-[11px] tracking-wide text-stone-500 border border-stone-700/60 rounded px-2 py-0.5">
              {chordMoveLabel}
            </span>
          </div>
        )}

        {/* Ear Training reveal — the run plays fully blind (no note names spoken
            or shown), this lets you check your answer afterward on demand. */}
        {active && isScale && (
          <div className="mt-4 flex items-center gap-2 rounded-lg border border-stone-700/50 bg-stone-800/50 px-4 py-3">
            <span className="text-xs text-stone-500">Notes played:</span>
            <span
              className="font-mono text-lg tracking-wide text-stone-200 select-none transition-all duration-200"
              style={{ filter: revealed ? "none" : "blur(6px)" }}
            >
              {scaleNoteNames.join(", ")}
            </span>
            <button
              onClick={() => setRevealed((v) => !v)}
              className="text-[10px] tracking-wide text-stone-500 hover:text-stone-300 transition-colors duration-150 px-1 py-0.5"
            >
              {revealed ? "hide" : "show"}
            </button>
          </div>
        )}

        {/* Active round hint — no target note revealed, ear is the only judge */}
        {active && (
          <p className="mt-4 text-xs text-stone-500">
            {isScale ? "Listen on" : "Find it on"} the{" "}
            <span className="text-amber-300 font-medium">{STRING_LABELS[stringIndex]}</span> string
            {mode === "single" && (
              <>
                &nbsp;&mdash;&nbsp;{selectedInterval?.label} of{" "}
                <span className="text-amber-300 font-medium">{rootNote}</span>
              </>
            )}
            . Press <span className="text-stone-300">Space</span> for the next one.
          </p>
        )}
      </div>
    </div>
  );
}
