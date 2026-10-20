## POST /case/c1-byte-valid

```python
try:
    client.c1_byte_valid(C1ByteValid(value="QVVUSE9SRUQ="))
except ApiError as e:
    ...  # TODO: Handle 'e.error' of type RawError
```

## POST /case/c2-date-valid

```python
try:
    client.c2_date_valid(
        C2DateValid(value=date(2026, 5, 1))
    )
except ApiError as e:
    ...  # TODO: Handle 'e.error' of type RawError
```

## POST /case/c3-array-of-arrays-nested

```python
try:
    client.c3_array_of_arrays_nested(
        C3ArrayOfArraysNested(
            value=[["AUTHORED-a", "AUTHORED-b"]]
        ),
    )
except ApiError as e:
    ...  # TODO: Handle 'e.error' of type RawError
```

## POST /case/c4-null-on-nullable

```python
try:
    client.c4_null_on_nullable(
        C4NullOnNullable(value="some example string")
    )
except ApiError as e:
    ...  # TODO: Handle 'e.error' of type RawError
```

## POST /case/c5-oneof-match

```python
try:
    client.c5_oneof_match(
        C5OneofMatch(value="AUTHORED-oneof-string")
    )
except ApiError as e:
    ...  # TODO: Handle 'e.error' of type RawError
```

## POST /case/d1-byte-invalid

```python
try:
    client.d1_byte_invalid(
        D1ByteInvalid(value="some example string")
    )
except ApiError as e:
    ...  # TODO: Handle 'e.error' of type RawError
```

## POST /case/d2-date-day-first

```python
try:
    client.d2_date_day_first(
        D2DateDayFirst(value=date(2024, 1, 15))
    )
except ApiError as e:
    ...  # TODO: Handle 'e.error' of type RawError
```

## POST /case/d3-date-impossible

```python
try:
    client.d3_date_impossible(
        D3DateImpossible(value=date(2024, 1, 15))
    )
except ApiError as e:
    ...  # TODO: Handle 'e.error' of type RawError
```

## POST /case/d4-array-of-arrays-flat

```python
try:
    client.d4_array_of_arrays_flat(
        D4ArrayOfArraysFlat(value=[["some example string"]])
    )
except ApiError as e:
    ...  # TODO: Handle 'e.error' of type RawError
```

## POST /case/d5-null-on-non-nullable

```python
try:
    client.d5_null_on_non_nullable(
        D5NullOnNonNullable(value="some example string")
    )
except ApiError as e:
    ...  # TODO: Handle 'e.error' of type RawError
```

## POST /case/d6-oneof-no-match

```python
try:
    client.d6_oneof_no_match(
        D6OneofNoMatch(value="some example string")
    )
except ApiError as e:
    ...  # TODO: Handle 'e.error' of type RawError
```

## POST /case/d7-nullable-wrong-type

```python
try:
    client.d7_nullable_wrong_type(
        D7NullableWrongType(value="42")
    )
except ApiError as e:
    ...  # TODO: Handle 'e.error' of type RawError
```

## POST /case/k1-map-of-arrays-bad

```python
try:
    client.k1_map_of_arrays_bad(
        K1MapOfArraysBad(
            value={"key": "AUTHORED-not-an-array"}
        ),
    )
except ApiError as e:
    ...  # TODO: Handle 'e.error' of type RawError
```

## POST /case/k2-object-as-json-string

```python
try:
    client.k2_object_as_json_string(
        K2ObjectAsJsonString(value=Value(x=1))
    )
except ApiError as e:
    ...  # TODO: Handle 'e.error' of type RawError
```

## POST /case/r1-array-bare-scalar

```python
try:
    client.r1_array_bare_scalar(
        R1ArrayBareScalar(value=["AUTHORED-1234"])
    )
except ApiError as e:
    ...  # TODO: Handle 'e.error' of type RawError
```

## POST /case/r2-param-array-bare-scalar

```python
try:
    client.r2_param_array_bare_scalar(
        ["AUTHORED-one-two"],
        R2ParamArrayBareScalar(value="AUTHORED-body"),
    )
except ApiError as e:
    ...  # TODO: Handle 'e.error' of type RawError
```
