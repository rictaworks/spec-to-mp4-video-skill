/**
 * スキルの設置（symlink）を扱う共通処理。
 *
 * 方針:
 *   - リポジトリを Single Source of Truth とし、設置先へファイルを複製しない
 *   - 既存のパスを削除・上書きしない。衝突した場合は手動での対応を求める例外を送出する
 *   - 設置先が存在しない場合に暗黙で作成しない
 */
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const messages = require('./messages.json');
const { REPO_ROOT } = require('./skill');

const SKILL_NAME = 'spec-to-mp4-video';
const SKILLS_DIR_ENV_NAME = 'CLAUDE_SKILLS_DIR';
const SYMLINK_PROBE_PREFIX = 'symlink-probe-';
const PROBE_TARGET_NAME = 'target';
const PROBE_LINK_NAME = 'link';

/**
 * ディレクトリ symlink を作成できないと判断してよいエラーコード。
 * Windows は開発者モードが無効かつ非昇格のシェルで EPERM を返す。
 */
const UNSUPPORTED_SYMLINK_ERROR_CODES = ['EPERM', 'EACCES', 'ENOSYS', 'UNKNOWN'];

/** メッセージ雛形の {key} を値で置換する */
function format(template, values) {
  return Object.entries(values).reduce(
    (text, [key, value]) => text.split(`{${key}}`).join(String(value)),
    template,
  );
}

/** symlink を作成できない場合の理由の文面を返す */
function unsupportedReason(code) {
  return format(messages.symlinkUnsupported, { code });
}

/**
 * この環境でディレクトリ symlink を作成できるかを、一時ディレクトリで実際に
 * 作成して判定する。判定結果と、その理由の文面を返す。
 *
 * 作成できない環境であると判断してよいエラーコード以外は握りつぶさず、
 * 原因を含む例外として送出する。判定に用いた一時ディレクトリは削除しない。
 */
function directorySymlinkSupport() {
  const probeRoot = fs.mkdtempSync(path.join(os.tmpdir(), SYMLINK_PROBE_PREFIX));
  const target = path.join(probeRoot, PROBE_TARGET_NAME);

  fs.mkdirSync(target);

  try {
    fs.symlinkSync(target, path.join(probeRoot, PROBE_LINK_NAME), 'dir');
  } catch (cause) {
    if (UNSUPPORTED_SYMLINK_ERROR_CODES.includes(cause.code)) {
      return { available: false, reason: unsupportedReason(cause.code) };
    }

    throw new Error(
      format(messages.symlinkProbeFailed, {
        path: probeRoot,
        reason: cause.message,
      }),
      { cause },
    );
  }

  return { available: true, reason: messages.symlinkSupported };
}

/** 設置先ディレクトリの中の、このスキルのリンクのパスを返す */
function linkPath(skillsDirectory) {
  return path.join(skillsDirectory, SKILL_NAME);
}

/**
 * 設置先ディレクトリへ、このリポジトリを指す symlink を作る。
 * 作成したリンクのパスを返す。
 */
function install(skillsDirectory, repositoryRoot = REPO_ROOT) {
  if (!fs.existsSync(skillsDirectory)) {
    throw new Error(
      format(messages.skillsDirectoryNotFound, { path: skillsDirectory }),
    );
  }

  const link = linkPath(skillsDirectory);

  if (fs.existsSync(link) || fs.lstatSync(link, { throwIfNoEntry: false })) {
    throw new Error(format(messages.installationPathOccupied, { path: link }));
  }

  fs.symlinkSync(repositoryRoot, link, 'dir');

  return link;
}

module.exports = {
  SKILLS_DIR_ENV_NAME,
  SKILL_NAME,
  UNSUPPORTED_SYMLINK_ERROR_CODES,
  directorySymlinkSupport,
  install,
  linkPath,
  unsupportedReason,
};
