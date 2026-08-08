/**
 * スキルの設置（symlink）を扱う共通処理。
 *
 * 方針:
 *   - リポジトリを Single Source of Truth とし、設置先へファイルを複製しない
 *   - 既存のパスを削除・上書きしない。衝突した場合は手動での対応を求める例外を送出する
 *   - 設置先が存在しない場合に暗黙で作成しない
 */
const fs = require('node:fs');
const path = require('node:path');

const messages = require('./messages.json');
const { REPO_ROOT } = require('./skill');

const SKILL_NAME = 'spec-to-mp4-video';
const SKILLS_DIR_ENV_NAME = 'CLAUDE_SKILLS_DIR';

/** メッセージ雛形の {key} を値で置換する */
function format(template, values) {
  return Object.entries(values).reduce(
    (text, [key, value]) => text.split(`{${key}}`).join(String(value)),
    template,
  );
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
  install,
  linkPath,
};
