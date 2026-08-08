#!/usr/bin/env bash
#
# ネイティブの alert() / confirm() / prompt() が使われていないことを検査する。
# CLAUDE.md「UI / デザイン」の規約に対応する。
# 検出時は非ゼロ終了する。ファイルの書き換えは一切行わない。

set -euo pipefail

readonly TARGET_PATTERN='\.(js|jsx|mjs|cjs|ts|tsx|vue|svelte|html)$'
readonly EXCLUDE_PATTERN='^(node_modules/|DELETE/)'

# 直前が識別子文字・ドルマーク・ドットでない場合のみ一致させる。
# これにより inquirer.prompt( のような別オブジェクトのメソッドは対象外となり、
# window.alert( は先頭の window から一致するため対象となる。
readonly FORBIDDEN_PATTERN='(?<![\w$.])(?:window\.)?(?:alert|confirm|prompt)\s*\('

list_target_files() {
  git ls-files --cached --others --exclude-standard \
    | grep -E "${TARGET_PATTERN}" \
    | grep -Ev "${EXCLUDE_PATTERN}" || true
}

check_forbidden_api() {
  local files hits

  files="$(list_target_files)"

  if [ -z "${files}" ]; then
    echo "OK: 検査対象のファイルなし"
    return 0
  fi

  hits="$(printf '%s\n' "${files}" | xargs -r grep -nIP "${FORBIDDEN_PATTERN}" || true)"

  if [ -n "${hits}" ]; then
    echo "NG: ネイティブの alert() / confirm() / prompt() が使われています。" >&2
    echo "${hits}" >&2
    echo "対処: UI コンポーネントとして実装してください。" >&2
    return 1
  fi

  echo "OK: ネイティブダイアログの使用なし"
  return 0
}

main() {
  check_forbidden_api
}

main "$@"
