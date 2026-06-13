"use client";

import { useEffect, useRef } from "react";
import { useBluesStore } from "@/store/bluesStore";
import { getChordForBar, getChordVoicing } from "@/lib/music/blues";
import { generateBarPhrase, type SoloRhythm } from "@/lib/music/soloGenerator";

export function useBluesEngine() {
  const {
    key, bpm, durationSeconds, isPlaying,
    setCurrentBar, setCurrentBeat, setElapsedSeconds,
    setIsCountIn, setCountInBeat, setActiveSoloNote, setActiveSoloNoteSecondary, stop,
  } = useBluesStore();

  const synthsRef = useRef<{
    chord:       import("tone").PolySynth | null;
    click:       import("tone").MembraneSynth | null;
    solo:        import("tone").FMSynth | null;   // used for bend/slide (needs frequency ramp)
    soloSampler: import("tone").Sampler | null;   // used for plain notes (real guitar samples)
    reverb:      import("tone").Reverb | null;
    soloFx:      import("tone").Reverb | null;
    soloDist:    import("tone").Distortion | null;
    soloEq:      import("tone").EQ3 | null;
  }>({ chord: null, click: null, solo: null, soloSampler: null, reverb: null, soloFx: null, soloDist: null, soloEq: null });

  // Flipped to true by the sampler's onload callback
  const samplerLoadedRef = useRef(false);

  // Set true when a cross-bar phrase is playing; tells the next bar's beat-1
  // handler to skip phrase generation so the ongoing phrase isn't interrupted.
  const skipNextBarRef = useRef(false);

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

      // ── Solo effects chain (shared by both FMSynth and Sampler) ──
      // Light overdrive gives the "hair" blues guitar always has.
      // EQ cuts low mud and pushes mid-presence where guitar lives.
      const soloFx   = new Tone.Reverb({ decay: 2.2, wet: 0.22 }).toDestination();
      const soloEq   = new Tone.EQ3({ low: -6, mid: 5, high: -3 });
      const soloDist = new Tone.Distortion({ distortion: 0.18, oversample: "4x" as const, wet: 0.45 });
      soloDist.connect(soloEq);
      soloEq.connect(soloFx);

      // FMSynth for bend / slide articulations.
      // The modulator envelope decays to zero sustain — this makes the FM
      // harmonics strongest at the pick attack then fade to a cleaner tone,
      // which is exactly how a plucked string behaves.
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

      // Sampler with real electric-guitar samples for plain notes.
      // Falls back silently to FMSynth until all buffers finish loading.
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
      synthsRef.current.chord?.dispose();
      synthsRef.current.click?.dispose();
      synthsRef.current.solo?.dispose();
      synthsRef.current.soloSampler?.dispose();
      synthsRef.current.reverb?.dispose();
      synthsRef.current.soloFx?.dispose();
      synthsRef.current.soloDist?.dispose();
      synthsRef.current.soloEq?.dispose();
      samplerLoadedRef.current = false;
      synthsRef.current = { chord: null, click: null, solo: null, soloSampler: null, reverb: null, soloFx: null, soloDist: null, soloEq: null };
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
      skipNextBarRef.current = false;

      const id = transport.scheduleRepeat((time) => {
        const { chord: chordSynth, click: clickSynth, solo: soloSynth, soloSampler } = synthsRef.current;

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
          if (solo.enabled && (soloSynth || soloSampler)) {
            if (skipNextBarRef.current) {
              // A cross-bar phrase from the previous bar is still ringing into
              // this bar — don't start a new phrase, just clear the flag.
              skipNextBarRef.current = false;
            } else {
              const role = bar % 2 === 1 ? "call" : "response";
              const phrase = generateBarPhrase(
                chord.root,
                chord.degree,
                solo.fretStart, solo.fretEnd,
                solo.strStart, solo.strEnd,
                solo.rhythm,
                role,
              );

              const spansNextBar = phrase.some(n => n.beatOffset >= 4);
              if (spansNextBar) skipNextBarRef.current = true;

              // Open-string MIDI pitches for Hz calculation without Tone.Frequency
              const OPEN_MIDI = [40, 45, 50, 55, 59, 64];
              const midiToHz = (midi: number) => 440 * Math.pow(2, (midi - 69) / 12);

              for (let idx = 0; idx < phrase.length; idx++) {
                const n = phrase[idx];
                const noteTime = time + n.beatOffset * secondsPerBeat;
                const noteDurSec = Tone.Time(n.duration).toSeconds();

                if (n.bend && soloSynth) {
                  // Play note then ramp pitch upward — guitar bend effect.
                  const startHz = midiToHz(OPEN_MIDI[n.stringIndex] + n.fretNumber);
                  const endHz   = startHz * Math.pow(2, n.bend / 12);
                  soloSynth.triggerAttack(`${n.note}${n.octave}`, noteTime, 0.7);
                  soloSynth.frequency.linearRampToValueAtTime(endHz, noteTime + noteDurSec * 0.65);
                  soloSynth.triggerRelease(noteTime + noteDurSec);

                  // Show the source fret immediately, then light up the bend target
                  // fret (same string, +bend semitones) at 40% through so it appears
                  // as the pitch "arrives" at its destination.
                  Tone.getDraw().schedule(() => {
                    if (cancelled) return;
                    setActiveSoloNote({ stringIndex: n.stringIndex, fretNumber: n.fretNumber });
                    setActiveSoloNoteSecondary({
                      stringIndex: n.stringIndex,
                      fretNumber:  n.fretNumber + n.bend!,
                      type: "bend",
                    });
                  }, noteTime + noteDurSec * 0.4);

                } else if (n.slideToNext && idx < phrase.length - 1 && soloSynth) {
                  // Slide: attack this note, ramp frequency toward next note's pitch.
                  const next  = phrase[idx + 1];
                  const endHz = midiToHz(OPEN_MIDI[next.stringIndex] + next.fretNumber);
                  soloSynth.triggerAttack(`${n.note}${n.octave}`, noteTime, 0.7);
                  soloSynth.frequency.linearRampToValueAtTime(endHz, noteTime + noteDurSec);
                  soloSynth.triggerRelease(noteTime + noteDurSec);

                  // Show both source and destination immediately so the player
                  // can see where the slide is heading.
                  Tone.getDraw().schedule(() => {
                    if (cancelled) return;
                    setActiveSoloNoteSecondary({
                      stringIndex: next.stringIndex,
                      fretNumber:  next.fretNumber,
                      type: "slide",
                    });
                  }, noteTime);

                } else {
                  // Route plain notes through the sampler (real guitar samples)
                  // once it has finished loading; fall back to FMSynth until then.
                  const player = samplerLoadedRef.current && soloSampler ? soloSampler : soloSynth;
                  player?.triggerAttackRelease(`${n.note}${n.octave}`, n.duration, noteTime, 0.7);
                }

                Tone.getDraw().schedule(() => {
                  if (cancelled) return;
                  setActiveSoloNote({ stringIndex: n.stringIndex, fretNumber: n.fretNumber });
                  // Clear secondary when a plain note plays (new phrase)
                  if (!n.bend && !n.slideToNext) setActiveSoloNoteSecondary(null);
                }, noteTime);
              }

              // Schedule note-display clear: at bar end for normal phrases, or
              // after the last note for cross-bar phrases that span into next bar.
              if (!spansNextBar) {
                Tone.getDraw().schedule(() => {
                  if (cancelled) return;
                  setActiveSoloNote(null);
                  setActiveSoloNoteSecondary(null);
                }, time + 4 * secondsPerBeat - 0.05);
              } else if (phrase.length > 0) {
                const lastN = phrase[phrase.length - 1];
                const clearAt = time + lastN.beatOffset * secondsPerBeat
                  + Tone.Time(lastN.duration).toSeconds() + 0.1;
                Tone.getDraw().schedule(() => {
                  if (cancelled) return;
                  setActiveSoloNote(null);
                  setActiveSoloNoteSecondary(null);
                }, clearAt);
              }
            }
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
