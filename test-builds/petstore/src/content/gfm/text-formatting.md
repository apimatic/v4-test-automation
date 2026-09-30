---
title: Text formatting
description: "Strikethrough, emphasis, escapes and entity references"
---

## Strikethrough

GFM adds ~~single tilde~~ and ~~double tilde~~ strikethrough.

A ~~struck phrase~~ inside a sentence, and ~~one with **bold** inside it~~.

## Emphasis edge cases

*single asterisk* and _single underscore_

**double asterisk** and __double underscore__

***triple*** and ___triple underscore___

Intra-word emphasis: un*frigging*believable, and snake_case_word should NOT be emphasised.

## Backslash escapes

Escaped characters: \*not emphasis\*, \_not emphasis\_, \`not code\`, \# not a heading

A literal backslash: \\

## Entity references

Named: &copy; &amp; &lt; &gt; &nbsp; &hellip; &mdash;

Numeric: &#35; &#1234; &#992; &#x22;

## Hard line breaks

A line ending with two spaces  
breaks here.

A line ending with a backslash\
breaks here too.

## Code spans

Simple `code`, with backticks `` ` `` inside, and ``a span with a `nested` backtick``.

A code span preserving   multiple   spaces: `a   b`
