/**
 * Issue #8 / PR #23
 *
 * SKILL.md の P7「環境準備」の契約テスト。
 * requirements.md 第8.2節・第9節 P7・第9.1節・第12節（フォントのライセンス）に対応する。
 */
const skill = require('../support/skill');

const HEADING = '## P7 環境準備';

const section = () => skill.extractSection(skill.loadSkill().body, HEADING);

describe('P7 の節', () => {
  test('節が存在する', () => {
    expect(() => section()).not.toThrow();
  });
});

describe('動画生成プロジェクトの構築', () => {
  test('作業ディレクトリへプロジェクトを構築することが書かれている', () => {
    expect(section()).toMatch(/動画生成プロジェクト/);
    expect(section()).toMatch(/作業ディレクトリ/);
  });

  test('構成データを読み込む構造であることが書かれている', () => {
    expect(section()).toMatch(/構成データ/);
    expect(section()).toMatch(/読み込/);
  });

  test('出力仕様に合わせた解像度とフレームレートを設定することが書かれている', () => {
    expect(section()).toMatch(/1920\s*x\s*1080/);
    expect(section()).toMatch(/30\s*fps/);
  });
});

describe('日本語フォントの可用性判定', () => {
  test('日本語グリフの欠落を判定することが書かれている', () => {
    expect(section()).toMatch(/日本語/);
    expect(section()).toMatch(/グリフ/);
    expect(section()).toMatch(/欠落/);
  });

  test('判定を静止画で確認する手順が書かれている', () => {
    expect(section()).toMatch(/静止画|フレーム/);
  });

  test('不足時は停止し、導入を求めることが書かれている', () => {
    expect(section()).toMatch(/停止/);
    expect(section()).toMatch(/導入/);
  });

  test('自動導入や代替フォントへの暗黙の切り替えを行わないことが書かれている', () => {
    expect(section()).toMatch(/代替フォント/);
    expect(section()).toMatch(/切り替えを行わ(ない|ず)/);
  });
});

describe('フォントのライセンス', () => {
  test('商用利用可のライセンスであることを確認する旨が書かれている', () => {
    expect(section()).toMatch(/商用利用/);
    expect(section()).toMatch(/ライセンス/);
    expect(section()).toMatch(/確認/);
  });
});

describe('完了条件', () => {
  test('P7 の完了条件が明記されている', () => {
    expect(section()).toMatch(/完了条件/);
    expect(section()).toMatch(/起動/);
    expect(section()).toMatch(/欠落しない/);
  });
});
