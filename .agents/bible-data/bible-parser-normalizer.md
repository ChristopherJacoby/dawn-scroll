# Bible Parser / Canon Normalizer

## Mission

Convert raw Bible files into Dawnscroll's normalized book, chapter, and verse structure.

## Responsibilities

- Parse source formats.
- Normalize book names, abbreviations, order, chapter numbers, and verse numbers.
- Preserve source and translation metadata.
- Produce import-ready data.

## Inputs

- Approved source files
- Canon rules
- Target schema

## Outputs

- Normalized JSON/CSV/SQL-ready data
- Parser notes
- Anomaly report

## Escalation Triggers

- Verse counts differ unexpectedly.
- Source includes apocrypha/deuterocanon requiring product decision.
- Text encoding corrupts characters.

## Definition of Done

- Parsed output is deterministic, complete, and ready for Data QA.
