"use client";

import { useEffect, useRef } from "react";
import { useShallow } from "zustand/react/shallow";
import { useEarTrainerStore } from "@/store/earTrainerStore";
import { getNoteAtPosition, findLowestFret, STRING_LABELS } from "@/lib/music/notes";
import { INTERVALS } from "@/lib/music/intervals";
import { CHORD_TONES } from "@/store/earTrainerStore";

// Drives the Fretboard Recall / Ear Training round loop: speaks the prompt,
// plays the note(s) for the round once speech finishes, then (if a timer is
// set) counts down to the next round. Chord Resolution mode speaks the
// string, the two chord roots, and the resolution chord tone (e.g. "from
// the A to the D, 7th") — the run's scale-degree detail is still too dense
// to track by ear and stays on the visual card only. Ear Training (scale)
// mode speaks only the string and key, then plays the key's major triad as
// an arpeggio followed by a blind 4-note major-scale run with no note names
// surfaced anywhere — the actual ear-training exercise.
export function useEarTrainerEngine() {
  const {
    active,
    roundId,
    mode,
    rootNote,
    targetChordRoot,
    stringIndex,
    targetNote,
    runFrets,
    resolutionFret,
    keyFret,
    intervalSemitones,
    chordToneSemitones,
    timerSeconds,
    setTimeLeft,
    nextRound,
  } = useEarTrainerStore(
    useShallow((s) => ({
      active: s.active,
      roundId: s.roundId,
      mode: s.mode,
      rootNote: s.rootNote,
      targetChordRoot: s.targetChordRoot,
      stringIndex: s.stringIndex,
      targetNote: s.targetNote,
      runFrets: s.runFrets,
      resolutionFret: s.resolutionFret,
      keyFret: s.keyFret,
      intervalSemitones: s.intervalSemitones,
      chordToneSemitones: s.chordToneSemitones,
      timerSeconds: s.timerSeconds,
      setTimeLeft: s.setTimeLeft,
      nextRound: s.nextRound,
    }))
  );

  const synthRef = useRef<{
    sampler: import("tone").Sampler | null;
    synth: import("tone").Synth | null;
    reverb: import("tone").Reverb | null;
  }>({ sampler: null, synth: null, reverb: null });
  const samplerLoadedRef = useRef(false);
  const countdownIdRef = useRef<number | null>(null);
  // Bumped every round so async callbacks (speech onend, Tone.start) from a
  // stale round can recognize they're outdated and no-op instead of firing late.
  const tokenRef = useRef(0);

  // Create a single lightweight instrument once, shared across all rounds.
  useEffect(() => {
    let disposed = false;

    import("tone").then((Tone) => {
      if (disposed) return;

      const reverb = new Tone.Reverb({ decay: 1.4, wet: 0.2 }).toDestination();

      const synth = new Tone.Synth({
        oscillator: { type: "triangle" as const },
        envelope: { attack: 0.005, decay: 0.25, sustain: 0.3, release: 1.2 },
        volume: -6,
      });
      synth.connect(reverb);

      const sampler = new Tone.Sampler({
        urls: {
          A2: "A2.mp3", A3: "A3.mp3", A4: "A4.mp3", A5: "A5.mp3",
          E2: "E2.mp3", E3: "E3.mp3", E4: "E4.mp3",
          G3: "G3.mp3", G4: "G4.mp3",
          B3: "B3.mp3", D3: "D3.mp3", D4: "D4.mp3",
        },
        baseUrl: "https://nbrosowsky.github.io/tonejs-instruments/samples/guitar-electric/",
        release: 1.2,
        volume: -3,
        onload: () => { samplerLoadedRef.current = true; },
      });
      sampler.connect(reverb);

      synthRef.current = { sampler, synth, reverb };
    });

    return () => {
      disposed = true;
      synthRef.current.sampler?.dispose();
      synthRef.current.synth?.dispose();
      synthRef.current.reverb?.dispose();
      samplerLoadedRef.current = false;
      synthRef.current = { sampler: null, synth: null, reverb: null };
    };
  }, []);

  function clearCountdown() {
    if (countdownIdRef.current !== null) {
      window.clearInterval(countdownIdRef.current);
      countdownIdRef.current = null;
    }
  }

  // One round: speak "<string> string, <interval> of <root>", then on speech end
  // play the target note on that string, then (if enabled) count down to the next round.
  useEffect(() => {
    if (!active) {
      clearCountdown();
      window.speechSynthesis?.cancel();
      return;
    }

    const token = ++tokenRef.current;
    clearCountdown();
    setTimeLeft(-1);

    const interval = INTERVALS.find((i) => i.semitones === intervalSemitones);
    const chordTone = CHORD_TONES.find((t) => t.semitones === chordToneSemitones);
    // "the" before a lone "A" forces TTS engines to read it as the note letter
    // rather than the indefinite article — grammatically "the a" can't parse
    // as article + noun, so it falls back to the letter name.
    const text =
      mode === "progression"
        ? `The ${STRING_LABELS[stringIndex]} string, from the ${rootNote} to the ${targetChordRoot}, ${chordTone?.short ?? ""}.`
        : mode === "scale"
        ? `The ${STRING_LABELS[stringIndex]} string, key of the ${rootNote}.`
        : `The ${STRING_LABELS[stringIndex]} string, ${interval?.spoken ?? ""} of the ${rootNote}`;

    const startCountdown = () => {
      if (timerSeconds > 0) {
        setTimeLeft(timerSeconds);
        countdownIdRef.current = window.setInterval(() => {
          if (tokenRef.current !== token) return;
          const remaining = useEarTrainerStore.getState().timeLeft - 1;
          if (remaining <= 0) {
            clearCountdown();
            setTimeLeft(0);
            nextRound();
          } else {
            setTimeLeft(remaining);
          }
        }, 1000);
      }
    };

    const playAndStartTimer = async () => {
      if (tokenRef.current !== token) return;
      const Tone = await import("tone");
      await Tone.start();
      if (tokenRef.current !== token) return;

      const { sampler, synth } = synthRef.current;
      const player = samplerLoadedRef.current && sampler ? sampler : synth;

      const playFret = (fret: number, duration: string) => {
        const { note, octave } = getNoteAtPosition(stringIndex, fret);
        player?.triggerAttackRelease(`${note}${octave}`, duration);
      };

      if (mode === "progression") {
        const RUN_STEP_MS = 600;
        const RESOLUTION_GAP_MS = 500;
        runFrets.forEach((fret, i) => {
          window.setTimeout(() => {
            if (tokenRef.current !== token) return;
            playFret(fret, "4n");
          }, i * RUN_STEP_MS);
        });
        window.setTimeout(() => {
          if (tokenRef.current !== token) return;
          playFret(resolutionFret, "2n");
          startCountdown();
        }, runFrets.length * RUN_STEP_MS + RESOLUTION_GAP_MS);
      } else if (mode === "scale") {
        const ARPEGGIO_STEP_MS = 90;
        const ARPEGGIO_GAP_MS = 500;
        const RUN_STEP_MS = 550;

        // Root, major 3rd, perfect 5th, octave — establishes the key's major
        // tonality as a quick strum before the blind run, so the run's notes
        // can be judged relative to the key.
        const arpeggioFrets = [keyFret, keyFret + 4, keyFret + 7, keyFret + 12];
        arpeggioFrets.forEach((fret, i) => {
          window.setTimeout(() => {
            if (tokenRef.current !== token) return;
            playFret(fret, "8n");
          }, i * ARPEGGIO_STEP_MS);
        });

        const runStartDelay = arpeggioFrets.length * ARPEGGIO_STEP_MS + ARPEGGIO_GAP_MS;
        runFrets.forEach((fret, i) => {
          window.setTimeout(() => {
            if (tokenRef.current !== token) return;
            playFret(fret, "4n");
          }, runStartDelay + i * RUN_STEP_MS);
        });
        window.setTimeout(() => {
          if (tokenRef.current !== token) return;
          startCountdown();
        }, runStartDelay + runFrets.length * RUN_STEP_MS + 300);
      } else {
        const fret = findLowestFret(stringIndex, targetNote);
        playFret(fret, "2n");
        startCountdown();
      }
    };

    window.speechSynthesis?.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.95;
    utterance.onend = () => { playAndStartTimer(); };
    utterance.onerror = () => { playAndStartTimer(); };
    window.speechSynthesis?.speak(utterance);

    return () => {
      clearCountdown();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, roundId]);

  // Spacebar always advances to the next round while a session is active,
  // regardless of whether the countdown timer is running or off.
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.code !== "Space") return;
      if (!useEarTrainerStore.getState().active) return;
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "SELECT" || tag === "TEXTAREA") return;
      e.preventDefault();
      nextRound();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [nextRound]);

  useEffect(() => {
    return () => {
      window.speechSynthesis?.cancel();
      clearCountdown();
    };
  }, []);
}
