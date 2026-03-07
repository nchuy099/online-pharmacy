import pathlib
import sys

PROJECT_ROOT = pathlib.Path(__file__).resolve().parents[2]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from data.process_raw_to_api import Importer


def _base_raw() -> dict:
    return {
        "slug": "thuoc/test-sp-1",
        "name": "Test Product",
        "prices": [
            {
                "price": 120000,
                "measureUnitName": "hop",
                "level": 1,
            }
        ],
    }


def test_map_payload_uses_short_description_when_description_is_null():
    importer = Importer(dry_run=True)
    raw = _base_raw()
    raw["description"] = None
    raw["short_description"] = "Mo ta ngan"

    payload = importer._map_product_payload(1, raw, "cat-1")

    assert payload is not None
    assert payload["description"] == "Mo ta ngan"


def test_map_payload_keeps_description_when_present():
    importer = Importer(dry_run=True)
    raw = _base_raw()
    raw["description"] = "Mo ta day du"
    raw["short_description"] = "Mo ta ngan"

    payload = importer._map_product_payload(2, raw, "cat-1")

    assert payload is not None
    assert payload["description"] == "Mo ta day du"
