/**
 * Issue #36 / PR #43
 *
 * ディレクトリ symlink を作成できない環境（開発者モードが無効で、かつ管理者へ
 * 昇格していない Windows）でも `npm test` が失敗しないことの契約テスト。
 *
 * 案A を採る。symlink の作成可否を実行時に判定し、作成できない環境では
 * test/pr29 の該当テストをスキップする。symlink 経由の読み込みを確認するという
 * PR #29 の目的を変えないためである。
 *
 * requirements.md 第15節（リソース構成図・設置先）に対応する。
 */
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const installation = require('../support/installation');
const skill = require('../support/skill');

const PR29_TEST_PATH = path.join(
  skill.REPO_ROOT,
  'test',
  'pr29',
  'installation.test.js',
);
const README_PATH = path.join(skill.REPO_ROOT, 'README.md');
const PR_TEMPLATE_PATH = path.join(
  skill.REPO_ROOT,
  '.github',
  'pull_request_template.md',
);

/** 指定したファイルを読む。存在しない場合はパスを含む例外を送出する */
function readFile(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`ファイルが見つかりません: ${filePath}`);
  }

  return fs.readFileSync(filePath, 'utf8');
}

/** この環境で実際にディレクトリ symlink を作れるかを、作って確かめる */
function probeSymlink() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'symlink-check-'));
  const target = path.join(root, 'target');

  fs.mkdirSync(target);

  try {
    fs.symlinkSync(target, path.join(root, 'link'), 'dir');
  } catch (cause) {
    return false;
  }

  return true;
}

describe('symlink の作成可否の判定', () => {
  test('判定の結果と理由を返す', () => {
    const support = installation.directorySymlinkSupport();

    expect(typeof support.available).toBe('boolean');
    expect(typeof support.reason).toBe('string');
    expect(support.reason.length).toBeGreaterThan(0);
  });

  test('判定が実際の作成可否と一致する', () => {
    expect(installation.directorySymlinkSupport().available).toBe(
      probeSymlink(),
    );
  });

  test('判定のためにリポジトリの外を書き換えない（一時ディレクトリで判定する）', () => {
    const before = fs.readdirSync(skill.REPO_ROOT).sort();

    installation.directorySymlinkSupport();

    expect(fs.readdirSync(skill.REPO_ROOT).sort()).toEqual(before);
  });

  test('作成できない場合の理由に Windows の前提が含まれる', () => {
    expect(installation.UNSUPPORTED_SYMLINK_ERROR_CODES).toContain('EPERM');
    expect(installation.unsupportedReason('EPERM')).toMatch(/開発者モード/);
    expect(installation.unsupportedReason('EPERM')).toMatch(/管理者/);
    expect(installation.unsupportedReason('EPERM')).toContain('EPERM');
  });
});

describe('test/pr29 のスキップ', () => {
  const source = () => readFile(PR29_TEST_PATH);

  test('symlink の作成可否の判定を用いている', () => {
    expect(source()).toMatch(/directorySymlinkSupport/);
  });

  test('作成できない環境ではテストをスキップする', () => {
    expect(source()).toMatch(/test\.skip/);
  });

  test('スキップ理由をテスト名へ出す', () => {
    expect(source()).toMatch(/スキップ/);
    expect(source()).toMatch(/reason/);
  });

  test('スキップした事実と理由を実行結果へ書き出す', () => {
    expect(source()).toMatch(/process\.stderr\.write/);
    expect(source()).toMatch(/symlinkSupport\.reason/);
  });

  test('symlink を作成できる環境では従来どおり実行する', () => {
    if (!installation.directorySymlinkSupport().available) {
      return;
    }

    const skillsDir = fs.mkdtempSync(path.join(os.tmpdir(), 'skills-'));
    const link = installation.install(skillsDir);

    expect(fs.lstatSync(link).isSymbolicLink()).toBe(true);
  });
});

describe('ユーザーテスト手順への前提の記載', () => {
  test('README に Windows での前提が書かれている', () => {
    const readme = readFile(README_PATH);

    expect(readme).toMatch(/Windows/);
    expect(readme).toMatch(/開発者モード/);
    expect(readme).toMatch(/管理者/);
  });

  test('README に前提を満たさない場合の扱いが書かれている', () => {
    const readme = readFile(README_PATH);

    expect(readme).toMatch(/スキップ/);
    expect(readme).toMatch(/不合格ではありません/);
  });

  test('PR テンプレートに実行環境の前提の欄がある', () => {
    expect(readFile(PR_TEMPLATE_PATH)).toMatch(/実行環境の前提/);
  });
});
