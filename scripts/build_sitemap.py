#!/usr/bin/env python3
"""Build sitemap.xml from indexable HTML pages with bhcs.com.tw canonicals."""

from __future__ import annotations

import html
import re
import subprocess
from datetime import datetime, timezone
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
CANONICAL_RE = re.compile(r'<link\s+rel=["\']canonical["\']\s+href=["\']([^"\']+)', re.I)
ROBOTS_RE = re.compile(r'<meta\s+name=["\']robots["\']\s+content=["\']([^"\']+)', re.I)
DOMAIN = "https://www.bhcs.com.tw/"


def git_lastmod(path: Path) -> str | None:
    """Return the Git commit date, using today for uncommitted files."""
    relative = path.relative_to(ROOT).as_posix()
    try:
        inside = subprocess.run(
            ["git", "rev-parse", "--is-inside-work-tree"],
            cwd=ROOT,
            capture_output=True,
            text=True,
            check=False,
        )
        if inside.returncode != 0 or inside.stdout.strip() != "true":
            return None

        status = subprocess.run(
            ["git", "status", "--porcelain", "--", relative],
            cwd=ROOT,
            capture_output=True,
            text=True,
            check=False,
        )
        if status.stdout.strip():
            return datetime.now(timezone.utc).date().isoformat()

        log = subprocess.run(
            ["git", "log", "-1", "--format=%cs", "--", relative],
            cwd=ROOT,
            capture_output=True,
            text=True,
            check=False,
        )
        value = log.stdout.strip()
        if re.fullmatch(r"\d{4}-\d{2}-\d{2}", value):
            return value
    except OSError:
        return None
    return None


def page_record(path: Path) -> tuple[str, str] | None:
    source = path.read_text(encoding="utf-8", errors="ignore")
    robots = ROBOTS_RE.search(source)
    if robots and "noindex" in robots.group(1).lower():
        return None
    canonical = CANONICAL_RE.search(source)
    if not canonical:
        return None
    url = canonical.group(1).strip()
    if not url.startswith(DOMAIN) or "?" in url or "#" in url:
        return None
    modified = git_lastmod(path)
    if modified is None:
        modified = datetime.fromtimestamp(path.stat().st_mtime, timezone.utc).date().isoformat()
    return url, modified


def sort_key(record: tuple[str, str]) -> tuple[int, str]:
    url = record[0]
    preferred = [
        DOMAIN,
        DOMAIN + "guoxiao.html",
        DOMAIN + "guozhong.html",
        DOMAIN + "gaozhong.html",
        DOMAIN + "shizi.html",
        DOMAIN + "xuexi-xitong.html",
        DOMAIN + "chengguo.html",
        DOMAIN + "ziyuan.html",
        DOMAIN + "wenzhang/",
        DOMAIN + "lianluo.html",
    ]
    try:
        return preferred.index(url), url
    except ValueError:
        return len(preferred), url


records: dict[str, str] = {}
for html_path in ROOT.rglob("*.html"):
    if any(part in {".git", "node_modules", "scripts"} for part in html_path.relative_to(ROOT).parts):
        continue
    record = page_record(html_path)
    if record:
        url, modified = record
        records[url] = max(records.get(url, ""), modified)

ordered = sorted(records.items(), key=sort_key)
lines = ['<?xml version="1.0" encoding="UTF-8"?>', '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">']
for url, modified in ordered:
    lines.append(f"  <url><loc>{html.escape(url)}</loc><lastmod>{modified}</lastmod></url>")
lines.append("</urlset>")
(ROOT / "sitemap.xml").write_text("\n".join(lines) + "\n", encoding="utf-8")
print(f"Wrote {len(ordered)} URLs to {ROOT / 'sitemap.xml'}")
