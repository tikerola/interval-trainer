"use client";

import { useEffect, useRef, useCallback } from "react";
import { usePhraseBuilderStore, SLOTS_PER_BAR, SLOTS_PER_BEAT } from "@/store/phraseBuilderStore";
import { getChordAtSlot, getTotalSlots } from "@/lib/music/phraseBuilder";
import { getChordVoicing } from "@/lib/music/blues";

export function usePhraseBuilderEngine() {
  const { isPlaying, setPlayheadSlot, setActivePhraseNote, stop } = usePhraseBuilderStore();

  const synthsRef = useRef<{
    chord:       import("tone").PolySynth | null;
    click:       import("tone").MembraneSynth | null;
    solo:        import("tone").FMSynth | null;
    soloSampler: import("tone").Sampler | null;
    reverb:      import("tone").Reverb | null;
    soloFx:      import("tone").Reverb | null;
    soloDist:    import("tone").Distortion | null;
    soloEq:      import("tone").EQ3 | null;
  }>({ chord: null, click: null, solo: null, soloSampler: null,
       reverb: null, soloFx: null, soloDist: null, soloEq: null });

  const samplerLoadedRef = useRef(false);

  useEffect(() => {
    let disposed = false;

    import("tone").then((Tone) => {
      if (disposed) return;

      const reverb = new Tone.Reverb({ decay: 1.2, wet: 0.25 }).toDestination();
      const chord = new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: "triangle" as const },
        envelope: { attack: 0.01, decay: 0.6, sustain: 0.05, release: 2 },
        volume: -12,
      });
      chord.connect(reverb);

      const click = new Tone.MembraneSynth({
        pitchDecay: 0.02,
        octaves: 4,
        envelope: { attack: 0.001, decay: 0.08, sustain: 0, release: 0.1 },
        volume: -4,
      }).toDestination();

      const soloFx   = new Tone.Reverb({ decay: 2.2, wet: 0.22 }).toDestination();
      const soloEq   = new Tone.EQ3({ low: -6, mid: 5, high: -3 });
      const soloDist = new Tone.Distortion({ distortion: 0.18, oversample: "4x" as const, wet: 0.45 });
      soloDist.connect(soloEq);
      soloEq.connect(soloFx);

      const solo = new Tone.FMSynth({
        harmonicity: 3.01,
        modulationIndex: 12,
        oscillator: { type: "triangle" as const },
        envelope: { attack: 0.002, decay: 0.18, sustain: 0.42, release: 1.4 },
        modulation: { type: "square" as const },
        modulationEnvelope: { attack: 0.001, decay: 0.08, sustain: 0.0, release: 0.2 },
        volume: -5,
      });
      solo.connect(soloDist);

      const soloSampler = new Tone.Sampler({
        urls: {
          A2: "A2.mp3", A3: "A3.mp3", A4: "A4.mp3", A5: "A5.mp3",
          E2: "E2.mp3", E3: "E3.mp3", E4: "E4.mp3",
          G3: "G3.mp3", G4: "G4.mp3",
          B3: "B3.mp3", D3: "D3.mp3", D4: "D4.mp3",
        },
        baseUrl: "https://nbrosowsky.github.io/tonejs-instruments/samples/guitar-electric/",
        release: 1.5,
        volume: -3,
        onload: () => { samplerLoadedRef.current = true; },
      });
      soloSampler.connect(soloDist);

      synthsRef.current = { chord, click, solo, soloSampler, reverb, soloFx, soloDist, soloEq };
    });

    return () => {
      disposed = true;
      const s = synthsRef.current;
      s.chord?.dispose(); s.click?.dispose(); s.solo?.dispose();
      s.soloSampler?.dispose(); s.reverb?.dispose(); s.soloFx?.dispose();
      s.soloDist?.dispose(); s.soloEq?.dispose();
      samplerLoadedRef.current = false;
      synthsRef.current = { chord: null, click: null, solo: null, soloSampler: null,
                            reverb: null, soloFx: null, soloDist: null, soloEq: null };
    };
  }, []);

  const previewNote = useCallback((note: string, octave: number, duration: string) => {
    import("tone").then(async (Tone) => {
      await Tone.start();
      const { solo: soloSynth, soloSampler } = synthsRef.current;
      const player = samplerLoadedRef.current && soloSampler ? soloSampler : soloSynth;
      player?.triggerAttackRelease(`${note}${octave}`, duration);
    });
  }, []);

  useEffect(() => {
    if (!isPlaying) return;

    let cancelled = false;
    const state = usePhraseBuilderStore.getState();
    const { key, bpm, mode, sections, notes, phraseGrid } = state;

    const slotsPerBar  = SLOTS_PER_BAR[phraseGrid];
    const slotsPerBeat = SLOTS_PER_BEAT[phraseGrid];
    const tickDuration = phraseGrid === "straight" ? "16n" : "16t";
    const totalSlots   = getTotalSlots(sections, phraseGrid);

    if (totalSlots === 0) { stop(); return; }

    import("tone").then((Tone) => {
      if (cancelled) return;

      const transport = Tone.getTransport();
      transport.cancel(0);
      transport.bpm.value = bpm;

      let slotIndex = 0;

      const id = transport.scheduleRepeat((time) => {
        const { chord: chordSynth, click: clickSynth, solo: soloSynth, soloSampler } = synthsRef.current;
        const currentSlot = slotIndex % totalSlots;

        // Click on every beat
        if (currentSlot % slotsPerBeat === 0) {
          const beatInBar = Math.floor((currentSlot % slotsPerBar) / slotsPerBeat);
          clickSynth?.triggerAttackRelease(
            beatInBar === 0 ? "C2" : "C3",
            "16n", time,
            beatInBar === 0 ? 0.9 : 0.35,
          );
        }

        // Chord strum at each bar start
        if (currentSlot % slotsPerBar === 0) {
          const chord = getChordAtSlot(key, sections, currentSlot, phraseGrid);
          const voicing = getChordVoicing(chord.root, chord.notes);
          voicing.forEach((n, i) => {
            chordSynth?.triggerAttackRelease(n, "2n", time + i * 0.018, 0.5);
          });
        }

        // User notes (record mode only)
        if (mode === "record") {
          for (const n of notes) {
            if (n.slot === currentSlot) {
              const player = samplerLoadedRef.current && soloSampler ? soloSampler : soloSynth;
              player?.triggerAttackRelease(`${n.note}${n.octave}`, n.duration, time, 0.75);

              Tone.getDraw().schedule(() => {
                if (cancelled) return;
                setActivePhraseNote({ stringIndex: n.stringIndex, fretNumber: n.fretNumber });
              }, time);

              const durSec = Tone.Time(n.duration).toSeconds();
              Tone.getDraw().schedule(() => {
                if (cancelled) return;
                setActivePhraseNote(null);
              }, time + durSec);
            }
          }
        }

        const capturedSlot = currentSlot;
        Tone.getDraw().schedule(() => {
          if (cancelled) return;
          setPlayheadSlot(capturedSlot);
        }, time);

        slotIndex++;
      }, tickDuration);

      Tone.start().then(() => {
        if (cancelled) return;
        transport.start();
      });

      return id;
    });

    return () => {
      cancelled = true;
      import("tone").then((Tone) => {
        Tone.getTransport().stop();
        Tone.getTransport().cancel(0);
      });
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlaying]);

  return { previewNote };
}
