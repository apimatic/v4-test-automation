---
title: TT Status Codes
description: "Migration test 1 of 10 - postnl, HTML table plus a style block"
---

<Mermaid
  chart="
graph TD;
subgraph AA [Consumers]
A[Mobile app];
B[Web app];
C[Node.js client];
end
subgraph BB [Services]
E[REST API];
F[GraphQL API];
G[SOAP API];
end
Z[GraphQL API];
A --> Z;
B --> Z;
C --> Z;
Z --> E;
Z --> F;
Z --> G;"
/>


````ts twoslash lineNumbers
type Player = {
  /**
   * The player name
   * ```php
   * $a = "60"
   * ```
   *
   * @default 'user'
   */
  name: string;
};

/**
 * A custom function.
 *
 * @example
 *
 * ```ts
 * const str = fn("hello world")
 * console.log(str)
 * ```
 */
function fn<const T extends string>(s: T): T {
  return s;
}

// ---cut---
// @noErrors
console.g;
//       ^|

const player: Player = { name: 'Hello World' };
//    ^?

fn('test');
````