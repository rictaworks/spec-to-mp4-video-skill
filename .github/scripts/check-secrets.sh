#!/usr/bin/env bash
#
# 追跡対象ファイルにシークレットが混入していないことを検査する。
# 検出時は非ゼロ終了する。ファイルの削除・書き換えは一切行わない。

set -euo pipefail

# 追跡してはならないパス（.env.example / .env.sample は雛形のため許可する）
readonly FORBIDDEN_PATH_PATTERN='(^|/)(\.env|\.env\..+|master\.key|id_rsa|id_ed25519|credentials|secrets\.yml)$|\.(pem|p12|pfx|keystore|jks)$'
readonly ALLOWED_PATH_PATTERN='(^|/)\.env\.(example|sample|template)$'

# 内容として検出したい資格情報のパターン
readonly SECRET_CONTENT_PATTERN='AKIA[0-9A-Z]{16}|-----BEGIN [A-Z ]*PRIVATE KEY-----|sk-ant-[A-Za-z0-9_-]{24,}|ghp_[A-Za-z0-9]{36}|xox[baprs]-[A-Za-z0-9-]{10,}'

# このスクリプト自身はパターン定義を含むため内容検査の対象から除外する
readonly SELF_PATH='.github/scripts/check-secrets.sh'

list_tracked_files() {
  # 追跡済みに加え、.gitignore で除外されていない未追跡ファイルも検査対象に含める
  git ls-files --cached --others --exclude-standard
}

check_forbidden_paths() {
  local hits
  hits="$(list_tracked_files | grep -E "${FORBIDDEN_PATH_PATTERN}" | grep -Ev "${ALLOWED_PATH_PATTERN}" || true)"

  if [ -n "${hits}" ]; then
    echo "NG: 追跡してはならないファイルがコミットされています。" >&2
    echo "${hits}" >&2
    echo "対処: .gitignore へ追加し、追跡対象から外してください（手動で対応してください）。" >&2
    return 1
  fi

  echo "OK: 禁止パスの追跡なし"
  return 0
}

check_secret_content() {
  local hits
  hits="$(list_tracked_files \
    | grep -Fxv "${SELF_PATH}" \
    | xargs -r grep -nIE "${SECRET_CONTENT_PATTERN}" || true)"

  if [ -n "${hits}" ]; then
    echo "NG: 資格情報とみられる文字列が含まれています。" >&2
    echo "${hits}" >&2
    echo "対処: 環境変数へ外部化し、コードには変数名のみを残してください。" >&2
    return 1
  fi

  echo "OK: 資格情報の混入なし"
  return 0
}

main() {
  local status=0

  check_forbidden_paths || status=1
  check_secret_content || status=1

  if [ "${status}" -ne 0 ]; then
    echo "シークレット検査に失敗しました。" >&2
  fi

  return "${status}"
}

main "$@"
