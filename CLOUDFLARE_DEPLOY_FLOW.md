# Cloudflare反映フロー

このアプリは、音源とアプリ本体を分けてCloudflareに反映します。

- 音源: Cloudflare R2 `mimilisten-audio`
- アプリ本体: Cloudflare Pages `mimilisten`
- ソース管理: GitHub `YutaTeru/mimilisten`

## いつもの反映コマンド

デスクトップの「音源集」とアプリのJSON/テキストをまとめてCloudflareへ反映する場合:

```powershell
powershell -ExecutionPolicy Bypass -File tools\publish-all-to-cloudflare.ps1
```

このコマンドで行うこと:

1. `C:\Users\OwnerPC\Desktop\音源集` から必要な音源を探す
2. R2へ音源をアップロードする
3. `data/questions.json` と `data/long-listening.json` の音源URLをCloudflare URLへ更新する
4. 公開URLで音源が読めるか検証する
5. `dist` にアプリ本体だけをまとめる
6. Cloudflare Pagesへデプロイする

## アプリだけ反映する場合

音源を増やしていないが、UIやテキストだけ変えた場合:

```powershell
powershell -ExecutionPolicy Bypass -File tools\deploy-app-to-cloudflare.ps1
```

## 音源だけ確認したい場合

```powershell
python tools\verify_audio_urls.py
```

## 公開URL

- アプリ: https://mimilisten.pages.dev/
- 音源ベースURL: https://pub-6e10f4d8b90b42c79b09bec4ee876a01.r2.dev

## 無料枠の確認場所

Cloudflare Dashboardで以下を確認します。

1. `R2 object storage`
2. `mimilisten-audio`
3. `Metrics`

音源が増えたときは、保存容量と読み取り回数をここで確認します。
