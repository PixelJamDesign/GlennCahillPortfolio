// Turns a source recording into the two files the site plays: a WebM (VP9)
// and an MP4 (H.264) fallback, both 1440 wide at 30fps. Optionally mixes a
// music track under it (from Suno or anywhere else), trimmed to the clip with
// a fade in and out and the level evened up.
//
//   npm run video <source> [--music <track>] [--name <output-name>]
//                          [--seconds <n>] [--width 1440] [--start <n>]
//
// Music is looked up by name in public/music, then in the originals folder.
//
// The source is a file in ../glenncahill-v2-originals/video (or any path).
// Output lands in public/video/<name>.webm and .mp4, and the source is moved
// into the originals folder if it isn't there already.
//
// Note: the case study hero loop always plays muted, because browsers only
// autoplay silent video. Music is heard when someone opens "Watch the video".
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const ORIGINALS = path.resolve('../glenncahill-v2-originals/video');
const OUT = path.resolve('public/video');
// music is looked for in these, in order. Tracks kept in public/music are
// published with the site; the originals folder keeps them off it.
const MUSIC_DIRS = [
  path.resolve('public/music'),
  path.resolve('../glenncahill-v2-originals/music'),
  ORIGINALS,
];

const args = process.argv.slice(2);
const flag = (name, fallback = null) => {
  const i = args.indexOf(`--${name}`);
  return i === -1 ? fallback : args[i + 1];
};
const positional = args.filter((a, i) => !a.startsWith('--') && !(i > 0 && args[i - 1].startsWith('--')));

const sourceArg = positional[0];
if (!sourceArg) {
  console.error('Usage: npm run video <source> [--music <track>] [--name <output-name>] [--seconds <n>] [--start <n>]');
  process.exit(1);
}

const find = (file, dir) => {
  for (const p of [file, path.join(dir, file), path.join(dir, path.basename(file))]) {
    if (p && fs.existsSync(p)) return path.resolve(p);
  }
  return null;
};

const source = find(sourceArg, ORIGINALS);
if (!source) {
  console.error(`Can't find "${sourceArg}". Looked in ${ORIGINALS} and the current folder.`);
  process.exit(1);
}
const musicArg = flag('music');
const music = musicArg ? MUSIC_DIRS.map((d) => find(musicArg, d)).find(Boolean) : null;
if (musicArg && !music) {
  console.error(`Can't find the music file "${musicArg}". Looked in:\n  ${MUSIC_DIRS.join('\n  ')}`);
  const listed = MUSIC_DIRS.flatMap((d) => (fs.existsSync(d) ? fs.readdirSync(d) : []))
    .filter((f) => /\.(mp3|wav|m4a|aac|flac|ogg|opus)$/i.test(f));
  if (listed.length) console.error(`\nTracks available:\n  ${listed.join('\n  ')}`);
  process.exit(1);
}

const name = (flag('name') || path.basename(source).replace(/\.[^.]+$/, '').replace(/-source$/, ''))
  .toLowerCase()
  .replace(/[^a-z0-9-]+/g, '-');
const width = Number(flag('width', 1440));
const start = flag('start') ? Number(flag('start')) : null;
const seconds = flag('seconds') ? Number(flag('seconds')) : null;

const run = (cmd, cmdArgs) => {
  const r = spawnSync(cmd, cmdArgs, { stdio: ['ignore', 'pipe', 'pipe'] });
  if (r.status !== 0) {
    console.error(r.stderr?.toString().split('\n').slice(-8).join('\n'));
    process.exit(1);
  }
  return r.stdout.toString().trim();
};

const duration = Number(
  run('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'default=nw=1:nk=1', source])
);
const clip = seconds ?? (start ? duration - start : duration);

// video filter: scale to width (even height), 30fps
const vf = `scale=${width}:-2,fps=30`;
// music: trim to the clip, fade in over 1s, out over the last 2s, level evened
const af = `atrim=0:${clip.toFixed(2)},afade=t=in:st=0:d=1,afade=t=out:st=${Math.max(0, clip - 2).toFixed(2)}:d=2,loudnorm=I=-16:TP=-1.5:LRA=11`;

const trim = [...(start ? ['-ss', String(start)] : []), ...(seconds ? ['-t', String(seconds)] : [])];
const inputs = music
  ? ['-stream_loop', '-1', '-i', music, ...trim, '-i', source]
  : [...trim, '-i', source];
// with music the video is input 1 and the track input 0
const maps = music ? ['-map', '1:v:0', '-map', '0:a:0', '-filter:a', af, '-shortest'] : ['-an'];

fs.mkdirSync(OUT, { recursive: true });
const webm = path.join(OUT, `${name}.webm`);
const mp4 = path.join(OUT, `${name}.mp4`);

console.log(`Encoding ${path.basename(source)}${music ? ` with ${path.basename(music)}` : ' (no audio)'}`);
console.log(`  ${clip.toFixed(1)}s → ${width}px wide, 30fps`);

console.log('  WebM (VP9)…');
run('ffmpeg', ['-y', ...inputs, '-vf', vf, ...maps,
  '-c:v', 'libvpx-vp9', '-crf', '34', '-b:v', '0', '-row-mt', '1', '-cpu-used', '2',
  ...(music ? ['-c:a', 'libopus', '-b:a', '128k'] : []), webm]);

console.log('  MP4 (H.264)…');
run('ffmpeg', ['-y', ...inputs, '-vf', vf, ...maps,
  '-c:v', 'libx264', '-crf', '27', '-preset', 'slow', '-movflags', '+faststart',
  ...(music ? ['-c:a', 'aac', '-b:a', '128k'] : []), mp4]);

// keep the source alongside the other originals
if (!source.startsWith(ORIGINALS)) {
  fs.mkdirSync(ORIGINALS, { recursive: true });
  const kept = path.join(ORIGINALS, `${name}-source${path.extname(source)}`);
  fs.renameSync(source, kept);
  console.log(`  source kept as ${path.relative(process.cwd(), kept)}`);
}

const mb = (f) => `${(fs.statSync(f).size / 1e6).toFixed(1)}MB`;
console.log(`\nDone. /video/${name}.webm (${mb(webm)}) and /video/${name}.mp4 (${mb(mp4)})`);
console.log(`Set the case study's "Hero video" to /video/${name}.webm, then publish.`);
