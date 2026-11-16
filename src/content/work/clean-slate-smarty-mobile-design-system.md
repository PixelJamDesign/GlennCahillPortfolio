---
title: CleanSlate - SMARTY Mobile Design System
heroTitle: CleanSlate
draft: false
order: 1
tag: Design System
excerpt: >-
  A design system built from the ground up for SMARTY, replacing three
  fragmented Figma libraries with a single source of truth spanning design and a
  shared React Native codebase.
year: 2025 - Present
role: Design System Engineer
client: SMARTY Mobile
cover: /images/work/clean-slate-smarty-mobile-design-system/cover.webp
gallery:
  show: true
  after: The work
  items:
    - image: >-
        /images/work/clean-slate-smarty-mobile-design-system/gallery/items/0/image.png
      caption: >-
        Clear and credible documentation removed ambiguity between Stakeholders,
        Design, Dev and QA.
    - image: >-
        /images/work/clean-slate-smarty-mobile-design-system/gallery/items/1/image.png
      caption: >-
        The culmination of ingredients (core components) to create a recipe
        (organism) for each function.
    - image: >-
        /images/work/clean-slate-smarty-mobile-design-system/gallery/items/2/image.png
      caption: >-
        Bringing all those elements together allowed us to quickly prototype and
        test the new dashboard experience.
stats:
  show: false
  chapter: Background
  items: []
questions:
  - chapter: Background
    question: What was the challenge?
    show: true
    answer: >-
      The fragmentation had produced drift. There were multiple versions of the
      same component, whether inputs, buttons, cards or plan cards, and no
      authoritative one among them. The system had also fallen out of step with
      production, because change requests were being implemented as small tweaks
      on the live site and never fed back. Designers lost confidence in the
      libraries and started working from the live site instead, which only
      widened the gap. On top of that, SMARTY works with two development
      partners, one owning app and one owning web, duplicating effort on the
      same problems.
  - chapter: Background
    question: What informed the direction?
    show: true
    answer: >-
      The consolidation onto a single React Native codebase was a strategic
      directive, driven by consistency and by the man hours being lost to
      duplication. On the design side the approach was capture first, improve
      second. Take what existed, hold feature parity, and improve incrementally
      rather than rebuilding and redesigning at once. The Brand team's direction
      was a slate heavy aesthetic with accents of teal and white, which gave the
      system its name. CleanSlate works on both levels, for the palette and for
      the fact we were building from nothing.
  - chapter: The work
    question: What was my approach?
    show: true
    answer: >-
      The working method was design, test, then validate. There was no shortage
      of informed opinion about what could be better, but design is subjective
      and experience doesn't guarantee an outcome, so proposals were treated as
      hypotheses rather than conclusions. The navigation is the clearest
      example. The menu systems were substantially reworked, but that rework was
      shaped by user interviews and card sorting exercises rather than by our
      own instincts about hierarchy. Twenty two years in, I'd rather be
      corrected by a card sort than be confidently wrong in production.

      Architecturally I built from the bottom up, and the sequence was
      deliberate. An 8px baseline grid first, with 4px increments for finer
      work, then a spacing rhythm on top of it. Typography came next, mapping
      Kollektif, SMARTY's brand typeface, onto that rhythm through sizing, line
      height, letter spacing and weight. Colour came last, precisely because it
      depends on everything above it. The palette was set against real type
      sizes and real foreground and background pairings, then checked against
      accessibility contrast criteria rather than assumed to pass.
  - chapter: The work
    question: What did I design?
    show: true
    answer: >-
      The foundation library from scratch, covering variables, the spacing
      scale, typography and corner radius. The typography collection carries
      desktop and mobile breakpoint modes, so type responds to viewport the same
      way spacing does.


      On top of that sits the token architecture, where most of the thinking
      went. Colour resolves through four aliased layers: hex, foundation token,
      theme token, component token. That final component level layer was my
      addition, and it's the part of the system I'm most pleased with.


      Then the component library itself. Atomic design, renamed internally to
      ingredients and recipes, which proved a far more intuitive framing for non
      designers. Each component ships with its specification, props, named
      tokens and playgrounds for mobile and desktop. Recipes go further. A Plan
      Usage Card publishes an instances sheet naming every component inside it,
      each linking through to its own documentation. A connected ecosystem
      rather than a catalogue.
  - chapter: The work
    question: What were the key considerations?
    show: true
    answer: >-
      Governance was the main one. A theme layer alone isn't enough, because the
      same component needs different treatment depending on what contains it. A
      bullet list inside a bottom sheet isn't the same as one inside a content
      card. Component level tokens solve that, and without them you're
      overriding at instance level forever, which is how systems rot.


      Depth is the obvious question with four layers of aliasing, but it was
      never a practical concern. Figma's dev mode resolves the entire chain on
      screen, so a developer sees the component token, the theme token, the
      foundation token and the hex value together, with the code syntax
      alongside. Nothing is hidden. Documentation, shared playgrounds and
      working sessions with both development partners did the rest.
  - chapter: The result
    question: What was the outcome?
    show: true
    answer: >-
      A single system has replaced three fragmented libraries, with a full
      foundation layer, a token architecture of four layers, a documented
      component library and a recipe book, all pointed at one React Native
      codebase shared across iOS, Android and web. Internal feedback has been
      consistently positive, and the practical difference in day to day design
      work is significant. I wouldn't claim a measured figure, but from my own
      experience of working in it, I'd estimate it has cut somewhere in the
      region of 40% off the time it takes to build out a journey. Mostly because
      the hunting has gone. There's one place to look, and what's in it is
      trustworthy.
  - chapter: The result
    question: What did this enable?
    show: true
    answer: >-
      Personally, the time it gives back is the real return. Hours that used to
      go on locating the right component or reconciling versions now go into
      creative thinking, user testing and prototyping, building against the live
      codebase with Code Connect and AI tooling to get ideas in front of people
      far earlier than a static mockup ever allowed. For the business, it's the
      foundation for the wider app refresh and a consolidated codebase across
      three platforms. The next step is the recipe library proper, a pattern
      library of templates that lets the team assemble and prototype at pace.
---
## Background

When I joined SMARTY there were three Figma libraries in circulation, one for web, one for mobile web and one for app, each with incomplete component and variable sets. In practice that meant designing a layout involved hunting for whichever library happened to suit the breakpoint in front of you, then hoping the components inside it still reflected what was actually live. The opportunity was to collapse all three into a single system with real governance behind it, and to align that system with a consolidated codebase so design and development were finally describing the same product.

![](/images/work/clean-slate-smarty-mobile-design-system/01.webp)

## The work

I worked as Design System Engineer on CleanSlate, focused on the underlying Figma architecture: the foundation layer, the token structure, the component library, the documentation and the pipeline into code.

![](/images/work/clean-slate-smarty-mobile-design-system/02.webp)

## The result

CleanSlate isn't live yet. Components are in build, marked ready for dev and annotated, with direct dev mode links into Figma. The system is already in daily use on the design side though, driving the journeys for the SMARTY app refresh, which means it's being road tested against real product work rather than sitting in a library waiting for launch.

![](/images/work/clean-slate-smarty-mobile-design-system/03.webp)
