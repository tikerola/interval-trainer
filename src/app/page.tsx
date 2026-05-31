"use client";

import Fretboard from "@/components/Fretboard";
import ExerciseHub from "@/components/ExerciseHub";
import ExerciseResults from "@/components/ExerciseResults";
import { useExerciseStore } from "@/store/exerciseStore";

export default function Home() {
  const stopped = useExerciseStore((s) => s.stopped);

  return (
    <main className="min-h-screen flex flex-col items-center justify-start px-4 py-10 gap-10">
      <header className="text-center">
        <h1 className="text-2xl font-semibold tracking-widest uppercase text-amber-200/80">
          Guitar Trainer
        </h1>
      </header>

      <Fretboard />
      <ExerciseHub />
      {stopped && <ExerciseResults />}
    </main>
  );
}
