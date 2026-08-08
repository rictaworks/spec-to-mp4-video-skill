/**
 * Issue #12 / PR #27
 *
 * SKILL.md の完了報告と停止時の提示文の契約テスト。
 * requirements.md 第7.3節・第8.3節・第9.1節、CLAUDE.md「コンテンツの表記」に対応する。
 *
 * 利用者の目に触れる文面はですます調で書く。だである調の文末を含めない。
 */
const skill = require('../support/skill');

const REPORT_HEADING = '## 完了報告';
const NOTICE_HEADING = '## 停止時の提示文';

/** ですます調と認める文末 */
const POLITE_ENDING =
  /(です|ます|ました|ません|ませんでした|でした|ください|ましょう|でしょうか)。$/;

/**
 * だである調とみなす文末。文の末尾に固定して判定する。
 * 「ました。」「でした。」は丁寧体のためこれに含めない。
 */
const PLAIN_ENDING = /(である|だ|する|ない|(?<![まで])した)。$/;

const report = () => skill.extractSection(skill.loadSkill().body, REPORT_HEADING);
const notice = () => skill.extractSection(skill.loadSkill().body, NOTICE_HEADING);

/** 節の中の ```text ブロックを配列で返す */
function codeBlocks(section) {
  const blocks = [...section.matchAll(/```text\n([\s\S]*?)```/g)].map(
    (matched) => matched[1],
  );

  if (blocks.length === 0) {
    throw new Error('提示文のコードブロックが1件も見つかりません');
  }

  return blocks;
}

/** 句点で終わる文を配列で返す */
function sentences(text) {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.endsWith('。'))
    .flatMap((line) => line.split('。').filter(Boolean).map((s) => `${s}。`));
}

describe('完了報告', () => {
  test('節が存在する', () => {
    expect(() => report()).not.toThrow();
  });

  const ITEMS = [
    ['出力パス', /出力パス/],
    ['シーン一覧と各シーンの尺', /シーン一覧/],
    ['総尺', /総尺/],
    ['採用した既定値', /採用した既定値/],
    ['要件の充足状況', /充足状況/],
  ];

  test.each(ITEMS)('報告項目に %s が含まれる', (_label, pattern) => {
    expect(report()).toMatch(pattern);
  });

  test('連番を付与した場合は既存ファイルの所在も報告する', () => {
    expect(report()).toMatch(/既存ファイル/);
  });

  test('可読性の要件の判定結果を報告する', () => {
    expect(report()).toMatch(/R1/);
    expect(report()).toMatch(/R5/);
  });
});

describe('停止時の提示文', () => {
  test('節が存在する', () => {
    expect(() => notice()).not.toThrow();
  });

  const BRANCHES = [
    ['必須項目の欠落', /必須項目/],
    ['規模の超過', /上限|超え/],
    ['日本語フォントの不足', /日本語フォント/],
    ['想定尺の欠落', /想定尺/],
  ];

  test.each(BRANCHES)('%s の分岐に対する文面がある', (_label, pattern) => {
    expect(notice()).toMatch(pattern);
  });

  test('提示文がコードブロックとして用意されている', () => {
    expect(codeBlocks(notice()).length).toBeGreaterThanOrEqual(4);
  });
});

describe('提示文の文体', () => {
  test('すべての文がですます調で終わる', () => {
    const offenders = codeBlocks(notice())
      .flatMap((block) => sentences(block))
      .filter((sentence) => !POLITE_ENDING.test(sentence));

    expect(offenders).toEqual([]);
  });

  test('だである調の文末を含まない', () => {
    const offenders = codeBlocks(notice())
      .flatMap((block) => sentences(block))
      .filter((sentence) => PLAIN_ENDING.test(sentence));

    expect(offenders).toEqual([]);
  });
});
