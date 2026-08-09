/**
 * 画面内収まりの機械検査（SKILL.md P8「画面内収まりの検査」）の参照実装。
 *
 * SKILL.md はデモ版の構成上 scripts を持たないため、本文には検査の規則だけを書く。
 * この実装は、その規則がテストで再現できる形になっていることを担保するために置く。
 *
 * 検査する不適合:
 *   I1 描画矩形が上下左右 5% の安全余白の外へ出ている
 *   I2 親要素の内寸を超えて配置され、視覚的に欠ける
 *   I3 算出フォントサイズが縦解像度の 3%（1920x1080 で 32px）を下回る
 *
 * 方針:
 *   - 判定できない入力を既定値で埋めない。原因が特定できる例外を送出する
 *   - メッセージは messages.json に分離し、このファイルへ直接埋め込まない
 *   - 入口・分岐・出口をトレースできるようにする（環境変数 SKILL_SUPPORT_TRACE=1 で出力）
 */
const messages = require('./messages.json');

const SAFE_MARGIN_RATIO = 0.05;
const MIN_FONT_SIZE_RATIO = 0.03;
const RECT_KEYS = ['x', 'y', 'width', 'height'];
const TRACE_ENV_NAME = 'SKILL_SUPPORT_TRACE';

const CODE_SAFE_AREA = 'I1';
const CODE_CONTAINMENT = 'I2';
const CODE_FONT_SIZE = 'I3';

const EDGE_LEFT = '左';
const EDGE_TOP = '上';
const EDGE_RIGHT = '右';
const EDGE_BOTTOM = '下';

/** メッセージ雛形の {key} を値で置換する */
function format(template, values) {
  return Object.entries(values).reduce(
    (text, [key, value]) => text.split(`{${key}}`).join(String(value)),
    template,
  );
}

/** 実行経路を再構成できるようにトレースを出力する */
function trace(event, detail) {
  if (process.env[TRACE_ENV_NAME] !== '1') {
    return;
  }

  process.stderr.write(`[layout-inspection] ${event} ${JSON.stringify(detail)}\n`);
}

/** 値が有限の数値であるかを返す */
function isFiniteNumber(value) {
  return typeof value === 'number' && Number.isFinite(value);
}

/** フレームの画面の大きさを取り出す。欠けている場合は例外を送出する */
function canvasOf(frame) {
  const canvas = frame.canvas;

  if (
    canvas === undefined ||
    canvas === null ||
    !isFiniteNumber(canvas.width) ||
    !isFiniteNumber(canvas.height)
  ) {
    throw new Error(format(messages.frameCanvasMissing, { frame: frame.name }));
  }

  return canvas;
}

/** フレームの要素の配列を取り出す。欠けている場合は例外を送出する */
function elementsOf(frame) {
  if (!Array.isArray(frame.elements)) {
    throw new Error(
      format(messages.frameElementsMissing, { frame: frame.name }),
    );
  }

  return frame.elements;
}

/** 安全余白の内側の領域を返す */
function safeArea(canvas) {
  const horizontal = canvas.width * SAFE_MARGIN_RATIO;
  const vertical = canvas.height * SAFE_MARGIN_RATIO;

  return {
    left: horizontal,
    top: vertical,
    right: canvas.width - horizontal,
    bottom: canvas.height - vertical,
  };
}

/** 文字サイズの下限を返す。縦解像度の 3% の小数点以下を切り捨てる */
function minimumFontSize(canvas) {
  return Math.floor(canvas.height * MIN_FONT_SIZE_RATIO);
}

/** 要素の描画矩形を検証して返す */
function rectOf(element) {
  const rect = element.rect;

  if (rect === undefined || rect === null) {
    throw new Error(
      format(messages.elementRectMissing, { element: element.name }),
    );
  }

  RECT_KEYS.forEach((key) => {
    if (!isFiniteNumber(rect[key])) {
      throw new Error(
        format(messages.elementRectInvalid, {
          element: element.name,
          key,
          value: rect[key],
        }),
      );
    }
  });

  return rect;
}

/** 矩形の四辺の座標を返す */
function edgesOf(rect) {
  return {
    left: rect.x,
    top: rect.y,
    right: rect.x + rect.width,
    bottom: rect.y + rect.height,
  };
}

/** 要素に名称があることを確認する */
function assertName(element, frame, index) {
  if (typeof element.name !== 'string' || element.name.length === 0) {
    throw new Error(
      format(messages.elementNameMissing, { frame: frame.name, index }),
    );
  }
}

/** 領域からのはみ出し量を、辺の名称とともに返す。収まっている場合は null を返す */
function overflowOf(edges, area) {
  const overflows = [
    { edge: EDGE_LEFT, amount: area.left - edges.left },
    { edge: EDGE_TOP, amount: area.top - edges.top },
    { edge: EDGE_RIGHT, amount: edges.right - area.right },
    { edge: EDGE_BOTTOM, amount: edges.bottom - area.bottom },
  ].filter((candidate) => candidate.amount > 0);

  if (overflows.length === 0) {
    return null;
  }

  return overflows.reduce((largest, candidate) =>
    candidate.amount > largest.amount ? candidate : largest,
  );
}

/** I1 安全余白のはみ出しを判定する */
function inspectSafeArea(element, canvas) {
  const overflow = overflowOf(edgesOf(rectOf(element)), safeArea(canvas));

  if (overflow === null) {
    return null;
  }

  return {
    code: CODE_SAFE_AREA,
    element: element.name,
    detail: format(messages.findingSafeArea, {
      overflow: overflow.amount,
      edge: overflow.edge,
    }),
  };
}

/** 親要素の内側の余白を取り出す。指定が無い場合は 0 とする */
function paddingOf(parent) {
  if (parent.padding === undefined) {
    return 0;
  }

  if (!isFiniteNumber(parent.padding) || parent.padding < 0) {
    throw new Error(
      format(messages.elementPaddingInvalid, {
        element: parent.name,
        value: parent.padding,
      }),
    );
  }

  return parent.padding;
}

/** 親要素の内寸の領域を返す */
function innerArea(parent) {
  const edges = edgesOf(rectOf(parent));
  const padding = paddingOf(parent);

  return {
    left: edges.left + padding,
    top: edges.top + padding,
    right: edges.right - padding,
    bottom: edges.bottom - padding,
  };
}

/** 名称から同じフレームの要素を引く。見つからない場合は例外を送出する */
function findParent(element, elements) {
  const parent = elements.find((candidate) => candidate.name === element.parent);

  if (parent === undefined) {
    throw new Error(
      format(messages.elementParentNotFound, {
        element: element.name,
        parent: element.parent,
      }),
    );
  }

  return parent;
}

/** I2 親要素の内寸からの欠けを判定する */
function inspectContainment(element, elements) {
  if (element.parent === undefined) {
    return null;
  }

  const parent = findParent(element, elements);
  const overflow = overflowOf(edgesOf(rectOf(element)), innerArea(parent));

  if (overflow === null) {
    return null;
  }

  return {
    code: CODE_CONTAINMENT,
    element: element.name,
    detail: format(messages.findingContainment, {
      parent: parent.name,
      overflow: overflow.amount,
      edge: overflow.edge,
    }),
  };
}

/** 文言を持つ要素の算出フォントサイズを検証して返す */
function fontSizeOf(element) {
  if (element.fontSize === undefined) {
    throw new Error(
      format(messages.elementFontSizeMissing, { element: element.name }),
    );
  }

  if (!isFiniteNumber(element.fontSize) || element.fontSize <= 0) {
    throw new Error(
      format(messages.elementFontSizeInvalid, {
        element: element.name,
        value: element.fontSize,
      }),
    );
  }

  return element.fontSize;
}

/** I3 文字サイズの下限を判定する */
function inspectFontSize(element, canvas) {
  if (typeof element.text !== 'string' || element.text.length === 0) {
    return null;
  }

  const actual = fontSizeOf(element);
  const minimum = minimumFontSize(canvas);

  if (actual >= minimum) {
    return null;
  }

  return {
    code: CODE_FONT_SIZE,
    element: element.name,
    detail: format(messages.findingFontSize, { actual, minimum }),
  };
}

/** 1件の要素を3種の検査に掛ける */
function inspectElement(element, elements, canvas) {
  return [
    inspectSafeArea(element, canvas),
    inspectContainment(element, elements),
    inspectFontSize(element, canvas),
  ].filter((finding) => finding !== null);
}

/** 1枚の代表フレームを検査し、不適合の一覧を返す */
function inspect(frame) {
  trace('inspect:enter', { frame: frame.name });

  const canvas = canvasOf(frame);
  const elements = elementsOf(frame);

  const findings = elements.flatMap((element, index) => {
    assertName(element, frame, index);
    return inspectElement(element, elements, canvas);
  });

  trace('inspect:exit', { frame: frame.name, findingCount: findings.length });

  return findings.map((finding) => ({ frame: frame.name, ...finding }));
}

/** 複数の代表フレームをまとめて検査する */
function inspectFrames(frames) {
  if (!Array.isArray(frames)) {
    throw new TypeError(format(messages.frameElementsMissing, { frame: frames }));
  }

  return frames.flatMap((frame) => inspect(frame));
}

module.exports = {
  CODE_CONTAINMENT,
  CODE_FONT_SIZE,
  CODE_SAFE_AREA,
  MIN_FONT_SIZE_RATIO,
  SAFE_MARGIN_RATIO,
  inspect,
  inspectFrames,
  minimumFontSize,
  safeArea,
};
