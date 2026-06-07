"use client";

import { useState } from "react";
import Fretboard from "@/components/Fretboard";
import ExerciseHub from "@/components/ExerciseHub";
import ExerciseResults from "@/components/ExerciseResults";
import TriadMap from "@/components/TriadMap";
import BluesTrainer from "@/components/BluesTrainer";
import { useExerciseStore } from "@/store/exerciseStore";

type Tab = "interval" | "triad" | "blues";

const TABS: { id: Tab; label: string }[] = [
  { id: "interval", label: "Interval Trainer" },
  { id: "triad",    label: "Triad Map" },
  { id: "blues",    label: "Blues Trainer" },
];

export default function Home() {
  const [activeTab, setActiveTab] = useState<Tab>("interval");
  const stopped = useExerciseStore((s) => s.stopped);

  return (
    <main className="min-h-screen flex flex-col items-center justify-start px-4 py-10 gap-8">
      <header className="text-center">
        <h1 className="text-2xl font-semibold tracking-widest uppercase text-amber-200/80">
          Guitar Trainer
        </h1>
      </header>

      {/* Tab bar */}
      <div className="flex border-b border-stone-700/60 self-stretch max-w-5xl w-full">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-5 py-2 text-sm font-mono tracking-wide transition-all duration-150 border-b-2 -mb-px ${
              activeTab === tab.id
                ? "text-amber-200 border-amber-400"
                : "text-stone-400 border-transparent hover:text-stone-200"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === "interval" ? (
        <>
          <Fretboard />
          <ExerciseHub />
          {stopped && <ExerciseResults />}
        </>
      ) : activeTab === "triad" ? (
        <TriadMap />
      ) : (
        <BluesTrainer />
      )}
    </main>
  );
}
