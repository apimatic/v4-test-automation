## DELETE /shapes/resources/{id}

```typescript
try {
  await client.shapes.shapesDelete({
    id: "AUTHORED-id",
    body: { a: "AUTHORED-delete" },
  });
} catch (err) {
  // TODO: Handle 'err' of type ApiError, where 'err.payload' is always the Undeclared arm
}
```

## GET /examples/header-path/{p}

<!-- field: h1 -->

```
try {
  await client.examples.examplesHeaderPath({
    p: "AUTHORED-p1",
    h: "AUTHORED-h1",
  });
} catch (err) {
  // TODO: Handle 'err' of type ApiError, where 'err.payload' is always the Undeclared arm
}
```

<!-- field: h2 -->

```
try {
  await client.examples.examplesHeaderPath({
    p: "AUTHORED-p1",
    h: "AUTHORED-h2",
  });
} catch (err) {
  // TODO: Handle 'err' of type ApiError, where 'err.payload' is always the Undeclared arm
}
```

## GET /params/no-example/{pathNoEx}

```typescript
try {
  await client.params.paramsNoExample({
    pathNoEx: "some example string",
    qReq: "some example string",
    hReq: "some example string",
  });
} catch (err) {
  // TODO: Handle 'err' of type ApiError, where 'err.payload' is always the Undeclared arm
}
```

## GET /params/with-example/{pathEx}

```typescript
try {
  await client.params.paramsWithExample({
    pathEx: "AUTHORED-path",
    qReqEx: "AUTHORED-query",
    qSchemaEx: "AUTHORED-schema-ex",
    qOptEx: "AUTHORED-optional",
    hReqEx: "AUTHORED-header",
  });
} catch (err) {
  // TODO: Handle 'err' of type ApiError, where 'err.payload' is always the Undeclared arm
}
```

## GET /query-styles

```typescript
try {
  await client.params.queryStyles({
    formExplode: ["AUTHORED-fe1", "AUTHORED-fe2"],
    formNoExplode: ["AUTHORED-fn1", "AUTHORED-fn2"],
    deep: { from: "AUTHORED-from", to: "AUTHORED-to" },
    pipe: ["AUTHORED-p1", "AUTHORED-p2"],
    space: ["AUTHORED-s1", "AUTHORED-s2"],
  });
} catch (err) {
  // TODO: Handle 'err' of type ApiError, where 'err.payload' is always the Undeclared arm
}
```

## PATCH /shapes/resources/{id}

```typescript
try {
  await client.shapes.shapesPatch({
    id: "AUTHORED-id",
    body: { a: "AUTHORED-patch" },
  });
} catch (err) {
  // TODO: Handle 'err' of type ApiError, where 'err.payload' is always the Undeclared arm
}
```

## POST /body/b02-optional-missing

```typescript
try {
  await client.body.b02OptionalMissing({
    body: { a: "AUTHORED-a" },
  });
} catch (err) {
  // TODO: Handle 'err' of type ApiError, where 'err.payload' is always the Undeclared arm
}
```

## POST /body/b03-extra-key

```typescript
try {
  await client.body.b03ExtraKey({
    body: { a: "AUTHORED-a" },
  });
} catch (err) {
  // TODO: Handle 'err' of type ApiError, where 'err.payload' is always the Undeclared arm
}
```

## POST /body/b05-enum-not-member

```typescript
try {
  await client.body.b05EnumNotMember({
    body: { value: StrEnum.FirstMember },
  });
} catch (err) {
  // TODO: Handle 'err' of type ApiError, where 'err.payload' is always the Undeclared arm
}
```

## POST /body/b06-enum-case

```typescript
try {
  await client.body.b06EnumCase({
    body: { value: StrEnum.FirstMember },
  });
} catch (err) {
  // TODO: Handle 'err' of type ApiError, where 'err.payload' is always the Undeclared arm
}
```

## POST /body/b07-number-as-string

```typescript
try {
  await client.body.b07NumberAsString({
    body: { value: 7 },
  });
} catch (err) {
  // TODO: Handle 'err' of type ApiError, where 'err.payload' is always the Undeclared arm
}
```

## POST /body/b08-boolean-as-string

```typescript
try {
  await client.body.b08BooleanAsString({
    body: { value: false },
  });
} catch (err) {
  // TODO: Handle 'err' of type ApiError, where 'err.payload' is always the Undeclared arm
}
```

## POST /body/b09-string-as-number

```typescript
try {
  await client.body.b09StringAsNumber({
    body: { value: "864508030147323" },
  });
} catch (err) {
  // TODO: Handle 'err' of type ApiError, where 'err.payload' is always the Undeclared arm
}
```

## POST /body/b10-datetime-no-tz

```typescript
try {
  await client.body.b10DatetimeNoTz({
    body: {
      value: new Date(Date.UTC(2026, 4, 1, 10, 15, 30)),
    },
  });
} catch (err) {
  // TODO: Handle 'err' of type ApiError, where 'err.payload' is always the Undeclared arm
}
```

## POST /body/b14-array-given-scalar

```typescript
try {
  await client.body.b14ArrayGivenScalar({
    body: { value: ["AUTHORED-x"] },
  });
} catch (err) {
  // TODO: Handle 'err' of type ApiError, where 'err.payload' is always the Undeclared arm
}
```

## POST /body/b15-map-given-scalar

```typescript
try {
  await client.body.b15MapGivenScalar({
    body: { value: { key: "some example string" } },
  });
} catch (err) {
  // TODO: Handle 'err' of type ApiError, where 'err.payload' is always the Undeclared arm
}
```

## POST /examples/different-names

<!-- field: b1 -->

```
try {
  await client.examples.examplesDifferentNames({
    q: "AUTHORED-q1",
    body: { a: "AUTHORED-b1" },
  });
} catch (err) {
  // TODO: Handle 'err' of type ApiError, where 'err.payload' is always the Undeclared arm
}
```

<!-- field: b2 -->

```
try {
  await client.examples.examplesDifferentNames({
    q: "AUTHORED-q1",
    body: { a: "AUTHORED-b2" },
  });
} catch (err) {
  // TODO: Handle 'err' of type ApiError, where 'err.payload' is always the Undeclared arm
}
```

## POST /examples/query-only

<!-- field: q1 -->

```
try {
  await client.examples.examplesQueryOnly({
    q: "AUTHORED-q1",
    body: { a: "some example string" },
  });
} catch (err) {
  // TODO: Handle 'err' of type ApiError, where 'err.payload' is always the Undeclared arm
}
```

<!-- field: q2 -->

```
try {
  await client.examples.examplesQueryOnly({
    q: "AUTHORED-q2",
    body: { a: "some example string" },
  });
} catch (err) {
  // TODO: Handle 'err' of type ApiError, where 'err.payload' is always the Undeclared arm
}
```

## POST /examples/ref

<!-- field: ref-case -->

```
try {
  await client.examples.examplesRef({
    body: { a: "AUTHORED-ref" },
  });
} catch (err) {
  // TODO: Handle 'err' of type ApiError, where 'err.payload' is always the Undeclared arm
}
```

## POST /examples/same-names

<!-- field: first-case -->

```
try {
  await client.examples.examplesSameNames({
    q: "AUTHORED-q-first",
    body: { a: "AUTHORED-body-first" },
  });
} catch (err) {
  // TODO: Handle 'err' of type ApiError, where 'err.payload' is always the Undeclared arm
}
```

<!-- field: second-case -->

```
try {
  await client.examples.examplesSameNames({
    q: "AUTHORED-q-second",
    body: { a: "AUTHORED-body-second" },
  });
} catch (err) {
  // TODO: Handle 'err' of type ApiError, where 'err.payload' is always the Undeclared arm
}
```

## POST /examples/single

```typescript
try {
  await client.examples.examplesSingle({
    body: { a: "AUTHORED-single" },
  });
} catch (err) {
  // TODO: Handle 'err' of type ApiError, where 'err.payload' is always the Undeclared arm
}
```

## POST /examples/two-named

<!-- field: first-case -->

```
try {
  await client.examples.examplesTwoNamed({
    body: { a: "AUTHORED-first" },
  });
} catch (err) {
  // TODO: Handle 'err' of type ApiError, where 'err.payload' is always the Undeclared arm
}
```

<!-- field: second-case -->

```
try {
  await client.examples.examplesTwoNamed({
    body: { a: "AUTHORED-second" },
  });
} catch (err) {
  // TODO: Handle 'err' of type ApiError, where 'err.payload' is always the Undeclared arm
}
```

## POST /media/binary

```typescript
try {
  await client.media.mediaBinary({
    body: new Uint8Array(),
  });
} catch (err) {
  // TODO: Handle 'err' of type ApiError, where 'err.payload' is always the Undeclared arm
}
```

## POST /media/form

```typescript
try {
  await client.media.mediaForm({
    a: "AUTHORED-form-a",
    b: "some example string",
  });
} catch (err) {
  // TODO: Handle 'err' of type ApiError, where 'err.payload' is always the Undeclared arm
}
```

## POST /media/multipart

```typescript
try {
  await client.media.mediaMultipart({
    note: "AUTHORED-note",
    upload: new Uint8Array(),
  });
} catch (err) {
  // TODO: Handle 'err' of type ApiError, where 'err.payload' is always the Undeclared arm
}
```

## POST /media/text

```typescript
try {
  await client.media.mediaText({ body: "AUTHORED-text" });
} catch (err) {
  // TODO: Handle 'err' of type ApiError, where 'err.payload' is always the Undeclared arm
}
```

## POST /shapes/array-body

```typescript
try {
  await client.shapes.shapesArrayBody({
    body: [
      { a: "AUTHORED-item-1" },
      { a: "AUTHORED-item-2" },
    ],
  });
} catch (err) {
  // TODO: Handle 'err' of type ApiError, where 'err.payload' is always the Undeclared arm
}
```

## POST /shapes/optional-body

```typescript
try {
  await client.shapes.shapesOptionalBody();
} catch (err) {
  // TODO: Handle 'err' of type ApiError, where 'err.payload' is always the Undeclared arm
}
```

## POST /shapes/union-body

```typescript
try {
  await client.shapes.shapesUnionBody({
    body: { y: "AUTHORED-root-y" },
  });
} catch (err) {
  // TODO: Handle 'err' of type ApiError, where 'err.payload' is always the Undeclared arm
}
```

## POST /types/no-example

```typescript
try {
  await client.types.typesNoExample({
    body: {
      str: "some example string",
      password: "some example password",
      email: "user@example.com",
      uri: "https://example.com",
      uriRef: "/path/to/resource",
      ipv4: "192.0.2.1",
      ipv6: "2001:db8::1",
      hostname: "example.com",
      uuid: "00000000-0000-0000-0000-000000000000",
      int32: 1,
      int64: 1,
      double: 1.5,
      bool: true,
      date: "2024-01-15",
      dateTime: new Date(Date.UTC(2024, 0, 15, 9, 30, 0)),
      strEnum: StrEnum.FirstMember,
      intEnum: IntEnum._10,
      strArray: ["some example string"],
      strMap: { key: "some example string" },
      nested: { req: "some example string" },
    },
  });
} catch (err) {
  // TODO: Handle 'err' of type ApiError, where 'err.payload' is always the Undeclared arm
}
```

## POST /types/with-example

```typescript
try {
  await client.types.typesWithExample({
    body: {
      str: "AUTHORED-string",
      password: "AUTHORED-password",
      email: "authored@example.org",
      uri: "https://authored.example.org/x",
      uriRef: "/authored/path",
      ipv4: "198.51.100.7",
      ipv6: "2001:db8::7",
      hostname: "authored.example.org",
      uuid: "11111111-2222-3333-4444-555555555555",
      int32: 42,
      int64: 4294967296,
      double: 42.5,
      bool: false,
      date: "2026-05-01",
      dateTime: new Date(Date.UTC(2026, 4, 1, 10, 15, 30)),
      strEnum: StrEnum.SecondMember,
      intEnum: IntEnum._20,
      strArray: ["AUTHORED-a", "AUTHORED-b"],
      strMap: { k1: "AUTHORED-1", k2: "AUTHORED-2" },
      nested: {
        req: "AUTHORED-nested-req",
        opt: "AUTHORED-nested-opt",
      },
    },
  });
} catch (err) {
  // TODO: Handle 'err' of type ApiError, where 'err.payload' is always the Undeclared arm
}
```

## POST /unions/u01-discriminator-second

```typescript
try {
  await client.unions.u01DiscriminatorSecond({
    body: {
      pet: { petType: "dog", bark: "AUTHORED-woof" },
    },
  });
} catch (err) {
  // TODO: Handle 'err' of type ApiError, where 'err.payload' is always the Undeclared arm
}
```

## POST /unions/u02-discriminator-missing

```typescript
try {
  await client.unions.u02DiscriminatorMissing({
    body: { pet: { petType: "cat" } },
  });
} catch (err) {
  // TODO: Handle 'err' of type ApiError, where 'err.payload' is always the Undeclared arm
}
```

## POST /unions/u03-discriminator-unknown

```typescript
try {
  await client.unions.u03DiscriminatorUnknown({
    body: { pet: { petType: "cat" } },
  });
} catch (err) {
  // TODO: Handle 'err' of type ApiError, where 'err.payload' is always the Undeclared arm
}
```

## POST /unions/u04-oneof-fits-second

```typescript
try {
  await client.unions.u04OneofFitsSecond({
    body: { value: { y: "AUTHORED-y" } },
  });
} catch (err) {
  // TODO: Handle 'err' of type ApiError, where 'err.payload' is always the Undeclared arm
}
```

## POST /unions/u06-oneof-no-example

```typescript
try {
  await client.unions.u06OneofNoExample({
    body: { value: { x: "some example string" } },
  });
} catch (err) {
  // TODO: Handle 'err' of type ApiError, where 'err.payload' is always the Undeclared arm
}
```

## POST /unions/u07-anyof-fits-second

```typescript
try {
  await client.unions.u07AnyofFitsSecond({
    body: { value: { y: "AUTHORED-y" } },
  });
} catch (err) {
  // TODO: Handle 'err' of type ApiError, where 'err.payload' is always the Undeclared arm
}
```

## POST /unions/u08-anyof-no-example

```typescript
try {
  await client.unions.u08AnyofNoExample({
    body: { value: { x: "some example string" } },
  });
} catch (err) {
  // TODO: Handle 'err' of type ApiError, where 'err.payload' is always the Undeclared arm
}
```

## POST /unions/u09-allof

```typescript
try {
  await client.unions.u09Allof({
    body: { id: "AUTHORED-id", name: "AUTHORED-name" },
  });
} catch (err) {
  // TODO: Handle 'err' of type ApiError, where 'err.payload' is always the Undeclared arm
}
```

## POST /unions/u10-allof-duplicate

```typescript
try {
  await client.unions.u10AllofDuplicate({
    body: { v: "AUTHORED-v" },
  });
} catch (err) {
  // TODO: Handle 'err' of type ApiError, where 'err.payload' is always the Undeclared arm
}
```

## PUT /shapes/resources/{id}

```typescript
try {
  await client.shapes.shapesPut({
    id: "AUTHORED-id",
    body: { a: "AUTHORED-put" },
  });
} catch (err) {
  // TODO: Handle 'err' of type ApiError, where 'err.payload' is always the Undeclared arm
}
```
