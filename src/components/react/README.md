# React components

Interactive pieces that need React (React Bits components and the like) live here.
Use them from an `.astro` file with a client directive, or they render as static HTML:

```astro
---
import SplitText from '../components/react/SplitText.jsx';
---
<SplitText client:visible text="Hello" />
```

Prefer `client:visible` (loads when scrolled into view) or `client:idle`.
Use `client:load` only for things above the fold that must animate straight away.
