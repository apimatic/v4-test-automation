## POST /case/c1-byte-valid

```csharp
try
{
    await client.C1ByteValid(new C1ByteValidRequest
    {
        Body = new C1ByteValid { Value = "QVVUSE9SRUQ=" },
    });
}
catch (ApiException<RawError> ex)
{
    // TODO: Handle 'ex.Error' of type RawError
}
```

## POST /case/c2-date-valid

```csharp
try
{
    await client.C2DateValid(new C2DateValidRequest
    {
        Body = new C2DateValid
        {
            Value = DateTimeOffset.Parse(
                "2026-05-01T00:00:00Z"),
        },
    });
}
catch (ApiException<RawError> ex)
{
    // TODO: Handle 'ex.Error' of type RawError
}
```

## POST /case/c3-array-of-arrays-nested

```csharp
try
{
    await client.C3ArrayOfArraysNested(
        new C3ArrayOfArraysNestedRequest
        {
            Body = new C3ArrayOfArraysNested
            {
                Value = [["AUTHORED-a", "AUTHORED-b"]],
            },
        });
}
catch (ApiException<RawError> ex)
{
    // TODO: Handle 'ex.Error' of type RawError
}
```

## POST /case/c4-null-on-nullable

```csharp
try
{
    await client.C4NullOnNullable(
        new C4NullOnNullableRequest
        {
            Body = new C4NullOnNullable
            {
                Value = "some example string",
            },
        });
}
catch (ApiException<RawError> ex)
{
    // TODO: Handle 'ex.Error' of type RawError
}
```

## POST /case/c5-oneof-match

```csharp
try
{
    await client.C5OneofMatch(new C5OneofMatchRequest
    {
        Body = new C5OneofMatch
        {
            Value = "AUTHORED-oneof-string",
        },
    });
}
catch (ApiException<RawError> ex)
{
    // TODO: Handle 'ex.Error' of type RawError
}
```

## POST /case/d1-byte-invalid

```csharp
try
{
    await client.D1ByteInvalid(new D1ByteInvalidRequest
    {
        Body = new D1ByteInvalid
        {
            Value = "some example string",
        },
    });
}
catch (ApiException<RawError> ex)
{
    // TODO: Handle 'ex.Error' of type RawError
}
```

## POST /case/d2-date-day-first

```csharp
try
{
    await client.D2DateDayFirst(new D2DateDayFirstRequest
    {
        Body = new D2DateDayFirst
        {
            Value = DateTimeOffset.Parse(
                "2024-01-15T00:00:00Z"),
        },
    });
}
catch (ApiException<RawError> ex)
{
    // TODO: Handle 'ex.Error' of type RawError
}
```

## POST /case/d3-date-impossible

```csharp
try
{
    await client.D3DateImpossible(
        new D3DateImpossibleRequest
        {
            Body = new D3DateImpossible
            {
                Value = DateTimeOffset.Parse(
                    "2024-01-15T00:00:00Z"),
            },
        });
}
catch (ApiException<RawError> ex)
{
    // TODO: Handle 'ex.Error' of type RawError
}
```

## POST /case/d4-array-of-arrays-flat

```csharp
try
{
    await client.D4ArrayOfArraysFlat(
        new D4ArrayOfArraysFlatRequest
        {
            Body = new D4ArrayOfArraysFlat
            {
                Value = [["some example string"]],
            },
        });
}
catch (ApiException<RawError> ex)
{
    // TODO: Handle 'ex.Error' of type RawError
}
```

## POST /case/d5-null-on-non-nullable

```csharp
try
{
    await client.D5NullOnNonNullable(
        new D5NullOnNonNullableRequest
        {
            Body = new D5NullOnNonNullable
            {
                Value = "some example string",
            },
        });
}
catch (ApiException<RawError> ex)
{
    // TODO: Handle 'ex.Error' of type RawError
}
```

## POST /case/d6-oneof-no-match

```csharp
try
{
    await client.D6OneofNoMatch(new D6OneofNoMatchRequest
    {
        Body = new D6OneofNoMatch
        {
            Value = "some example string",
        },
    });
}
catch (ApiException<RawError> ex)
{
    // TODO: Handle 'ex.Error' of type RawError
}
```

## POST /case/d7-nullable-wrong-type

```csharp
try
{
    await client.D7NullableWrongType(
        new D7NullableWrongTypeRequest
        {
            Body = new D7NullableWrongType { Value = "42" },
        });
}
catch (ApiException<RawError> ex)
{
    // TODO: Handle 'ex.Error' of type RawError
}
```

## POST /case/k1-map-of-arrays-bad

```csharp
try
{
    await client.K1MapOfArraysBad(
        new K1MapOfArraysBadRequest
        {
            Body = new K1MapOfArraysBad
            {
                Value = new Dictionary<string, object>(),
            },
        });
}
catch (ApiException<RawError> ex)
{
    // TODO: Handle 'ex.Error' of type RawError
}
```

## POST /case/k2-object-as-json-string

```csharp
try
{
    await client.K2ObjectAsJsonString(
        new K2ObjectAsJsonStringRequest
        {
            Body = new K2ObjectAsJsonString
            {
                Value = new Value { X = 1 },
            },
        });
}
catch (ApiException<RawError> ex)
{
    // TODO: Handle 'ex.Error' of type RawError
}
```

## POST /case/r1-array-bare-scalar

```csharp
try
{
    await client.R1ArrayBareScalar(
        new R1ArrayBareScalarRequest
        {
            Body = new R1ArrayBareScalar
            {
                Value = ["AUTHORED-1234"],
            },
        });
}
catch (ApiException<RawError> ex)
{
    // TODO: Handle 'ex.Error' of type RawError
}
```

## POST /case/r2-param-array-bare-scalar

```csharp
try
{
    await client.R2ParamArrayBareScalar(
        new R2ParamArrayBareScalarRequest
        {
            R2Tags = ["AUTHORED-one-two"],
            Body = new R2ParamArrayBareScalar
            {
                Value = "AUTHORED-body",
            },
        });
}
catch (ApiException<RawError> ex)
{
    // TODO: Handle 'ex.Error' of type RawError
}
```
