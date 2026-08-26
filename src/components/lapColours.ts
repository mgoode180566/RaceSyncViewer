/**
 * Deliberately fixed lap palette so the same lap keeps the same
 * colour in the map, lap list and later comparison charts.
 */
export const LAP_COLOURS = [
  '#42a5f5',
  '#ef5350',
  '#66bb6a',
  '#ffa726',
  '#ab47bc',
  '#26c6da',
  '#ec407a',
  '#d4e157',
  '#8d6e63',
  '#7e57c2',
]

export function lapColour(
  lapNumber: number,
): string {
  return LAP_COLOURS[
    (
      lapNumber -
      1
    ) %
    LAP_COLOURS.length
  ]
}
