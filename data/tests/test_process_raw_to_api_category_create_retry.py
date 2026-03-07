import pathlib
import sys

PROJECT_ROOT = pathlib.Path(__file__).resolve().parents[2]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from data.process_raw_to_api import Importer


class _Resp:
    def __init__(self, status_code: int):
        self.status_code = status_code
        self.text = ""

    def json(self):
        return {}


class _Session:
    def __init__(self, status_code: int):
        self.calls = 0
        self._status_code = status_code

    def post(self, *args, **kwargs):
        self.calls += 1
        return _Resp(self._status_code)


def test_create_category_does_not_retry_on_duplicate_status():
    importer = Importer(dry_run=True)
    fake = _Session(409)
    importer.session = fake

    created, is_duplicate = importer._create_category_with_retry({"name": "test"}, retries=3)

    assert created is None
    assert is_duplicate is True
    assert fake.calls == 1
