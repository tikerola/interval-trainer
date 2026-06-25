import { getDom7Notes } from "../blues";
import type { FlatNote } from "./flatten";
import type { Phrase } from "./phrases";

export type ResolutionStrength = "strong" | "moderate" | "weak";

export interface ResolutionTag {
  phrase: Phrase;
  lastNote: FlatNote;
  strength: ResolutionStrength;
  explanation: string;
}

/** Classifies how each phrase ends, against the chord active at its last note. */
export function analyzeResolutions(phrases: Phrase[]): ResolutionTag[] {
  return phrases.map((phrase) => {
    const last = phrase.notes[phrase.notes.length - 1];
    const chordTones = getDom7Notes(last.chordRoot);

    let strength: ResolutionStrength;
    if (last.note === chordTones[0]) strength = "strong";
    else if ((chordTones as readonly string[]).includes(last.note)) strength = "moderate";
    else strength = "weak";

    const explanation =
      strength === "strong"
        ? `Resolves to the root of ${last.chordRoot}7 — a strong, settled landing.`
        : strength === "moderate"
        ? `Resolves to a chord tone of ${last.chordRoot}7 — stable, but not fully home.`
        : `Ends on a tension note rather than a chord tone, leaving the phrase open.`;

    return { phrase, lastNote: last, strength, explanation };
  });
}
