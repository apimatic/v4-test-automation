---
title: Tables
description: "GFM tables with column alignment, section 4.10 of the spec"
---

## Every alignment

| Left | Centre | Right | Default |
| :--- | :----: | ----: | ------- |
| `/pet` | POST | 100/min | 45 ms |
| `/pet/findByStatus` | GET | 300/min | 120 ms |
| `/store/order` | POST | 60/min | 90 ms |

## Inline formatting in cells

| Field | Type | Notes |
| --- | --- | --- |
| **`apiKey`** | `string` | *Required.* See [authentication](/guides/authentication) |
| `timeout` | `number` | Defaults to ~~60000~~ 30000 |
| `retries` | `number` | Set to `0` to disable |

## Escaped pipes in cells

| Expression | Meaning |
| --- | --- |
| `a \| b` | A literal pipe inside a code span |
| `"production" \| "staging"` | A union type |

## Ragged rows

GFM pads a short row and drops cells beyond the header count.

| One | Two | Three |
| --- | --- | --- |
| a | b | c |
| d | e |
| f |
| g | h | i | j |

## A table with one column

| Status |
| --- |
| available |
| pending |
| sold |
