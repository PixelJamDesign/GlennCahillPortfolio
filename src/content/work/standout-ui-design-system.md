---
title: StandOut UI — Design System
tag: Design System
cover: /images/work/standout-ui-design-system/cover.webp
excerpt: My own design system, built in my spare time. Twenty years of best practice poured into one Figma library, on its way to becoming a Webflow component kit anyone can build with.
order: 13
questions:
  - chapter: Background
    question: What was the challenge?
    show: true
    answer: ""
  - chapter: Background
    question: What informed the direction?
    show: true
    answer: ""
  - chapter: The work
    question: What was my approach?
    show: true
    answer: ""
  - chapter: The work
    question: What did I design?
    show: true
    answer: ""
  - chapter: The work
    question: What were the key considerations?
    show: true
    answer: ""
  - chapter: The result
    question: What was the outcome?
    show: true
    answer: ""
  - chapter: The result
    question: What did this enable?
    show: true
    answer: ""
notes: |-
  The work: image suggestion: the variables panel in Figma showing the token structure — for a design system audience this IS the product shot
  The work: image suggestion: one component's full variant matrix (states × sizes × themes) laid out on a single frame
---

## Background

StandOut is my own design system, built in my spare time, and it's where everything I've learned doing this professionally gets poured. The ambition is a "full-fat" solution: a complete Figma library first, then a Webflow component kit that lets anyone assemble feature-rich websites without fighting their tools.

That's the end game. Here's how it actually gets built.

## The brief

Use the full suite of what Figma offers, properly:

- Variables
- Prototyping
- Auto-layout
- Design tokens

Then carry the exact same variable structure and naming conventions into the Webflow template, so the two platforms stay in lockstep.

![](/images/work/standout-ui-design-system/01.webp)

## The work

Everything starts with the component audit, and I won't pretend it's glamorous. You go through every component that exists or needs to exist based on the user journeys and wireframes, then group the lot.

From there it's atomic design. Break each component down to its core elements, text and iconography at the bottom. But before building a single component, I set the variables. My rule of thumb is to define values for:

- Colour palette
- Icon size and stroke weight
- Padding, spacing and corner radius
- Font sizes and families

Components built on that foundation update in minutes when a token changes. Components built without it update one screen at a time, forever.

Then comes documentation: guidelines that break each component into small identifiable chunks, so a designer meeting the system for the first time can teach themselves. And finally stress testing — device testing and deliberately pushing each component past its intended use, because the failure you find before launch is the cheap one.

Maintaining a system is its own discipline. I structure components so new features can be added and tested with minimal impact, with mandatory testing and documentation on every update. The best release process I've run pairs that with a voting forum where designers suggest and upvote features, shipped in weekly pushes.

![](/images/work/standout-ui-design-system/02.webp)

## The result

StandOut hasn't officially launched yet, and honestly, the building is half the point. It's my laboratory. It's where I experiment with new Figma features, refine my process, and stay sharp as a design system specialist between client engagements.

Design systems are the corner of this industry I get genuinely evangelical about. If you want to talk through my process in more detail, I'd enjoy that conversation.

![](/images/work/standout-ui-design-system/03.webp)
