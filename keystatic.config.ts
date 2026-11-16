// The visual editor (Keystatic). It reads and writes the same markdown files
// the site is built from, in src/content/work — nothing is stored anywhere
// else. It only runs on the dev server on the Pi (see astro.config.mjs); the
// public site stays a plain static build.
import { config, collection, fields } from '@keystatic/core';
import { aiText } from './src/keystatic/ai-text';

const chapters = [
  { label: 'Background', value: 'Background' },
  { label: 'The brief', value: 'The brief' },
  { label: 'The work', value: 'The work' },
  { label: 'The result', value: 'The result' },
];

// chapter images live under /images/work; new uploads land there too
const images = { directory: 'public/images/work', publicPath: '/images/work/' };

export default config({
  storage: { kind: 'local' },
  ui: {
    brand: { name: 'Glenn Cahill' },
  },
  collections: {
    work: collection({
      label: 'Case studies',
      path: 'src/content/work/*',
      slugField: 'title',
      // the case study as saved (not yet published), opened from the editor
      previewUrl: '/work/{slug}',
      format: { contentField: 'content' },
      entryLayout: 'content',
      columns: ['title', 'order', 'draft'],
      schema: {
        title: fields.slug({
          name: { label: 'Title', description: 'Shown on the work page and cards, e.g. "Fastic — Mobile App Dashboard".' },
          slug: { label: 'Page address', description: 'The end of the URL: glenncahill.com/work/…' },
        }),
        heroTitle: aiText({
          label: 'Hero title',
          description: 'Optional. The big title in the hero. Leave blank to use the title up to the "—".',
        }),
        draft: fields.checkbox({
          label: 'Draft',
          description: 'Hidden from the live site. Still visible here and on the preview.',
          defaultValue: false,
        }),
        order: fields.integer({ label: 'Order', description: 'Position on the work page. 1 is first.', defaultValue: 99 }),
        tag: aiText({ label: 'Tag', description: 'The category pill, e.g. "Product Design".' }),
        excerpt: aiText({ label: 'Intro', description: 'The line under the hero title.', multiline: true }),
        year: fields.text({ label: 'Year', description: 'e.g. "2021" or "2019 — 21".' }),
        role: aiText({ label: 'Role' }),
        client: fields.text({ label: 'Client' }),
        link: fields.url({ label: 'Live link', description: 'Optional. Shown in the hero.' }),
        cover: fields.image({ label: 'Cover image', directory: 'public/images/work', publicPath: '/images/work/' }),
        video: fields.text({
          label: 'Hero video',
          description: 'Optional. Path to a .webm, e.g. /video/fastic-portfolio-demo.webm',
        }),

        gallery: fields.object(
          {
            show: fields.checkbox({ label: 'Show the gallery', defaultValue: false }),
            after: fields.select({
              label: 'Sits after',
              description: 'The chapter it follows. On a wide screen it fills the screen and the images move sideways as you scroll.',
              options: chapters,
              defaultValue: 'The work',
            }),
            items: fields.array(
              fields.object({
                image: fields.image({ label: 'Image', ...images }),
                caption: aiText({ label: 'Caption', description: 'Optional. Shown under the image.' }),
              }),
              {
                label: 'Images',
                // the image field's value is an object, not a path — only its
                // filename is safe to show here
                itemLabel: (p) => p.fields.caption.value || p.fields.image.value?.filename || 'Image',
              }
            ),
          },
          { label: 'Gallery' }
        ),

        stats: fields.object(
          {
            show: fields.checkbox({ label: 'Show the metric cards', defaultValue: false }),
            chapter: fields.select({ label: 'Chapter', options: chapters, defaultValue: 'Background' }),
            note: aiText({ label: 'Note', description: 'Optional small line under the cards, e.g. "Data correct as of Sept 2026".' }),
            items: fields.array(
              fields.object({
                value: fields.text({ label: 'Number', description: 'e.g. "318" or "+34%"' }),
                label: aiText({ label: 'Label', description: 'e.g. "Total users"' }),
              }),
              { label: 'Cards', itemLabel: (p) => `${p.fields.value.value || '…'}  ${p.fields.label.value}` }
            ),
          },
          { label: 'Metrics' }
        ),

        questions: fields.array(
          fields.object({
            chapter: fields.select({ label: 'Chapter', options: chapters, defaultValue: 'Background' }),
            question: aiText({ label: 'Question' }),
            show: fields.checkbox({
              label: 'Show on the site',
              description: 'Untick to hide this question without deleting the answer.',
              defaultValue: true,
            }),
            answer: aiText({
              label: 'Answer',
              description: 'Each line becomes a paragraph. Start a line with • or - for a bullet point. Unanswered questions stay hidden on the live site.',
              multiline: true,
            }),
          }),
          {
            label: 'Questions',
            itemLabel: (p) =>
              `${p.fields.chapter.value} · ${p.fields.question.value || 'New question'}` +
              (p.fields.show.value ? '' : '  (hidden)') +
              (p.fields.answer.value.trim() ? '' : '  (no answer yet)'),
          }
        ),

        notes: aiText({
          label: 'Private notes',
          description: 'Only you see these. Never shown on the site.',
          multiline: true,
        }),

        content: fields.markdoc({
          label: 'Chapters',
          description: 'Each "##" heading starts a chapter. The image under a heading fills the screen behind that chapter.',
          extension: 'md',
          options: { image: images },
        }),
      },
    }),
  },
});
