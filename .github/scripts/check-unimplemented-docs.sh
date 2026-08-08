#!/usr/bin/env bash
#
# README.md と SPEC/ に未実装のものが書かれていないことを検査する。
# CLAUDE.md「ドキュメント運用」の規約に対応する。
# 検出時は非ゼロ終了する。ファイルの書き換えは一切行わない。

set -euo pipefail

# 未実装のものを指し示す語。README.md と SPEC/ では使用を認めない。
readonly UNIMPLEMENTED_PATTERN='未実装|未着手|未作成|未対応|予定|今後|将来|構想|TODO|TBD'

# このスクリプト自身は語の定義を含むため対象から除外する
readonly SELF_PATH='.github/scripts/check-unimplemented-docs.sh'

list_target_files() {
  git ls-files --cached --others --exclude-standard \
    | grep -E '^(README\.md|SPEC/.*\.md)$' \
    | grep -Fxv "${SELF_PATH}" || true
}

check_unimplemented() {
  local files hits

  files="$(list_target_files)"

  if [ -z "${files}" ]; then
    echo "OK: 検査対象のファイルなし"
    return 0
  fi

  hits="$(printf '%s\n' "${files}" | xargs -r grep -nIE "${UNIMPLEMENTED_PATTERN}" || true)"

  if [ -n "${hits}" ]; then
    echo "NG: README.md または SPEC/ に未実装のものが書かれています。" >&2
    echo "${hits}" >&2
    echo "対処: 実際に存在し動作するものだけを残してください。検討段階の内容は requirements.md が持ちます。" >&2
    return 1
  fi

  echo "OK: README.md と SPEC/ に未実装の記載なし"
  return 0
}

main() {
  check_unimplemented
}

main "$@"
