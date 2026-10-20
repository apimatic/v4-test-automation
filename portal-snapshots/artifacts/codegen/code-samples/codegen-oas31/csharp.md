## POST /case/c6-type-array-null-ok

```csharp
try
{
    await client.C6TypeArrayNullOk(
        new C6TypeArrayNullOkRequest
        {
            Body = new C6TypeArrayNullOk
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

## POST /case/c7-type-array-string-ok

```csharp
try
{
    await client.C7TypeArrayStringOk(
        new C7TypeArrayStringOkRequest
        {
            Body = new C7TypeArrayStringOk
            {
                Value = "AUTHORED-31-string",
            },
        });
}
catch (ApiException<RawError> ex)
{
    // TODO: Handle 'ex.Error' of type RawError
}
```

## POST /case/d8-type-array-wrong-member

```csharp
try
{
    await client.D8TypeArrayWrongMember(
        new D8TypeArrayWrongMemberRequest
        {
            Body = new D8TypeArrayWrongMember
            {
                Value = "42",
            },
        });
}
catch (ApiException<RawError> ex)
{
    // TODO: Handle 'ex.Error' of type RawError
}
```

## POST /case/r3-array-bare-scalar-31

```csharp
try
{
    await client.R3ArrayBareScalar31(
        new R3ArrayBareScalar31Request
        {
            Body = new R3ArrayBareScalar31
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
