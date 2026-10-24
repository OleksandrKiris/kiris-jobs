"""Pure preparation for PR67; no route and no bundled/redefined API schema."""
from collections.abc import Callable
from copy import deepcopy

from .material_snapshot import InvalidMaterialSnapshot, MaterialSnapshot, canonical_language


def adapt_material_response(response: object, *, build_version: str,
                            validate_schema: Callable[[object], None]) -> tuple[MaterialSnapshot, ...]:
    """Validate using owner-14's pinned schema, then map verified public metadata.

    The trusted caller supplies a schema validator that raises on invalid input.
    Build version comes from packaging, never from the content SHA. Input and
    validator receive separate copies; neither can change the caller's snapshot.
    This maps metadata only, not title/text rendering or query/HTTP behaviour.
    """
    data = deepcopy(response)
    validate_schema(deepcopy(data))
    if not isinstance(data, dict):
        raise InvalidMaterialSnapshot("response must be an object")
    try:
        requested = data['requested_language']
        effective = data['effective_language']
        fallback = data['fallback']
        if type(fallback) is not bool or fallback != (canonical_language(requested) != effective):
            raise InvalidMaterialSnapshot("inconsistent fallback")
        if data['api_version'] != 'v1' or data['schema_version'] != '1.0.0':
            raise InvalidMaterialSnapshot("unsupported contract version")
        if data['next_cursor'] is not None:
            raise InvalidMaterialSnapshot("unsupported pagination")
        result = []
        for item in data['items']:
            source = item['source']
            if source['verification_status'] != 'verified-against-repository' or item['synthetic'] is not False:
                raise InvalidMaterialSnapshot("only repository-verified public metadata accepted")
            if item['language'] != effective:
                raise InvalidMaterialSnapshot("inconsistent item language")
            if source['ref'] != data['content_version']:
                raise InvalidMaterialSnapshot("inconsistent source version")
            result.append(MaterialSnapshot(
                location_id=item['location_id'], material_id=item['id'],
                requested_language=requested, effective_language=effective,
                source_ref=f"{source['repo']}@{source['ref']}:{source['path']}#{source['selector']}",
                content_version=data['content_version'], schema_version=data['schema_version'],
                api_version=data['api_version'], build_version=build_version,
                confirmation_ref=f"repository-comparison:{source['verified_on']}",
            ))
        return tuple(result)
    except (KeyError, TypeError) as exc:
        raise InvalidMaterialSnapshot("invalid response metadata") from exc
