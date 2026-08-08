/**
 * Issue #14 / PR #29
 *
 * スキルの設置（symlink）の契約テスト。
 * requirements.md 第3節（リポジトリを Single Source of Truth とし symlink で設置する）に対応する。
 *
 * 設置先はテストごとに作った一時ディレクトリとする。
 * 実行者のスキルディレクトリを書き換えない。環境変数 CLAUDE_SKILLS_DIR が
 * 指定されている場合のみ、実際の設置状態もあわせて検証する。
 */
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const installation = require('../support/installation');
const skill = require('../support/skill');

const SKILL_NAME = 'spec-to-mp4-video';

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
  test('symlink として設置される（複製ではない）', () => {
    const skillsDir = makeSkillsDirectory();
    const link = installation.install(skillsDir);

    expect(fs.lstatSync(link).isSymbolicLink()).toBe(true);
  });

  test('リンク先がこのリポジトリである', () => {
    const skillsDir = makeSkillsDirectory();
    const link = installation.install(skillsDir);

    expect(fs.realpathSync(link)).toBe(fs.realpathSync(skill.REPO_ROOT));
  });

  test('設置先にファイルの複製が発生していない', () => {
    const skillsDir = makeSkillsDirectory();
    installation.install(skillsDir);

    const entries = fs.readdirSync(skillsDir, { withFileTypes: true });

    expect(entries).toHaveLength(1);
    expect(entries[0].isSymbolicLink()).toBe(true);
  });

  test('すでに同名のパスがある場合、上書きせず例外を送出する', () => {
    const skillsDir = makeSkillsDirectory();
    installation.install(skillsDir);

    expect(() => installation.install(skillsDir)).toThrow(/手動/);
  });
});

describe('symlink 経由の読み込み', () => {
  test('SKILL.md が読め、name が解決できる', () => {
    const skillsDir = makeSkillsDirectory();
    const link = installation.install(skillsDir);
    const loaded = skill.loadSkill(path.join(link, 'SKILL.md'));

    expect(loaded.frontmatter.name).toBe(SKILL_NAME);
  });

  test('本文が symlink 経由でも同一である', () => {
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
