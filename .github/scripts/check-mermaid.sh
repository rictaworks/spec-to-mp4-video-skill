#!/usr/bin/env bash
#
# Markdown 内の mermaid コードブロックの構造を検査する。
# ブラウザを必要としない範囲で、次の2点を検証する。
#   1. mermaid ブロックが閉じられていること
#   2. ブロックの先頭行が既知の図種別で始まっていること
# 図の完全なレンダリング検証は SPEC/ に図を作成する時点で
# @mermaid-js/mermaid-cli を導入して行う（SPEC/README.md 参照）。
# 検出時は非ゼロ終了する。ファイルの書き換えは一切行わない。

set -euo pipefail

readonly TARGET_PATTERN='\.md$'
readonly EXCLUDE_PATTERN='^(DELETE/|node_modules/)'

readonly DIAGRAM_TYPES='flowchart|graph|sequenceDiagram|classDiagram|stateDiagram-v2|stateDiagram|erDiagram|journey|gantt|pie|quadrantChart|requirementDiagram|gitGraph|mindmap|timeline|sankey-beta|xychart-beta|block-beta|packet-beta|architecture-beta|C4Context|C4Container|C4Component|C4Dynamic|C4Deployment'

list_markdown_files() {
  git ls-files --cached --others --exclude-standard \
    | grep -E "${TARGET_PATTERN}" \
    | grep -Ev "${EXCLUDE_PATTERN}" || true
}

inspect_file() {
  local file="$1"

  awk -v file="${file}" -v types="${DIAGRAM_TYPES}" '
    BEGIN { inblock = 0; needtype = 0; failed = 0 }

    /^[[:space:]]*```mermaid[[:space:]]*$/ && inblock == 0 {
      inblock = 1
      needtype = 1
      start = NR
      next
    }

    /^[[:space:]]*```[[:space:]]*$/ && inblock == 1 {
      if (needtype == 1) {
        printf "%s:%d: mermaid ブロックが空です\n", file, start > "/dev/stderr"
        failed = 1
      }
      inblock = 0
      next
    }

    inblock == 1 && needtype == 1 {
      line = $0
      sub(/^[[:space:]]+/, "", line)

      if (line == "") {
        next
      }

      if (line !~ "^(" types ")") {
        printf "%s:%d: 未知の図種別です: %s\n", file, NR, line > "/dev/stderr"
        failed = 1
      }

      needtype = 0
      next
    }

    END {
      if (inblock == 1) {
        printf "%s:%d: mermaid ブロックが閉じられていません\n", file, start > "/dev/stderr"
        failed = 1
      }
      exit failed
    }
  ' "${file}"
}

check_mermaid_blocks() {
  local file
  local status=0
  local count=0

  while IFS= read -r file; do
    if ! grep -q '^[[:space:]]*```mermaid[[:space:]]*$' -- "${file}"; then
      continue
    fi

    count=$((count + 1))

    if ! inspect_file "${file}"; then
      status=1
    fi
  done < <(list_markdown_files)

  if [ "${status}" -ne 0 ]; then
    echo "NG: mermaid の構文検査に失敗しました。" >&2
    return 1
  fi

  echo "OK: mermaid ブロックの構造は正しい（${count} ファイル）"
  return 0
}

main() {
  check_mermaid_blocks
}

main "$@"
