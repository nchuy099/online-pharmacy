#!/usr/bin/env python3
from __future__ import annotations

import argparse
import csv
import html
import json
from pathlib import Path
from typing import Any
from urllib.parse import urlsplit


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Build k6 artifacts from summary and CSV outputs.")
    parser.add_argument("--summary-input", required=True)
    parser.add_argument("--summary-output", required=True)
    parser.add_argument("--metrics-csv", required=True)
    parser.add_argument("--request-details-csv", required=True)
    parser.add_argument("--report-html", required=True)
    parser.add_argument("--metadata-json", required=True)
    return parser.parse_args()


def load_summary(path: Path) -> dict[str, Any]:
    return json.loads(path.read_text(encoding="utf-8"))


def write_summary(path: Path, payload: dict[str, Any]) -> None:
    path.write_text(json.dumps(payload, ensure_ascii=True, indent=2), encoding="utf-8")


def build_request_details(metrics_csv: Path, request_details_csv: Path) -> int:
    request_details_csv.parent.mkdir(parents=True, exist_ok=True)
    rows_written = 0
    with metrics_csv.open("r", encoding="utf-8", newline="") as source, request_details_csv.open(
        "w", encoding="utf-8", newline=""
    ) as target:
        reader = csv.DictReader(source)
        fieldnames = [
            "timestamp",
            "duration_ms",
            "method",
            "status",
            "url",
            "scenario",
            "group",
            "name",
            "error",
            "error_code",
            "proto",
            "tls_version",
            "extra_tags",
        ]
        writer = csv.DictWriter(target, fieldnames=fieldnames)
        writer.writeheader()

        for row in reader:
            if row.get("metric_name") != "http_req_duration":
                continue
            duration_value = row.get("metric_value", "")
            try:
                duration_value = f"{float(duration_value):.3f}"
            except (TypeError, ValueError):
                duration_value = str(duration_value)
            writer.writerow(
                {
                    "timestamp": row.get("timestamp", ""),
                    "duration_ms": duration_value,
                    "method": row.get("method", ""),
                    "status": row.get("status", ""),
                    "url": row.get("url", ""),
                    "scenario": row.get("scenario", ""),
                    "group": row.get("group", ""),
                    "name": row.get("name", ""),
                    "error": row.get("error", "") or "-",
                    "error_code": row.get("error_code", ""),
                    "proto": row.get("proto", ""),
                    "tls_version": row.get("tls_version", ""),
                    "extra_tags": row.get("extra_tags", ""),
                }
            )
            rows_written += 1
    return rows_written


def load_request_details(request_details_csv: Path) -> list[dict[str, str]]:
    with request_details_csv.open("r", encoding="utf-8", newline="") as handle:
        return list(csv.DictReader(handle))


def metric_value(summary: dict[str, Any], name: str, key: str, fallback: str = "") -> str:
    metric = summary.get("metrics", {}).get(name, {})
    value = metric.get(key)
    return str(value) if value is not None else fallback


def format_number(value: str, *, digits: int = 2) -> str:
    try:
        number = float(value)
    except (TypeError, ValueError):
        return value
    if number.is_integer():
        return f"{int(number)}"
    return f"{number:.{digits}f}"


def format_duration(value: str) -> str:
    formatted = format_number(value, digits=3)
    return f"{formatted} ms" if formatted else value


def format_rate(value: str) -> str:
    try:
        number = float(value)
    except (TypeError, ValueError):
        return value
    return f"{number * 100:.2f}%"


def request_counts(summary: dict[str, Any]) -> tuple[int, int, int, float]:
    total_raw = metric_value(summary, "http_reqs", "count", metric_value(summary, "http_reqs", "value", "0"))
    failed_rate_raw = metric_value(summary, "http_req_failed", "value", "0")
    try:
        total = int(float(total_raw))
    except (TypeError, ValueError):
        total = 0
    try:
        failed_rate = float(failed_rate_raw)
    except (TypeError, ValueError):
        failed_rate = 0.0
    failed = int(round(total * failed_rate))
    success = max(total - failed, 0)
    return total, success, failed, failed_rate


def percentile(values: list[float], pct: float) -> float | None:
    if not values:
        return None
    if len(values) == 1:
        return values[0]
    ordered = sorted(values)
    rank = (len(ordered) - 1) * pct
    lower = int(rank)
    upper = min(lower + 1, len(ordered) - 1)
    weight = rank - lower
    return ordered[lower] * (1 - weight) + ordered[upper] * weight


def build_metadata_rows(metadata: dict[str, Any]) -> str:
    ordered_keys = [
        ("runId", "Run ID"),
        ("timestampDisplay", "Timestamp"),
        ("timestampUtc7", "Timestamp key"),
        ("scriptName", "Script"),
        ("scriptPath", "Script path"),
        ("baseUrl", "Base URL"),
        ("vus", "VUs"),
        ("duration", "Duration"),
        ("productCount", "Product count"),
        ("outputDir", "Output dir"),
        ("summaryPath", "Summary file"),
        ("metricsPath", "Metrics file"),
        ("requestDetailsPath", "Request details file"),
        ("reportPath", "Report file"),
    ]
    rows = []
    for key, label in ordered_keys:
        value = metadata.get(key, "-")
        if value in ("", None):
            value = "-"
        rows.append(
            f"<tr><th>{html.escape(label)}</th><td>{html.escape(str(value))}</td></tr>"
        )
    return "\n".join(rows)


def build_summary_rows(summary: dict[str, Any], *, request_duration_p99: str = "") -> str:
    total_requests, success_requests, failed_requests, failed_rate = request_counts(summary)
    rows = [
        ("HTTP requests", str(total_requests)),
        ("Successful requests", str(success_requests)),
        ("Failed requests", str(failed_requests)),
        ("Error rate", format_rate(str(failed_rate))),
    ]

    for metric_key, label in [
        ("avg", "Req duration avg"),
        ("p(90)", "Req duration p90"),
        ("p(95)", "Req duration p95"),
        ("p(99)", "Req duration p99"),
        ("max", "Req duration max"),
    ]:
        value = metric_value(summary, "http_req_duration", metric_key, "")
        if metric_key == "p(99)" and not value:
            value = request_duration_p99
        if value:
            rows.append((label, format_duration(value)))

    vus_max = metric_value(summary, "vus_max", "max", "")
    if vus_max:
        rows.append(("Max VUs", vus_max))

    return "\n".join(
        "<tr>" f"<th>{html.escape(label)}</th>" f"<td>{html.escape(value)}</td>" "</tr>"
        for label, value in rows
    )


def build_request_rows(request_details: list[dict[str, str]]) -> str:
    def display_url(raw: str) -> str:
        if not raw:
            return ""
        parsed = urlsplit(raw)
        if parsed.scheme and parsed.netloc:
            path = parsed.path or "/"
            return f"{path}?{parsed.query}" if parsed.query else path
        return raw

    rows = []
    for idx, row in enumerate(request_details, start=1):
        rows.append(
            "<tr>"
            f'<td data-col="index">{idx}</td>'
            f"<td>{html.escape(row.get('timestamp', ''))}</td>"
            f"<td>{html.escape(row.get('method', ''))}</td>"
            f"<td>{html.escape(row.get('status', ''))}</td>"
            f"<td>{html.escape(row.get('duration_ms', ''))}</td>"
            f"<td>{html.escape(display_url(row.get('url', '')))}</td>"
            f"<td>{html.escape(row.get('scenario', ''))}</td>"
            f"<td>{html.escape(row.get('error', '') or '-')}</td>"
            "</tr>"
        )
    return "\n".join(rows)


def build_stat_cards(summary: dict[str, Any], *, request_duration_p99: str = "") -> str:
    total_requests, _, _, failed_rate = request_counts(summary)
    cards = [
        ("HTTP Requests", str(total_requests)),
        ("Error Rate", format_rate(str(failed_rate))),
        ("Avg Duration", format_duration(metric_value(summary, "http_req_duration", "avg", "-"))),
        ("P90 Duration", format_duration(metric_value(summary, "http_req_duration", "p(90)", "-"))),
        ("P95 Duration", format_duration(metric_value(summary, "http_req_duration", "p(95)", "-"))),
        ("P99 Duration", format_duration(metric_value(summary, "http_req_duration", "p(99)", request_duration_p99 or "-"))),
    ]
    return "\n".join(
        (
            '<article class="stat-card">'
            f'<div class="stat-label">{html.escape(label)}</div>'
            f'<div class="stat-value">{html.escape(str(value))}</div>'
            "</article>"
        )
        for label, value in cards
    )


def build_html(summary: dict[str, Any], metadata: dict[str, Any], request_details: list[dict[str, str]]) -> str:
    metadata_rows = build_metadata_rows(metadata)
    request_durations = []
    for row in request_details:
        try:
            request_durations.append(float(row.get("duration_ms", "")))
        except (TypeError, ValueError):
            continue
    request_duration_p99 = ""
    p99_value = percentile(request_durations, 0.99)
    if p99_value is not None:
        request_duration_p99 = f"{p99_value:.3f}"

    summary_rows = build_summary_rows(summary, request_duration_p99=request_duration_p99)
    request_rows = build_request_rows(request_details)
    request_count = len(request_details)
    stat_cards = build_stat_cards(summary, request_duration_p99=request_duration_p99)

    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>k6 Performance Report</title>
  <style>
    :root {{
      color-scheme: light;
      --bg: #f4efe7;
      --panel: rgba(255, 252, 246, 0.92);
      --panel-strong: #fffdf8;
      --ink: #17212f;
      --muted: #667085;
      --line: rgba(92, 77, 61, 0.14);
      --accent: #0f766e;
      --accent-2: #b45309;
      --shadow: 0 18px 36px rgba(17, 24, 39, 0.08);
    }}
    * {{
      box-sizing: border-box;
    }}
    body {{
      margin: 0;
      font-family: "IBM Plex Sans", "Segoe UI", sans-serif;
      background:
        radial-gradient(circle at top left, rgba(15, 118, 110, 0.12), transparent 24%),
        radial-gradient(circle at top right, rgba(180, 83, 9, 0.12), transparent 18%),
        linear-gradient(180deg, #f3eee5 0%, #f8f6f1 100%);
      color: var(--ink);
    }}
    main {{
      max-width: 1320px;
      margin: 0 auto;
      padding: 28px 20px 64px;
    }}
    h1, h2 {{
      margin: 0;
      line-height: 1.1;
    }}
    h1 {{
      font-size: clamp(28px, 4vw, 42px);
      letter-spacing: -0.04em;
    }}
    h2 {{
      font-size: 14px;
      color: var(--accent);
      text-transform: uppercase;
      letter-spacing: 0.14em;
    }}
    p {{
      color: var(--muted);
      margin: 0;
      line-height: 1.6;
    }}
    .hero {{
      display: block;
      margin-bottom: 20px;
    }}
    .hero-stack {{
      display: grid;
      gap: 20px;
    }}
    .hero-panel {{
      background: linear-gradient(135deg, rgba(255,255,255,0.88), rgba(251,246,238,0.96));
      border: 1px solid var(--line);
      border-radius: 24px;
      padding: 26px;
      box-shadow: var(--shadow);
    }}
    .hero-kicker {{
      margin-bottom: 10px;
      color: var(--accent-2);
      font-family: "IBM Plex Mono", monospace;
      font-size: 12px;
      letter-spacing: 0.1em;
      text-transform: uppercase;
    }}
    .hero-panel h1 {{
      margin-bottom: 10px;
    }}
    .hero-meta {{
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      margin-top: 18px;
    }}
    .chip {{
      border: 1px solid var(--line);
      border-radius: 999px;
      padding: 8px 12px;
      background: rgba(255,255,255,0.75);
      font-family: "IBM Plex Mono", monospace;
      font-size: 12px;
    }}
    .grid {{
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 20px;
      margin-bottom: 20px;
    }}
    .panel {{
      background: var(--panel);
      border: 1px solid var(--line);
      border-radius: 24px;
      padding: 22px;
      box-shadow: var(--shadow);
      overflow: hidden;
    }}
    .panel-scroll {{
      overflow-x: auto;
      border: 1px solid var(--line);
      border-radius: 18px;
      background: var(--panel-strong);
    }}
    .stats-grid {{
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 14px;
    }}
    .stat-card {{
      border: 1px solid var(--line);
      background: linear-gradient(180deg, rgba(255,255,255,0.92), rgba(246,240,231,0.96));
      border-radius: 18px;
      padding: 18px;
      min-height: 112px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }}
    .stat-label {{
      color: var(--muted);
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.08em;
    }}
    .stat-value {{
      font-family: "IBM Plex Mono", monospace;
      font-size: clamp(18px, 1.6vw, 24px);
      font-weight: 700;
    }}
    .stat-unit {{
      font-size: 12px;
      color: var(--muted);
      margin-top: 4px;
      text-transform: uppercase;
      letter-spacing: 0.08em;
    }}
    table {{
      width: 100%;
      border-collapse: collapse;
      font-size: 13px;
    }}
    th, td {{
      text-align: left;
      vertical-align: top;
      padding: 12px 14px;
      border-bottom: 1px solid var(--line);
    }}
    th {{
      width: 34%;
      color: var(--muted);
      font-weight: 600;
    }}
    .summary-table td,
    .request-table td,
    .chip {{
      font-family: "IBM Plex Mono", monospace;
    }}
    .summary-table th {{
      width: auto;
      white-space: nowrap;
    }}
    .request-table {{
      min-width: 980px;
    }}
    .request-table th {{
      width: auto;
      white-space: nowrap;
      position: sticky;
      top: 0;
      background: #faf6ef;
      z-index: 1;
    }}
    .request-table td {{
      white-space: nowrap;
    }}
    .pagination {{
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      margin-bottom: 14px;
    }}
    .pagination-controls {{
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 10px;
    }}
    .pagination button,
    .pagination select {{
      border: 1px solid var(--line);
      background: var(--panel-strong);
      color: var(--ink);
      border-radius: 999px;
      padding: 8px 12px;
      font: inherit;
    }}
    .pagination button:disabled {{
      opacity: 0.45;
      cursor: not-allowed;
    }}
    tr:last-child th, tr:last-child td {{
      border-bottom: 0;
    }}
    .note {{
      font-size: 13px;
      color: var(--muted);
      margin-top: 10px;
    }}
    .section-head {{
      display: flex;
      align-items: baseline;
      justify-content: space-between;
      gap: 12px;
      margin-bottom: 14px;
    }}
    .section-head p {{
      font-size: 13px;
    }}
    @media (max-width: 920px) {{
    }}
    @media (max-width: 640px) {{
      main {{
        padding: 18px 14px 40px;
      }}
      .hero-panel,
      .panel {{
        padding: 18px;
        border-radius: 18px;
      }}
      .stats-grid {{
        grid-template-columns: 1fr;
      }}
      th, td {{
        padding: 10px 12px;
      }}
    }}
  </style>
</head>
<body>
  <main>
    <section class="hero">
      <div class="hero-stack">
        <div class="hero-panel">
          <div class="hero-kicker">Performance Report</div>
          <h1>k6 result package</h1>
          <p>One view for the summary output, resolved run metadata and the request-level detail extracted from CSV samples.</p>
          <div class="hero-meta">
            <span class="chip">runId: {html.escape(str(metadata.get("runId", "")))}</span>
            <span class="chip">script: {html.escape(str(metadata.get("scriptName", "")))}</span>
            <span class="chip">timestamp: {html.escape(str(metadata.get("timestampDisplay", metadata.get("timestampUtc7", ""))))}</span>
            <span class="chip">timestamp key: {html.escape(str(metadata.get("timestampUtc7", "")))}</span>
          </div>
        </div>
        <div class="hero-panel">
          <h2>Headline Metrics</h2>
          <div class="stats-grid">
            {stat_cards}
          </div>
        </div>
      </div>
    </section>
    <div class="grid">
      <section class="panel">
        <div class="section-head">
          <h2>Summary</h2>
          <p>End-of-test metrics from k6. Time values are in ms, error rate is shown as a percentage, and p99 is derived from request samples when k6 does not emit it.</p>
        </div>
        <table class="summary-table">
          <tr><th>metric</th><th>value</th></tr>
          {summary_rows}
        </table>
      </section>
      <section class="panel">
        <div class="section-head">
          <h2>Metadata</h2>
          <p>Resolved runtime config and output paths.</p>
        </div>
        <table>
          {metadata_rows}
        </table>
      </section>
    </div>
    <section class="panel" style="margin-top: 20px;">
      <div class="section-head">
        <h2>Request Details</h2>
        <p>All {request_count} request rows are included below.</p>
      </div>
      <div class="pagination">
        <div class="pagination-controls">
          <button type="button" id="prev-page">Previous</button>
          <button type="button" id="next-page">Next</button>
          <label for="page-size">Rows per page</label>
          <select id="page-size">
            <option value="50">50</option>
            <option value="100" selected>100</option>
            <option value="250">250</option>
            <option value="500">500</option>
          </select>
        </div>
        <div class="pagination-controls">
          <span id="page-status"></span>
        </div>
      </div>
      <div class="panel-scroll">
        <table class="request-table" id="request-table">
          <tr>
            <th>#</th>
            <th>timestamp</th>
            <th>method</th>
            <th>status</th>
            <th>duration (ms)</th>
            <th>url</th>
            <th>scenario</th>
            <th>error</th>
          </tr>
          {request_rows}
        </table>
      </div>
      <div class="note">Rows are derived from `http_req_duration` samples in the CSV metrics stream.</div>
    </section>
  </main>
  <script>
    (() => {{
      const table = document.getElementById("request-table");
      if (!table) return;
      const rows = Array.from(table.querySelectorAll("tr")).slice(1);
      const prevButton = document.getElementById("prev-page");
      const nextButton = document.getElementById("next-page");
      const pageSizeSelect = document.getElementById("page-size");
      const pageStatus = document.getElementById("page-status");
      let pageSize = Number(pageSizeSelect.value);
      let currentPage = 1;

      function render() {{
        const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
        currentPage = Math.min(currentPage, totalPages);
        const start = (currentPage - 1) * pageSize;
        const end = start + pageSize;

        rows.forEach((row, idx) => {{
          row.style.display = idx >= start && idx < end ? "" : "none";
        }});

        prevButton.disabled = currentPage === 1;
        nextButton.disabled = currentPage === totalPages;
        pageStatus.textContent = "Page " + currentPage + " / " + totalPages + " | Rows " + rows.length;
      }}

      prevButton.addEventListener("click", () => {{
        if (currentPage > 1) {{
          currentPage -= 1;
          render();
        }}
      }});

      nextButton.addEventListener("click", () => {{
        const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
        if (currentPage < totalPages) {{
          currentPage += 1;
          render();
        }}
      }});

      pageSizeSelect.addEventListener("change", () => {{
        pageSize = Number(pageSizeSelect.value);
        currentPage = 1;
        render();
      }});

      render();
    }})();
  </script>
</body>
</html>
"""


def main() -> int:
    args = parse_args()
    summary_input = Path(args.summary_input)
    summary_output = Path(args.summary_output)
    metrics_csv = Path(args.metrics_csv)
    request_details_csv = Path(args.request_details_csv)
    report_html = Path(args.report_html)
    metadata = json.loads(args.metadata_json)

    summary = load_summary(summary_input)
    summary["metadata"] = metadata
    write_summary(summary_output, summary)

    build_request_details(metrics_csv, request_details_csv)
    request_details = load_request_details(request_details_csv)
    report_html.write_text(build_html(summary, metadata, request_details), encoding="utf-8")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
