"""Entirely synthetic metadata; no claim of approved production material."""
from dataclasses import FrozenInstanceError, replace
import unittest

from backend.domain.material_snapshot import (
    InvalidMaterialSnapshot, MaterialSnapshot, canonical_language, select_material,
)


def fixture(**changes):
    values = dict(location_id="fixture-location-A", material_id="fixture-reader-01",
                  requested_language="ua", effective_language="uk",
                  source_ref="fixture:reader", content_version="content-3",
                  schema_version="internal-1", api_version="unassigned",
                  build_version="fixture-build-7", confirmation_ref="fixture:approval")
    return MaterialSnapshot(**(values | changes))


class MaterialSnapshotTests(unittest.TestCase):
    def test_alias_is_not_a_fallback_and_ids_are_preserved(self):
        item = fixture()
        self.assertEqual(canonical_language("ua"), "uk")
        self.assertFalse(item.is_fallback)
        self.assertEqual(item.material_id, "fixture-reader-01")
        self.assertEqual(item.requested_language, "ua")

    def test_explicit_fallback(self):
        self.assertTrue(fixture(requested_language="ka").is_fallback)

    def test_location_isolation_and_unknown_id_are_indistinguishable(self):
        item = fixture()
        self.assertIsNone(select_material(item, location_id="fixture-location-B", material_id=item.material_id))
        self.assertIsNone(select_material(item, location_id=item.location_id, material_id="missing"))
        self.assertIs(select_material(item, location_id=item.location_id, material_id=item.material_id), item)

    def test_read_does_not_mutate_or_share_state_between_locations(self):
        a, b = fixture(), fixture(location_id="fixture-location-B")
        select_material(a, location_id=a.location_id, material_id=a.material_id)
        self.assertEqual(b.location_id, "fixture-location-B")
        with self.assertRaises(FrozenInstanceError):
            a.location_id = b.location_id

    def test_versions_remain_independent(self):
        item = fixture()
        changed = replace(item, build_version="fixture-build-8")
        self.assertEqual(changed.content_version, item.content_version)
        self.assertEqual(changed.schema_version, item.schema_version)
        self.assertEqual(changed.api_version, item.api_version)

    def test_missing_or_malformed_metadata_rejected(self):
        for field in ("location_id", "material_id", "source_ref", "content_version", "schema_version",
                      "api_version", "build_version", "confirmation_ref"):
            for value in ("", " ", None, 1, True, " padded "):
                with self.subTest(field=field, value=value), self.assertRaises(InvalidMaterialSnapshot):
                    fixture(**{field: value})

    def test_unconfirmed_status_rejected(self):
        for status in ("draft", "withdrawn", "unknown", "CONFIRMED", None, True):
            with self.subTest(status=status), self.assertRaises(InvalidMaterialSnapshot):
                fixture(status=status)

    def test_language_negative_cases(self):
        for value in ("", None, 1, True, " uk "):
            with self.subTest(value=value), self.assertRaises(InvalidMaterialSnapshot):
                fixture(requested_language=value)
        with self.assertRaises(InvalidMaterialSnapshot):
            fixture(effective_language="ua")

    def test_invalid_lookup_rejected(self):
        with self.assertRaises(InvalidMaterialSnapshot):
            select_material({}, location_id="A", material_id="B")
        with self.assertRaises(InvalidMaterialSnapshot):
            select_material(fixture(), location_id="", material_id="B")


if __name__ == "__main__":
    unittest.main()
