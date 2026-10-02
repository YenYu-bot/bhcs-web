#!/usr/bin/env python3
"""Recompute every resource count on ziyuan.html from the rendered links.

Counting rule (one rule for the whole page, identical to the runtime filter
script in ziyuan.html and to scripts/test_researcher_batch5.cjs):

  * one <a> link = one item;
  * only links inside a <section class="res-sec"> count: direct children of
    .tpills, and links inside .science-category <li>;
  * a unit row (.trow) with several buttons counts one item per button;
  * the science entry block (science-entry markers), prose links and the
    "總覽頁" links do not count.

The numbers written back are: the category nav (<span>N</span>), the finder
lead (目前共 N 項), the no-JS status line (顯示全部 N 項資源), each section
heading (<span class="count">N 項</span>), each unit label (<small>N 個</small>)
and each science category heading (<small>N 項</small>).

Run after build_science.mjs (which renders the science section). Idempotent.
"""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PAGE = ROOT / "ziyuan.html"

SECTION_RE = re.compile(r'<section class="res-sec" id="([^"]+)">[\s\S]*?</section>')
TROW_RE = re.compile(r'(<div class="trow"><div class="tlabel">)([\s\S]*?)(</div><div class="tpills">)([\s\S]*?)(</div></div>)')
CATEGORY_RE = re.compile(r'(<article class="science-category"><h4>)([\s\S]*?)(</h4>[\s\S]*?<ul>)([\s\S]*?)(</ul>)')
LINK_RE = re.compile(r"<a\b[^>]*>")
LI_LINK_RE = re.compile(r"<li><a\b[^>]*>")
H3_COUNT_RE = re.compile(r'(<h3>[\s\S]*?<span class="count">)\d+( 項</span></h3>)')
SMALL_COUNT_RE = re.compile(r"(<small>)\d+( 個</small>)")
NAV_RE = re.compile(r'(<a href="#(res-[a-z-]+)">[^<]*<span>)\d+(</span></a>)')


def section_counts(html: str) -> tuple[str, dict[str, int], list[int]]:
    """Return the section with counts rewritten, the per-row counts and the total."""
    rows: list[tuple[str, int]] = []

    def trow(match: re.Match[str]) -> str:
        n = len(LINK_RE.findall(match.group(4)))
        label = SMALL_COUNT_RE.sub(lambda m: f"{m.group(1)}{n}{m.group(2)}", match.group(2))
        rows.append((re.sub("<.*?>", "", label), n))
        return f"{match.group(1)}{label}{match.group(3)}{match.group(4)}{match.group(5)}"

    def category(match: re.Match[str]) -> str:
        n = len(LI_LINK_RE.findall(match.group(4)))
        label = re.sub(r"<small>\d+ 項</small>", f"<small>{n} 項</small>", match.group(2))
        rows.append((re.sub("<.*?>", "", label), n))
        return f"{match.group(1)}{label}{match.group(3)}{match.group(4)}{match.group(5)}"

    html = TROW_RE.sub(trow, html)
    html = CATEGORY_RE.sub(category, html)
    if html.count('class="trow"') != len(TROW_RE.findall(html)):
        raise SystemExit("A .trow block does not follow the tlabel/tpills layout")
    if html.count('class="science-category"') != len(CATEGORY_RE.findall(html)):
        raise SystemExit("A .science-category block does not follow the h4/ul layout")
    total = sum(n for _, n in rows)
    html, replaced = H3_COUNT_RE.subn(lambda m: f"{m.group(1)}{total}{m.group(2)}", html, count=1)
    if replaced != 1:
        raise SystemExit("Section heading without <span class=\"count\">")
    return html, dict(rows), total


def main() -> None:
    before = PAGE.read_text(encoding="utf-8")
    counts: dict[str, int] = {}
    rows: dict[str, dict[str, int]] = {}

    def section(match: re.Match[str]) -> str:
        html, row_counts, total = section_counts(match.group(0))
        counts[match.group(1)] = total
        rows[match.group(1)] = row_counts
        return html

    text = SECTION_RE.sub(section, before)
    total = sum(counts.values())

    def nav(match: re.Match[str]) -> str:
        if match.group(2) not in counts:
            raise SystemExit(f"Nav points to unknown section #{match.group(2)}")
        return f"{match.group(1)}{counts[match.group(2)]}{match.group(3)}"

    text, nav_count = NAV_RE.subn(nav, text)
    if nav_count != len(counts):
        raise SystemExit(f"Nav lists {nav_count} categories but the page has {len(counts)} sections")
    text, lead = re.subn(r"目前共 \d+ 項", f"目前共 {total} 項", text)
    text, status = re.subn(r"顯示全部 \d+ 項資源", f"顯示全部 {total} 項資源", text)
    if lead != 1 or status != 1:
        raise SystemExit("Finder lead or status line missing")

    if text != before:
        PAGE.write_text(text, encoding="utf-8")
    summary = {"total": total, "sections": counts, "rows": rows}
    if "--json" in sys.argv:
        print(json.dumps(summary, ensure_ascii=False, indent=1))
    else:
        print(f"Resource counts: total {total}; " + ", ".join(f"{k}={v}" for k, v in counts.items()) + (" (updated)" if text != before else " (unchanged)"))


if __name__ == "__main__":
    main()
