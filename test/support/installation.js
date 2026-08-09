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
const SKILL_FILENAME = 'SKILL.md';
const SKILLS_DIR_ENV_NAME = 'CLAUDE_SKILLS_DIR';

/** 設置先に置かれているものの種別 */
const KIND_NONE = 'none';
const KIND_SYMLINK = 'symlink';
const KIND_ENTITY = 'entity';
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

/** 設置先ディレクトリが存在することを確認する */
function assertSkillsDirectory(skillsDirectory) {
  if (!fs.existsSync(skillsDirectory)) {
    throw new Error(
      format(messages.skillsDirectoryNotFound, { path: skillsDirectory }),
    );
  }
}

/**
 * 設置先の状態を判定して返す。
 *
 * 配布 zip の展開と symlink 設置はどちらも同じパスを占有するため、既存が
 * どちらであるかを種別（none / symlink / entity）と所在で報告する。
 * 判定のみを行い、設置先を書き換えない。
 */
function inspect(skillsDirectory) {
  assertSkillsDirectory(skillsDirectory);

  const target = linkPath(skillsDirectory);
  const stat = fs.lstatSync(target, { throwIfNoEntry: false });

  if (stat === undefined) {
    return {
      path: target,
      exists: false,
      kind: KIND_NONE,
      target: null,
      summary: format(messages.installationStateNone, { path: target }),
    };
  }

  const resolved = fs.realpathSync(target);

  if (stat.isSymbolicLink()) {
    return {
      path: target,
      exists: true,
      kind: KIND_SYMLINK,
      target: resolved,
      summary: format(messages.installationStateSymlink, {
        path: target,
        target: resolved,
      }),
    };
  }

  return {
    path: target,
    exists: true,
    kind: KIND_ENTITY,
    target: resolved,
    summary: format(messages.installationStateEntity, {
      path: target,
      target: resolved,
    }),
  };
}

/** 既存がある場合に、その種別と所在を含む例外を送出する */
function refuseOccupied(state) {
  const template =
    state.kind === KIND_SYMLINK
      ? messages.installationOccupiedBySymlink
      : messages.installationOccupiedByEntity;

  throw new Error(
    format(template, { path: state.path, target: state.target }),
  );
}

/**
 * 設置先ディレクトリへ、このリポジトリを指す symlink を作る。
 * 作成したリンクのパスを返す。
 *
 * 既存がある場合は、種別と所在を提示して停止する。無言で上書きしない。
 * 既存の移動・改名・削除を行わない。
 */
function install(skillsDirectory, repositoryRoot = REPO_ROOT) {
  const state = inspect(skillsDirectory);

  if (state.exists) {
    refuseOccupied(state);
  }

  fs.symlinkSync(repositoryRoot, state.path, 'dir');

  return state.path;
}

/** 設置先の SKILL.md がリポジトリの SKILL.md と同一かを判定する */
function skillBodyMatches(state, repositoryRoot) {
  if (!state.exists) {
    return false;
  }

  const installed = path.join(state.path, SKILL_FILENAME);

  if (!fs.existsSync(installed)) {
    return false;
  }

  return (
    fs.readFileSync(installed, 'utf8') ===
    fs.readFileSync(path.join(repositoryRoot, SKILL_FILENAME), 'utf8')
  );
}

/**
 * 設置の結果を確認する。
 *
 * 設置物の種別と参照先に加えて、読み込まれる SKILL.md がリポジトリの版と
 * 一致するかを返す。実体が置かれている場合は symlink ではないことが分かる。
 * 確認のみを行い、設置先を書き換えない。
 */
function verify(skillsDirectory, repositoryRoot = REPO_ROOT) {
  const state = inspect(skillsDirectory);
  const repositoryPath = fs.realpathSync(repositoryRoot);

  return {
    ...state,
    pointsToRepository:
      state.kind === KIND_SYMLINK && state.target === repositoryPath,
    skillBodyMatches: skillBodyMatches(state, repositoryRoot),
  };
}

module.exports = {
  KIND_ENTITY,
  KIND_NONE,
  KIND_SYMLINK,
  SKILLS_DIR_ENV_NAME,
  SKILL_NAME,
  UNSUPPORTED_SYMLINK_ERROR_CODES,
  directorySymlinkSupport,
  inspect,
  install,
  linkPath,
  unsupportedReason,
  verify,
};
