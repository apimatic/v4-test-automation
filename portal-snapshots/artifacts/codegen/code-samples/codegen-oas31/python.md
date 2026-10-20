## POST /case/c6-type-array-null-ok

```python
try:
    client.c6_type_array_null_ok(
        C6TypeArrayNullOk(value="some example string")
    )
except ApiError as e:
    ...  # TODO: Handle 'e.error' of type RawError
```

## POST /case/c7-type-array-string-ok

```python
try:
    client.c7_type_array_string_ok(
        C7TypeArrayStringOk(value="AUTHORED-31-string")
    )
except ApiError as e:
    ...  # TODO: Handle 'e.error' of type RawError
```

## POST /case/d8-type-array-wrong-member

```python
try:
    client.d8_type_array_wrong_member(
        D8TypeArrayWrongMember(value="42")
    )
except ApiError as e:
    ...  # TODO: Handle 'e.error' of type RawError
```

## POST /case/r3-array-bare-scalar-31

```python
try:
    client.r3_array_bare_scalar_31(
        R3ArrayBareScalar31(value=["AUTHORED-1234"])
    )
except ApiError as e:
    ...  # TODO: Handle 'e.error' of type RawError
```
