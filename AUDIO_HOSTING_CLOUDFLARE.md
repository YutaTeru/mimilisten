# Cloudflareで音源を配信する方針

## 結論

音源はGitHubに入れず、Cloudflare側に置く方針でよいです。大量のMP3/WAVはリポジトリを重くしやすく、スマホアプリ更新のたびに音源も抱える構成は運用しにくくなります。

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

実アップロード前に、このPCでWranglerへログインしておきます。

```powershell
npx.cmd --yes wrangler login
```

アップロードする場合だけ `--upload` を付けます。

```powershell
powershell -ExecutionPolicy Bypass -File tools\sync-audio-to-cloudflare.ps1 -PublicBaseUrl https://<your-r2-dev-url> -Upload
```

アップロード後、JSONを書き換える前に公開URLを検証します。

```powershell
powershell -ExecutionPolicy Bypass -File tools\verify-audio-cloudflare.ps1
```

JSONの音源URLもCloudflare URLへ切り替える場合:

```powershell
powershell -ExecutionPolicy Bypass -File tools\sync-audio-to-cloudflare.ps1 -PublicBaseUrl https://<your-r2-dev-url> -UpdateJson
```

一度にバケット作成、CORS設定、アップロードまで行う場合:

```powershell
powershell -ExecutionPolicy Bypass -File tools\sync-audio-to-cloudflare.ps1 -SetupBucket -EnableR2DevUrl -SetCors -PublicBaseUrl https://<your-r2-dev-url> -Upload
```

注意: `--upload` を付けない限り、Cloudflareには何も作成・送信しません。バケット作成やCORS設定もドライラン表示だけになります。
また、`--upload` / `-Upload` などCloudflareへ実際に反映する操作は、Wranglerにログインしていない場合は送信前に止まります。

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
