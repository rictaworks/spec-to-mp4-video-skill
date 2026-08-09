/**
 * Issue #14 / PR #29
 *
 * スキルの設置（symlink）の契約テスト。
 * requirements.md 第3節（リポジトリを Single Source of Truth とし symlink で設置する）に対応する。
 *
 * 設置先はテストごとに作った一時ディレクトリとする。
 * 実行者のスキルディレクトリを書き換えない。環境変数 CLAUDE_SKILLS_DIR が
 * 指定されている場合のみ、実際の設置状態もあわせて検証する。
 *
 * Issue #36。ディレクトリ symlink を作成できない環境（開発者モードが無効で、
 * かつ管理者へ昇格していない Windows）では、symlink の作成を要するテストを
 * スキップする。スキップ理由はテスト名へ出す。
 */
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const installation = require('../support/installation');
const skill = require('../support/skill');

const SKILL_NAME = 'spec-to-mp4-video';

const symlinkSupport = installation.directorySymlinkSupport();

/** symlink の作成を要するテストを、作成できない環境ではスキップする */
const symlinkTest = symlinkSupport.available ? test : test.skip;

// スキップした事実と理由を実行結果から読み取れるようにする。
// jest の要約は件数しか示さないため、理由を標準エラーへ書き出す。
if (!symlinkSupport.available) {
  process.stderr.write(
    `[test/pr29] symlink の作成を要するテストをスキップします: ${symlinkSupport.reason}\n`,
  );
}

/** スキップする場合に、その理由をテスト名へ添える */
function named(name) {
  if (symlinkSupport.available) {
    return name;
  }

  return `${name}（スキップ: ${symlinkSupport.reason}）`;
}

/** 設置先に見立てた一時ディレクトリを作る */
function makeSkillsDirectory() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'skills-'));
}

describe('設置先の解決', () => {
  test('スキル名のディレクトリ名で設置先のパスを組み立てる', () => {
    const skillsDir = makeSkillsDirectory();

    expect(installation.linkPath(skillsDir)).toBe(
      path.join(skillsDir, SKILL_NAME),
    );
  });

  test('設置先のディレクトリが存在しない場合、パスを含む例外を送出する', () => {
    const missing = path.join(os.tmpdir(), 'no-such-skills-dir-for-test');

    expect(() => installation.install(missing)).toThrow(missing);
  });
});

describe('設置', () => {
  symlinkTest(named('symlink として設置される（複製ではない）'), () => {
    const skillsDir = makeSkillsDirectory();
    const link = installation.install(skillsDir);

    expect(fs.lstatSync(link).isSymbolicLink()).toBe(true);
  });

  symlinkTest(named('リンク先がこのリポジトリである'), () => {
    const skillsDir = makeSkillsDirectory();
    const link = installation.install(skillsDir);

    expect(fs.realpathSync(link)).toBe(fs.realpathSync(skill.REPO_ROOT));
  });

  symlinkTest(named('設置先にファイルの複製が発生していない'), () => {
    const skillsDir = makeSkillsDirectory();
    installation.install(skillsDir);

    const entries = fs.readdirSync(skillsDir, { withFileTypes: true });

    expect(entries).toHaveLength(1);
    expect(entries[0].isSymbolicLink()).toBe(true);
  });

  symlinkTest(named('すでに同名のパスがある場合、上書きせず例外を送出する'), () => {
    const skillsDir = makeSkillsDirectory();
    installation.install(skillsDir);

    expect(() => installation.install(skillsDir)).toThrow(/手動/);
  });
});

describe('symlink 経由の読み込み', () => {
  symlinkTest(named('SKILL.md が読め、name が解決できる'), () => {
    const skillsDir = makeSkillsDirectory();
    const link = installation.install(skillsDir);
    const loaded = skill.loadSkill(path.join(link, 'SKILL.md'));

    expect(loaded.frontmatter.name).toBe(SKILL_NAME);
  });

  symlinkTest(named('本文が symlink 経由でも同一である'), () => {
    const skillsDir = makeSkillsDirectory();
    const link = installation.install(skillsDir);

    expect(skill.loadSkill(path.join(link, 'SKILL.md')).raw).toBe(
      skill.loadSkill().raw,
    );
  });
});

describe('実際の設置状態', () => {
  const configured = process.env.CLAUDE_SKILLS_DIR;

  test('CLAUDE_SKILLS_DIR が指定されている場合、設置済みで symlink である', () => {
    if (configured === undefined) {
      expect(installation.SKILLS_DIR_ENV_NAME).toBe('CLAUDE_SKILLS_DIR');
      return;
    }

    const link = installation.linkPath(configured);

    expect(fs.lstatSync(link).isSymbolicLink()).toBe(true);
    expect(fs.realpathSync(link)).toBe(fs.realpathSync(skill.REPO_ROOT));
  });
});
