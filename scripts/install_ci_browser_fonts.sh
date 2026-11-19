#!/usr/bin/env bash
set -euo pipefail

# Ubuntu Noble's fonts-noto-cjk 1:20230817+repack1-3. The AWS mirror can
# stall for the entire job while streaming this 61 MB package. Use the
# same archive bytes over HTTPS and verify against Noble's package index:
# https://archive.ubuntu.com/ubuntu/dists/noble/main/binary-amd64/Packages.xz
name='fonts-noto-cjk_20230817+repack1-3_all.deb'
sha256='7d64b985f6fe128c99eae5610d5c047338e572bdcfb2bb09736be01b824a7f6c'
dir=$(mktemp -d)
trap 'rm -rf -- "$dir"' EXIT
chmod 755 "$dir" # Let APT's _apt sandbox read the verified local package.
deb="$dir/$name"
for archive in https://archive.ubuntu.com/ubuntu https://security.ubuntu.com/ubuntu; do
  if curl --fail --silent --show-error --proto '=https' --connect-timeout 15 --max-time 180 \
      "$archive/pool/main/f/fonts-noto-cjk/$name" -o "$deb" &&
    printf '%s  %s\n' "$sha256" "$deb" | sha256sum --check --status; then
    sudo apt-get -o Acquire::Retries=2 -o Acquire::http::Timeout=45 -o Acquire::https::Timeout=45 \
      install -y "$deb" fonts-noto-color-emoji "$@"
    exit 0
  fi
  printf 'Could not download and verify fonts-noto-cjk from %s\n' "$archive" >&2
done
printf 'No Ubuntu archive returned the verified fonts-noto-cjk package.\n' >&2
exit 1
