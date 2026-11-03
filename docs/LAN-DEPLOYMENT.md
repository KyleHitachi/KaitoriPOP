# KaitoriPOP LAN deployment

社内LANで1台のWindows PCからKaitoriPOPを配信するための手順です。

## 初回セットアップ

PowerShellでプロジェクト直下に移動します。

```powershell
cd C:\Users\shase\Documents\Codex\KaitoriPOP\KaitoriPOP
npm install
npm run build
.\scripts\windows\install-kaitoripop-task.ps1 -Port 3000
```

登録後、Windowsログオン時に本番サーバーが自動起動します。
`Access is denied` が出る場合は、PowerShellを「管理者として実行」して同じコマンドを実行してください。

自動起動せずに今だけ起動する場合は次を使います。

```powershell
.\scripts\windows\start-kaitoripop.ps1 -Port 3000
```

社内端末からは次の形式でアクセスします。

```text
http://<このPCのIPアドレス>:3000
```

このPC自身からは次で確認できます。

```text
http://localhost:3000
```

## 状態確認

```powershell
.\scripts\windows\status-kaitoripop.ps1 -Port 3000
```

ログは次に出ます。

```text
logs\kaitoripop.out.log
logs\kaitoripop.err.log
```

## 更新手順

GitHubから最新版を取り込み、再ビルドします。

```powershell
git pull --ff-only origin main
npm install
npm run build
```

その後、タスクスケジューラから `KaitoriPOP LAN Server` を再起動するか、PCを再ログオンします。

## 解除

```powershell
.\scripts\windows\uninstall-kaitoripop-task.ps1
```

## 注意

- PNG生成でPlaywright/Chromiumを使います。Chromiumが未導入の場合は `npx playwright install chromium` を実行してください。
- 社内の別PCからアクセスする場合、Windows Firewallでポート `3000` の受信許可が必要になる場合があります。
