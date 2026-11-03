# KaitoriPOP

Excel / CSV から MTG の買取表を作成し、並び替えや表示調整をしたうえで PNG に書き出せる Next.js アプリです。

## 技術スタック

- Next.js 15
- React 19
- TypeScript
- Tailwind CSS 4
- Playwright
- `xlsx`
- `dnd-kit`

## 主な機能

- Excel / CSV の読み込み（シートごとに買取表を作成。カテゴリ順・POWER 9 行の自動並び替え）
- 36枚を超えたカードは「掲載外のカード」に残し、画面から入れ替え
- プレビューは PNG と同じ HTML を表示（見た目のずれなし）
- ドラッグ / キーボード（Alt+矢印）での並び替え、取り消し・やり直し（Ctrl+Z / Ctrl+Shift+Z）
- カード単位の価格・セット表記などの上書き（プレビューに「修正済み」の印）
- タイトル、CTA、ロゴ、更新日付、フッターの調整とプリセット保存
- 作業内容の自動保存と、作業ファイル（JSON）の保存・読み込み
- カード画像はサーバー側で並列取得・キャッシュ
- PNG 書き出し（1シート / 全シートを zip で一括）

## 入力フォーマット

ヘッダ名ベースの読み込みに対応しています。以下の列名を推奨します。

1. `No`
2. `日本語名`
3. `英語名`
4. `セット`
5. `言語`
6. `状態`
7. `JP価格`
8. `EN価格`
9. `カテゴリ`
10. `備考`
11. `画像URL`

旧フォーマットの固定列読み込みにも対応しています。

サンプルは [public/sample-buylist.csv](public/sample-buylist.csv) にあります（アプリの「サンプルCSVで試す」でも読み込めます）。

## セットアップ

```bash
npm install
npx playwright install chromium
npm run dev
```

## テスト

```bash
npm run test:unit
npm run lint
```
