#!/usr/bin/env bash
#
# main への直接 push に src/ 配下の変更が含まれていないことを検査する。
# CLAUDE.md「ブランチ運用」の規約に対応する。
#   - src/* 以外の変更は main への push を許可する
#   - src/* の変更は必ず PR を経由する
#
# 変更ファイルの一覧を標準入力から1行1件で受け取る。
# 検出時は非ゼロ終了する。ファイルの書き換えは一切行わない。

set -euo pipefail

readonly PROTECTED_PATTERN='^src/'

check_protected_paths() {
  local changed_files="$1"
  local hits

  hits="$(printf '%s\n' "${changed_files}" | grep -E "${PROTECTED_PATTERN}" || true)"

  if [ -n "${hits}" ]; then
    echo "NG: main への直接 push に src/ 配下の変更が含まれています。" >&2
    echo "${hits}" >&2
    echo "対処: ブランチを作成し、Pull Request を経由してください。" >&2
    return 1
  fi

  echo "OK: main への push に src/ 配下の変更なし"
  return 0
}

main() {
  local changed_files

  changed_files="$(cat)"

  check_protected_paths "${changed_files}"
}

main "$@"
