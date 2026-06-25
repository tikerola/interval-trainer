import type { ScaleUsage } from "./scaleUsage";
import type { MotifGroup } from "./motifs";
import type { CallResponsePair } from "./callResponse";
import type { ResolutionTag } from "./resolution";
import type { ChordTargetingStat } from "./chordTargeting";
import type { PositionUsage } from "./position";

export interface IngredientCard {
  title: string;
  body: string;
}

export function buildIngredientCards(data: {
  scaleUsage: ScaleUsage;
  motifs: MotifGroup[];
  callResponse: CallResponsePair[];
  resolutions: ResolutionTag[];
  chordTargeting: ChordTargetingStat[];
  position: PositionUsage;
}): IngredientCard[] {
  const cards: IngredientCard[] = [];

  cards.push({
    title: "Scale",
    body: `This solo sits mostly in the ${data.scaleUsage.bestFit.scaleName} (${data.scaleUsage.bestFit.percentInScale}% of notes) — the backbone of blues phrasing.`,
  });

  if (data.scaleUsage.blueNotes.length > 0) {
    const first = data.scaleUsage.blueNotes[0];
    cards.push({
      title: "Blue Notes",
      body: `The ${first.degree} "blue note" appears ${data.scaleUsage.blueNotes.length} time${data.scaleUsage.blueNotes.length === 1 ? "" : "s"} (first in bar ${first.bar}) — it creates tension against the chord before resolving back into the scale.`,
    });
  }

  if (data.motifs.length > 0) {
    const top = data.motifs[0];
    cards.push({
      title: "Repetition",
      body: `The most repeated idea recurs in ${top.bars.length} bars (${top.bars.join(", ")}) — repeating a phrase with small variations is one of the most important blues improvisation techniques.`,
    });
  }

  if (data.callResponse.length > 0) {
    const first = data.callResponse[0];
    cards.push({
      title: "Call & Response",
      body: `${data.callResponse.length} call-and-response moment${data.callResponse.length === 1 ? "" : "s"} found — e.g. ${first.explanation} This conversational phrasing is a blues hallmark.`,
    });
  }

  const strongCount = data.resolutions.filter((r) => r.strength === "strong").length;
  cards.push({
    title: "Resolution",
    body: `${strongCount} of ${data.resolutions.length} phrases resolve strongly to the chord root — the rest leave tension hanging, pushing the line forward into the next phrase.`,
  });

  const avgChordTones = Math.round(
    data.chordTargeting.reduce((s, c) => s + c.percentChordTones, 0) / Math.max(1, data.chordTargeting.length),
  );
  cards.push({
    title: "Chord Targeting",
    body: `On average ${avgChordTones}% of the notes in each bar are chord tones (root/3rd/5th/b7) of that bar's own chord — the solo follows the changes rather than running one scale straight through.`,
  });

  cards.push({
    title: "Fretboard Position",
    body: data.position.primaryBox === "unboxed"
      ? `Played across frets ${data.position.fretRange.min}-${data.position.fretRange.max}, mostly outside the standard pentatonic box shapes.`
      : `Mostly played in the "${data.position.primaryBox}"-shape box (overall range: frets ${data.position.fretRange.min}-${data.position.fretRange.max}), shifting position ${data.position.transitions} times — including the jump to a higher box in the second chorus.`,
  });

  return cards;
}
