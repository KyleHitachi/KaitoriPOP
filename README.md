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

- Excel / CSV の読み込み
- シートごとのカード一覧生成
- ドラッグ&ドロップでの並び替え
- カード単位の価格・セット表記の上書き
- タイトル、CTA、ロゴ、更新日付、フッターの調整
- PNG 書き出し

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

サンプルは [sample-buylist.csv](/Users/KH1TA/Documents/KaitoriPOP/sample-buylist.csv) にあります。

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

## GitHub へ公開する流れ

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin <YOUR_GITHUB_REPO_URL>
git push -u origin main
```

