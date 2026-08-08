/**
 * Issue #13 / PR #28
 *
 * SKILL.md のセキュリティ・権利の要件と、デモ版の構成上の制約の契約テスト。
 * requirements.md 第4節（規模）・第12節（セキュリティ・権利）・第15節（リソース構成）に対応する。
 */
const fs = require('node:fs');
const path = require('node:path');

const skill = require('../support/skill');

const HEADING = '## 禁止事項';
const LINE_LIMIT = 500;
const ABSENT_DIRECTORIES = ['scripts', 'references', 'assets'];

const section = () => skill.extractSection(skill.loadSkill().body, HEADING);

describe('禁止事項の節', () => {
  test('節が存在する', () => {
    expect(() => section()).not.toThrow();
  });
});

describe('個人を特定できる情報の扱い', () => {
  test('画面表現の中に実在の個人を特定できる情報を表示しないことが書かれている', () => {
    expect(section()).toMatch(/実在の個人/);
    expect(section()).toMatch(/表示しない/);
  });

  test('仕様書に含まれる場合は伏せ字化の可否を確認することが書かれている', () => {
    expect(section()).toMatch(/伏せ字/);
    expect(section()).toMatch(/確認/);
  });
});

describe('第三者の著作物', () => {
  test('主従関係・出典明示・改変禁止の要件を満たす範囲でのみ用いることが書かれている', () => {
    expect(section()).toMatch(/主従関係/);
    expect(section()).toMatch(/出典/);
    expect(section()).toMatch(/改変/);
  });
});

describe('資格情報', () => {
  test('資格情報を本文へ書かず、環境変数として外部化することが書かれている', () => {
    expect(section()).toMatch(/資格情報/);
    expect(section()).toMatch(/環境変数/);
    expect(section()).toMatch(/変数名/);
  });

  test('SKILL.md 本文に資格情報とみられる文字列が含まれない', () => {
    const patterns = [
      /AKIA[0-9A-Z]{16}/,
      /-----BEGIN [A-Z ]*PRIVATE KEY-----/,
      /sk-ant-[A-Za-z0-9_-]{24,}/,
      /ghp_[A-Za-z0-9]{36}/,
      /xox[baprs]-[A-Za-z0-9-]{10,}/,
    ];

    for (const pattern of patterns) {
      expect(skill.loadSkill().raw).not.toMatch(pattern);
    }
  });

  test('SKILL.md 本文にメールアドレスが含まれない', () => {
    expect(skill.loadSkill().raw).not.toMatch(
      /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/,
    );
  });
});

describe('規模の制約', () => {
  test(`SKILL.md の行数が ${LINE_LIMIT} 行以下である`, () => {
    expect(skill.loadSkill().lineCount).toBeLessThanOrEqual(LINE_LIMIT);
  });
});

describe('構成の制約', () => {
  test.each(ABSENT_DIRECTORIES)(
    'リポジトリに %s ディレクトリを持たない',
    (name) => {
      expect(fs.existsSync(path.join(skill.REPO_ROOT, name))).toBe(false);
    },
  );
});

describe('表記の制約', () => {
  test('SKILL.md に絵文字が含まれない', () => {
    const emoji =
      /[\u{1F300}-\u{1F5FF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{1F900}-\u{1FAFF}\u{2700}-\u{27BF}\u{2600}-\u{26FF}]/u;

    expect(skill.loadSkill().raw).not.toMatch(emoji);
  });
});
