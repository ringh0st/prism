/** Where a cell's center is in the scene: the board is centered on the origin, one unit per cell (x right, z down). */
export const cellPosition = (level, x, y) => [x - level.width / 2 + 0.5, 0, y - level.height / 2 + 0.5];
