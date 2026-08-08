#!/usr/bin/env bash
#
# 追跡対象のテキストファイルに絵文字が含まれていないことを検査する。
# CLAUDE.md「UI / デザイン」の規約（絵文字禁止・アイコンは FontAwesome）に対応する。
# 検出時は非ゼロ終了する。ファイルの書き換えは一切行わない。

set -euo pipefail

# 検査対象の拡張子。このスクリプト自身はパターン定義を含むため除外する
readonly TARGET_PATTERN='\.(md|ts|tsx|js|jsx|json|jsonc|yml|yaml|sh)$'
readonly EXCLUDE_PATTERN='^\.github/scripts/check-no-emoji\.sh$'

# 絵文字の主要ブロック（Misc Symbols and Pictographs / Emoticons / Transport /
# Supplemental Symbols and Pictographs / Dingbats / Misc Symbols）
readonly EMOJI_PATTERN='[\x{1F300}-\x{1F5FF}\x{1F600}-\x{1F64F}\x{1F680}-\x{1F6FF}\x{1F900}-\x{1FAFF}\x{2700}-\x{27BF}\x{2600}-\x{26FF}]'

list_target_files() {
  git ls-files --cached --others --exclude-standard \
    | grep -E "${TARGET_PATTERN}" \
    | grep -Ev "${EXCLUDE_PATTERN}" || true
}

check_no_emoji() {
  local hits

  hits="$(list_target_files | xargs -r grep -nIP "${EMOJI_PATTERN}" || true)"

  if [ -n "${hits}" ]; then
    echo "NG: 絵文字が含まれています。FontAwesome のアイコンへ置き換えてください。" >&2
    echo "${hits}" >&2
    return 1
  fi

  echo "OK: 絵文字なし"
  return 0
}

main() {
  check_no_emoji
}

main "$@"
