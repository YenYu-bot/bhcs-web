#!/usr/bin/env bash
set -euo pipefail

# Ubuntu Noble fonts-noto-cjk 1:20230817+repack1-3.
# SHA-256 from https://archive.ubuntu.com/ubuntu/dists/noble/main/binary-amd64/Packages.xz
name='fonts-noto-cjk_20230817+repack1-3_all.deb'
sha256='7d64b985f6fe128c99eae5610d5c047338e572bdcfb2bb09736be01b824a7f6c'
action=${1:?fetch or install}
dir=${2:?artifact directory}
shift 2
deb="$dir/$name"
verify() { printf '%s  %s\n' "$sha256" "$1" | sha256sum --check --status; }

case "$action" in
  fetch)
    mkdir -p "$dir"
    partial=$(mktemp "$dir/.download.XXXXXXXX")
    trap 'rm -f -- "$partial"' EXIT
    # Some runners receive only ~65 kB/s: 25 minutes allows the full transfer.
    for archive in https://archive.ubuntu.com/ubuntu https://security.ubuntu.com/ubuntu; do
      if curl --fail --silent --show-error --proto '=https' --connect-timeout 15 --max-time 1500 \
          --speed-limit 1000 --speed-time 90 \
          "$archive/pool/main/f/fonts-noto-cjk/$name" -o "$partial" &&
          verify "$partial"; then
        mv -- "$partial" "$deb"
        exit 0
      fi
      printf 'Could not download and verify fonts-noto-cjk from %s\n' "$archive" >&2
    done
    printf 'No Ubuntu archive returned the verified fonts-noto-cjk package.\n' >&2
    exit 1
    ;;
  install)
    # Treat the same-run artifact as untrusted until its bytes match.
    verify "$deb"
    sudo apt-get -o Acquire::Retries=2 -o Acquire::http::Timeout=45 -o Acquire::https::Timeout=45 \
      install -y "$deb" fonts-noto-color-emoji "$@"
    ;;
  *) printf 'Expected fetch or install\n' >&2; exit 2 ;;
esac
