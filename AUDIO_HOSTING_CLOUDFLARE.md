# Cloudflareで音源を配信する方針

## 結論

音源はGitHubに入れず、Cloudflare側に置く方針でよいです。大量のMP3/WAVはリポジトリを重くしやすく、スマホアプリ更新のたびに音源も抱える構成は運用しにくくなります。

## 無料運用を守るための前提

コード側だけで「絶対に課金されない」と保証することはできません。Cloudflareの料金は、アカウントのプラン、R2の保存容量、読み取り回数、転送量、将来の設定変更に左右されます。

そのため、このリポジトリでは次の安全策にしています。

- 標準実行はドライランのみ。`-Upload` を付けない限りCloudflareには送信しない。
- `-Upload`、`-SetupBucket`、`-EnableR2DevUrl`、`-SetCors` はWranglerログイン確認後だけ動く。
- 標準で `MaxMB=100`、`MaxFiles=200` の上限をかける。
- 音源ファイル本体はGitHubに入れない。
- 最初は少量でテストし、Cloudflareダッシュボードで使用量を確認してから増やす。

本当に無料枠内で運用するには、Cloudflare側でFreeプラン、R2使用量、課金アラート、不要な有料機能が有効になっていないことを確認してください。

## 推奨構成

- アプリ本体: GitHub `YutaTeru/mimilisten`
- Web配信: Cloudflare Pages
- 音源配信: Cloudflare R2 または別の公開CDN
- アプリ内データ: `data/questions.json` と `data/long-listening.json`

## 今後の同期コマンド

音源は `C:\Users\OwnerPC\Desktop\音源集` を優先して拾います。アプリのJSONに書かれている音源だけを対象にするので、`q001.mp3` などの重複ファイルやログは入りません。

まずは必ずドライランします。

```powershell
powershell -ExecutionPolicy Bypass -File tools\sync-audio-to-cloudflare.ps1 -PublicBaseUrl https://<your-r2-dev-url>
```

Cloudflareへ反映できる状態か、先に診断できます。

```powershell
powershell -ExecutionPolicy Bypass -File tools\check-audio-cloudflare-ready.ps1 -PublicBaseUrl https://<your-r2-dev-url>
```

実アップロード直前は、ログインとURLも必須として診断します。

```powershell
powershell -ExecutionPolicy Bypass -File tools\check-audio-cloudflare-ready.ps1 -PublicBaseUrl https://<your-r2-dev-url> -RequireLogin -RequirePublicBaseUrl
```

最初の接続テストでは、さらに小さく制限して確認できます。

```powershell
powershell -ExecutionPolicy Bypass -File tools\sync-audio-to-cloudflare.ps1 -PublicBaseUrl https://<your-r2-dev-url> -MaxFiles 20 -MaxMB 20
```

実アップロード前に、このPCでWranglerへログインしておきます。

```powershell
npx.cmd --yes wrangler login
```

Cloudflareへ初めて送る時は、まず3件だけに絞ると安全です。

```powershell
powershell -ExecutionPolicy Bypass -File tools\sync-audio-to-cloudflare.ps1 -PublicBaseUrl https://<your-r2-dev-url> -LimitFiles 3 -MaxFiles 3 -MaxMB 5 -Upload
```

3件だけアップロードして、その3件だけアプリのJSONも切り替える場合:

```powershell
powershell -ExecutionPolicy Bypass -File tools\sync-audio-to-cloudflare.ps1 -PublicBaseUrl https://<your-r2-dev-url> -LimitFiles 3 -MaxFiles 3 -MaxMB 5 -Upload -UpdateJson
```

アップロードする場合だけ `-Upload` を付けます。

```powershell
powershell -ExecutionPolicy Bypass -File tools\sync-audio-to-cloudflare.ps1 -PublicBaseUrl https://<your-r2-dev-url> -Upload
```

アップロード後、JSONを書き換える前に公開URLを検証します。

```powershell
powershell -ExecutionPolicy Bypass -File tools\verify-audio-cloudflare.ps1
```

JSONの音源URLもCloudflare URLへ切り替える場合:

```powershell
powershell -ExecutionPolicy Bypass -File tools\sync-audio-to-cloudflare.ps1 -PublicBaseUrl https://<your-r2-dev-url> -Upload -UpdateJson
```

既にCloudflareへアップロード済みで、JSONだけ後から切り替える場合は、確認済みの時だけ `-AllowJsonOnly` を使います。

```powershell
powershell -ExecutionPolicy Bypass -File tools\sync-audio-to-cloudflare.ps1 -PublicBaseUrl https://<your-r2-dev-url> -UpdateJson -AllowJsonOnly
```

一度にバケット作成、CORS設定、アップロードまで行う場合:

```powershell
powershell -ExecutionPolicy Bypass -File tools\sync-audio-to-cloudflare.ps1 -SetupBucket -EnableR2DevUrl -SetCors -PublicBaseUrl https://<your-r2-dev-url> -Upload
```

注意: `-Upload` を付けない限り、Cloudflareには何も作成・送信しません。バケット作成やCORS設定もドライラン表示だけになります。
また、`-Upload` などCloudflareへ実際に反映する操作は、Wranglerにログインしていない場合は送信前に止まります。

Cloudflare URLへ切り替えたあと、音源URLが実際に読めるか確認します。

```powershell
python tools\verify_audio_urls.py
```

基本の順番:

1. `wrangler login`
2. ドライラン
3. `-Upload`
4. manifest検証
5. `-UpdateJson`
6. アプリで再生確認

## データ側の変更方針

現在の音源パスは相対パスです。

```json
"audioUrl": "audio/chunks/round-2/chunk001.mp3"
```

本番ではCloudflareの公開URLにします。

```json
"audioUrl": "https://<your-audio-domain>/chunks/round-2/chunk001.mp3"
```

差し替える対象:

- `data/questions.json`
  - `audioUrl`
  - `sentenceAudioUrl`
  - `monologueAudioUrl`
- `data/long-listening.json`
  - `audioUrl`

## 注意

- 音源URLはHTTPSにする。
- ファイル名は変えない。
- `manifest.json` 的な音源一覧をCloudflare側にも残しておくと、あとで確認しやすい。
- TTS音源の利用規約は必ず確認する。
- R2は無料枠内で使う。スクリプトは標準で100MBを超えるアップロードを止める。
- テストは `r2.dev` でよいが、本番はカスタムドメインに切り替える。
