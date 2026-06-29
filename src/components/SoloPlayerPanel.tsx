"use client";

import { useState } from "react";
import { getChordForBar } from "@/lib/music/blues";
import { TRANSCRIBED_SOLOS } from "@/lib/music/solos";
import { useBluesStore } from "@/store/bluesStore";
import { useBluesEngine } from "@/hooks/useBluesEngine";
import BluesFretboard, { FRET_COUNT } from "./BluesFretboard";
import SoloTabView from "./SoloTabView";
import SoloAnalysisPanel from "./SoloAnalysisPanel";

export default function SoloPlayerPanel({
  noteDisplay,
}: {
  noteDisplay: "triad" | "pentatonic";
}) {
  useBluesEngine();
  const [view, setView] = useState<"none" | "tab" | "analysis">("none");

  const {
    solo, bpm, setBpm, loadSolo,
    isPlaying, playRange, playFull, stop,
    isCountIn, countInBeat, currentBar, currentBeat,
    activeSoloNotes, activeSoloNoteSecondary,
  } = useBluesStore();

  const barCount = solo.chordProgression.length;
  const displayBar = isPlaying ? currentBar : 1;
  const chord = getChordForBar(solo.key, displayBar, solo.chordProgression);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="text-xs text-stone-400 uppercase tracking-widest font-mono">Solo Player</div>
          <select
            disabled={isPlaying}
            value={solo.id}
            onChange={(e) => {
              const next = TRANSCRIBED_SOLOS.find((s) => s.id === e.target.value);
              if (next) loadSolo(next);
            }}
            className="bg-transparent text-stone-300 text-[10px] font-mono mt-0.5 border-none outline-none cursor-pointer disabled:opacity-40 -ml-0.5"
          >
            {TRANSCRIBED_SOLOS.map((s) => (
              <option key={s.id} value={s.id} className="bg-stone-900 text-stone-100">
                {s.title} · {s.artist}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <button
            disabled={isPlaying || bpm <= 60}
            onClick={() => setBpm(Math.max(60, bpm - 5))}
            className="w-7 h-7 rounded bg-stone-800 text-stone-300 hover:bg-stone-700 disabled:opacity-30 font-mono text-sm transition-colors"
          >−</button>
          <span className="w-16 text-center font-mono text-xs text-stone-400 tabular-nums">
            {bpm} BPM{bpm !== solo.bpm ? ` (rec. ${solo.bpm})` : ""}
          </span>
          <button
            disabled={isPlaying || bpm >= solo.bpm}
            onClick={() => setBpm(Math.min(solo.bpm, bpm + 5))}
            className="w-7 h-7 rounded bg-stone-800 text-stone-300 hover:bg-stone-700 disabled:opacity-30 font-mono text-sm transition-colors"
          >+</button>
        </div>
      </div>

      <div className="flex items-end gap-3">
        <div>
          <div
            className="text-5xl font-black font-mono tracking-tight transition-all duration-200"
            style={{ color: isPlaying ? "#fbbf24" : "rgba(251,191,36,0.45)" }}
          >
            {chord.name}
          </div>
          <div className="text-[10px] text-stone-500 font-mono uppercase tracking-widest mt-0.5">
            {isCountIn
              ? `count-in ${countInBeat}`
              : isPlaying
              ? playRange
                ? `bar ${currentBar} · beat ${currentBeat} · ${playRange.loop ? "looping" : "once"}`
                : `bar ${currentBar} / ${barCount} · beat ${currentBeat}`
              : "chord"}
          </div>
        </div>
      </div>

      <BluesFretboard
        keyNote={solo.key}
        chordNotes={chord.notes}
        fretStart={0}
        fretEnd={FRET_COUNT}
        stringStart={0}
        stringEnd={5}
        noteDisplay={noteDisplay}
        activeSoloNotes={activeSoloNotes}
        activeSoloNoteSecondary={activeSoloNoteSecondary}
      />

      <div className="flex gap-2 items-center">
        {!isPlaying ? (
          <button
            onClick={playFull}
            className="px-8 py-3 rounded bg-amber-400 text-stone-900 font-bold font-mono tracking-wide hover:bg-amber-300 transition-colors text-sm"
          >
            ▶ Play Solo
          </button>
        ) : (
          <button
            onClick={stop}
            className="px-8 py-3 rounded bg-stone-700 text-stone-200 font-bold font-mono tracking-wide hover:bg-stone-600 transition-colors text-sm"
          >
            ■ Stop
          </button>
        )}
        <span className="text-[10px] font-mono text-stone-600 uppercase tracking-widest">
          {isPlaying && playRange ? `bar ${playRange.bar} only` : "loops continuously"}
        </span>

        <div className="ml-auto flex gap-1.5">
          <button
            onClick={() => setView((v) => (v === "tab" ? "none" : "tab"))}
            className={`px-3 py-1.5 rounded font-mono text-xs transition-colors ${
              view === "tab" ? "bg-stone-600 text-stone-100 font-bold" : "bg-stone-800 text-stone-400 hover:bg-stone-700 hover:text-stone-200"
            }`}
          >Tab</button>
          <button
            onClick={() => setView((v) => (v === "analysis" ? "none" : "analysis"))}
            className={`px-3 py-1.5 rounded font-mono text-xs transition-colors ${
              view === "analysis" ? "bg-stone-600 text-stone-100 font-bold" : "bg-stone-800 text-stone-400 hover:bg-stone-700 hover:text-stone-200"
            }`}
          >Analysis</button>
        </div>
      </div>

      {view === "tab" && (
        <div className="pt-2 border-t border-stone-800">
          <div className="text-xs text-stone-400 uppercase tracking-widest font-mono mb-2">Transcription</div>
          <SoloTabView solo={solo} />
        </div>
      )}

      {view === "analysis" && (
        <div className="pt-2 border-t border-stone-800">
          <div className="text-xs text-stone-400 uppercase tracking-widest font-mono mb-2">Analysis</div>
          <SoloAnalysisPanel solo={solo} />
        </div>
      )}
    </div>
  );
}
