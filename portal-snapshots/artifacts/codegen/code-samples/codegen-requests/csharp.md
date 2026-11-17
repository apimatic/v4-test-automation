## DELETE /shapes/resources/{id}

```csharp
try
{
    await client.Shapes.ShapesDelete(new ShapesDeleteRequest
    {
        Id = "AUTHORED-id",
        Body = new Simple { A = "AUTHORED-delete" },
    });
}
catch (ApiException<RawError> ex)
{
    // TODO: Handle 'ex.Error' of type RawError
}
```

## GET /examples/header-path/{p}

<!-- field: h1 -->

```
try
{
    await client.Examples.ExamplesHeaderPath(
        new ExamplesHeaderPathRequest
        {
            P = "AUTHORED-p1",
            H = "AUTHORED-h1",
        });
}
catch (ApiException<RawError> ex)
{
    // TODO: Handle 'ex.Error' of type RawError
}
```

<!-- field: h2 -->

```
try
{
    await client.Examples.ExamplesHeaderPath(
        new ExamplesHeaderPathRequest
        {
            P = "AUTHORED-p1",
            H = "AUTHORED-h2",
        });
}
catch (ApiException<RawError> ex)
{
    // TODO: Handle 'ex.Error' of type RawError
}
```

## GET /params/no-example/{pathNoEx}

```csharp
try
{
    await client.Params.ParamsNoExample(
        new ParamsNoExampleRequest
        {
            PathNoEx = "some example string",
            QReq = "some example string",
            HReq = "some example string",
        });
}
catch (ApiException<RawError> ex)
{
    // TODO: Handle 'ex.Error' of type RawError
}
```

## GET /params/with-example/{pathEx}

```csharp
try
{
    await client.Params.ParamsWithExample(
        new ParamsWithExampleRequest
        {
            PathEx = "AUTHORED-path",
            QReqEx = "AUTHORED-query",
            QSchemaEx = "AUTHORED-schema-ex",
            QOptEx = "AUTHORED-optional",
            HReqEx = "AUTHORED-header",
        });
}
catch (ApiException<RawError> ex)
{
    // TODO: Handle 'ex.Error' of type RawError
}
```

## GET /query-styles

```csharp
try
{
    await client.Params.QueryStyles(new QueryStylesRequest
    {
        FormExplode = ["AUTHORED-fe1", "AUTHORED-fe2"],
        FormNoExplode = ["AUTHORED-fn1", "AUTHORED-fn2"],
        Deep = new DeepFilter
        {
            From = "AUTHORED-from",
            To = "AUTHORED-to",
        },
        Pipe = ["AUTHORED-p1", "AUTHORED-p2"],
        Space = ["AUTHORED-s1", "AUTHORED-s2"],
    });
}
catch (ApiException<RawError> ex)
{
    // TODO: Handle 'ex.Error' of type RawError
}
```

## PATCH /shapes/resources/{id}

```csharp
try
{
    await client.Shapes.ShapesPatch(new ShapesPatchRequest
    {
        Id = "AUTHORED-id",
        Body = new Simple { A = "AUTHORED-patch" },
    });
}
catch (ApiException<RawError> ex)
{
    // TODO: Handle 'ex.Error' of type RawError
}
```

## POST /body/b02-optional-missing

```csharp
try
{
    await client.Body.B02OptionalMissing(
        new B02OptionalMissingRequest
        {
            Body = new RequiredAndOptional
            {
                A = "AUTHORED-a",
            },
        });
}
catch (ApiException<RawError> ex)
{
    // TODO: Handle 'ex.Error' of type RawError
}
```

## POST /body/b03-extra-key

```csharp
try
{
    await client.Body.B03ExtraKey(new B03ExtraKeyRequest
    {
        Body = new Simple { A = "AUTHORED-a" },
    });
}
catch (ApiException<RawError> ex)
{
    // TODO: Handle 'ex.Error' of type RawError
}
```

## POST /body/b05-enum-not-member

```csharp
try
{
    await client.Body.B05EnumNotMember(
        new B05EnumNotMemberRequest
        {
            Body = new EnumHolder
            {
                Value = StrEnum.FirstMember,
            },
        });
}
catch (ApiException<RawError> ex)
{
    // TODO: Handle 'ex.Error' of type RawError
}
```

## POST /body/b06-enum-case

```csharp
try
{
    await client.Body.B06EnumCase(new B06EnumCaseRequest
    {
        Body = new EnumHolder
        {
            Value = StrEnum.FirstMember,
        },
    });
}
catch (ApiException<RawError> ex)
{
    // TODO: Handle 'ex.Error' of type RawError
}
```

## POST /body/b07-number-as-string

```csharp
try
{
    await client.Body.B07NumberAsString(
        new B07NumberAsStringRequest
        {
            Body = new IntHolder { Value = 7 },
        });
}
catch (ApiException<RawError> ex)
{
    // TODO: Handle 'ex.Error' of type RawError
}
```

## POST /body/b08-boolean-as-string

```csharp
try
{
    await client.Body.B08BooleanAsString(
        new B08BooleanAsStringRequest
        {
            Body = new BoolHolder { Value = false },
        });
}
catch (ApiException<RawError> ex)
{
    // TODO: Handle 'ex.Error' of type RawError
}
```

## POST /body/b09-string-as-number

```csharp
try
{
    await client.Body.B09StringAsNumber(
        new B09StringAsNumberRequest
        {
            Body = new StringHolder
            {
                Value = "864508030147323",
            },
        });
}
catch (ApiException<RawError> ex)
{
    // TODO: Handle 'ex.Error' of type RawError
}
```

## POST /body/b10-datetime-no-tz

```csharp
try
{
    await client.Body.B10DatetimeNoTz(
        new B10DatetimeNoTzRequest
        {
            Body = new DateTimeHolder
            {
                Value = DateTimeOffset.Parse(
                    "2026-05-01T10:15:30Z"),
            },
        });
}
catch (ApiException<RawError> ex)
{
    // TODO: Handle 'ex.Error' of type RawError
}
```

## POST /body/b14-array-given-scalar

```csharp
try
{
    await client.Body.B14ArrayGivenScalar(
        new B14ArrayGivenScalarRequest
        {
            Body = new ArrayHolder
            {
                Value = ["AUTHORED-x"],
            },
        });
}
catch (ApiException<RawError> ex)
{
    // TODO: Handle 'ex.Error' of type RawError
}
```

## POST /body/b15-map-given-scalar

```csharp
try
{
    await client.Body.B15MapGivenScalar(
        new B15MapGivenScalarRequest
        {
            Body = new MapHolder
            {
                Value = new Dictionary<string, string>
                {
                    ["key"] = "some example string",
                },
            },
        });
}
catch (ApiException<RawError> ex)
{
    // TODO: Handle 'ex.Error' of type RawError
}
```

## POST /examples/different-names

<!-- field: b1 -->

```
try
{
    await client.Examples.ExamplesDifferentNames(
        new ExamplesDifferentNamesRequest
        {
            Q = "AUTHORED-q1",
            Body = new Simple { A = "AUTHORED-b1" },
        });
}
catch (ApiException<RawError> ex)
{
    // TODO: Handle 'ex.Error' of type RawError
}
```

<!-- field: b2 -->

```
try
{
    await client.Examples.ExamplesDifferentNames(
        new ExamplesDifferentNamesRequest
        {
            Q = "AUTHORED-q1",
            Body = new Simple { A = "AUTHORED-b2" },
        });
}
catch (ApiException<RawError> ex)
{
    // TODO: Handle 'ex.Error' of type RawError
}
```

## POST /examples/query-only

<!-- field: q1 -->

```
try
{
    await client.Examples.ExamplesQueryOnly(
        new ExamplesQueryOnlyRequest
        {
            Q = "AUTHORED-q1",
            Body = new Simple { A = "some example string" },
        });
}
catch (ApiException<RawError> ex)
{
    // TODO: Handle 'ex.Error' of type RawError
}
```

<!-- field: q2 -->

```
try
{
    await client.Examples.ExamplesQueryOnly(
        new ExamplesQueryOnlyRequest
        {
            Q = "AUTHORED-q2",
            Body = new Simple { A = "some example string" },
        });
}
catch (ApiException<RawError> ex)
{
    // TODO: Handle 'ex.Error' of type RawError
}
```

## POST /examples/ref

<!-- field: ref-case -->

```
try
{
    await client.Examples.ExamplesRef(new ExamplesRefRequest
    {
        Body = new Simple { A = "AUTHORED-ref" },
    });
}
catch (ApiException<RawError> ex)
{
    // TODO: Handle 'ex.Error' of type RawError
}
```

## POST /examples/same-names

<!-- field: first-case -->

```
try
{
    await client.Examples.ExamplesSameNames(
        new ExamplesSameNamesRequest
        {
            Q = "AUTHORED-q-first",
            Body = new Simple { A = "AUTHORED-body-first" },
        });
}
catch (ApiException<RawError> ex)
{
    // TODO: Handle 'ex.Error' of type RawError
}
```

<!-- field: second-case -->

```
try
{
    await client.Examples.ExamplesSameNames(
        new ExamplesSameNamesRequest
        {
            Q = "AUTHORED-q-second",
            Body = new Simple
            {
                A = "AUTHORED-body-second",
            },
        });
}
catch (ApiException<RawError> ex)
{
    // TODO: Handle 'ex.Error' of type RawError
}
```

## POST /examples/single

```csharp
try
{
    await client.Examples.ExamplesSingle(
        new ExamplesSingleRequest
        {
            Body = new Simple { A = "AUTHORED-single" },
        });
}
catch (ApiException<RawError> ex)
{
    // TODO: Handle 'ex.Error' of type RawError
}
```

## POST /examples/two-named

<!-- field: first-case -->

```
try
{
    await client.Examples.ExamplesTwoNamed(
        new ExamplesTwoNamedRequest
        {
            Body = new Simple { A = "AUTHORED-first" },
        });
}
catch (ApiException<RawError> ex)
{
    // TODO: Handle 'ex.Error' of type RawError
}
```

<!-- field: second-case -->

```
try
{
    await client.Examples.ExamplesTwoNamed(
        new ExamplesTwoNamedRequest
        {
            Body = new Simple { A = "AUTHORED-second" },
        });
}
catch (ApiException<RawError> ex)
{
    // TODO: Handle 'ex.Error' of type RawError
}
```

## POST /media/binary

```csharp
try
{
    await client.Media.MediaBinary(new MediaBinaryRequest
    {
        Body = Array.Empty<byte>(),
    });
}
catch (ApiException<RawError> ex)
{
    // TODO: Handle 'ex.Error' of type RawError
}
```

## POST /media/form

```csharp
try
{
    await client.Media.MediaForm(new MediaFormRequest
    {
        A = "AUTHORED-form-a",
        B = "some example string",
    });
}
catch (ApiException<RawError> ex)
{
    // TODO: Handle 'ex.Error' of type RawError
}
```

## POST /media/multipart

```csharp
try
{
    await client.Media.MediaMultipart(
        new MediaMultipartRequest
        {
            Note = "AUTHORED-note",
            Upload = Array.Empty<byte>(),
        });
}
catch (ApiException<RawError> ex)
{
    // TODO: Handle 'ex.Error' of type RawError
}
```

## POST /media/text

```csharp
try
{
    await client.Media.MediaText(new MediaTextRequest
    {
        Body = "AUTHORED-text",
    });
}
catch (ApiException<RawError> ex)
{
    // TODO: Handle 'ex.Error' of type RawError
}
```

## POST /shapes/array-body

```csharp
try
{
    await client.Shapes.ShapesArrayBody(
        new ShapesArrayBodyRequest
        {
            Body = [
                new Simple { A = "AUTHORED-item-1" },
                new Simple { A = "AUTHORED-item-2" },
            ],
        });
}
catch (ApiException<RawError> ex)
{
    // TODO: Handle 'ex.Error' of type RawError
}
```

## POST /shapes/optional-body

```csharp
try
{
    await client.Shapes.ShapesOptionalBody(
        new ShapesOptionalBodyRequest());
}
catch (ApiException<RawError> ex)
{
    // TODO: Handle 'ex.Error' of type RawError
}
```

## POST /shapes/union-body

```csharp
try
{
    await client.Shapes.ShapesUnionBody(
        new ShapesUnionBodyOperationRequest
        {
            Body = new OptionB { Y = "AUTHORED-root-y" },
        });
}
catch (ApiException<RawError> ex)
{
    // TODO: Handle 'ex.Error' of type RawError
}
```

## POST /types/no-example

```csharp
try
{
    await client.Types.TypesNoExample(
        new TypesNoExampleRequest
        {
            Body = new AllTypes
            {
                Str = "some example string",
                Password = "some example password",
                Email = "user@example.com",
                Uri = "https://example.com",
                UriRef = "/path/to/resource",
                Ipv4 = "192.0.2.1",
                Ipv6 = "2001:db8::1",
                Hostname = "example.com",
                Uuid = Guid.Parse(
                    "00000000-0000-0000-0000-000000000000"),
                Int32 = 1,
                Int64 = 1L,
                Double = 1.5d,
                Bool = true,
                Date = DateTimeOffset.Parse(
                    "2024-01-15T00:00:00Z"),
                DateTime = DateTimeOffset.Parse(
                    "2024-01-15T09:30:00Z"),
                StrEnum = StrEnum.FirstMember,
                IntEnum = IntEnumEnum.Value10,
                StrArray = ["some example string"],
                StrMap = new Dictionary<string, string>
                {
                    ["key"] = "some example string",
                },
                Nested = new Nested
                {
                    Req = "some example string",
                },
            },
        });
}
catch (ApiException<RawError> ex)
{
    // TODO: Handle 'ex.Error' of type RawError
}
```

## POST /types/with-example

```csharp
try
{
    await client.Types.TypesWithExample(
        new TypesWithExampleRequest
        {
            Body = new AllTypes
            {
                Str = "AUTHORED-string",
                Password = "AUTHORED-password",
                Email = "authored@example.org",
                Uri = "https://authored.example.org/x",
                UriRef = "/authored/path",
                Ipv4 = "198.51.100.7",
                Ipv6 = "2001:db8::7",
                Hostname = "authored.example.org",
                Uuid = Guid.Parse(
                    "11111111-2222-3333-4444-555555555555"),
                Int32 = 42,
                Int64 = 4294967296L,
                Double = 42.5d,
                Bool = false,
                Date = DateTimeOffset.Parse(
                    "2026-05-01T00:00:00Z"),
                DateTime = DateTimeOffset.Parse(
                    "2026-05-01T10:15:30Z"),
                StrEnum = StrEnum.SecondMember,
                IntEnum = IntEnumEnum.Value20,
                StrArray = ["AUTHORED-a", "AUTHORED-b"],
                StrMap = new Dictionary<string, string>
                {
                    ["k1"] = "AUTHORED-1",
                    ["k2"] = "AUTHORED-2",
                },
                Nested = new Nested
                {
                    Req = "AUTHORED-nested-req",
                    Opt = "AUTHORED-nested-opt",
                },
            },
        });
}
catch (ApiException<RawError> ex)
{
    // TODO: Handle 'ex.Error' of type RawError
}
```

## POST /unions/u01-discriminator-second

```csharp
try
{
    await client.Unions.U01DiscriminatorSecond(
        new U01DiscriminatorSecondRequest
        {
            Body = new PetHolder
            {
                Pet = new Dog
                {
                    PetType = "dog",
                    Bark = "AUTHORED-woof",
                },
            },
        });
}
catch (ApiException<RawError> ex)
{
    // TODO: Handle 'ex.Error' of type RawError
}
```

## POST /unions/u02-discriminator-missing

```csharp
try
{
    await client.Unions.U02DiscriminatorMissing(
        new U02DiscriminatorMissingRequest
        {
            Body = new PetHolder
            {
                Pet = new Cat { PetType = "cat" },
            },
        });
}
catch (ApiException<RawError> ex)
{
    // TODO: Handle 'ex.Error' of type RawError
}
```

## POST /unions/u03-discriminator-unknown

```csharp
try
{
    await client.Unions.U03DiscriminatorUnknown(
        new U03DiscriminatorUnknownRequest
        {
            Body = new PetHolder
            {
                Pet = new Cat { PetType = "cat" },
            },
        });
}
catch (ApiException<RawError> ex)
{
    // TODO: Handle 'ex.Error' of type RawError
}
```

## POST /unions/u04-oneof-fits-second

```csharp
try
{
    await client.Unions.U04OneofFitsSecond(
        new U04OneofFitsSecondRequest
        {
            Body = new OneOfHolder
            {
                Value = new OptionB { Y = "AUTHORED-y" },
            },
        });
}
catch (ApiException<RawError> ex)
{
    // TODO: Handle 'ex.Error' of type RawError
}
```

## POST /unions/u06-oneof-no-example

```csharp
try
{
    await client.Unions.U06OneofNoExample(
        new U06OneofNoExampleRequest
        {
            Body = new OneOfHolder
            {
                Value = new OptionA
                {
                    X = "some example string",
                },
            },
        });
}
catch (ApiException<RawError> ex)
{
    // TODO: Handle 'ex.Error' of type RawError
}
```

## POST /unions/u07-anyof-fits-second

```csharp
try
{
    await client.Unions.U07AnyofFitsSecond(
        new U07AnyofFitsSecondRequest
        {
            Body = new AnyOfHolder
            {
                Value = new OptionB { Y = "AUTHORED-y" },
            },
        });
}
catch (ApiException<RawError> ex)
{
    // TODO: Handle 'ex.Error' of type RawError
}
```

## POST /unions/u08-anyof-no-example

```csharp
try
{
    await client.Unions.U08AnyofNoExample(
        new U08AnyofNoExampleRequest
        {
            Body = new AnyOfHolder
            {
                Value = new OptionA
                {
                    X = "some example string",
                },
            },
        });
}
catch (ApiException<RawError> ex)
{
    // TODO: Handle 'ex.Error' of type RawError
}
```

## POST /unions/u09-allof

```csharp
try
{
    await client.Unions.U09Allof(new U09AllofRequest
    {
        Body = new Combined
        {
            Id = "AUTHORED-id",
            Name = "AUTHORED-name",
        },
    });
}
catch (ApiException<RawError> ex)
{
    // TODO: Handle 'ex.Error' of type RawError
}
```

## POST /unions/u10-allof-duplicate

```csharp
try
{
    await client.Unions.U10AllofDuplicate(
        new U10AllofDuplicateRequest
        {
            Body = new CombinedDuplicate
            {
                V = "AUTHORED-v",
            },
        });
}
catch (ApiException<RawError> ex)
{
    // TODO: Handle 'ex.Error' of type RawError
}
```

## PUT /shapes/resources/{id}

```csharp
try
{
    await client.Shapes.ShapesPut(new ShapesPutRequest
    {
        Id = "AUTHORED-id",
        Body = new Simple { A = "AUTHORED-put" },
    });
}
catch (ApiException<RawError> ex)
{
    // TODO: Handle 'ex.Error' of type RawError
}
```
