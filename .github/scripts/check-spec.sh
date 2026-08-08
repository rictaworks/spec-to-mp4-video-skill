#!/usr/bin/env bash
#
# requirements.md（SSOT）に必須の節が存在することを検査する。
# 節の欠落は仕様の欠落を意味するため、検出時は非ゼロ終了する。

set -euo pipefail

readonly SPEC_FILE='requirements.md'

readonly REQUIRED_SECTIONS=(
  '## 1. 概要'
  '## 2. プラットフォーム選定'
  '## 3. 識別子'
  '## 4. 規模'
  '## 5. 対象ターゲットと参照した一次情報'
  '## 6. 発火条件の設計方針'
  '## 7. 入力仕様（動画仕様書）'
  '## 8. 出力仕様'
  '## 9. 手順の論理構造と分岐条件'
  '## 10. 設計要件'
  '## 11. 制約の適用範囲'
  '## 12. セキュリティ・権利の要件'
)

check_spec_exists() {
  if [ ! -f "${SPEC_FILE}" ]; then
    echo "NG: ${SPEC_FILE} が存在しません。" >&2
    return 1
  fi

  echo "OK: ${SPEC_FILE} が存在する"
  return 0
}

check_required_sections() {
  local section
  local -a missing=()

  for section in "${REQUIRED_SECTIONS[@]}"; do
    if ! grep -qF -- "${section}" "${SPEC_FILE}"; then
      missing+=("${section}")
    fi
  done

  if [ "${#missing[@]}" -ne 0 ]; then
    echo "NG: ${SPEC_FILE} に必須の節が存在しません。" >&2
    printf '%s\n' "${missing[@]}" >&2
    return 1
  fi

  echo "OK: 必須の節がすべて存在する（${#REQUIRED_SECTIONS[@]} 件）"
  return 0
}

main() {
  local status=0

  check_spec_exists || return 1
  check_required_sections || status=1

  if [ "${status}" -ne 0 ]; then
    echo "仕様検査に失敗しました。" >&2
  fi

  return "${status}"
}

main "$@"
