"use client";

import { useShallow } from "zustand/react/shallow";
import { useExerciseStore } from "@/store/exerciseStore";

export default function ExerciseResults() {
  const { points, mistakes, startedAt, stoppedAt, reset, startExercise } = useExerciseStore(
    useShallow((s) => ({
      points: s.points,
      mistakes: s.mistakes,
      startedAt: s.startedAt,
      stoppedAt: s.stoppedAt,
      reset: s.reset,
      startExercise: s.startExercise,
    }))
  );

  const elapsedMs = stoppedAt - startedAt;
  const seconds = Math.floor(elapsedMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const timeStr = minutes > 0 ? `${minutes}m ${seconds % 60}s` : `${seconds}s`;
  const totalAttempts = points + mistakes;
  const accuracy = totalAttempts > 0 ? Math.round((points / totalAttempts) * 100) : 100;

  return (
    <div className="w-full max-w-5xl">
      <div className="rounded-xl border border-stone-700/40 bg-stone-900/60 px-6 py-6">
        <div className="flex flex-wrap items-center gap-8">
          <div>
            <p className="text-xs text-stone-400/70 tracking-widest uppercase mb-1">
              Session Complete
            </p>
            <p className="text-stone-500 text-sm">
              Here's how you did
            </p>
          </div>

          <div className="flex gap-6">
            <Stat label="Points" value={String(points)} accent />
            <Stat label="Accuracy" value={`${accuracy}%`} accent={accuracy >= 90} />
            <Stat label="Mistakes" value={String(mistakes)} />
            <Stat label="Time" value={timeStr} />
          </div>

          <div className="flex gap-3 ml-auto">
            <button
              onClick={() => { reset(); startExercise(); }}
              className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-stone-900 font-semibold text-sm transition-colors"
            >
              Play Again
            </button>
            <button
              onClick={reset}
              className="px-4 py-2 rounded-lg border border-stone-600 hover:border-stone-400 text-stone-400 hover:text-stone-200 text-sm transition-colors"
            >
              Reset
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="text-center">
      <p className="text-xs text-stone-500 tracking-wide mb-0.5">{label}</p>
      <p className={`text-xl font-bold ${accent ? "text-amber-300" : "text-stone-300"}`}>
        {value}
      </p>
    </div>
  );
}
