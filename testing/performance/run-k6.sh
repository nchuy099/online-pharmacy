#!/usr/bin/env bash
set -euo pipefail

if [[ $# -lt 2 ]]; then
  echo "Usage: $0 <run-id> <k6-script> [k6-args...]" >&2
  exit 1
fi

run_id="$1"
script_path="$2"
shift 2

env_file="testing/performance/.env"
if [[ -f "$env_file" ]]; then
  # shellcheck disable=SC1090
  set -a
  source "$env_file"
  set +a
fi

timestamp="$(TZ=Asia/Ho_Chi_Minh date +%Y%m%d_%H%M%S)"
timestamp_display="$(TZ=Asia/Ho_Chi_Minh date '+%Y-%m-%d %H:%M:%S UTC+7')"
script_name="$(basename "$script_path" .js)"
results_root="testing/performance/results"
run_dir="${results_root}/${timestamp}_${run_id}_${script_name}"
artifact_prefix="${run_dir}/${script_name}"
run_dir_rel="/${timestamp}_${run_id}_${script_name}"
summary_rel="${run_dir_rel}/${script_name}_summary.json"
metrics_rel="${run_dir_rel}/${script_name}_metrics.csv"
request_details_rel="${run_dir_rel}/${script_name}_request-details.csv"
report_rel="${run_dir_rel}/${script_name}_report.html"
summary_file="${artifact_prefix}_summary.json"
metrics_file="${artifact_prefix}_metrics.csv"
request_details_file="${artifact_prefix}_request-details.csv"
report_file="${artifact_prefix}_report.html"
tmp_summary_file="$(mktemp /tmp/k6-summary.XXXXXX.json)"
products_file="testing/performance/data/products.json"
product_count_value="-"
if [[ -f "$products_file" ]]; then
  product_count_value="$(jq 'length' "$products_file" 2>/dev/null || true)"
fi
cleanup() {
  rm -f "$tmp_summary_file"
}
trap cleanup EXIT

mkdir -p "$run_dir"

k6 run --summary-export "$tmp_summary_file" --out "csv=${metrics_file}" "$script_path" "$@"

metadata_json="$(jq -cn \
  --arg runId "$run_id" \
  --arg timestampUtc7 "$timestamp" \
  --arg timestampDisplay "$timestamp_display" \
  --arg scriptPath "$script_path" \
  --arg scriptName "$script_name" \
  --arg baseUrl "${BASE_URL:-}" \
  --arg vus "${VUS:-}" \
  --arg duration "${DURATION:-}" \
  --arg productCount "$product_count_value" \
  --arg outputDir "$run_dir_rel" \
  --arg summaryPath "$(basename "$summary_rel")" \
  --arg metricsPath "$(basename "$metrics_rel")" \
  --arg requestDetailsPath "$(basename "$request_details_rel")" \
  --arg reportPath "$(basename "$report_rel")" \
  '{
    runId: $runId,
    timestampUtc7: $timestampUtc7,
    timestampDisplay: $timestampDisplay,
    scriptPath: $scriptPath,
    scriptName: $scriptName,
    baseUrl: $baseUrl,
    vus: $vus,
    duration: $duration,
    productCount: $productCount,
    outputDir: $outputDir,
    summaryPath: $summaryPath,
    metricsPath: $metricsPath,
    requestDetailsPath: $requestDetailsPath,
    reportPath: $reportPath
  }')"

python3 testing/performance/build_k6_report.py \
  --summary-input "$tmp_summary_file" \
  --summary-output "$summary_file" \
  --metrics-csv "$metrics_file" \
  --request-details-csv "$request_details_file" \
  --report-html "$report_file" \
  --metadata-json "$metadata_json"
