import { getCollection } from 'astro:content';

/** Work items in display order. Drafts show on the dev server so they can be
 *  worked on, and are left out of the production build. */
export async function getWork() {
  const items = await getCollection('work', ({ data }) => import.meta.env.DEV || !data.draft);
  return items.sort((a, b) => a.data.order - b.data.order);
}
