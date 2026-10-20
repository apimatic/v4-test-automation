## POST /case/c6-type-array-null-ok

```typescript
try {
  await client.c6TypeArrayNullOk({
    body: { value: "some example string" },
  });
} catch (err) {
  // TODO: Handle 'err' of type ApiError, where 'err.payload' is always the Undeclared arm
}
```

## POST /case/c7-type-array-string-ok

```typescript
try {
  await client.c7TypeArrayStringOk({
    body: { value: "AUTHORED-31-string" },
  });
} catch (err) {
  // TODO: Handle 'err' of type ApiError, where 'err.payload' is always the Undeclared arm
}
```

## POST /case/d8-type-array-wrong-member

```typescript
try {
  await client.d8TypeArrayWrongMember({
    body: { value: "42" },
  });
} catch (err) {
  // TODO: Handle 'err' of type ApiError, where 'err.payload' is always the Undeclared arm
}
```

## POST /case/r3-array-bare-scalar-31

```typescript
try {
  await client.r3ArrayBareScalar31({
    body: { value: ["AUTHORED-1234"] },
  });
} catch (err) {
  // TODO: Handle 'err' of type ApiError, where 'err.payload' is always the Undeclared arm
}
```
