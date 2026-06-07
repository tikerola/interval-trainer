"use client";

import { useEffect, useMemo } from "react";
import { NOTES } from "@/lib/music/notes";
import { useTriadStore } from "@/store/triadStore";
import { getDiatonicTriads } from "@/lib/music/triads";
import { SCALES, isHeptatonic } from "@/lib/music/scales";
import { CAGED_SHAPES, getCagedBox } from "@/lib/music/caged";
import TriadFretboard from "./TriadFretboard";

const QUALITY_ABBREV = {
  major: "maj",
  minor: "min",
  diminished: "dim",
  augmented: "aug",
} as const;

export default function TriadMap() {
  const {
    selectedKey, selectedScale, selectedDegree,
    labelMode, showScale, selectedCagedShape,
    setKey, setScale, setDegree, setLabelMode, setShowScale, setCagedShape,
  } = useTriadStore();

  const heptatonic = isHeptatonic(selectedScale);
  const triads = useMemo(
    () => (heptatonic ? getDiatonicTriads(selectedKey, selectedScale) : []),
    [selectedKey, selectedScale, heptatonic]
  );
  const activeTriad = selectedDegree !== null
    ? triads.find((t) => t.degree === selectedDegree)
    : null;

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
      e.preventDefault();
      if (selectedCagedShape === null) {
        setCagedShape(e.key === "ArrowRight" ? CAGED_SHAPES[0] : CAGED_SHAPES[CAGED_SHAPES.length - 1]);
        return;
      }
      const idx = CAGED_SHAPES.indexOf(selectedCagedShape);
      const next = e.key === "ArrowRight"
        ? CAGED_SHAPES[(idx + 1) % CAGED_SHAPES.length]
        : CAGED_SHAPES[(idx - 1 + CAGED_SHAPES.length) % CAGED_SHAPES.length];
      setCagedShape(next);
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedCagedShape, setCagedShape]);

  return (
    <div className="w-full max-w-5xl flex flex-col gap-6">
      <TriadFretboard />

      <div className="flex flex-col gap-5 p-5 rounded-xl border border-stone-700/50 bg-stone-900/60">

        {/* Scale selector */}
        <div className="flex flex-col gap-2" data-testid="section-scale">
          <span className="text-xs text-stone-400 uppercase tracking-widest font-mono">Scale</span>
          <div className="flex flex-wrap gap-1.5">
            {SCALES.map((scale) => (
              <button
                key={scale.name}
                onClick={() => setScale(scale)}
                className={`px-3 py-1.5 rounded text-sm font-mono transition-all duration-150 ${
                  selectedScale.name === scale.name
                    ? "bg-amber-400 text-stone-900 font-bold"
                    : "bg-stone-800 text-stone-300 hover:bg-stone-700 hover:text-stone-100"
                }`}
              >
                {scale.name}
              </button>
            ))}
          </div>
        </div>

        {/* Key selector */}
        <div className="flex flex-col gap-2" data-testid="section-key">
          <span className="text-xs text-stone-400 uppercase tracking-widest font-mono">Key</span>
          <div className="flex flex-wrap gap-1.5">
            {NOTES.map((note) => (
              <button
                key={note}
                onClick={() => setKey(note)}
                className={`w-11 py-1.5 rounded text-sm font-mono transition-all duration-150 text-center ${
                  selectedKey === note
                    ? "bg-amber-400 text-stone-900 font-bold"
                    : "bg-stone-800 text-stone-300 hover:bg-stone-700 hover:text-stone-100"
                }`}
              >
                {note}
              </button>
            ))}
          </div>
        </div>

        {/* Chord degree selector — only for heptatonic scales */}
        {heptatonic && (
          <div className="flex flex-col gap-2" data-testid="section-chord">
            <span className="text-xs text-stone-400 uppercase tracking-widest font-mono">Chord</span>
            <div className="flex flex-wrap gap-1.5">
              {triads.map((triad) => (
                <button
                  key={triad.degree}
                  data-degree={triad.degree}
                  onClick={() => setDegree(triad.degree)}
                  className={`flex flex-col items-center px-3 py-2 rounded text-sm font-mono transition-all duration-150 min-w-[56px] ${
                    selectedDegree === triad.degree
                      ? "bg-amber-400 text-stone-900 font-bold"
                      : "bg-stone-800 text-stone-300 hover:bg-stone-700 hover:text-stone-100"
                  }`}
                >
                  <span>{triad.label}</span>
                  <span
                    className={`text-[9px] mt-0.5 ${
                      selectedDegree === triad.degree ? "opacity-70" : "opacity-50"
                    }`}
                  >
                    {triad.notes[0]} {QUALITY_ABBREV[triad.quality]}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* CAGED box selector */}
        <div className="flex flex-col gap-2" data-testid="section-caged">
          <span className="text-xs text-stone-400 uppercase tracking-widest font-mono">CAGED Box</span>
          <div className="flex flex-wrap gap-1.5">
            {CAGED_SHAPES.map((shape) => {
              const box = getCagedBox(selectedKey, shape, selectedScale);
              return (
                <button
                  key={shape}
                  onClick={() => setCagedShape(shape)}
                  className={`flex flex-col items-center px-3 py-2 rounded font-mono transition-all duration-150 min-w-[52px] ${
                    selectedCagedShape === shape
                      ? "bg-sky-400 text-stone-900 font-bold"
                      : "bg-stone-800 text-stone-300 hover:bg-stone-700 hover:text-stone-100"
                  }`}
                >
                  <span className="text-sm">{shape}</span>
                  <span className={`text-[9px] mt-0.5 ${selectedCagedShape === shape ? "opacity-70" : "opacity-50"}`}>
                    {box.start}–{box.end}
                  </span>
                </button>
              );
            })}
            {selectedCagedShape !== null && (
              <button
                onClick={() => setCagedShape(null)}
                className="flex flex-col items-center justify-center px-3 py-2 rounded font-mono transition-all duration-150 min-w-[52px] bg-stone-800 text-stone-400 hover:bg-stone-700 hover:text-stone-200"
                title="Clear CAGED highlight"
              >
                <span className="text-sm">✕</span>
                <span className="text-[9px] mt-0.5 opacity-50">none</span>
              </button>
            )}
          </div>
        </div>

        {/* View + Label toggles */}
        <div className="flex items-center gap-6 flex-wrap">
          {heptatonic && (
            <div className="flex items-center gap-3" data-testid="section-view">
              <span className="text-xs text-stone-400 uppercase tracking-widest font-mono">View</span>
              <div className="flex rounded overflow-hidden border border-stone-700/60">
                {([false, true] as const).map((scale) => (
                  <button
                    key={String(scale)}
                    onClick={() => setShowScale(scale)}
                    className={`px-3 py-1 text-xs font-mono transition-all duration-150 ${
                      showScale === scale
                        ? "bg-amber-400 text-stone-900 font-bold"
                        : "bg-stone-800 text-stone-400 hover:text-stone-200"
                    }`}
                  >
                    {scale ? "Scale" : "Triad"}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center gap-3" data-testid="section-labels">
            <span className="text-xs text-stone-400 uppercase tracking-widest font-mono">Labels</span>
            <div className="flex rounded overflow-hidden border border-stone-700/60">
              {(["note", "degree"] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setLabelMode(mode)}
                  className={`px-3 py-1 text-xs font-mono transition-all duration-150 ${
                    labelMode === mode
                      ? "bg-amber-400 text-stone-900 font-bold"
                      : "bg-stone-800 text-stone-400 hover:text-stone-200"
                  }`}
                >
                  {mode === "note" ? "C E G" : "1 3 5"}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Info bar + legend */}
        <div className="flex items-center justify-between flex-wrap gap-3 pt-3 border-t border-stone-700/40" data-testid="info-bar">
          <div className="text-sm font-mono">
            {activeTriad ? (
              <span>
                <span className="text-amber-200 font-semibold">
                  {activeTriad.notes[0]} {activeTriad.quality}
                </span>
                <span className="text-stone-500 ml-2">
                  ({activeTriad.label} of {selectedKey} {selectedScale.name})
                </span>
                <span className="text-stone-400 ml-3">
                  {activeTriad.notes[0]} · {activeTriad.notes[1]} · {activeTriad.notes[2]}
                </span>
              </span>
            ) : (
              <span className="text-stone-500">
                {selectedKey} {selectedScale.name}
                {heptatonic ? " — select a chord above" : ""}
              </span>
            )}
          </div>

          <div className="flex gap-4 text-[11px] font-mono text-stone-400 shrink-0">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block" />Root
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-sky-400 inline-block" />Third
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block" />Fifth
            </span>
          </div>
        </div>

      </div>
    </div>
  );
}
