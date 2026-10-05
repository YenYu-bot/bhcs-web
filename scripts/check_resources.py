#!/usr/bin/env python3
"""Audit the resource page (ziyuan.html) links.

Fails (exit 1) when a local href points to a missing file, when a
?topic= value is not a topic key of the target drill engine, or when the
same href is listed twice. Links with the same (or nearly the same) title but
different hrefs are printed for review only; they can be legitimate (the same
unit at two grades) or two entry points for one tool.

Uses the same link rule as build_resources.py: direct <a> children of .tpills
and <a> inside .science-category <li>, within <section class="res-sec">.
"""

from __future__ import annotations

import html
import json
import re
import sys
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PAGE = ROOT / "ziyuan.html"

SECTION_RE = re.compile(r'<section class="res-sec" id="([^"]+)">([\s\S]*?)</section>')
TROW_RE = re.compile(r'<div class="trow"><div class="tlabel">([\s\S]*?)</div><div class="tpills">([\s\S]*?)</div></div>')
CATEGORY_RE = re.compile(r'<article class="science-category"><h4>([\s\S]*?)</h4>[\s\S]*?<ul>([\s\S]*?)</ul>')
LINK_RE = re.compile(r'<a\b([^>]*)>([\s\S]*?)</a>')
LI_LINK_RE = re.compile(r'<li><a\b([^>]*)>([\s\S]*?)</a>')
TOPICS_RE = re.compile(r"const TOPICS=(\[\[[\s\S]*?\]\])")
CONFIGS_RE = re.compile(r"CONFIGS=\{((?:[a-z0-9]+:[A-Za-z0-9_]+(?:\(\))?,?)+)\}")


def strip(text: str) -> str:
    return html.unescape(re.sub("<.*?>", "", text)).strip()


def links() -> list[dict[str, str]]:
    rows = []
    for sid, body in SECTION_RE.findall(PAGE.read_text(encoding="utf-8")):
        for label, pills in TROW_RE.findall(body):
            for attrs, text in LINK_RE.findall(pills):
                rows.append({"section": sid, "row": strip(label), "href": re.search(r'href="([^"]*)"', attrs).group(1), "title": strip(text)})
        for label, items in CATEGORY_RE.findall(body):
            for attrs, text in LI_LINK_RE.findall(items):
                rows.append({"section": sid, "row": strip(label), "href": re.search(r'href="([^"]*)"', attrs).group(1), "title": strip(text)})
    return rows


def topic_keys(target: Path) -> set[str] | None:
    """Topic keys of a drill engine: TOPICS=[[key,name],...] (g3–g9) or CONFIGS={key:config(),...} (g10–g11)."""
    source = target.read_text(encoding="utf-8", errors="ignore")
    match = TOPICS_RE.search(source)
    if match:
        try:
            return {key for key, *_ in json.loads(match.group(1))}
        except json.JSONDecodeError:
            return set(re.findall(r'\["([a-z0-9]+)","', match.group(1)))
    match = CONFIGS_RE.search(source)
    if match:
        return set(re.findall(r"([a-z0-9]+):", match.group(1)))
    return None


def similar_title(title: str) -> str:
    return re.sub(r"[（(].*?[)）]|[\s・·、，：:]|與|和|的", "", title)


CONTENT_RULES = (
    ("ziyuan.html", "奇奇博士", False),
    ("ziyuan.html", "同一類型連續三次都對", False),
    ("tools/mini-lab/index.html", "余老師", True),
)


def content_errors() -> list[str]:
    """Guard the mini-lab host name and the practice advice against stale wording."""
    errors = []
    for rel, needle, expected in CONTENT_RULES:
        present = needle in (ROOT / rel).read_text(encoding="utf-8")
        if present != expected:
            errors.append(f"{rel} {'must contain' if expected else 'must not contain'} {needle!r}")
    return errors


def main() -> None:
    rows = links()
    errors: list[str] = content_errors()

    for row in rows:
        href = row["href"]
        if href.startswith(("http:", "https:")):
            continue
        file_part, _, query = href.partition("?")
        file_part = file_part.split("#")[0]
        if file_part.endswith("/"):
            file_part += "index.html"
        target = ROOT / file_part
        if not target.is_file():
            errors.append(f"missing file: {href} ({row['section']} / {row['row']} / {row['title']})")
            continue
        topic = re.search(r"(?:^|&)topic=([^&#]*)", query)
        if topic:
            keys = topic_keys(target)
            if keys is None:
                errors.append(f"no TOPICS registry in {file_part} for {href}")
            elif topic.group(1) not in keys:
                errors.append(f"unknown topic key: {href} ({row['title']})")

    by_href: dict[str, list[dict[str, str]]] = defaultdict(list)
    for row in rows:
        by_href[row["href"]].append(row)
    duplicate_hrefs = {href: items for href, items in by_href.items() if len(items) > 1}
    for href, items in duplicate_hrefs.items():
        errors.append("duplicate href: " + href + " <- " + "; ".join(f"{i['section']}/{i['row']}/{i['title']}" for i in items))

    by_title: dict[str, dict[str, str]] = defaultdict(dict)
    for row in rows:
        by_title[similar_title(row["title"])][row["href"]] = row["title"]

    print(f"{len(rows)} resource links on ziyuan.html")
    print("A. same href listed more than once:", "none" if not duplicate_hrefs else "")
    for href, items in duplicate_hrefs.items():
        print(f"  {href}")
        for item in items:
            print(f"  - {item['section']} / {item['row']} / {item['title']}")
    print("B. same or similar title, different href:")
    found = False
    for key, hrefs in by_title.items():
        if len(hrefs) > 1:
            found = True
            print(f"  {key}")
            for href, title in hrefs.items():
                print(f"  - {href}" + (f"  ({title})" if title != key else ""))
    if not found:
        print("  none")
    for error in errors:
        print("ERROR", error)
    if errors:
        sys.exit(1)
    print("All local hrefs exist and every ?topic= matches its engine; no duplicate href.")


if __name__ == "__main__":
    main()
