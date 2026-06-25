import type { Phrase } from "./phrases";
import type { ResolutionTag } from "./resolution";

export interface CallResponsePair {
  call: Phrase;
  response: Phrase;
  explanation: string;
}

// If the next phrase doesn't start within this many beats, it's not a "reply" —
// just an unrelated later idea.
const MAX_GAP_BEATS = 4;

/** Pairs a weakly/moderately-resolved phrase with an immediately following strongly-resolved one. */
export function detectCallResponse(phrases: Phrase[], resolutions: ResolutionTag[]): CallResponsePair[] {
  const pairs: CallResponsePair[] = [];

  for (let i = 0; i < phrases.length - 1; i++) {
    const call = resolutions[i];
    const response = resolutions[i + 1];
    if (call.strength === "strong" || response.strength !== "strong") continue;

    const gap = phrases[i + 1].startBeat - phrases[i].endBeat;
    if (gap > MAX_GAP_BEATS) continue;

    pairs.push({
      call: phrases[i],
      response: phrases[i + 1],
      explanation: `Bar ${phrases[i].startBar} poses a question (${call.strength} ending); bar ${phrases[i + 1].startBar} answers it with a strong resolution.`,
    });
  }

  return pairs;
}
