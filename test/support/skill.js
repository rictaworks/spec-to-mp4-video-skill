/**
 * SKILL.md の読み込みとフロントマターの分解を提供する共通処理。
 *
 * 方針:
 *   - 値が取得できない場合に既定値で握りつぶさない。原因が特定できる例外を送出する
 *   - メッセージは messages.json に分離し、このファイルへ直接埋め込まない
 *   - 入口・分岐・出口をトレースできるようにする（環境変数 SKILL_SUPPORT_TRACE=1 で出力）
 */
const fs = require('node:fs');
const path = require('node:path');
const yaml = require('js-yaml');

const messages = require('./messages.json');

const REPO_ROOT = path.resolve(__dirname, '..', '..');
const SKILL_FILENAME = 'SKILL.md';
const FRONTMATTER_DELIMITER = '---';
const TRACE_ENV_NAME = 'SKILL_SUPPORT_TRACE';

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

  process.stderr.write(`[skill-support] ${event} ${JSON.stringify(detail)}\n`);
}

/** リポジトリルートの SKILL.md の絶対パスを返す */
function skillPath() {
  const resolved = path.join(REPO_ROOT, SKILL_FILENAME);
  trace('skillPath', { resolved });
  return resolved;
}

/** SKILL.md を読み込む。存在しない場合はパスを含む例外を送出する */
function readSkill(filePath = skillPath()) {
  trace('readSkill:enter', { filePath });

  if (!fs.existsSync(filePath)) {
    throw new Error(format(messages.skillFileNotFound, { path: filePath }));
  }

  let raw;

  try {
    raw = fs.readFileSync(filePath, 'utf8');
  } catch (cause) {
    throw new Error(
      format(messages.skillFileUnreadable, {
        path: filePath,
        reason: cause.message,
      }),
      { cause },
    );
  }

  trace('readSkill:exit', { filePath, length: raw.length });
  return raw;
}

/** フロントマターの終端行の位置を返す。見つからない場合は例外を送出する */
function findFrontmatterEnd(lines) {
  for (let index = 1; index < lines.length; index += 1) {
    if (lines[index].trim() === FRONTMATTER_DELIMITER) {
      return index;
    }
  }

  throw new Error(
    format(messages.frontmatterUnterminated, {
      delimiter: FRONTMATTER_DELIMITER,
    }),
  );
}

/** フロントマター部分の YAML を解釈する */
function parseFrontmatter(source) {
  let parsed;

  try {
    parsed = yaml.load(source);
  } catch (cause) {
    throw new Error(
      format(messages.frontmatterInvalidYaml, { reason: cause.message }),
      { cause },
    );
  }

  if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error(
      format(messages.frontmatterNotMapping, { actual: typeof parsed }),
    );
  }

  return parsed;
}

/** SKILL.md の原文をフロントマターと本文へ分解する */
function parseSkill(raw) {
  trace('parseSkill:enter', { length: raw.length });

  const lines = raw.split('\n');

  if (lines[0].trim() !== FRONTMATTER_DELIMITER) {
    throw new Error(
      format(messages.frontmatterMissing, { delimiter: FRONTMATTER_DELIMITER }),
    );
  }

  const endIndex = findFrontmatterEnd(lines);
  const frontmatter = parseFrontmatter(lines.slice(1, endIndex).join('\n'));
  const bodyLines = lines.slice(endIndex + 1);

  trace('parseSkill:exit', {
    keys: Object.keys(frontmatter),
    bodyLineCount: bodyLines.length,
  });

  return {
    frontmatter,
    body: bodyLines.join('\n'),
    bodyLines,
  };
}

/** 見出し行の階層（先頭の # の数）を返す */
function headingLevel(heading) {
  const matched = heading.match(/^(#+)\s/);

  if (matched === null) {
    throw new Error(format(messages.headingLevelUnknown, { heading }));
  }

  return matched[1].length;
}

/**
 * 本文から見出し1件分の範囲を切り出す。
 * 同じ階層以上の次の見出しの手前までを返す。見出しが無い場合は例外を送出する。
 */
function extractSection(body, heading) {
  trace('extractSection:enter', { heading });

  const lines = body.split('\n');
  const start = lines.findIndex((line) => line.trim() === heading);

  if (start === -1) {
    throw new Error(format(messages.sectionNotFound, { heading }));
  }

  const level = headingLevel(heading);

  for (let index = start + 1; index < lines.length; index += 1) {
    const matched = lines[index].match(/^(#+)\s/);

    if (matched !== null && matched[1].length <= level) {
      trace('extractSection:exit', { heading, end: index });
      return lines.slice(start, index).join('\n').trimEnd();
    }
  }

  trace('extractSection:exit', { heading, end: lines.length });
  return lines.slice(start).join('\n').trimEnd();
}

/** SKILL.md を読み込み、分解した結果を返す */
function loadSkill(filePath = skillPath()) {
  const raw = readSkill(filePath);
  const parsed = parseSkill(raw);

  return {
    ...parsed,
    filePath,
    raw,
    lineCount: raw.split('\n').length,
  };
}

module.exports = {
  FRONTMATTER_DELIMITER,
  REPO_ROOT,
  SKILL_FILENAME,
  extractSection,
  findFrontmatterEnd,
  headingLevel,
  loadSkill,
  parseFrontmatter,
  parseSkill,
  readSkill,
  skillPath,
};
