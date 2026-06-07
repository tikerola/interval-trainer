"use client";

import { useEffect, useRef } from "react";
import { useBluesStore } from "@/store/bluesStore";
import { getChordForBar, getChordVoicing } from "@/lib/music/blues";

export function useBluesEngine() {
  const {
    key, bpm, durationSeconds, isPlaying,
    setCurrentBar, setCurrentBeat, setElapsedSeconds,
    setIsCountIn, setCountInBeat, stop,
  } = useBluesStore();

  const synthsRef = useRef<{
    chord: import("tone").PolySynth | null;
    click: import("tone").MembraneSynth | null;
    reverb: import("tone").Reverb | null;
  }>({ chord: null, click: null, reverb: null });

  // Create synths once on mount, tear down on unmount
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

      synthsRef.current = { chord, click, reverb };
    });

    return () => {
      disposed = true;
      synthsRef.current.chord?.dispose();
      synthsRef.current.click?.dispose();
      synthsRef.current.reverb?.dispose();
      synthsRef.current = { chord: null, click: null, reverb: null };
    };
  }, []);

  // Start / stop the transport when isPlaying changes
  useEffect(() => {
    if (!isPlaying) return;

    let cancelled = false;

    import("tone").then((Tone) => {
      if (cancelled) return;

      const transport = Tone.getTransport();
      transport.cancel(0);
      transport.bpm.value = bpm;

      const beatsPerSecond = bpm / 60;
      const totalBeats = Math.ceil(durationSeconds * beatsPerSecond);

      // beatIndex -4..-1 = one-bar count-in, 0+ = actual progression
      let beatIndex = -4;

      const id = transport.scheduleRepeat((time) => {
        const { chord: chordSynth, click: clickSynth } = synthsRef.current;

        if (beatIndex < 0) {
          // Count-in: click only, no chord
          const countInBeat = beatIndex + 5; // -4→1, -3→2, -2→3, -1→4
          clickSynth?.triggerAttackRelease("C2", "16n", time, 0.9);

          Tone.getDraw().schedule(() => {
            if (cancelled) return;
            setIsCountIn(true);
            setCountInBeat(countInBeat);
          }, time);

          beatIndex++;
          return;
        }

        if (beatIndex >= totalBeats) {
          Tone.getDraw().schedule(() => { stop(); }, time);
          transport.stop(time);
          return;
        }

        const beat = (beatIndex % 4) + 1;
        const bar = (Math.floor(beatIndex / 4) % 12) + 1;
        const elapsed = Math.floor(beatIndex / beatsPerSecond);

        // Click: downbeat louder
        clickSynth?.triggerAttackRelease(
          beat === 1 ? "C2" : "C3",
          "16n",
          time,
          beat === 1 ? 0.9 : 0.35
        );

        // Chord strum on beat 1
        if (beat === 1) {
          const chord = getChordForBar(key, bar);
          const voicing = getChordVoicing(chord.root, chord.notes);
          voicing.forEach((note, i) => {
            chordSynth?.triggerAttackRelease(note, "4n", time + i * 0.018, 0.55);
          });
        }

        const capturedBar = bar;
        const capturedBeat = beat;
        const capturedElapsed = elapsed;
        Tone.getDraw().schedule(() => {
          if (cancelled) return;
          setIsCountIn(false);
          setCountInBeat(0);
          setCurrentBar(capturedBar);
          setCurrentBeat(capturedBeat);
          setElapsedSeconds(capturedElapsed);
        }, time);

        beatIndex++;
      }, "4n");

      Tone.start().then(() => {
        if (cancelled) return;
        transport.start();
      });

      return id;
    });

    return () => {
      cancelled = true;
      import("tone").then((Tone) => {
        const transport = Tone.getTransport();
        transport.stop();
        transport.cancel(0);
      });
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlaying]);
}
