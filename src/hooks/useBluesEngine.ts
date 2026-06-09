"use client";

import { useEffect, useRef } from "react";
import { useBluesStore } from "@/store/bluesStore";
import { getChordForBar, getChordVoicing } from "@/lib/music/blues";
import { generateBarPhrase, type SoloRhythm } from "@/lib/music/soloGenerator";

export function useBluesEngine() {
  const {
    key, bpm, durationSeconds, isPlaying,
    setCurrentBar, setCurrentBeat, setElapsedSeconds,
    setIsCountIn, setCountInBeat, setActiveSoloNote, stop,
  } = useBluesStore();

  const synthsRef = useRef<{
    chord: import("tone").PolySynth | null;
    click: import("tone").MembraneSynth | null;
    solo:  import("tone").Synth | null;
    reverb: import("tone").Reverb | null;
    soloFx: import("tone").Reverb | null;
  }>({ chord: null, click: null, solo: null, reverb: null, soloFx: null });

  // Ref mirror of solo-related settings so the transport callback always reads current values
  const soloRef = useRef({
    enabled:   false,
    rhythm:    "shuffle" as SoloRhythm,
    fretStart: 0,
    fretEnd:   4,
    strStart:  0,
    strEnd:    5,
    key:       "A" as import("@/lib/music/notes").Note,
  });

  // Keep soloRef in sync without restarting the transport
  useEffect(() => {
    const unsub = useBluesStore.subscribe((s) => {
      soloRef.current = {
        enabled:   s.soloEnabled,
        rhythm:    s.soloRhythm,
        fretStart: s.fretStart,
        fretEnd:   s.fretEnd,
        strStart:  s.stringStart,
        strEnd:    s.stringEnd,
        key:       s.key,
      };
    });
    return unsub;
  }, []);

  // Create synths once on mount
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

      const soloFx = new Tone.Reverb({ decay: 1.8, wet: 0.3 }).toDestination();
      const solo = new Tone.Synth({
        oscillator: { type: "sawtooth" as const },
        envelope: { attack: 0.008, decay: 0.25, sustain: 0.35, release: 0.9 },
        volume: -7,
      });
      solo.connect(soloFx);

      synthsRef.current = { chord, click, solo, reverb, soloFx };
    });

    return () => {
      disposed = true;
      synthsRef.current.chord?.dispose();
      synthsRef.current.click?.dispose();
      synthsRef.current.solo?.dispose();
      synthsRef.current.reverb?.dispose();
      synthsRef.current.soloFx?.dispose();
      synthsRef.current = { chord: null, click: null, solo: null, reverb: null, soloFx: null };
    };
  }, []);

  // Start / stop transport
  useEffect(() => {
    if (!isPlaying) return;

    let cancelled = false;

    import("tone").then((Tone) => {
      if (cancelled) return;

      const transport = Tone.getTransport();
      transport.cancel(0);
      transport.bpm.value = bpm;

      const beatsPerSecond = bpm / 60;
      const secondsPerBeat = 60 / bpm;
      const totalBeats = Math.ceil(durationSeconds * beatsPerSecond);

      let beatIndex = -4; // -4..-1 = count-in

      const id = transport.scheduleRepeat((time) => {
        const { chord: chordSynth, click: clickSynth, solo: soloSynth } = synthsRef.current;

        // ── Count-in ──────────────────────────────────────────────
        if (beatIndex < 0) {
          const countInBeat = beatIndex + 5;
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

        const beat    = (beatIndex % 4) + 1;
        const bar     = (Math.floor(beatIndex / 4) % 12) + 1;
        const elapsed = Math.floor(beatIndex / beatsPerSecond);

        // ── Click ─────────────────────────────────────────────────
        clickSynth?.triggerAttackRelease(
          beat === 1 ? "C2" : "C3",
          "16n", time,
          beat === 1 ? 0.9 : 0.35
        );

        // ── Chord strum on beat 1 ─────────────────────────────────
        if (beat === 1) {
          const chord = getChordForBar(key, bar);
          const voicing = getChordVoicing(chord.root, chord.notes);
          voicing.forEach((note, i) => {
            chordSynth?.triggerAttackRelease(note, "4n", time + i * 0.018, 0.55);
          });

          // ── Solo phrase for this bar ──────────────────────────────
          const solo = soloRef.current;
          if (solo.enabled && soloSynth) {
            const role = bar % 2 === 1 ? "call" : "response";
            const phrase = generateBarPhrase(
              chord.root,
              solo.fretStart, solo.fretEnd,
              solo.strStart, solo.strEnd,
              solo.rhythm,
              role,
            );

            phrase.forEach((n) => {
              const noteTime = time + n.beatOffset * secondsPerBeat;
              soloSynth.triggerAttackRelease(`${n.note}${n.octave}`, n.duration, noteTime, 0.7);

              Tone.getDraw().schedule(() => {
                if (cancelled) return;
                setActiveSoloNote({ stringIndex: n.stringIndex, fretNumber: n.fretNumber });
              }, noteTime);
            });

            // Clear active note at end of bar
            Tone.getDraw().schedule(() => {
              if (cancelled) return;
              setActiveSoloNote(null);
            }, time + 4 * secondsPerBeat - 0.05);
          }
        }

        // ── UI state ──────────────────────────────────────────────
        const capturedBar     = bar;
        const capturedBeat    = beat;
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
