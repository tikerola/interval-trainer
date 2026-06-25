"use client";

import { useMemo, useCallback, useState, useEffect, useRef } from "react";
import { NOTES, getNoteAtPosition } from "@/lib/music/notes";
import {
  usePhraseBuilderStore, DURATION_LABELS, AVAILABLE_DURATIONS,
  SLOTS_PER_BAR, SLOTS_PER_BEAT,
  snapToNearestDuration,
  type BluesDegree, type NoteDuration, type PhraseGrid,
} from "@/store/phraseBuilderStore";
import { usePhraseBuilderEngine } from "@/hooks/usePhraseBuilderEngine";
import { getChordAtSlot, getSectionStartSlot, getTotalSlots } from "@/lib/music/phraseBuilder";
import { useBluesStore } from "@/store/bluesStore";
import BluesFretboard from "./BluesFretboard";
import PhraseTimeline from "./PhraseTimeline";
import SoloPlayerPanel from "./SoloPlayerPanel";

const DEGREE_OPTIONS: { value: BluesDegree; label: string }[] = [
  { value: 1, label: "I" },
  { value: 4, label: "IV" },
  { value: 5, label: "V" },
];

function BpmStepper() {
  const { bpm, setBpm, isPlaying } = usePhraseBuilderStore();
  return (
    <div className="flex items-center gap-1">
      <button
        disabled={isPlaying || bpm <= 40}
        onClick={() => setBpm(Math.max(40, bpm - 5))}
        className="w-7 h-7 rounded bg-stone-800 text-stone-300 hover:bg-stone-700 disabled:opacity-30 font-mono text-sm transition-colors"
      >−</button>
      <span className="w-14 text-center font-mono text-sm text-stone-200 tabular-nums">{bpm} BPM</span>
      <button
        disabled={isPlaying || bpm >= 220}
        onClick={() => setBpm(Math.min(220, bpm + 5))}
        className="w-7 h-7 rounded bg-stone-800 text-stone-300 hover:bg-stone-700 disabled:opacity-30 font-mono text-sm transition-colors"
      >+</button>
    </div>
  );
}

// Shows each section as a labeled block; highlights the currently playing section+bar during jam
function ChordProgressionBar({
  sections,
  phraseGrid,
  playheadSlot,
  isPlaying,
  keyNote,
}: {
  sections: ReturnType<typeof usePhraseBuilderStore.getState>["sections"];
  phraseGrid: PhraseGrid;
  playheadSlot: number;
  isPlaying: boolean;
  keyNote: string;
}) {
  const spb = SLOTS_PER_BAR[phraseGrid];
  const totalSlots = getTotalSlots(sections, phraseGrid);

  return (
    <div className="flex gap-0.5">
      {sections.map((sec, sIdx) => {
        const secStart = getSectionStartSlot(sections, sIdx, phraseGrid);
        const secSlots = sec.bars * spb;
        const isCurrent = isPlaying && playheadSlot >= secStart && playheadSlot < secStart + secSlots;
        const barInSection = isCurrent ? Math.floor((playheadSlot - secStart) / spb) : -1;
        const chord = getChordAtSlot(keyNote as Parameters<typeof getChordAtSlot>[0], sections, secStart, phraseGrid);

        const secEnd = secStart + secSlots;
        const progress = !isPlaying ? 0
          : isCurrent ? (playheadSlot - secStart) / secSlots
          : playheadSlot >= secEnd ? 1
          : 0;

        return (
          <div
            key={sec.id}
            className={`flex-1 rounded px-2 py-1.5 border transition-all duration-200 ${
              isCurrent
                ? "bg-amber-400/15 border-amber-400/50"
                : "bg-stone-800/40 border-stone-700/30"
            }`}
            style={{ flex: `${secSlots / totalSlots}` }}
          >
            <div className={`text-base font-bold font-mono leading-tight ${isCurrent ? "text-amber-300" : "text-stone-500"}`}>
              {chord.name}
            </div>
            <div className="text-[9px] font-mono text-stone-600 mt-0.5">
              {isCurrent ? `bar ${barInSection + 1} / ${sec.bars}` : `× ${sec.bars}`}
            </div>
            <div className="mt-1.5 h-1 rounded-full bg-stone-700/60 overflow-hidden">
              <div
                className="h-full rounded-full transition-[width] duration-75"
                style={{
                  width: `${progress * 100}%`,
                  background: isCurrent ? "#fbbf24" : "#78716c",
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function bendFromDelta(px: number): number {
  return px >= 65 ? 2 : px >= 25 ? 1 : 0;
}
function bendLabel(bend: number): string {
  return bend === 2 ? "1" : bend === 1 ? "½" : "";
}

function TapPad({ bpm, phraseGrid, playheadSlot, totalSlots, onTap }: {
  bpm: number;
  phraseGrid: PhraseGrid;
  playheadSlot: number;
  totalSlots: number;
  onTap: (slot: number, durationSlots: number, duration: NoteDuration, bend: number) => void;
}) {
  const tapRef = useRef<{ startTime: number; startSlot: number; startY: number } | null>(null);
  const [isHeld, setIsHeld] = useState(false);
  const [dragUp, setDragUp] = useState(0);
  const playheadRef = useRef(playheadSlot);
  useEffect(() => { playheadRef.current = playheadSlot; }, [playheadSlot]);

  const press = useCallback((clientY: number) => {
    tapRef.current = { startTime: Date.now(), startSlot: playheadRef.current, startY: clientY };
    setIsHeld(true);
    setDragUp(0);
  }, []);

  const move = useCallback((clientY: number) => {
    if (!tapRef.current) return;
    setDragUp(Math.max(0, tapRef.current.startY - clientY));
  }, []);

  const release = useCallback((clientY: number) => {
    if (!tapRef.current) return;
    const { startTime, startSlot, startY } = tapRef.current;
    tapRef.current = null;
    setIsHeld(false);
    setDragUp(0);
    const bend = bendFromDelta(Math.max(0, startY - clientY));
    const msPerSlot = (60000 / bpm) / SLOTS_PER_BEAT[phraseGrid];
    const rawSlots = (Date.now() - startTime) / msPerSlot;
    const capped = Math.max(1, Math.min(rawSlots, totalSlots - (startSlot % totalSlots)));
    const { duration, slots } = snapToNearestDuration(capped, phraseGrid);
    onTap(startSlot % totalSlots, slots, duration, bend);
  }, [bpm, phraseGrid, totalSlots, onTap]);

  const currentBend = bendFromDelta(dragUp);

  return (
    <div
      className={`w-full rounded-xl flex flex-col items-center justify-center gap-1 select-none cursor-ns-resize transition-all duration-75 relative ${
        isHeld
          ? "bg-amber-400/20 border-2 border-amber-400 shadow-lg shadow-amber-400/15 scale-[0.985]"
          : "bg-stone-800/60 border-2 border-stone-600/40 hover:border-stone-500 hover:bg-stone-800/80"
      }`}
      style={{ height: "88px" }}
      onMouseDown={(e) => press(e.clientY)}
      onMouseMove={(e) => move(e.clientY)}
      onMouseUp={(e) => release(e.clientY)}
      onMouseLeave={(e) => release(e.clientY)}
      onTouchStart={(e) => { e.preventDefault(); press(e.touches[0].clientY); }}
      onTouchMove={(e) => { e.preventDefault(); move(e.touches[0].clientY); }}
      onTouchEnd={(e) => { e.preventDefault(); release(e.changedTouches[0].clientY); }}
    >
      {currentBend > 0 && (
        <span className="absolute top-2 right-3 font-mono text-xs font-bold text-amber-300">
          ↑{bendLabel(currentBend)}
        </span>
      )}
      <span className={`font-mono text-2xl transition-colors leading-none ${isHeld ? "text-amber-300" : "text-stone-500"}`}>
        {isHeld ? "●" : "○"}
      </span>
      <span className={`font-mono text-xs uppercase tracking-widest transition-colors ${isHeld ? "text-amber-400" : "text-stone-500"}`}>
        {isHeld
          ? currentBend > 0 ? `bend ${bendLabel(currentBend)} step` : "recording…"
          : "hold to tap · drag up to bend"}
      </span>
    </div>
  );
}

export default function BluesTrainer() {
  const { previewNote } = usePhraseBuilderEngine();
  const [noteDisplay, setNoteDisplay] = useState<"triad" | "pentatonic">("triad");
  const [selectedNoteIds, setSelectedNoteIds] = useState<string[]>([]);

  const {
    key, bpm, mode, phraseGrid, sections, notes, selectedDuration,
    cursorSlot, fretStart, fretEnd, isPlaying, playheadSlot,
    activePhraseNote, recordPhase, pendingSlots, tapPreRollBar,
    setKey, setMode, setGrid, addSection, removeSection, updateSection, setSections,
    setSelectedDuration, setCursorSlot, setFretRange,
    placeNote, removeNote, updateNote, updateNotes, clearNotes,
    setIsPlaying, stop,
    setRecordPhase, addPendingSlot, clearPendingSlots, promotePendingSlot, setTapPreRollBar,
  } = usePhraseBuilderStore();

  const soloIsPlaying = useBluesStore((s) => s.isPlaying);
  const anyPlaying = isPlaying || soloIsPlaying;

  const slotsPerBar  = SLOTS_PER_BAR[phraseGrid];
  const slotsPerBeat = SLOTS_PER_BEAT[phraseGrid];

  const displayChord = useMemo(
    () => getChordAtSlot(key, sections, isPlaying ? playheadSlot : cursorSlot, phraseGrid),
    [key, sections, isPlaying, playheadSlot, cursorSlot, phraseGrid],
  );

  const isEditing = mode === "record" && !isPlaying && recordPhase !== "tapping";

  const selectedNotes = notes.filter((n) => selectedNoteIds.includes(n.id));
  const hasSelection = selectedNotes.length > 0;

  // Duration picker: show the common duration if all selected notes agree, else null (mixed)
  const activeDuration: typeof selectedDuration | null = hasSelection
    ? selectedNotes.every((n) => n.duration === selectedNotes[0].duration)
      ? selectedNotes[0].duration
      : null
    : selectedDuration;

  // Infer grid from a note's duration; ambiguous durations (4n/2n) return null
  const inferGrid = (dur: typeof selectedDuration): PhraseGrid | null =>
    dur === "16t" || dur === "8t" ? "triplet"
    : dur === "16n" || dur === "8n" ? "straight"
    : null;

  // Show the common inferred grid if all selected notes agree, else null (mixed)
  const selectedNoteGrid: PhraseGrid | null = hasSelection
    ? (() => {
        const grids = selectedNotes.map((n) => inferGrid(n.duration));
        const first = grids[0];
        return grids.every((g) => g === first) ? first : null;
      })()
    : null;
  const displayGrid = selectedNoteGrid ?? phraseGrid;

  const totalSlots = useMemo(
    () => sections.reduce((sum, sec) => sum + sec.bars * SLOTS_PER_BAR[phraseGrid], 0),
    [sections, phraseGrid],
  );

  // Exit pitching phase automatically when all pending slots are assigned
  useEffect(() => {
    if (recordPhase === "pitching" && pendingSlots.length === 0) {
      setRecordPhase("idle");
    }
  }, [recordPhase, pendingSlots.length, setRecordPhase]);

  const enterTapPhase = useCallback(() => {
    clearPendingSlots();
    setRecordPhase("tapping");
    setTapPreRollBar(1);
    setIsPlaying(true);
  }, [clearPendingSlots, setRecordPhase, setTapPreRollBar, setIsPlaying]);

  const finishTapping = useCallback(() => {
    stop();
    setRecordPhase(pendingSlots.length > 0 ? "pitching" : "idle");
    if (pendingSlots.length > 0) setCursorSlot(pendingSlots[0].slot);
  }, [stop, setRecordPhase, pendingSlots, setCursorSlot]);

  const handleFretClick = useCallback((stringIndex: number, fretNumber: number) => {
    const { note, octave } = getNoteAtPosition(stringIndex, fretNumber);
    if (recordPhase === "pitching" && pendingSlots.length > 0) {
      const target = pendingSlots[0];
      promotePendingSlot(target.id, fretNumber, stringIndex, note, octave);
      previewNote(note, octave, target.duration);
      if (pendingSlots.length > 1) setCursorSlot(pendingSlots[1].slot);
      return;
    }
    placeNote(fretNumber, stringIndex, note, octave);
    previewNote(note, octave, selectedDuration);
  }, [recordPhase, pendingSlots, promotePendingSlot, placeNote, previewNote, selectedDuration, setCursorSlot]);

  return (
    <div className="w-full max-w-5xl flex flex-col gap-5">

      {/* ── Top row: Key, BPM, Mode ── */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-2">
          <span className="text-xs text-stone-400 uppercase tracking-widest font-mono">Key</span>
          <div className="flex flex-wrap gap-1">
            {NOTES.map((n) => (
              <button
                key={n}
                onClick={() => !anyPlaying && setKey(n)}
                disabled={anyPlaying}
                className={`px-2.5 py-1 rounded font-mono text-xs transition-all duration-150 ${
                  key === n
                    ? "bg-amber-400 text-stone-900 font-bold"
                    : "bg-stone-800 text-stone-300 hover:bg-stone-700 disabled:opacity-40"
                }`}
              >{n}</button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <BpmStepper />
          <div className="flex gap-0.5 p-0.5 bg-stone-800 rounded">
            {(["triad", "pentatonic"] as const).map((d) => (
              <button
                key={d}
                onClick={() => setNoteDisplay(d)}
                className={`px-3 py-1 rounded font-mono text-xs transition-all duration-150 ${
                  noteDisplay === d
                    ? "bg-stone-600 text-stone-100 font-bold"
                    : "text-stone-400 hover:text-stone-200"
                }`}
              >{d === "triad" ? "Triads" : "Pentatonic"}</button>
            ))}
          </div>
          <div className="flex gap-0.5 p-0.5 bg-stone-800 rounded">
            {(["jam", "record", "solo"] as const).map((m) => (
              <button
                key={m}
                disabled={anyPlaying}
                onClick={() => setMode(m)}
                className={`px-3 py-1 rounded font-mono text-xs transition-all duration-150 ${
                  mode === m
                    ? "bg-stone-600 text-stone-100 font-bold"
                    : "text-stone-400 hover:text-stone-200 disabled:opacity-40"
                }`}
              >{m === "jam" ? "Jam" : m === "record" ? "Record" : "Solo"}</button>
            ))}
          </div>
        </div>
      </div>


      {/* ── Section builder ── */}
      {mode !== "solo" && (
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-stone-400 uppercase tracking-widest font-mono">Sections</span>
        <button
          disabled={isPlaying}
          onClick={() => setSections([
            { degree: 1, bars: 4 },
            { degree: 4, bars: 2 },
            { degree: 1, bars: 2 },
            { degree: 5, bars: 1 },
            { degree: 4, bars: 1 },
            { degree: 1, bars: 1 },
            { degree: 5, bars: 1 },
          ])}
          className="px-2.5 py-1 rounded bg-stone-700/60 border border-stone-600/40 text-amber-400/80 hover:text-amber-300 hover:bg-stone-700 font-mono text-xs transition-colors disabled:opacity-30"
          title="Standard 12-bar blues: I×4, IV×2, I×2, V×1, IV×1, I×2"
        >12-bar blues</button>
        {sections.map((sec, idx) => (
          <div key={sec.id} className="flex items-center gap-1 bg-stone-800/70 rounded px-2 py-1 border border-stone-700/40">
            <span className="text-[10px] text-stone-500 font-mono mr-0.5">{idx + 1}.</span>
            <select
              disabled={isPlaying}
              value={sec.degree}
              onChange={(e) => updateSection(sec.id, { degree: Number(e.target.value) as BluesDegree })}
              className="bg-transparent text-amber-300 font-bold font-mono text-xs border-none outline-none cursor-pointer disabled:opacity-40"
            >
              {DEGREE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value} className="bg-stone-900 text-stone-100">{o.label}</option>
              ))}
            </select>
            <button
              disabled={isPlaying || sec.bars <= 1}
              onClick={() => updateSection(sec.id, { bars: sec.bars - 1 })}
              className="w-5 h-5 rounded text-stone-400 hover:text-stone-200 disabled:opacity-30 font-mono text-xs transition-colors"
            >−</button>
            <span className="w-8 text-center font-mono text-xs text-stone-200 tabular-nums">{sec.bars}b</span>
            <button
              disabled={isPlaying || sec.bars >= 4}
              onClick={() => updateSection(sec.id, { bars: sec.bars + 1 })}
              className="w-5 h-5 rounded text-stone-400 hover:text-stone-200 disabled:opacity-30 font-mono text-xs transition-colors"
            >+</button>
            {sections.length > 1 && (
              <button
                disabled={isPlaying}
                onClick={() => removeSection(sec.id)}
                className="ml-0.5 text-stone-600 hover:text-stone-300 disabled:opacity-30 font-mono text-xs transition-colors"
              >×</button>
            )}
          </div>
        ))}
        {sections.length < 8 && (
          <button
            disabled={isPlaying}
            onClick={addSection}
            className="px-2.5 py-1 rounded bg-stone-800/50 border border-stone-700/40 text-stone-400 hover:text-stone-200 font-mono text-xs transition-colors disabled:opacity-30"
          >+ Add</button>
        )}
      </div>
      )}

      {/* ── Jam: chord progression bar ── */}
      {mode === "jam" && (
        <ChordProgressionBar
          sections={sections}
          phraseGrid={phraseGrid}
          playheadSlot={playheadSlot}
          isPlaying={isPlaying}
          keyNote={key}
        />
      )}

      {mode === "solo" ? (
        <SoloPlayerPanel noteDisplay={noteDisplay} />
      ) : (
      <>

      {/* ── Current chord + fret range ── */}
      <div className="flex items-end gap-3">
        <div>
          <div
            className="text-5xl font-black font-mono tracking-tight transition-all duration-200"
            style={{ color: isPlaying ? "#fbbf24" : "rgba(251,191,36,0.45)" }}
          >
            {displayChord.name}
          </div>
          <div className="text-[10px] text-stone-500 font-mono uppercase tracking-widest mt-0.5">
            {isPlaying ? "playing" : mode === "record" ? "at cursor" : "chord"}
          </div>
        </div>
        <div className="ml-auto text-right">
          <div className="text-xs font-mono text-stone-400 tabular-nums">frets {fretStart}–{fretEnd}</div>
          <div className="text-[10px] text-stone-600 font-mono uppercase tracking-widest">drag edges to adjust</div>
        </div>
      </div>

      {/* ── Fretboard ── */}
      <BluesFretboard
        keyNote={key}
        chordNotes={displayChord.notes}
        fretStart={fretStart}
        fretEnd={fretEnd}
        stringStart={0}
        stringEnd={5}
        noteDisplay={noteDisplay}
        activeSoloNote={activePhraseNote}
        activeSoloNoteSecondary={null}
        onFretRangeChange={setFretRange}
        isRecording={isEditing}
        onFretClick={(isEditing || recordPhase === "pitching") ? handleFretClick : undefined}
      />

      {/* ── Record controls ── */}
      {mode === "record" && (
        <div className="pt-1 border-t border-stone-800">

          {/* ── Tapping phase ── */}
          {recordPhase === "tapping" && (
            <div className="flex flex-col gap-3">
              {tapPreRollBar > 0 ? (
                <div
                  className="w-full rounded-xl flex flex-col items-center justify-center gap-1 bg-stone-800/60 border-2 border-stone-700/40"
                  style={{ height: "88px" }}
                >
                  <span className="font-mono text-xs uppercase tracking-widest text-stone-500">Get ready…</span>
                  <span className="font-mono text-4xl font-black text-amber-300 leading-none tabular-nums">
                    {tapPreRollBar}
                  </span>
                  <span className="font-mono text-xs text-stone-500">
                    {tapPreRollBar === 1 ? "bar" : "bars"}
                  </span>
                </div>
              ) : (
                <TapPad
                  bpm={bpm}
                  phraseGrid={phraseGrid}
                  playheadSlot={playheadSlot}
                  totalSlots={totalSlots}
                  onTap={(slot, durationSlots, duration, bend) => addPendingSlot(slot, durationSlots, duration, bend)}
                />
              )}
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-stone-500">
                  {pendingSlots.length === 0 ? "Tap notes above to record rhythm" : `${pendingSlots.length} note${pendingSlots.length !== 1 ? "s" : ""} tapped`}
                </span>
                <div className="ml-auto flex gap-2">
                  {pendingSlots.length > 0 && (
                    <button
                      onClick={clearPendingSlots}
                      className="px-3 py-1.5 rounded bg-stone-800 text-stone-400 font-mono text-xs hover:bg-stone-700 hover:text-stone-200 transition-colors"
                    >
                      Clear
                    </button>
                  )}
                  <button
                    onClick={finishTapping}
                    disabled={pendingSlots.length === 0}
                    className="px-4 py-1.5 rounded bg-amber-500/80 text-stone-900 font-bold font-mono text-xs hover:bg-amber-400 transition-colors disabled:opacity-30"
                  >
                    Assign Pitches →
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── Pitching phase ── */}
          {recordPhase === "pitching" && (
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex flex-col gap-0.5">
                <span className="text-xs text-stone-400 uppercase tracking-widest font-mono">Assign pitch</span>
                <span className="font-mono text-sm text-amber-300">
                  {pendingSlots.length} remaining — click a fret
                </span>
              </div>
              <button
                onClick={() => { stop(); enterTapPhase(); }}
                className="ml-auto px-3 py-1.5 rounded bg-stone-800 text-stone-400 font-mono text-xs hover:bg-stone-700 hover:text-stone-200 transition-colors"
              >
                ← Re-tap
              </button>
            </div>
          )}

          {/* ── Idle / normal step-entry ── */}
          {recordPhase === "idle" && (
            <div className="flex flex-wrap gap-x-8 gap-y-3 items-start">

              {/* Grid / feel */}
              <div className="flex flex-col gap-1.5">
                <span className="text-xs text-stone-400 uppercase tracking-widest font-mono">
                  {hasSelection ? "Feel" : "Grid"}
                </span>
                <div className="flex gap-1">
                  {(["straight", "triplet"] as PhraseGrid[]).map((g) => {
                    const isActive = displayGrid === g;
                    const isNoteGrid = hasSelection && selectedNoteGrid === g;
                    return (
                      <button
                        key={g}
                        disabled={isPlaying}
                        onClick={() => setGrid(g)}
                        className={`px-3 py-1.5 rounded font-mono text-xs transition-all duration-150 ${
                          isActive
                            ? isNoteGrid
                              ? "bg-amber-500/80 text-stone-900 font-bold"
                              : hasSelection
                                ? "bg-stone-500 text-stone-200 font-bold"
                                : "bg-stone-600 text-stone-100 font-bold"
                            : "bg-stone-800 text-stone-400 hover:bg-stone-700 disabled:opacity-40"
                        }`}
                      >
                        {g === "straight" ? "Straight" : "Triplet"}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Note duration */}
              <div className="flex flex-col gap-1.5">
                <span className="text-xs text-stone-400 uppercase tracking-widest font-mono">
                  {hasSelection ? `Edit selected (${selectedNotes.length})` : "Note length"}
                </span>
                <div className="flex gap-1.5">
                  {AVAILABLE_DURATIONS[phraseGrid].map((dur: NoteDuration) => (
                    <button
                      key={dur}
                      disabled={isPlaying}
                      onClick={() => {
                        if (hasSelection) {
                          updateNotes(selectedNoteIds, dur);
                          setSelectedNoteIds([]);
                        } else {
                          setSelectedDuration(dur);
                        }
                      }}
                      className={`px-3 py-1.5 rounded font-mono text-xs transition-all duration-150 ${
                        activeDuration === dur
                          ? hasSelection
                            ? "bg-amber-500/80 text-stone-900 font-bold"
                            : "bg-sky-600/80 text-white font-bold"
                          : "bg-stone-800 text-stone-400 hover:bg-stone-700 disabled:opacity-40"
                      }`}
                    >
                      {DURATION_LABELS[dur]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tap rhythm entry */}
              <div className="flex flex-col gap-1.5 ml-auto">
                <span className="text-xs text-stone-400 uppercase tracking-widest font-mono">Tap rhythm</span>
                <button
                  disabled={isPlaying}
                  onClick={enterTapPhase}
                  className="px-4 py-1.5 rounded bg-stone-700/60 border border-stone-600/50 text-amber-400/80 hover:text-amber-300 hover:bg-stone-700 font-mono text-xs transition-colors disabled:opacity-30"
                  title="Click a slot in the timeline first to set the start position"
                >
                  ● Tap
                </button>
                <span className="text-[10px] font-mono text-stone-600 text-right">
                  click timeline to set start
                </span>
              </div>

              {isEditing && (
                <div className="self-end text-[11px] text-stone-500 font-mono pb-0.5 w-full">
                  Select slot → click fret to place
                </div>
              )}
            </div>
          )}

        </div>
      )}

      {/* ── Timeline ── */}
      {mode === "record" && (
        <PhraseTimeline
          keyNote={key}
          sections={sections}
          notes={notes}
          pendingSlots={pendingSlots}
          activePendingId={recordPhase === "pitching" ? (pendingSlots[0]?.id ?? null) : null}
          phraseGrid={phraseGrid}
          slotsPerBar={slotsPerBar}
          slotsPerBeat={slotsPerBeat}
          cursorSlot={cursorSlot}
          playheadSlot={playheadSlot}
          isPlaying={isPlaying}
          selectedNoteIds={selectedNoteIds}
          onSlotClick={setCursorSlot}
          onNoteSelect={setSelectedNoteIds}
          onNoteRemove={(id) => { removeNote(id); setSelectedNoteIds((prev) => prev.filter((x) => x !== id)); }}
        />
      )}

      {/* ── Legend ── */}
      {mode === "record" && (
        <div className="flex flex-wrap gap-x-5 gap-y-1 text-[10px] font-mono text-stone-500">
          <span><span className="text-amber-500">●</span> Root</span>
          <span><span className="text-sky-500">●</span> 3rd</span>
          <span><span className="text-emerald-600">●</span> 5th</span>
          {noteDisplay === "pentatonic" && <>
            <span><span className="text-orange-500">●</span> b7</span>
            <span><span className="text-fuchsia-600">●</span> Blue notes</span>
            <span><span className="text-stone-500">●</span> Outside</span>
          </>}
        </div>
      )}

      {/* ── Play / Stop / Clear ── */}
      <div className="flex gap-2 items-center">
        {!isPlaying ? (
          <button
            onClick={() => { setSelectedNoteIds([]); setIsPlaying(true); }}
            className="px-8 py-3 rounded bg-amber-400 text-stone-900 font-bold font-mono tracking-wide hover:bg-amber-300 transition-colors text-sm"
          >
            ▶ {mode === "jam" ? "Start Jam" : "Play Back"}
          </button>
        ) : (
          <button
            onClick={stop}
            className="px-8 py-3 rounded bg-stone-700 text-stone-200 font-bold font-mono tracking-wide hover:bg-stone-600 transition-colors text-sm"
          >
            ■ Stop
          </button>
        )}
        {mode === "record" && notes.length > 0 && !isPlaying && (
          <button
            onClick={clearNotes}
            className="px-4 py-3 rounded bg-stone-800 text-stone-400 font-mono text-sm hover:bg-stone-700 hover:text-stone-200 transition-colors"
          >
            Clear
          </button>
        )}
      </div>

      </>
      )}

    </div>
  );
}
