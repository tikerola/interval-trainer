"use client";

import { useEffect, useRef } from "react";
import { useBluesStore } from "@/store/bluesStore";
import { getChordForBar, getChordVoicing } from "@/lib/music/blues";
import { toneDurationToBeats } from "@/lib/music/duration";
import type { SoloNote } from "@/lib/music/soloNote";
import type { TranscribedSolo } from "@/lib/music/solos";

type PlayRange = { bar: number; loop: boolean } | null;

// A note is reached legato (hammer-on/pull-off, or the landing note of a slide) when
// it's on the same string as the previous note with essentially no gap between them —
// the same adjacency test the tab view uses to decide where to draw "h"/"p"/"/". Those
// notes weren't freshly picked, so they should sound quieter than a normal attack.
function isLegatoFrom(prev: SoloNote, n: SoloNote): boolean {
  if (prev.stringIndex !== n.stringIndex) return false;
  const prevEnd = prev.beatOffset + toneDurationToBeats(prev.duration);
  return prev.slideToNext === true || Math.abs(prevEnd - n.beatOffset) < 0.05;
}

// A bar's phrase is chronological across all strings, so a double-stop (two notes at
// the same beatOffset on different strings) sits between a note and its actual
// same-string neighbor. Slide targets and legato detection need the real same-string
// neighbor, not just the adjacent array entry.
function findNextSameString(phrase: SoloNote[], fromIdx: number, stringIndex: number): SoloNote | undefined {
  for (let j = fromIdx + 1; j < phrase.length; j++) {
    if (phrase[j].stringIndex === stringIndex) return phrase[j];
  }
  return undefined;
}
function findPrevSameString(phrase: SoloNote[], fromIdx: number, stringIndex: number): SoloNote | undefined {
  for (let j = fromIdx - 1; j >= 0; j--) {
    if (phrase[j].stringIndex === stringIndex) return phrase[j];
  }
  return undefined;
}

export function useBluesEngine() {
  const {
    bpm, isPlaying,
    setCurrentBar, setCurrentBeat,
    setIsCountIn, setCountInBeat, setActiveSoloNotes, setActiveSoloNoteSecondary, stop,
  } = useBluesStore();

  const synthsRef = useRef<{
    chord:       import("tone").PolySynth | null;
    click:       import("tone").MembraneSynth | null;
    solo:        import("tone").FMSynth | null;   // used for bend/slide (needs frequency ramp)
    solo2:       import("tone").FMSynth | null;   // second voice — for a double-stop bend/slide simultaneous with the first
    soloSampler: import("tone").Sampler | null;   // used for plain notes (real guitar samples)
    reverb:      import("tone").Reverb | null;
    soloFx:      import("tone").Reverb | null;
    soloDist:    import("tone").Distortion | null;
    soloEq:      import("tone").EQ3 | null;
  }>({ chord: null, click: null, solo: null, solo2: null, soloSampler: null, reverb: null, soloFx: null, soloDist: null, soloEq: null });

  // Tracks the last note-time scheduled on each bend/slide voice, so a second
  // bend/slide that lands at the exact same time (a double-stop slide) gets
  // routed to the other voice instead of colliding on the same monophonic synth.
  const lastBendSlideTimeRef = useRef<{ solo: number; solo2: number }>({ solo: -1, solo2: -1 });

  // Flipped to true by the sampler's onload callback
  const samplerLoadedRef = useRef(false);

  // Set true when a cross-bar phrase is playing; tells the next bar's beat-1
  // handler to skip phrase generation so the ongoing phrase isn't interrupted.
  const skipNextBarRef = useRef(false);

  // Ref mirrors of store data the transport callback reads every tick, so switching
  // solos or which bar to play doesn't require tearing down and rebuilding the
  // transport schedule. That matters: the click/solo synths are long-lived across
  // restarts, and Tone.js requires strictly increasing schedule times per synth —
  // rapidly cancelling and rescheduling (e.g. clicking through several bars' loop
  // buttons in a row) could otherwise race against still-in-flight lookahead audio
  // events and throw "start time must be strictly greater than previous start time".
  const soloRef = useRef<TranscribedSolo>(useBluesStore.getState().solo);
  const playRangeRef = useRef<PlayRange>(useBluesStore.getState().playRange);

  useEffect(() => {
    const unsub = useBluesStore.subscribe((s) => {
      soloRef.current = s.solo;
      playRangeRef.current = s.playRange;
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
      const soloVoiceSettings = {
        harmonicity: 3.01,
        modulationIndex: 12,
        oscillator: { type: "triangle" as const },
        envelope: { attack: 0.002, decay: 0.18, sustain: 0.42, release: 1.4 },
        modulation: { type: "square" as const },
        modulationEnvelope: { attack: 0.001, decay: 0.08, sustain: 0.0, release: 0.2 },
        volume: -5,
      };
      const solo = new Tone.FMSynth(soloVoiceSettings);
      solo.connect(soloDist);
      const solo2 = new Tone.FMSynth(soloVoiceSettings);
      solo2.connect(soloDist);

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

      synthsRef.current = { chord, click, solo, solo2, soloSampler, reverb, soloFx, soloDist, soloEq };
    });

    return () => {
      disposed = true;
      synthsRef.current.chord?.dispose();
      synthsRef.current.click?.dispose();
      synthsRef.current.solo?.dispose();
      synthsRef.current.solo2?.dispose();
      synthsRef.current.soloSampler?.dispose();
      synthsRef.current.reverb?.dispose();
      synthsRef.current.soloFx?.dispose();
      synthsRef.current.soloDist?.dispose();
      synthsRef.current.soloEq?.dispose();
      samplerLoadedRef.current = false;
      synthsRef.current = { chord: null, click: null, solo: null, solo2: null, soloSampler: null, reverb: null, soloFx: null, soloDist: null, soloEq: null };
    };
  }, []);

  // Start / stop transport. Only runs on a genuine stop<->play transition — switching
  // which bar plays (or solo<->full) while already playing is handled live below via
  // playRangeRef, without tearing this down.
  useEffect(() => {
    if (!isPlaying) return;

    let cancelled = false;

    import("tone").then((Tone) => {
      if (cancelled) return;

      const transport = Tone.getTransport();
      transport.cancel(0);
      transport.bpm.value = bpm;

      const secondsPerBeat = 60 / bpm;

      let beatIndex = playRangeRef.current ? 0 : -4; // -4..-1 = count-in; bars from the tab jump in immediately
      let activeRangeKey = rangeKey(playRangeRef.current);
      skipNextBarRef.current = false;
      // Stale times from a previous play session would otherwise look like a same-instant
      // collision (or a guaranteed "free" voice) against this session's own time-0-based clock.
      lastBendSlideTimeRef.current = { solo: -1, solo2: -1 };

      const id = transport.scheduleRepeat((time) => {
        try {
          const { chord: chordSynth, click: clickSynth, solo: soloSynth, solo2: soloSynth2, soloSampler } = synthsRef.current;
          const range = playRangeRef.current;

          // The user switched which bar to play (or between a bar and the full solo) —
          // restart cleanly rather than carrying over a stale beat position.
          const key = rangeKey(range);
          if (key !== activeRangeKey) {
            activeRangeKey = key;
            beatIndex = range ? 0 : -4;
            skipNextBarRef.current = false;
          }

          const fullBarCount = soloRef.current.chordProgression.length;
          const barCount = range ? 1 : fullBarCount;
          const rangeStartBar = range?.bar ?? 1;

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

          // ── Single-bar "play once" stops after exactly one pass ────
          if (range && !range.loop && beatIndex >= barCount * 4) {
            Tone.getDraw().schedule(() => { if (!cancelled) stop(); }, time);
            transport.stop(time);
            return;
          }

          const beat = (beatIndex % 4) + 1;
          const bar  = rangeStartBar + (Math.floor(beatIndex / 4) % barCount);

          // ── Click (shuffle swing feel throughout) ──────────────────
          clickSynth?.triggerAttackRelease(
            beat === 1 ? "C2" : "C3",
            "16n", time,
            beat === 1 ? 0.9 : 0.35
          );
          clickSynth?.triggerAttackRelease("C3", "16n", time + secondsPerBeat * (2 / 3), 0.18);

          // ── Chord strum on beat 1 ─────────────────────────────────
          if (beat === 1) {
            const solo = soloRef.current;
            const chord = getChordForBar(solo.key, bar, solo.chordProgression);
            const voicing = getChordVoicing(chord.root, chord.notes);
            voicing.forEach((note, i) => {
              chordSynth?.triggerAttackRelease(note, "4n", time + i * 0.018, 0.55);
            });

            // ── Solo phrase for this bar ──────────────────────────────
            if (soloSynth || soloSampler) {
              if (skipNextBarRef.current) {
                // A cross-bar phrase from the previous bar is still ringing into
                // this bar — don't start a new phrase, just clear the flag.
                skipNextBarRef.current = false;
              } else {
                const phrase = solo.bars.get(bar) ?? [];

                const spansNextBar = phrase.some(n => n.beatOffset >= 4);
                if (spansNextBar) skipNextBarRef.current = true;

                // Open-string MIDI pitches for Hz calculation without Tone.Frequency
                const OPEN_MIDI = [40, 45, 50, 55, 59, 64];
                const midiToHz = (midi: number) => 440 * Math.pow(2, (midi - 69) / 12);

                for (let idx = 0; idx < phrase.length; idx++) {
                  const n = phrase[idx];
                  const noteTime = time + n.beatOffset * secondsPerBeat;
                  const noteDurSec = Tone.Time(n.duration).toSeconds();
                  // Legato notes (hammer-on/pull-off, or a slide's landing note) weren't
                  // freshly picked — play them noticeably softer than a real pick attack.
                  const prevSameString = findPrevSameString(phrase, idx, n.stringIndex);
                  const velocity = prevSameString && isLegatoFrom(prevSameString, n) ? 0.4 : 0.7;

                  // A grace note (or any tightly-spaced note) can have a notated duration
                  // longer than the real gap before the next note on the same string —
                  // a string can't ring two notes at once, so clamp to that gap. This also
                  // keeps Tone.js's per-synth automation timeline strictly increasing.
                  const nextSameString = findNextSameString(phrase, idx, n.stringIndex);
                  const gapSec = nextSameString ? (nextSameString.beatOffset - n.beatOffset) * secondsPerBeat : Infinity;
                  const effectiveDurSec = Math.max(0.02, Math.min(noteDurSec, gapSec - 0.01));

                  // A double-stop is two notes at the same beatOffset (different strings) —
                  // light up all of them together, not just whichever's draw call lands last.
                  const simultaneousNotes = phrase
                    .filter((p) => p.beatOffset === n.beatOffset)
                    .map((p) => ({ stringIndex: p.stringIndex, fretNumber: p.fretNumber }));

                  const sampler = samplerLoadedRef.current ? soloSampler : null;
                  // Anything not going through the (polyphonic) sampler needs a synth voice.
                  // A double-stop (two strings, same instant) needs its own voice — picking
                  // whichever voice's last note didn't land at this exact time.
                  let bendSlideSynth: typeof soloSynth = null;
                  if (!sampler || n.bend || n.slideToNext) {
                    const bendSlideTimes = lastBendSlideTimeRef.current;
                    const useVoice2 = bendSlideTimes.solo === noteTime;
                    bendSlideSynth = useVoice2 ? soloSynth2 : soloSynth;
                    if (useVoice2) bendSlideTimes.solo2 = noteTime;
                    else bendSlideTimes.solo = noteTime;
                  }

                  if (n.bend && bendSlideSynth) {
                    // Play note then ramp pitch upward — guitar bend effect.
                    const startHz = midiToHz(OPEN_MIDI[n.stringIndex] + n.fretNumber);
                    const endHz   = startHz * Math.pow(2, n.bend / 12);
                    bendSlideSynth.triggerAttack(`${n.note}${n.octave}`, noteTime, velocity);
                    bendSlideSynth.frequency.linearRampToValueAtTime(endHz, noteTime + effectiveDurSec * 0.65);
                    bendSlideSynth.triggerRelease(noteTime + effectiveDurSec);

                    // Show the source fret immediately, then light up the bend target
                    // fret (same string, +bend semitones) at 40% through so it appears
                    // as the pitch "arrives" at its destination.
                    Tone.getDraw().schedule(() => {
                      if (cancelled) return;
                      setActiveSoloNotes(simultaneousNotes);
                      setActiveSoloNoteSecondary({
                        stringIndex: n.stringIndex,
                        fretNumber:  n.fretNumber + n.bend!,
                        type: "bend",
                      });
                    }, noteTime + effectiveDurSec * 0.4);

                  } else if (n.slideToNext && bendSlideSynth && nextSameString) {
                    // Slide: attack this note, ramp frequency toward next note's pitch.
                    const endHz = midiToHz(OPEN_MIDI[nextSameString.stringIndex] + nextSameString.fretNumber);
                    bendSlideSynth.triggerAttack(`${n.note}${n.octave}`, noteTime, velocity);
                    bendSlideSynth.frequency.linearRampToValueAtTime(endHz, noteTime + effectiveDurSec);
                    bendSlideSynth.triggerRelease(noteTime + effectiveDurSec);

                    // Show both source and destination immediately so the player
                    // can see where the slide is heading.
                    Tone.getDraw().schedule(() => {
                      if (cancelled) return;
                      setActiveSoloNoteSecondary({
                        stringIndex: nextSameString.stringIndex,
                        fretNumber:  nextSameString.fretNumber,
                        type: "slide",
                      });
                    }, noteTime);

                  } else if (sampler) {
                    // Route plain notes through the sampler (real guitar samples) once it
                    // has finished loading — polyphonic, so no clamping needed here.
                    sampler.triggerAttackRelease(`${n.note}${n.octave}`, n.duration, noteTime, velocity);
                  } else {
                    // Sampler not loaded yet — fall back to the (monophonic) synth voice.
                    bendSlideSynth?.triggerAttackRelease(`${n.note}${n.octave}`, effectiveDurSec, noteTime, velocity);
                  }

                  Tone.getDraw().schedule(() => {
                    if (cancelled) return;
                    setActiveSoloNotes(simultaneousNotes);
                    // Clear secondary when a plain note plays (new phrase)
                    if (!n.bend && !n.slideToNext) setActiveSoloNoteSecondary(null);
                  }, noteTime);
                }

                // Schedule note-display clear: at bar end for normal phrases, or
                // after the last note for cross-bar phrases that span into next bar.
                if (!spansNextBar) {
                  Tone.getDraw().schedule(() => {
                    if (cancelled) return;
                    setActiveSoloNotes([]);
                    setActiveSoloNoteSecondary(null);
                  }, time + 4 * secondsPerBeat - 0.05);
                } else if (phrase.length > 0) {
                  const lastN = phrase[phrase.length - 1];
                  const clearAt = time + lastN.beatOffset * secondsPerBeat
                    + Tone.Time(lastN.duration).toSeconds() + 0.1;
                  Tone.getDraw().schedule(() => {
                    if (cancelled) return;
                    setActiveSoloNotes([]);
                    setActiveSoloNoteSecondary(null);
                  }, clearAt);
                }
              }
            }
          }

          // ── UI state ──────────────────────────────────────────────
          const capturedBar  = bar;
          const capturedBeat = beat;
          Tone.getDraw().schedule(() => {
            if (cancelled) return;
            setIsCountIn(false);
            setCountInBeat(0);
            setCurrentBar(capturedBar);
            setCurrentBeat(capturedBeat);
          }, time);

          beatIndex++;
        } catch (err) {
          // Tone.js can throw if a scheduled time collides with one already committed
          // to a synth's audio-param timeline (e.g. a very rapid stop-then-restart).
          // It's a benign timing race, not corrupted state — skip this tick rather
          // than crashing the page.
          console.warn("useBluesEngine: skipped a tick after a Tone.js scheduling error", err);
        }
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

function rangeKey(range: PlayRange): string {
  return range ? `${range.bar}:${range.loop}` : "full";
}
