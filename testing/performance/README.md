# Performance

This folder contains the customer-facing performance workflow for `online-pharmacy`.

## What is here

- `seed_performance_fixtures.py`
- `product-read-load-test.js`
- `customer-capacity-test.js`
- `customer-stress-test.js`
- `customer-spike-test.js`
- `customer-helpers.js`
- `lib.js`
- `data/`

## Requirements

- PostgreSQL with the application schema already migrated
- `k6` installed for load testing
- Python dependencies from `data/requirements.txt`

Install Python dependencies if needed:

```bash
python -m pip install -r data/requirements.txt
```

## Seed workflow

The seed script is DB-first and exports primary-image products plus their `categorySlug` into `testing/performance/data/products.json`.
It first picks about 20 categories that each have at least 10 products, then exports up to 1000 products for load tests.

### Run seed

```bash
DATABASE_URL=postgresql://postgres:password@localhost:5434/smart_pharma \
python testing/performance/seed_performance_fixtures.py \
  --catalog-limit 1000
```

### Useful seed options

- `--catalog-limit`: limit exported catalog rows for smaller local runs
- `--primary-image-only`: keep only products that have a primary image

## Generated fixtures

The script writes these files:

- `testing/performance/data/products.json`

## Run the k6 tests

All tests use the generated fixtures in `testing/performance/data/`.

### Environment

Create a local env file from the template and load it before running k6:

```bash
cp testing/performance/.env.example testing/performance/.env
source testing/performance/.env
```

The template includes the backend `BASE_URL`, PostgreSQL connection settings for the seed script, and credentials used by the k6 setup login. The current performance scripts authenticate with the super admin account and only need the product fixture.

Use `testing/performance/run-k6.sh` to generate result files with a timestamp and run id prefix.
Each run writes a dedicated folder under `testing/performance/results/` and places four artifacts inside it:

- `*_summary.json`
- `*_metrics.csv`
- `*_request-details.csv`
- `*_report.html`

The summary JSON includes a top-level `metadata` object with run id, a readable UTC+7 timestamp, script path, product count, and output file paths.

### Load test

```bash
RUN_ID=product-read-baseline \
testing/performance/run-k6.sh product-read-baseline testing/performance/product-read-load-test.js
```

To run the 500-user, 5-minute load test:

```bash
VUS=500 DURATION=5m RUN_ID=product-read-500-5m \
testing/performance/run-k6.sh product-read-500-5m testing/performance/product-read-load-test.js
```

### Capacity test

```bash
RUN_ID=capacity-100 VUS=100 \
testing/performance/run-k6.sh capacity-100 testing/performance/customer-capacity-test.js
```

### Stress test

```bash
RUN_ID=customer-stress-baseline \
testing/performance/run-k6.sh customer-stress-baseline testing/performance/customer-stress-test.js
```

### Spike test

```bash
RUN_ID=customer-spike-baseline \
testing/performance/run-k6.sh customer-spike-baseline testing/performance/customer-spike-test.js
```

## Notes

- `BASE_URL` is the backend URL used by the k6 scripts.
- `DATABASE_URL` is only needed for the Python seed script.
- The performance profile mocks GHN so external shipping latency does not affect results.
