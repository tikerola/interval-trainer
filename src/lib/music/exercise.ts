import { getNoteAtPosition } from "./notes";
import type { Note } from "./notes";

export function isCorrectExerciseAnswer(
  targetNote: Note,
  stringIndex: number,
  fretNumber: number
): boolean {
  const { note } = getNoteAtPosition(stringIndex, fretNumber);
  return note === targetNote;
}
