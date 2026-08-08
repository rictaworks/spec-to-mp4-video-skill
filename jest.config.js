/**
 * Jest の設定。
 *
 * テストは CLAUDE.md「テストの配置と対象」に従い test/pr<PR番号>/ に置く。
 * 共通処理は test/support/ に置き、テストとして実行しない。
 */
module.exports = {
  testEnvironment: 'node',
  testMatch: ['<rootDir>/test/pr*/**/*.test.js'],
  verbose: true,
};
