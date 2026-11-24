/**
 * The two coloring books on the desk. The little one (3 and up): the Baby Pals with big parts, colored by tapping.
 * The big one (8 to 10): the Master Pals with their small details and a mandala behind each, colored by tapping or
 * painted by hand with a thin, medium or thick crayon.
 */
export const BOOKS = {
  little: { id: 'little', title: 'My Pals', subtitle: 'Coloring Book', cover: 'little', canPaint: false, coverPals: ['bamboo', 'waffles', 'ribbit'], form: 1 },
  big: { id: 'big', title: 'Big Pals', subtitle: 'Fill it or paint it', cover: 'big', canPaint: true, coverPals: ['storm', 'aurora', 'leo'], form: 5 },
};
export const BOOK_IDS = Object.keys(BOOKS);
