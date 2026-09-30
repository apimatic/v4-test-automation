---
title: Block structure
description: "Setext headings, rules, quotes, lists and indented code"
---

Setext heading level one
========================

Setext heading level two
------------------------

## Thematic breaks

Three asterisks:

***

Three underscores:

___

Three hyphens with spaces:

- - -

## Blockquotes

> A single-level quote.

> A quote
> spanning two lines.

> Level one
> > Level two
> > > Level three

> A quote containing a list:
>
> - first
> - second
>
> and a code block:
>
> ```bash
> pip install acme-petstore-sdk
> ```

## Tight and loose lists

Tight:

- one
- two
- three

Loose:

- one

- two

- three

## Ordered lists starting elsewhere

5. five
6. six
7. seven

## Indented code block

    curl https://api.petstore.example.com/v3/pet/1 \
      -H "api_key: $PETSTORE_API_KEY"

## Fenced code with a tilde fence

~~~json
{ "id": 1, "name": "Kitty", "status": "available" }
~~~
