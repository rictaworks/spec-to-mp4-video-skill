/**
 * Issue #9 / PR #24
 *
 * SKILL.md の P8 のうち、シーン実装の要件の契約テスト。
 * requirements.md 第9節 P8・第10.1節（表現の要件）・第10.2節（アニメーション実装の要件）に対応する。
 */
const skill = require('../support/skill');

const PARENT_HEADING = '## P8 シーン実装とレンダリング';
const HEADING = '### シーン実装';

const section = () => skill.extractSection(skill.loadSkill().body, HEADING);

describe('シーン実装の節', () => {
  test('節が存在する', () => {
    expect(() => section()).not.toThrow();
  });

  test('P8 の内側に置かれている', () => {
    const parent = skill.extractSection(skill.loadSkill().body, PARENT_HEADING);

    expect(parent).toContain(HEADING);
  });
});

describe('表現の要件', () => {
  test('実写・画面録画・写真素材を用いないことが書かれている', () => {
    expect(section()).toMatch(/実写/);
    expect(section()).toMatch(/画面録画/);
    expect(section()).toMatch(/写真素材/);
    expect(section()).toMatch(/用いない/);
  });

  test('2Dの描画で構成することが書かれている', () => {
    expect(section()).toMatch(/2D/);
    expect(section()).toMatch(/描画/);
  });

  test('撮影工程を持たないことが書かれている', () => {
    expect(section()).toMatch(/撮影工程/);
  });

  test('端末画面を黒背景・等幅フォント・カーソル表現で表すことが書かれている', () => {
    expect(section()).toMatch(/黒背景/);
    expect(section()).toMatch(/等幅フォント/);
    expect(section()).toMatch(/カーソル/);
  });

  test('実物の忠実な再現を目的としないことが書かれている', () => {
    expect(section()).toMatch(/忠実な再現/);
    expect(section()).toMatch(/目的としない/);
  });

  test('正確さを要求する対象がコマンド文字列と出力の要点に限られる', () => {
    expect(section()).toMatch(/コマンド文字列/);
    expect(section()).toMatch(/要点/);
    expect(section()).toMatch(/限る|限定/);
  });
});

describe('アニメーション実装の要件', () => {
  test('時間変化する値を現在フレーム番号の純粋関数として実装することが書かれている', () => {
    expect(section()).toMatch(/フレーム番号/);
    expect(section()).toMatch(/純粋関数/);
  });

  test('CSS のトランジションを用いないことが書かれている', () => {
    expect(section()).toMatch(/トランジション/);
  });

  test('ユーティリティクラスによるアニメーションを用いないことが書かれている', () => {
    expect(section()).toMatch(/ユーティリティクラス/);
  });

  test('タイマーによる遅延実行を用いないことが書かれている', () => {
    expect(section()).toMatch(/タイマー/);
    expect(section()).toMatch(/遅延実行/);
  });

  test('用いない理由（レンダリング時に反映されない）が書かれている', () => {
    expect(section()).toMatch(/レンダリング時に反映されない/);
  });

  test('遷移に連結構造を用い、開始フレームの手計算を行わないことが書かれている', () => {
    expect(section()).toMatch(/連結/);
    expect(section()).toMatch(/開始フレーム/);
    expect(section()).toMatch(/手計算を行わ(ない|ず)/);
  });

  test('装飾のみを目的とした動きを追加しないことが書かれている', () => {
    expect(section()).toMatch(/装飾のみ/);
    expect(section()).toMatch(/追加しない/);
  });
});

describe('文言の扱い', () => {
  test('画面文言を構成データから読み込み、実装へ直接書かないことが書かれている', () => {
    expect(section()).toMatch(/構成データ/);
    expect(section()).toMatch(/直接書かない|直接埋め込ま(ない|ず)/);
  });
});
