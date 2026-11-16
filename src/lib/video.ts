import { existsSync } from 'node:fs';

const TYPES: Record<string, string> = { webm: 'video/webm', mp4: 'video/mp4' };

/** Given a video path in /public (any extension), list the variants that
 *  exist, WebM first so browsers that can play it take the smaller file and
 *  the rest fall through to MP4. */
export function videoSources(path?: string) {
  if (!path) return [];
  const base = path.replace(/\.(webm|mp4)$/i, '');
  return Object.entries(TYPES)
    .map(([ext, type]) => ({ src: `${base}.${ext}`, type }))
    .filter((s) => existsSync(`public${s.src}`));
}
