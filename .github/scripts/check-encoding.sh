#!/usr/bin/env bash
#
# 追跡対象のテキストファイルが UTF-8（BOM なし）・改行 LF であることを検査する。
# 検出時は非ゼロ終了する。ファイルの書き換えは一切行わない。

set -euo pipefail

list_text_files() {
  local file encoding

  while IFS= read -r file; do
    encoding="$(file --mime-encoding --brief -- "${file}")"

    if [ "${encoding}" = "binary" ]; then
      continue
    fi

    printf '%s\n' "${file}"
  done < <(git ls-files --cached --others --exclude-standard)
}

check_utf8() {
  local file
  local -a invalid=()

  while IFS= read -r file; do
    if ! iconv -f UTF-8 -t UTF-8 -- "${file}" >/dev/null 2>&1; then
      invalid+=("${file}")
    fi
  done < <(list_text_files)

  if [ "${#invalid[@]}" -ne 0 ]; then
    echo "NG: UTF-8 として不正なファイルがあります。" >&2
    printf '%s\n' "${invalid[@]}" >&2
    return 1
  fi

  echo "OK: すべて UTF-8"
  return 0
}

check_no_bom() {
  local file bom
  local -a withbom=()

  while IFS= read -r file; do
    bom="$(head -c 3 -- "${file}" | od -An -tx1 | tr -d ' \n')"

    if [ "${bom}" = "efbbbf" ]; then
      withbom+=("${file}")
    fi
  done < <(list_text_files)

  if [ "${#withbom[@]}" -ne 0 ]; then
    echo "NG: BOM 付きのファイルがあります。" >&2
    printf '%s\n' "${withbom[@]}" >&2
    return 1
  fi

  echo "OK: BOM なし"
  return 0
}

check_lf_only() {
  local file
  local -a crlf=()

  while IFS= read -r file; do
    if grep -qU $'\r' -- "${file}"; then
      crlf+=("${file}")
    fi
  done < <(list_text_files)

  if [ "${#crlf[@]}" -ne 0 ]; then
    echo "NG: CRLF を含むファイルがあります。" >&2
    printf '%s\n' "${crlf[@]}" >&2
    return 1
  fi

  echo "OK: 改行は LF のみ"
  return 0
}

main() {
  local status=0

  check_utf8 || status=1
  check_no_bom || status=1
  check_lf_only || status=1

  if [ "${status}" -ne 0 ]; then
    echo "エンコーディング検査に失敗しました。" >&2
  fi

  return "${status}"
}

main "$@"
