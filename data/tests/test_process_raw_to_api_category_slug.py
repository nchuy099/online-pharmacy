import pathlib
import sys

PROJECT_ROOT = pathlib.Path(__file__).resolve().parents[2]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from data.process_raw_to_api import Importer


def test_normalize_category_nodes_keeps_full_path_slug():
    importer = Importer(dry_run=True)
    raw = {
        "categories": [
            {"name": "Thuốc", "slug": "thuoc", "level": 1},
            {"name": "Thuốc tim mạch & máu", "slug": "thuoc/thuoc-tim-mach-and-mau", "level": 2},
            {"name": "Thuốc cầm máu", "slug": "thuoc/thuoc-tim-mach-and-mau/thuoc-cam-mau", "level": 3},
        ]
    }

    nodes = importer._normalize_category_nodes(raw)

    assert [n["slug"] for n in nodes] == [
        "thuoc",
        "thuoc/thuoc-tim-mach-and-mau",
        "thuoc/thuoc-tim-mach-and-mau/thuoc-cam-mau",
    ]


def test_ensure_category_chain_reuses_cache_with_name_based_slug_fallback():
    importer = Importer(dry_run=True)
    importer.category_cache = {
        "thuoc": "cat-1",
        "thuoc/thuoc-tim-mach-and-mau": "cat-2",
    }
    importer.category_by_context_slug = {
        ("thuoc", 1, ""): "cat-1",
        ("thuoc/thuoc-tim-mach-and-mau", 2, "thuoc"): "cat-2",
    }
    raw = {
        "categories": [
            {"name": "Thuốc", "slug": "thuoc", "level": 1},
            {"name": "Thuốc tim mạch & máu", "slug": "thuoc/thuoc-tim-mach-and-mau", "level": 2},
        ]
    }

    leaf = importer._ensure_category_chain(raw)

    assert leaf == "cat-2"


def test_ensure_category_chain_skips_when_duplicate_detected():
    importer = Importer(dry_run=False)
    importer.category_cache = {"thuoc": "cat-1"}
    importer.category_by_context_slug = {("thuoc", 1, ""): "cat-1"}

    def fake_create(*args, **kwargs):
        return None, True

    importer._create_category_with_retry = fake_create  # type: ignore[method-assign]

    raw = {
        "categories": [
            {"name": "Thuốc", "slug": "thuoc", "level": 1},
            {"name": "Thuốc tim mạch & máu", "slug": "thuoc/thuoc-tim-mach-and-mau", "level": 2},
        ]
    }

    leaf = importer._ensure_category_chain(raw)

    assert leaf == "cat-1"
    assert "thuoc/thuoc-tim-mach-and-mau" not in importer.category_cache
