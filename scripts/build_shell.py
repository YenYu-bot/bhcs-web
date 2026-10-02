#!/usr/bin/env python3
"""Inject the shared page shell (header, footer, contact dock, opening hours).

Single source: scripts/site/header.html, footer.html, dock.html and site.json.
Every main page (root *.html with the masthead header, plus wenzhang/*.html)
gets the same markup through marker blocks, following the build_science.mjs
convention:

    <!-- site-header:start --> ... <!-- site-header:end -->
    <!-- site-footer:start --> ... <!-- site-footer:end -->
    <!-- site-dock:start -->   ... <!-- site-dock:end -->

On first run the existing <header class="masthead">, <footer class="foot"> and
<div class="dock"> blocks are wrapped in markers; later runs only replace the
marked blocks, so the script is idempotent. Relative paths are prefixed per
page depth and the matching nav link gets aria-current="page".

The JSON-LD "openingHoursSpecification" array of every page is rewritten from
site.json as well, so the footer text and structured data cannot drift apart.

Run after build_site.mjs (which owns asset cache versions and article pages).
"""

from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "scripts" / "site"
MARKER = {
    "site-header": re.compile(r'<header class="masthead">[\s\S]*?</header>'),
    "site-footer": re.compile(r'<footer class="foot">[\s\S]*?</footer>'),
    "site-dock": re.compile(r'<div class="dock">[\s\S]*?</div>'),
}
HOURS_RE = re.compile(r'"openingHoursSpecification":\[[^\]]*\]')
NAV_LINK_RE = re.compile(r'(<a href=")([^"]+)(">)(?=[^<]*</a>)')


def main_pages() -> list[Path]:
    pages = sorted(ROOT.glob("*.html")) + sorted((ROOT / "wenzhang").glob("*.html"))
    chosen = []
    for page in pages:
        text = page.read_text(encoding="utf-8")
        if "<!-- site-header:start -->" in text or '<header class="masthead">' in text:
            chosen.append(page)
    return chosen


def block_regex(key: str) -> re.Pattern[str]:
    return re.compile(rf"<!-- {key}:start -->[\s\S]*?<!-- {key}:end -->")


def is_current(href: str, page: str) -> bool:
    if href.startswith(("tel:", "http")):
        return False
    if href.endswith("/"):
        return page.startswith(href)
    return href == page


def render_header(template: str, root: str, page: str) -> str:
    """Prefix relative links and mark the nav link of the current page."""

    def mark(match: re.Match[str]) -> str:
        href = match.group(2)
        site_href = href[len(root):] if root and href.startswith(root) else href
        current = ' aria-current="page"' if is_current(site_href, page) else ""
        return f'{match.group(1)}{href}"{current}>'

    return NAV_LINK_RE.sub(mark, template.replace("{{root}}", root))


def inject(text: str, key: str, html: str) -> str:
    block = f"<!-- {key}:start -->\n{html.rstrip()}\n<!-- {key}:end -->"
    marked = block_regex(key)
    if marked.search(text):
        return marked.sub(lambda _: block, text, count=1)
    raw = MARKER[key]
    if raw.search(text):
        return raw.sub(lambda _: block, text, count=1)
    raise SystemExit(f"{key}: no marker or legacy block found")


def main() -> None:
    site = json.loads((SOURCE / "site.json").read_text(encoding="utf-8"))
    hours_text = site["hours"]["text"]
    hours_spec = '"openingHoursSpecification":' + json.dumps(site["hours"]["specification"], ensure_ascii=False, separators=(",", ":"))
    header_src = (SOURCE / "header.html").read_text(encoding="utf-8")
    footer_src = (SOURCE / "footer.html").read_text(encoding="utf-8").replace("{{hours}}", hours_text)
    dock_src = (SOURCE / "dock.html").read_text(encoding="utf-8")

    changed = 0
    pages = main_pages()
    for page in pages:
        rel = page.relative_to(ROOT).as_posix()
        root = "../" * (len(page.relative_to(ROOT).parts) - 1)
        before = page.read_text(encoding="utf-8")
        text = before
        try:
            text = inject(text, "site-header", render_header(header_src, root, rel))
            text = inject(text, "site-footer", footer_src.replace("{{root}}", root))
            text = inject(text, "site-dock", dock_src.replace("{{root}}", root))
        except SystemExit as error:
            raise SystemExit(f"{rel}: {error}") from None
        text = HOURS_RE.sub(lambda _: hours_spec, text)
        if text != before:
            page.write_text(text, encoding="utf-8")
            changed += 1
    print(f"Shared shell applied to {len(pages)} pages ({changed} changed); hours: {hours_text} [{site['hours']['status']}]")


if __name__ == "__main__":
    main()
