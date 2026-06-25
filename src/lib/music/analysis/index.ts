import type { TranscribedSolo } from "../solos/types";
import { flattenSolo } from "./flatten";
import { segmentPhrases } from "./phrases";
import { analyzeScaleUsage } from "./scaleUsage";
import { detectMotifs } from "./motifs";
import { analyzeResolutions } from "./resolution";
import { detectCallResponse } from "./callResponse";
import { analyzeChordTargeting } from "./chordTargeting";
import { analyzePosition } from "./position";
import { buildIngredientCards } from "./cards";

export function analyzeSolo(solo: TranscribedSolo) {
  const flat = flattenSolo(solo);
  const phrases = segmentPhrases(flat);
  const scaleUsage = analyzeScaleUsage(flat, solo.key);
  const motifs = detectMotifs(solo);
  const resolutions = analyzeResolutions(phrases);
  const callResponse = detectCallResponse(phrases, resolutions);
  const chordTargeting = analyzeChordTargeting(solo);
  const position = analyzePosition(solo);
  const cards = buildIngredientCards({ scaleUsage, motifs, callResponse, resolutions, chordTargeting, position });

  return { phrases, scaleUsage, motifs, resolutions, callResponse, chordTargeting, position, cards };
}

export type SoloAnalysis = ReturnType<typeof analyzeSolo>;

export type { FlatNote } from "./flatten";
export type { Phrase } from "./phrases";
export type { ScaleUsage, ScaleFit, BlueNoteOccurrence } from "./scaleUsage";
export type { MotifGroup } from "./motifs";
export type { ResolutionTag, ResolutionStrength } from "./resolution";
export type { CallResponsePair } from "./callResponse";
export type { ChordTargetingStat } from "./chordTargeting";
export type { PositionUsage } from "./position";
export type { IngredientCard } from "./cards";
