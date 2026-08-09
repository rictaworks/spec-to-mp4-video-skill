/**
 * Issue #38 / PR #42
 *
 * P8 の完了条件に加えた「画面内収まりの機械検査」の契約テスト。
 *
 * SKILL.md へ書いた検査規則を test/support/layout-inspection.js に参照実装として
 * 起こし、2026-08-09 の実行で P9 まで漏れた2件を再現する入力で不適合を報告できる
 * ことを検証する。
 *
 *   1. 端末枠の内寸を 26px 超過する選択肢の行（下部が欠ける）
 *   2. 30px の HUD ラベル（下限 32px を下回る）
 *
 * requirements.md 第10.3節・第10.4節、SKILL.md P8・P9 に対応する。
 */
const layout = require('../support/layout-inspection');
const skill = require('../support/skill');

const body = () => skill.loadSkill().body;
const p8 = () => skill.extractSection(body(), '## P8 シーン実装とレンダリング');
const p9 = () => skill.extractSection(body(), '## P9 表示検証');

const CANVAS = { width: 1920, height: 1080 };

/** 検査に掛ける最小構成のフレームを組み立てる */
function frame(elements) {
  return { name: 'S07', canvas: CANVAS, elements };
}

/** 不適合の記号だけを取り出す */
function codesOf(findings) {
  return findings.map((finding) => finding.code);
}

describe('検査の定数', () => {
  test('安全余白は上下左右 5% である', () => {
    expect(layout.SAFE_MARGIN_RATIO).toBe(0.05);
  });

  test('文字サイズの下限は縦解像度の 3% である', () => {
    expect(layout.MIN_FONT_SIZE_RATIO).toBe(0.03);
  });

  test('1920x1080 における文字サイズの下限が 32px である', () => {
    expect(layout.minimumFontSize(CANVAS)).toBe(32);
  });

  test('1920x1080 における安全領域が上下左右 5% の内側である', () => {
    expect(layout.safeArea(CANVAS)).toEqual({
      left: 96,
      top: 54,
      right: 1824,
      bottom: 1026,
    });
  });
});

describe('I1 安全余白のはみ出し', () => {
  test('安全領域の内側に収まる要素を不適合としない', () => {
    const findings = layout.inspect(
      frame([{ name: '見出し', rect: { x: 200, y: 200, width: 800, height: 80 } }]),
    );

    expect(findings).toEqual([]);
  });

  test('右端が安全領域を越える要素を I1 として報告する', () => {
    const findings = layout.inspect(
      frame([
        { name: '長い行', rect: { x: 1000, y: 200, width: 900, height: 80 } },
      ]),
    );

    expect(codesOf(findings)).toEqual(['I1']);
    expect(findings[0].element).toBe('長い行');
    expect(findings[0].detail).toMatch(/76/);
  });

  test('上端が安全領域を越える要素を I1 として報告する', () => {
    const findings = layout.inspect(
      frame([{ name: 'ヘッダ', rect: { x: 200, y: 20, width: 400, height: 60 } }]),
    );

    expect(codesOf(findings)).toEqual(['I1']);
  });
});

describe('I2 親要素の内寸からの欠け', () => {
  // 2026-08-09 の実行で P9 まで漏れた1件目の再現。
  // 端末枠の内寸の下端を 26px 超えた選択肢の行が、HUD 行に重なって欠けた。
  const terminalFrame = () =>
    frame([
      {
        name: '端末枠',
        rect: { x: 160, y: 180, width: 1600, height: 660 },
        padding: 24,
      },
      {
        name: '選択肢の行',
        rect: { x: 200, y: 204, width: 1400, height: 638 },
        parent: '端末枠',
        text: '2. いいえ',
        fontSize: 34,
      },
    ]);

  test('端末枠の内寸を 26px 超える行を I2 として報告する', () => {
    const findings = layout.inspect(terminalFrame());

    expect(codesOf(findings)).toEqual(['I2']);
    expect(findings[0].element).toBe('選択肢の行');
    expect(findings[0].detail).toMatch(/26/);
  });

  test('内寸に収まる行を不適合としない', () => {
    const findings = layout.inspect(
      frame([
        {
          name: '端末枠',
          rect: { x: 160, y: 180, width: 1600, height: 660 },
          padding: 24,
        },
        {
          name: '選択肢の行',
          rect: { x: 200, y: 204, width: 1400, height: 612 },
          parent: '端末枠',
          text: '2. いいえ',
          fontSize: 34,
        },
      ]),
    );

    expect(findings).toEqual([]);
  });

  test('存在しない親を指す要素は例外を送出する', () => {
    expect(() =>
      layout.inspect(
        frame([
          {
            name: '行',
            rect: { x: 200, y: 200, width: 100, height: 40 },
            parent: '無い枠',
          },
        ]),
      ),
    ).toThrow(/無い枠/);
  });
});

describe('I3 文字サイズの下限', () => {
  // 2026-08-09 の実行で P9 まで漏れた2件目の再現。
  // HUD ラベルと端末ヘッダの作業ディレクトリ表示が 30px だった。
  test('30px のラベルを I3 として報告する', () => {
    const findings = layout.inspect(
      frame([
        {
          name: 'HUD ラベル',
          rect: { x: 200, y: 940, width: 400, height: 36 },
          text: '承認待ち',
          fontSize: 30,
        },
      ]),
    );

    expect(codesOf(findings)).toEqual(['I3']);
    expect(findings[0].element).toBe('HUD ラベル');
    expect(findings[0].detail).toMatch(/30/);
    expect(findings[0].detail).toMatch(/32/);
  });

  test('32px のラベルを不適合としない', () => {
    const findings = layout.inspect(
      frame([
        {
          name: 'HUD ラベル',
          rect: { x: 200, y: 940, width: 400, height: 36 },
          text: '承認待ち',
          fontSize: 32,
        },
      ]),
    );

    expect(findings).toEqual([]);
  });

  test('文言を持つ要素に文字サイズが無い場合は例外を送出する', () => {
    expect(() =>
      layout.inspect(
        frame([
          {
            name: 'ラベル',
            rect: { x: 200, y: 200, width: 400, height: 36 },
            text: '承認待ち',
          },
        ]),
      ),
    ).toThrow(/ラベル/);
  });
});

describe('検査の入力の検証', () => {
  test('描画矩形を持たない要素は例外を送出する', () => {
    expect(() => layout.inspect(frame([{ name: '枠' }]))).toThrow(/枠/);
  });

  test('矩形の値が数値でない場合は例外を送出する', () => {
    expect(() =>
      layout.inspect(
        frame([{ name: '枠', rect: { x: '0', y: 0, width: 10, height: 10 } }]),
      ),
    ).toThrow(/枠/);
  });

  test('画面の大きさを持たないフレームは例外を送出する', () => {
    expect(() => layout.inspect({ name: 'S01', elements: [] })).toThrow(/S01/);
  });
});

describe('複数シーンの検査', () => {
  test('シーンごとの不適合をまとめて報告する', () => {
    const findings = layout.inspectFrames([
      frame([
        {
          name: 'HUD ラベル',
          rect: { x: 200, y: 940, width: 400, height: 36 },
          text: '承認待ち',
          fontSize: 30,
        },
      ]),
      {
        name: 'S08',
        canvas: CANVAS,
        elements: [
          { name: '図', rect: { x: 1000, y: 200, width: 900, height: 80 } },
        ],
      },
    ]);

    expect(codesOf(findings)).toEqual(['I3', 'I1']);
    expect(findings[0].frame).toBe('S07');
    expect(findings[1].frame).toBe('S08');
  });

  test('すべて適合する場合は空を返す', () => {
    expect(
      layout.inspectFrames([
        frame([
          { name: '見出し', rect: { x: 200, y: 200, width: 800, height: 80 } },
        ]),
      ]),
    ).toEqual([]);
  });
});

describe('SKILL.md P8 の検査手順', () => {
  const section = () =>
    skill.extractSection(p8(), '### 画面内収まりの検査');

  test('検査の節がレンダリングの前にある', () => {
    expect(() => section()).not.toThrow();

    const lines = p8().split('\n');
    const indexOf = (heading) => lines.findIndex((line) => line === heading);

    expect(indexOf('### 画面内収まりの検査')).toBeLessThan(
      indexOf('### レンダリング'),
    );
  });

  test('安全余白のはみ出しの検査が書かれている', () => {
    expect(section()).toMatch(/安全余白/);
    expect(section()).toMatch(/5%/);
  });

  test('親要素の内寸を超えて欠ける要素の検査が書かれている', () => {
    expect(section()).toMatch(/内寸/);
    expect(section()).toMatch(/欠ける/);
  });

  test('文字サイズの下限の検査が書かれている', () => {
    expect(section()).toMatch(/3%/);
    expect(section()).toMatch(/32px/);
  });

  test('不適合を検出した場合はレンダリングへ進まないことが書かれている', () => {
    expect(section()).toMatch(/レンダリングへ進まない/);
    expect(section()).toMatch(/修正/);
  });

  test('機械検査の通過が R1・R2 の適合判定を代替しないことが書かれている', () => {
    expect(section()).toMatch(/R1/);
    expect(section()).toMatch(/R2/);
    expect(section()).toMatch(/(代替しない|見なさない)/);
  });

  test('P8 の完了条件に検査の通過が含まれている', () => {
    expect(p8()).toMatch(/完了条件[^\n]*検査/);
  });
});

describe('SKILL.md P9 との関係', () => {
  test('R1・R2 の判定が目視のままであることが書かれている', () => {
    expect(p9()).toMatch(/R1/);
    expect(p9()).toMatch(/R2/);
    expect(p9()).toMatch(/P8 の(機械)?検査/);
  });
});
