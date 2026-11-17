## DELETE /shapes/resources/{id}

```python
try:
    client.shapes.shapes_delete(
        "AUTHORED-id", Simple(a="AUTHORED-delete")
    )
except ApiError as e:
    ...  # TODO: Handle 'e.error' of type RawError
```

## GET /examples/header-path/{p}

<!-- field: h1 -->

```
try:
    client.examples.examples_header_path(
        "AUTHORED-p1", "AUTHORED-h1"
    )
except ApiError as e:
    ...  # TODO: Handle 'e.error' of type RawError
```

<!-- field: h2 -->

```
try:
    client.examples.examples_header_path(
        "AUTHORED-p1", "AUTHORED-h2"
    )
except ApiError as e:
    ...  # TODO: Handle 'e.error' of type RawError
```

## GET /params/no-example/{pathNoEx}

```python
try:
    client.params.params_no_example(
        "some example string",
        "some example string",
        "some example string",
    )
except ApiError as e:
    ...  # TODO: Handle 'e.error' of type RawError
```

## GET /params/with-example/{pathEx}

```python
try:
    client.params.params_with_example(
        "AUTHORED-path",
        "AUTHORED-query",
        "AUTHORED-schema-ex",
        "AUTHORED-header",
        q_opt_ex="AUTHORED-optional",
    )
except ApiError as e:
    ...  # TODO: Handle 'e.error' of type RawError
```

## GET /query-styles

```python
try:
    client.params.query_styles(
        ["AUTHORED-fe1", "AUTHORED-fe2"],
        ["AUTHORED-fn1", "AUTHORED-fn2"],
        DeepFilter(from_="AUTHORED-from", to="AUTHORED-to"),
        ["AUTHORED-p1", "AUTHORED-p2"],
        ["AUTHORED-s1", "AUTHORED-s2"],
    )
except ApiError as e:
    ...  # TODO: Handle 'e.error' of type RawError
```

## PATCH /shapes/resources/{id}

```python
try:
    client.shapes.shapes_patch(
        "AUTHORED-id", Simple(a="AUTHORED-patch")
    )
except ApiError as e:
    ...  # TODO: Handle 'e.error' of type RawError
```

## POST /body/b02-optional-missing

```python
try:
    client.body.b02_optional_missing(
        RequiredAndOptional(a="AUTHORED-a")
    )
except ApiError as e:
    ...  # TODO: Handle 'e.error' of type RawError
```

## POST /body/b03-extra-key

```python
try:
    client.body.b03_extra_key(Simple(a="AUTHORED-a"))
except ApiError as e:
    ...  # TODO: Handle 'e.error' of type RawError
```

## POST /body/b05-enum-not-member

```python
try:
    client.body.b05_enum_not_member(
        EnumHolder(value=StrEnum.FIRST_MEMBER)
    )
except ApiError as e:
    ...  # TODO: Handle 'e.error' of type RawError
```

## POST /body/b06-enum-case

```python
try:
    client.body.b06_enum_case(
        EnumHolder(value=StrEnum.FIRST_MEMBER)
    )
except ApiError as e:
    ...  # TODO: Handle 'e.error' of type RawError
```

## POST /body/b07-number-as-string

```python
try:
    client.body.b07_number_as_string(IntHolder(value=7))
except ApiError as e:
    ...  # TODO: Handle 'e.error' of type RawError
```

## POST /body/b08-boolean-as-string

```python
try:
    client.body.b08_boolean_as_string(
        BoolHolder(value=False)
    )
except ApiError as e:
    ...  # TODO: Handle 'e.error' of type RawError
```

## POST /body/b09-string-as-number

```python
try:
    client.body.b09_string_as_number(
        StringHolder(value="864508030147323")
    )
except ApiError as e:
    ...  # TODO: Handle 'e.error' of type RawError
```

## POST /body/b10-datetime-no-tz

```python
try:
    client.body.b10_datetime_no_tz(
        DateTimeHolder(
            value=datetime(
                2026, 5, 1, 10, 15, 30, tzinfo=timezone.utc
            ),
        ),
    )
except ApiError as e:
    ...  # TODO: Handle 'e.error' of type RawError
```

## POST /body/b14-array-given-scalar

```python
try:
    client.body.b14_array_given_scalar(
        ArrayHolder(value=["AUTHORED-x"])
    )
except ApiError as e:
    ...  # TODO: Handle 'e.error' of type RawError
```

## POST /body/b15-map-given-scalar

```python
try:
    client.body.b15_map_given_scalar(
        MapHolder(value={"key": "some example string"})
    )
except ApiError as e:
    ...  # TODO: Handle 'e.error' of type RawError
```

## POST /examples/different-names

<!-- field: b1 -->

```
try:
    client.examples.examples_different_names(
        "AUTHORED-q1", Simple(a="AUTHORED-b1")
    )
except ApiError as e:
    ...  # TODO: Handle 'e.error' of type RawError
```

<!-- field: b2 -->

```
try:
    client.examples.examples_different_names(
        "AUTHORED-q1", Simple(a="AUTHORED-b2")
    )
except ApiError as e:
    ...  # TODO: Handle 'e.error' of type RawError
```

## POST /examples/query-only

<!-- field: q1 -->

```
try:
    client.examples.examples_query_only(
        "AUTHORED-q1", Simple(a="some example string")
    )
except ApiError as e:
    ...  # TODO: Handle 'e.error' of type RawError
```

<!-- field: q2 -->

```
try:
    client.examples.examples_query_only(
        "AUTHORED-q2", Simple(a="some example string")
    )
except ApiError as e:
    ...  # TODO: Handle 'e.error' of type RawError
```

## POST /examples/ref

<!-- field: ref-case -->

```
try:
    client.examples.examples_ref(Simple(a="AUTHORED-ref"))
except ApiError as e:
    ...  # TODO: Handle 'e.error' of type RawError
```

## POST /examples/same-names

<!-- field: first-case -->

```
try:
    client.examples.examples_same_names(
        "AUTHORED-q-first", Simple(a="AUTHORED-body-first")
    )
except ApiError as e:
    ...  # TODO: Handle 'e.error' of type RawError
```

<!-- field: second-case -->

```
try:
    client.examples.examples_same_names(
        "AUTHORED-q-second",
        Simple(a="AUTHORED-body-second"),
    )
except ApiError as e:
    ...  # TODO: Handle 'e.error' of type RawError
```

## POST /examples/single

```python
try:
    client.examples.examples_single(
        Simple(a="AUTHORED-single")
    )
except ApiError as e:
    ...  # TODO: Handle 'e.error' of type RawError
```

## POST /examples/two-named

<!-- field: first-case -->

```
try:
    client.examples.examples_two_named(
        Simple(a="AUTHORED-first")
    )
except ApiError as e:
    ...  # TODO: Handle 'e.error' of type RawError
```

<!-- field: second-case -->

```
try:
    client.examples.examples_two_named(
        Simple(a="AUTHORED-second")
    )
except ApiError as e:
    ...  # TODO: Handle 'e.error' of type RawError
```

## POST /media/binary

```python
try:
    client.media.media_binary(Path("path/to/file.bin"))
except ApiError as e:
    ...  # TODO: Handle 'e.error' of type RawError
```

## POST /media/form

```python
try:
    client.media.media_form(
        "AUTHORED-form-a", "some example string"
    )
except ApiError as e:
    ...  # TODO: Handle 'e.error' of type RawError
```

## POST /media/multipart

```python
try:
    client.media.media_multipart(
        "AUTHORED-note", Path("path/to/file.bin")
    )
except ApiError as e:
    ...  # TODO: Handle 'e.error' of type RawError
```

## POST /media/text

```python
try:
    client.media.media_text("AUTHORED-text")
except ApiError as e:
    ...  # TODO: Handle 'e.error' of type RawError
```

## POST /shapes/array-body

```python
try:
    client.shapes.shapes_array_body(
        [
            Simple(a="AUTHORED-item-1"),
            Simple(a="AUTHORED-item-2"),
        ],
    )
except ApiError as e:
    ...  # TODO: Handle 'e.error' of type RawError
```

## POST /shapes/optional-body

```python
try:
    client.shapes.shapes_optional_body()
except ApiError as e:
    ...  # TODO: Handle 'e.error' of type RawError
```

## POST /shapes/union-body

```python
try:
    client.shapes.shapes_union_body(
        OptionB(y="AUTHORED-root-y")
    )
except ApiError as e:
    ...  # TODO: Handle 'e.error' of type RawError
```

## POST /types/no-example

```python
try:
    client.types.types_no_example(
        AllTypes(
            str_="some example string",
            password="some example password",
            email="user@example.com",
            uri="https://example.com",
            uri_ref="/path/to/resource",
            ipv4="192.0.2.1",
            ipv6="2001:db8::1",
            hostname="example.com",
            uuid=UUID(
                "00000000-0000-0000-0000-000000000000"
            ),
            int32=1,
            int64=1,
            double=1.5,
            bool_=True,
            date=date(2024, 1, 15),
            date_time=datetime(
                2024, 1, 15, 9, 30, 0, tzinfo=timezone.utc
            ),
            str_enum=StrEnum.FIRST_MEMBER,
            int_enum=IntEnum.VALUE_10,
            str_array=["some example string"],
            str_map={"key": "some example string"},
            nested=Nested(req="some example string"),
        ),
    )
except ApiError as e:
    ...  # TODO: Handle 'e.error' of type RawError
```

## POST /types/with-example

```python
try:
    client.types.types_with_example(
        AllTypes(
            str_="AUTHORED-string",
            password="AUTHORED-password",
            email="authored@example.org",
            uri="https://authored.example.org/x",
            uri_ref="/authored/path",
            ipv4="198.51.100.7",
            ipv6="2001:db8::7",
            hostname="authored.example.org",
            uuid=UUID(
                "11111111-2222-3333-4444-555555555555"
            ),
            int32=42,
            int64=4294967296,
            double=42.5,
            bool_=False,
            date=date(2026, 5, 1),
            date_time=datetime(
                2026, 5, 1, 10, 15, 30, tzinfo=timezone.utc
            ),
            str_enum=StrEnum.SECOND_MEMBER,
            int_enum=IntEnum.VALUE_20,
            str_array=["AUTHORED-a", "AUTHORED-b"],
            str_map={
                "k1": "AUTHORED-1", "k2": "AUTHORED-2"
            },
            nested=Nested(
                req="AUTHORED-nested-req",
                opt="AUTHORED-nested-opt",
            ),
        ),
    )
except ApiError as e:
    ...  # TODO: Handle 'e.error' of type RawError
```

## POST /unions/u01-discriminator-second

```python
try:
    client.unions_api.u01_discriminator_second(
        PetHolder(
            pet=Dog(pet_type="dog", bark="AUTHORED-woof")
        ),
    )
except ApiError as e:
    ...  # TODO: Handle 'e.error' of type RawError
```

## POST /unions/u02-discriminator-missing

```python
try:
    client.unions_api.u02_discriminator_missing(
        PetHolder(pet=Cat(pet_type="cat"))
    )
except ApiError as e:
    ...  # TODO: Handle 'e.error' of type RawError
```

## POST /unions/u03-discriminator-unknown

```python
try:
    client.unions_api.u03_discriminator_unknown(
        PetHolder(pet=Cat(pet_type="cat"))
    )
except ApiError as e:
    ...  # TODO: Handle 'e.error' of type RawError
```

## POST /unions/u04-oneof-fits-second

```python
try:
    client.unions_api.u04_oneof_fits_second(
        OneOfHolder(value=OptionB(y="AUTHORED-y"))
    )
except ApiError as e:
    ...  # TODO: Handle 'e.error' of type RawError
```

## POST /unions/u06-oneof-no-example

```python
try:
    client.unions_api.u06_oneof_no_example(
        OneOfHolder(value=OptionA(x="some example string"))
    )
except ApiError as e:
    ...  # TODO: Handle 'e.error' of type RawError
```

## POST /unions/u07-anyof-fits-second

```python
try:
    client.unions_api.u07_anyof_fits_second(
        AnyOfHolder(value=OptionB(y="AUTHORED-y"))
    )
except ApiError as e:
    ...  # TODO: Handle 'e.error' of type RawError
```

## POST /unions/u08-anyof-no-example

```python
try:
    client.unions_api.u08_anyof_no_example(
        AnyOfHolder(value=OptionA(x="some example string"))
    )
except ApiError as e:
    ...  # TODO: Handle 'e.error' of type RawError
```

## POST /unions/u09-allof

```python
try:
    client.unions_api.u09_allof(
        Combined(id="AUTHORED-id", name="AUTHORED-name")
    )
except ApiError as e:
    ...  # TODO: Handle 'e.error' of type RawError
```

## POST /unions/u10-allof-duplicate

```python
try:
    client.unions_api.u10_allof_duplicate(
        CombinedDuplicate(v="AUTHORED-v")
    )
except ApiError as e:
    ...  # TODO: Handle 'e.error' of type RawError
```

## PUT /shapes/resources/{id}

```python
try:
    client.shapes.shapes_put(
        "AUTHORED-id", Simple(a="AUTHORED-put")
    )
except ApiError as e:
    ...  # TODO: Handle 'e.error' of type RawError
```
