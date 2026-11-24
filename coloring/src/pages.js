import list from './pages.json';

/** The little book's pages in order: one per Pal, its drawing and its parts. */
const drawings = import.meta.glob('./pages/*.svg', { query: '?raw', import: 'default', eager: true });
export const PAGES = list.map((page) => ({ ...page, book: 'little', svg: drawings[`./pages/${page.id}.svg`] }));
