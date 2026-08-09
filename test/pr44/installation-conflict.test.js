/**
 * Issue #37 / PR #44
 *
 * 設置先の衝突（配布 zip を展開した実体と、symlink 設置）の契約テスト。
 *
 * どちらの経路も ~/.claude/skills/spec-to-mp4-video を占有するため、実体がある
 * 状態では symlink 設置が失敗する。ところが SKILL.md は読めてしまうため、
 * 設置に失敗したまま古い本文を読み続ける事故が起きる。
 *
 * 既存の種別（symlink / 実体）と所在を判定して報告し、実体を無言で上書き
 * しないこと、設置後に種別・参照先・本文の一致を確認できることを検証する。
 *
 * requirements.md 第15節（リソース構成図・設置先）に対応する。
 */
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const installation = require('../support/installation');
const skill = require('../support/skill');

const SKILL_NAME = 'spec-to-mp4-video';
const OLD_BODY = '---\nname: spec-to-mp4-video\ndescription: 古い配布 zip の本文\n---\n\n# 古い版\n';

const README_PATH = path.join(skill.REPO_ROOT, 'README.md');
const REQUIREMENTS_PATH = path.join(skill.REPO_ROOT, 'requirements.md');

const symlinkSupport = installation.directorySymlinkSupport();
const symlinkTest = symlinkSupport.available ? test : test.skip;

/** 設置先に見立てた一時ディレクトリを作る */
function makeSkillsDirectory() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'skills-conflict-'));
}

/** 配布 zip を展開した状態を模して、実体のディレクトリを作る */
function extractDistribution(skillsDirectory, body = OLD_BODY) {
  const target = path.join(skillsDirectory, SKILL_NAME);

  fs.mkdirSync(target);
  fs.writeFileSync(path.join(target, 'SKILL.md'), body, 'utf8');

  return target;
}

/** 指定したファイルを読む。存在しない場合はパスを含む例外を送出する */
function readFile(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`ファイルが見つかりません: ${filePath}`);
  }

  return fs.readFileSync(filePath, 'utf8');
}

describe('設置先の状態の判定', () => {
  test('未設置の場合は none を返す', () => {
    const state = installation.inspect(makeSkillsDirectory());

    expect(state.kind).toBe('none');
    expect(state.exists).toBe(false);
    expect(state.target).toBeNull();
  });

  test('実体のディレクトリがある場合は entity として所在を返す', () => {
    const skillsDir = makeSkillsDirectory();
    const extracted = extractDistribution(skillsDir);
    const state = installation.inspect(skillsDir);

    expect(state.kind).toBe('entity');
    expect(state.exists).toBe(true);
    expect(state.target).toBe(fs.realpathSync(extracted));
  });

  symlinkTest('symlink がある場合は symlink として参照先を返す', () => {
    const skillsDir = makeSkillsDirectory();

    installation.install(skillsDir);

    const state = installation.inspect(skillsDir);

    expect(state.kind).toBe('symlink');
    expect(state.target).toBe(fs.realpathSync(skill.REPO_ROOT));
  });

  test('設置先のディレクトリが存在しない場合はパスを含む例外を送出する', () => {
    const missing = path.join(os.tmpdir(), 'no-such-skills-dir-for-inspect');

    expect(() => installation.inspect(missing)).toThrow(missing);
  });
});

describe('実体がある状態での symlink 設置', () => {
  test('無言で上書きせず、既存の種別と所在を含む例外を送出する', () => {
    const skillsDir = makeSkillsDirectory();
    const extracted = extractDistribution(skillsDir);

    expect(() => installation.install(skillsDir)).toThrow(/実体/);
    expect(() => installation.install(skillsDir)).toThrow(
      new RegExp(fs.realpathSync(extracted).replace(/\\/g, '\\\\')),
    );
  });

  test('既存を手動で退避するよう求める', () => {
    const skillsDir = makeSkillsDirectory();

    extractDistribution(skillsDir);

    expect(() => installation.install(skillsDir)).toThrow(/手動/);
  });

  test('既存のファイルを削除・改名・上書きしない', () => {
    const skillsDir = makeSkillsDirectory();
    const extracted = extractDistribution(skillsDir);

    expect(() => installation.install(skillsDir)).toThrow();

    expect(fs.readdirSync(extracted)).toEqual(['SKILL.md']);
    expect(readFile(path.join(extracted, 'SKILL.md'))).toBe(OLD_BODY);
    expect(fs.lstatSync(extracted).isSymbolicLink()).toBe(false);
  });
});

describe('設置後の確認', () => {
  symlinkTest('symlink 設置なら種別・参照先・本文がすべて一致する', () => {
    const skillsDir = makeSkillsDirectory();

    installation.install(skillsDir);

    const result = installation.verify(skillsDir);

    expect(result.kind).toBe('symlink');
    expect(result.pointsToRepository).toBe(true);
    expect(result.skillBodyMatches).toBe(true);
    expect(result.summary).toMatch(/symlink/);
  });

  test('配布 zip の実体なら symlink ではないことと本文の不一致を報告する', () => {
    const skillsDir = makeSkillsDirectory();

    extractDistribution(skillsDir);

    const result = installation.verify(skillsDir);

    expect(result.kind).toBe('entity');
    expect(result.pointsToRepository).toBe(false);
    expect(result.skillBodyMatches).toBe(false);
    expect(result.summary).toMatch(/実体/);
  });

  test('実体の本文がリポジトリと同一でも symlink ではないことを報告する', () => {
    const skillsDir = makeSkillsDirectory();

    extractDistribution(skillsDir, readFile(skill.skillPath()));

    const result = installation.verify(skillsDir);

    expect(result.kind).toBe('entity');
    expect(result.skillBodyMatches).toBe(true);
    expect(result.pointsToRepository).toBe(false);
  });

  test('未設置なら未設置であることを報告する', () => {
    const result = installation.verify(makeSkillsDirectory());

    expect(result.kind).toBe('none');
    expect(result.pointsToRepository).toBe(false);
    expect(result.skillBodyMatches).toBe(false);
    expect(result.summary).toMatch(/設置されていません/);
  });

  test('確認の過程で設置先を書き換えない', () => {
    const skillsDir = makeSkillsDirectory();
    const extracted = extractDistribution(skillsDir);

    installation.verify(skillsDir);

    expect(fs.readdirSync(extracted)).toEqual(['SKILL.md']);
    expect(readFile(path.join(extracted, 'SKILL.md'))).toBe(OLD_BODY);
  });
});

describe('README の設置手順', () => {
  const readme = () => readFile(README_PATH);

  test('設置先に既存がある場合の扱いが書かれている', () => {
    expect(readme()).toMatch(/配布 zip/);
    expect(readme()).toMatch(/実体/);
  });

  test('設置物の種別と参照先を確認する手順が書かれている', () => {
    expect(readme()).toMatch(/readlink/);
    expect(readme()).toMatch(/ls -l/);
  });

  test('読み込まれている本文が意図した版かを確認する手段が書かれている', () => {
    expect(readme()).toMatch(/diff/);
    expect(readme()).toMatch(/SKILL\.md/);
  });

  test('既存を削除せず手動で退避するよう書かれている', () => {
    expect(readme()).toMatch(/退避/);
  });
});

describe('requirements.md 第15節との整合', () => {
  const section = () => {
    const text = readFile(REQUIREMENTS_PATH);
    const start = text.indexOf('## 15. リソース構成図');
    const end = text.indexOf('## 16.', start);

    return text.slice(start, end);
  };

  test('設置経路が2通りあることが書かれている', () => {
    expect(section()).toMatch(/zip/);
    expect(section()).toMatch(/symlink/);
  });

  test('衝突時に上書きせず所在を提示することが書かれている', () => {
    expect(section()).toMatch(/上書き/);
    expect(section()).toMatch(/(提示|報告)/);
  });

  test('設置物の種別と参照先を確認することが書かれている', () => {
    expect(section()).toMatch(/種別/);
    expect(section()).toMatch(/参照先/);
  });
});
