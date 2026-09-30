---
title: Autolinks
description: "GFM extended autolinks, section 6.9 of the spec"
---

GFM turns bare URLs into links without any angle brackets or link syntax.

## Extended autolinks

A bare https URL: https://swagger.io/specification/

A bare http URL: http://example.com/docs

A www autolink with no scheme: www.example.com/petstore

An email address: support@example.com

## Autolinks inside other text

See https://swagger.io for the specification, or write to support@example.com if that does not help.

A URL in parentheses (https://example.com/a) and one followed by a comma https://example.com/b, then more text.

## Trailing punctuation

GFM trims trailing punctuation from an autolink. Visit https://example.com/page. And https://example.com/other!

## Classic autolinks

The pointy-bracket form: <https://swagger.io> and <support@example.com>

## Not autolinks

Inside a code span: `https://example.com/not-a-link`

A bare domain with no www and no scheme: example.com/petstore
