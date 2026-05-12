---
paths:
  - scripts/**.py
---
# Python code style

## types
- Use type hints for function parameters and return values.
- avoid using `typing.List, typing.Dict, etc.`. Use built-in `list`, `dict`, etc. instead.

## General
- Use pathlib module for file system paths instead of os.path.
- Use f-strings for string formatting instead of concatenation or %-formatting.
