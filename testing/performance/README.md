# Performance

This folder contains the customer-facing performance workflow for `online-pharmacy`.

## What is here

- `seed_performance_fixtures.py`
- `customer-load-test.js`
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

The seed script is DB-first and runs in this order:

1. Export `categories`, `products`, and `variants` from PostgreSQL into `testing/performance/data/`
2. Seed `CUSTOMER` users and one address per customer directly in PostgreSQL
3. Import stock directly in PostgreSQL for every exported variant

The stock import uses:

- `quantity = --stock-quantity`
- `unit_cost = salePrice * 0.8`

### Run seed

```bash
DATABASE_URL=postgresql://postgres:password@localhost:5434/smart_pharma \
python testing/performance/seed_performance_fixtures.py \
  --customer-count 100 \
  --stock-quantity 100000
```

### Useful seed options

- `--customer-count`: number of generated performance customers
- `--stock-quantity`: imported quantity per variant
- `--customer-prefix`: email prefix for generated users
- `--run-prefix`: adds a run-specific suffix to generated customer emails
- `--catalog-limit`: limit exported catalog rows for smaller local runs

## Generated fixtures

The script writes these files:

- `testing/performance/data/categories.json`
- `testing/performance/data/products.json`
- `testing/performance/data/variants.json`
- `testing/performance/data/customers.json`

## Run the k6 tests

All tests use the generated fixtures in `testing/performance/data/`.

### Load test

```bash
RUN_ID=customer-load-baseline \
BASE_URL=http://localhost:8080 \
k6 run --summary-export results/customer-load-baseline.json \
testing/performance/customer-load-test.js
```

### Capacity test

```bash
RUN_ID=capacity-100 \
VUS=100 \
BASE_URL=http://localhost:8080 \
k6 run --summary-export results/capacity-100.json \
testing/performance/customer-capacity-test.js
```

### Stress test

```bash
RUN_ID=customer-stress-baseline \
BASE_URL=http://localhost:8080 \
k6 run --summary-export results/customer-stress-baseline.json \
testing/performance/customer-stress-test.js
```

### Spike test

```bash
RUN_ID=customer-spike-baseline \
BASE_URL=http://localhost:8080 \
k6 run --summary-export results/customer-spike-baseline.json \
testing/performance/customer-spike-test.js
```

## Notes

- `BASE_URL` is the backend URL used by the k6 scripts.
- `DATABASE_URL` is only needed for the Python seed script.
- The performance profile mocks GHN so external shipping latency does not affect results.
