"use client";

import { useMemo } from "react";
import { analyzeSolo } from "@/lib/music/analysis";
import type { TranscribedSolo } from "@/lib/music/solos";

function Card({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded border border-stone-700/40 bg-stone-800/40 px-3 py-2.5">
      <div className="text-amber-400/90 font-mono text-[11px] font-bold uppercase tracking-widest mb-1">{title}</div>
      <div className="text-stone-300 text-xs leading-relaxed">{body}</div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="text-stone-400 font-mono text-[10px] uppercase tracking-widest">{title}</div>
      {children}
    </div>
  );
}

export default function SoloAnalysisPanel({ solo }: { solo: TranscribedSolo }) {
  const analysis = useMemo(() => analyzeSolo(solo), [solo]);

  return (
    <div className="flex flex-col gap-5 max-h-[560px] overflow-y-auto pr-1">
      <Section title="Ingredients">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {analysis.cards.map((c) => <Card key={c.title} {...c} />)}
        </div>
      </Section>

      <Section title="Scale usage">
        <div className="flex flex-wrap gap-2">
          {analysis.scaleUsage.fits.map((f) => (
            <div
              key={f.scaleName}
              className={`px-2.5 py-1 rounded font-mono text-xs ${
                f.scaleName === analysis.scaleUsage.bestFit.scaleName
                  ? "bg-amber-400/15 border border-amber-400/40 text-amber-300"
                  : "bg-stone-800/50 border border-stone-700/40 text-stone-400"
              }`}
            >
              {f.scaleName} <span className="tabular-nums">{f.percentInScale}%</span>
            </div>
          ))}
        </div>
      </Section>

      <Section title={`Motifs (${analysis.motifs.length})`}>
        <div className="flex flex-col gap-1.5">
          {analysis.motifs.map((m) => (
            <div key={m.id} className="flex items-center gap-2 text-xs">
              <span className="text-stone-300">{m.description}</span>
              <span className="font-mono text-amber-300/80">bars {m.bars.join(", ")}</span>
            </div>
          ))}
        </div>
      </Section>

      <Section title={`Call & response (${analysis.callResponse.length})`}>
        <div className="flex flex-col gap-1">
          {analysis.callResponse.map((cr, i) => (
            <div key={i} className="text-xs text-stone-300">{cr.explanation}</div>
          ))}
        </div>
      </Section>

      <Section title="Resolution per phrase">
        <div className="flex flex-wrap gap-1">
          {analysis.resolutions.map((r, i) => (
            <span
              key={i}
              title={r.explanation}
              className={`px-2 py-0.5 rounded font-mono text-[10px] cursor-help ${
                r.strength === "strong"
                  ? "bg-emerald-700/30 text-emerald-300"
                  : r.strength === "moderate"
                  ? "bg-sky-700/30 text-sky-300"
                  : "bg-stone-700/40 text-stone-400"
              }`}
            >
              bar {r.phrase.startBar}
            </span>
          ))}
        </div>
      </Section>

      <Section title="Fretboard position">
        <div className="text-xs text-stone-300">
          Primary box: <span className="font-mono text-amber-300">{analysis.position.primaryBox}</span>
          {" · "}frets {analysis.position.fretRange.min}–{analysis.position.fretRange.max}
        </div>
        <div className="flex flex-wrap gap-2">
          {analysis.position.boxesUsed.map((b) => (
            <div key={b.shape} className="px-2 py-0.5 rounded bg-stone-800/50 border border-stone-700/40 font-mono text-[10px] text-stone-400">
              {b.shape} · {b.noteCount}
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
}
