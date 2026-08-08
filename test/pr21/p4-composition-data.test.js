/**
 * Issue #6 / PR #21
 *
 * SKILL.md の P4「構成データ生成」の契約テスト。
 * requirements.md 第8.2節（副次生成物）・第9節 P4・第10.1節（表現の要件）に対応する。
 */
const skill = require('../support/skill');

const HEADING = '## P4 構成データ生成';

const section = () => skill.extractSection(skill.loadSkill().body, HEADING);

describe('P4 の節', () => {
  test('節が存在する', () => {
    expect(() => section()).not.toThrow();
  });
});

describe('構成データファイルの位置づけ', () => {
  test('構成データファイルを作業ディレクトリへ書き出すことが書かれている', () => {
    expect(section()).toMatch(/構成データファイル/);
    expect(section()).toMatch(/作業ディレクトリ/);
  });

  test('画面文言の唯一の保持先であることが明記されている', () => {
    expect(section()).toMatch(/唯一の保持先/);
  });

  test('シーンの実装コードへ文字列を直接埋め込まないことが明記されている', () => {
    expect(section()).toMatch(/実装コード/);
    expect(section()).toMatch(/直接埋め込ま(ない|ず)/);
  });

  test('文言の修正がデータ編集のみで完結することが明記されている', () => {
    expect(section()).toMatch(/データ(の)?編集のみで完結/);
  });
});

describe('原文の保持', () => {
  test('要約・言い換え・翻訳をしないことが明記されている', () => {
    expect(section()).toMatch(/要約/);
    expect(section()).toMatch(/言い換え/);
    expect(section()).toMatch(/翻訳/);
    expect(section()).toMatch(/しない/);
  });

  test('原文のまま採用することが明記されている', () => {
    expect(section()).toMatch(/原文/);
  });
});

describe('構成データが持つ項目', () => {
  const FIELDS = ['識別子', '種別', '見出し', '画面表示テキスト', '尺'];

  test.each(FIELDS)('構成データの項目に %s が列挙されている', (field) => {
    expect(section()).toContain(field);
  });

  test('シーンの順序を保持することが書かれている', () => {
    expect(section()).toMatch(/順序/);
  });
});

describe('完了条件', () => {
  test('P4 の完了条件が明記されている', () => {
    expect(section()).toMatch(/完了条件/);
    expect(section()).toMatch(/原文のまま/);
  });
});
