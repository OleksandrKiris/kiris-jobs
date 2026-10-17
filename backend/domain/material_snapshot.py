"""Internal read-only snapshot validation, pending the owner-14 API contract.

No content is approved here: confirmation is supplied by a trusted local loader.
No HTTP, storage, network, authentication or online adapter is provided.
"""
from dataclasses import dataclass


class InvalidMaterialSnapshot(ValueError):
    """Snapshot metadata is inconsistent or cannot be served as confirmed."""


def canonical_language(value: str) -> str:
    if type(value) is not str or not value or value != value.strip():
        raise InvalidMaterialSnapshot("language must be a nonempty exact string")
    return "uk" if value == "ua" else value


def _nonempty(value: object, field: str) -> None:
    if type(value) is not str or not value.strip() or value != value.strip():
        raise InvalidMaterialSnapshot(f"{field} must be a nonempty exact string")


@dataclass(frozen=True, slots=True)
class MaterialSnapshot:
    """Immutable internal metadata; IDs are preserved without normalization.

    This is not an HTTP response schema. Versions are independent opaque labels.
    The loader must verify provenance/confirmation; this class validates shape.
    """
    location_id: str
    material_id: str
    requested_language: str
    effective_language: str
    source_ref: str
    content_version: str
    schema_version: str
    api_version: str
    build_version: str
    confirmation_ref: str
    status: str = "confirmed"

    def __post_init__(self) -> None:
        for field in ("location_id", "material_id", "source_ref", "content_version",
                      "schema_version", "api_version", "build_version", "confirmation_ref"):
            _nonempty(getattr(self, field), field)
        canonical_language(self.requested_language)
        if canonical_language(self.effective_language) != self.effective_language:
            raise InvalidMaterialSnapshot("effective language must be canonical")
        if self.status != "confirmed":
            raise InvalidMaterialSnapshot("only confirmed snapshots may be served")

    @property
    def is_fallback(self) -> bool:
        return canonical_language(self.requested_language) != self.effective_language


def select_material(snapshot: MaterialSnapshot, *, location_id: str,
                    material_id: str) -> MaterialSnapshot | None:
    """Exact scoped lookup; another location and missing ID have the same result.

    Does not search, translate, mutate, confirm, authorize or fetch content.
    """
    if not isinstance(snapshot, MaterialSnapshot):
        raise InvalidMaterialSnapshot("expected a validated snapshot")
    _nonempty(location_id, "location_id")
    _nonempty(material_id, "material_id")
    if (snapshot.location_id, snapshot.material_id) != (location_id, material_id):
        return None
    return snapshot
