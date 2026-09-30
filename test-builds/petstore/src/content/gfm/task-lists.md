---
title: Task lists
description: "GFM task list items, section 5.3 of the spec"
---

GFM adds task list items to ordinary lists. Each should render as a checkbox.

## A flat list

- [ ] An unchecked item
- [x] A checked item
- [X] A checked item with a capital X
- An ordinary item with no checkbox, in the same list

## Nested task lists

- [ ] Parent task
    - [x] Finished subtask
    - [ ] Unfinished subtask
        - [x] Deeper still
- [x] Second parent

## Ordered task list

1. [ ] First step
2. [x] Second step
3. [ ] Third step

## Task items carrying other content

- [ ] A task whose text has **bold**, `code` and [a link](/sdks)
- [x] A task with a following paragraph

    This paragraph belongs to the checked item above.
