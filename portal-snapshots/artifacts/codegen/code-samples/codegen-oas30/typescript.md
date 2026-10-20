## POST /case/c1-byte-valid

```typescript
try {
  await client.c1ByteValid({
    body: { value: "QVVUSE9SRUQ=" },
  });
} catch (err) {
  // TODO: Handle 'err' of type ApiError, where 'err.payload' is always the Undeclared arm
}
```

## POST /case/c2-date-valid

```typescript
try {
  await client.c2DateValid({
    body: { value: "2026-05-01" },
  });
} catch (err) {
  // TODO: Handle 'err' of type ApiError, where 'err.payload' is always the Undeclared arm
}
```

## POST /case/c3-array-of-arrays-nested

```typescript
try {
  await client.c3ArrayOfArraysNested({
    body: { value: [["AUTHORED-a", "AUTHORED-b"]] },
  });
} catch (err) {
  // TODO: Handle 'err' of type ApiError, where 'err.payload' is always the Undeclared arm
}
```

## POST /case/c4-null-on-nullable

```typescript
try {
  await client.c4NullOnNullable({
    body: { value: "some example string" },
  });
} catch (err) {
  // TODO: Handle 'err' of type ApiError, where 'err.payload' is always the Undeclared arm
}
```

## POST /case/c5-oneof-match

```typescript
try {
  await client.c5OneofMatch({
    body: { value: "AUTHORED-oneof-string" },
  });
} catch (err) {
  // TODO: Handle 'err' of type ApiError, where 'err.payload' is always the Undeclared arm
}
```

## POST /case/d1-byte-invalid

```typescript
try {
  await client.d1ByteInvalid({
    body: { value: "some example string" },
  });
} catch (err) {
  // TODO: Handle 'err' of type ApiError, where 'err.payload' is always the Undeclared arm
}
```

## POST /case/d2-date-day-first

```typescript
try {
  await client.d2DateDayFirst({
    body: { value: "2024-01-15" },
  });
} catch (err) {
  // TODO: Handle 'err' of type ApiError, where 'err.payload' is always the Undeclared arm
}
```

## POST /case/d3-date-impossible

```typescript
try {
  await client.d3DateImpossible({
    body: { value: "2024-01-15" },
  });
} catch (err) {
  // TODO: Handle 'err' of type ApiError, where 'err.payload' is always the Undeclared arm
}
```

## POST /case/d4-array-of-arrays-flat

```typescript
try {
  await client.d4ArrayOfArraysFlat({
    body: { value: [["some example string"]] },
  });
} catch (err) {
  // TODO: Handle 'err' of type ApiError, where 'err.payload' is always the Undeclared arm
}
```

## POST /case/d5-null-on-non-nullable

```typescript
try {
  await client.d5NullOnNonNullable({
    body: { value: "some example string" },
  });
} catch (err) {
  // TODO: Handle 'err' of type ApiError, where 'err.payload' is always the Undeclared arm
}
```

## POST /case/d6-oneof-no-match

```typescript
try {
  await client.d6OneofNoMatch({
    body: { value: "some example string" },
  });
} catch (err) {
  // TODO: Handle 'err' of type ApiError, where 'err.payload' is always the Undeclared arm
}
```

## POST /case/d7-nullable-wrong-type

```typescript
try {
  await client.d7NullableWrongType({
    body: { value: "42" },
  });
} catch (err) {
  // TODO: Handle 'err' of type ApiError, where 'err.payload' is always the Undeclared arm
}
```

## POST /case/k1-map-of-arrays-bad

```typescript
try {
  await client.k1MapOfArraysBad({
    body: { value: { key: "AUTHORED-not-an-array" } },
  });
} catch (err) {
  // TODO: Handle 'err' of type ApiError, where 'err.payload' is always the Undeclared arm
}
```

## POST /case/k2-object-as-json-string

```typescript
try {
  await client.k2ObjectAsJsonString({
    body: { value: { x: 1 } },
  });
} catch (err) {
  // TODO: Handle 'err' of type ApiError, where 'err.payload' is always the Undeclared arm
}
```

## POST /case/r1-array-bare-scalar

```typescript
try {
  await client.r1ArrayBareScalar({
    body: { value: ["AUTHORED-1234"] },
  });
} catch (err) {
  // TODO: Handle 'err' of type ApiError, where 'err.payload' is always the Undeclared arm
}
```

## POST /case/r2-param-array-bare-scalar

```typescript
try {
  await client.r2ParamArrayBareScalar({
    r2Tags: ["AUTHORED-one-two"],
    body: { value: "AUTHORED-body" },
  });
} catch (err) {
  // TODO: Handle 'err' of type ApiError, where 'err.payload' is always the Undeclared arm
}
```
