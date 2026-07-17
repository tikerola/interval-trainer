"use client";

import { useEffect, useRef } from "react";
import { useShallow } from "zustand/react/shallow";
import { useEarTrainerStore } from "@/store/earTrainerStore";
import { getNoteAtPosition, findLowestFret, STRING_LABELS } from "@/lib/music/notes";
import { INTERVALS } from "@/lib/music/intervals";

// Drives the Ear Training round loop: speaks the prompt, plays the target note
// once speech finishes, then (if a timer is set) counts down to the next round.
export function useEarTrainerEngine() {
  const { active, roundId, rootNote, stringIndex, targetNote, intervalSemitones, timerSeconds, setTimeLeft, nextRound } =
    useEarTrainerStore(
      useShallow((s) => ({
        active: s.active,
        roundId: s.roundId,
        rootNote: s.rootNote,
        stringIndex: s.stringIndex,
        targetNote: s.targetNote,
        intervalSemitones: s.intervalSemitones,
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
    // "the" before a lone "A" forces TTS engines to read it as the note letter
    // rather than the indefinite article — grammatically "the a" can't parse
    // as article + noun, so it falls back to the letter name.
    const text = `The ${STRING_LABELS[stringIndex]} string, ${interval?.spoken ?? ""} of the ${rootNote}`;

    const playAndStartTimer = async () => {
      if (tokenRef.current !== token) return;
      const Tone = await import("tone");
      await Tone.start();
      if (tokenRef.current !== token) return;

      const fret = findLowestFret(stringIndex, targetNote);
      const { octave } = getNoteAtPosition(stringIndex, fret);
      const noteName = `${targetNote}${octave}`;
      const { sampler, synth } = synthRef.current;
      const player = samplerLoadedRef.current && sampler ? sampler : synth;
      player?.triggerAttackRelease(noteName, "2n");

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
