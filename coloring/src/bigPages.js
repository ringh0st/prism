import list from './pages-big.json';

/** The big book's pages (loaded on their own, after the app starts: they're bigger and more detailed). */
const drawings = import.meta.glob('./pages-big/*.svg', { query: '?raw', import: 'default', eager: true });
export const BIG_PAGES = list.map((page) => ({ ...page, book: 'big', svg: drawings[`./pages-big/${page.id.replace(/^big-/, '')}.svg`] }));
