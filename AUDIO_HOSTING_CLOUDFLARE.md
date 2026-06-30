# Cloudflareで音源を配信する方針

## 結論

音源はGitHubに入れず、Cloudflare側に置く方針でよいです。大量のMP3/WAVはリポジトリを重くしやすく、スマホアプリ更新のたびに音源も抱える構成は運用しにくくなります。

## 推奨構成

- アプリ本体: GitHub `YutaTeru/mimilisten`
- Web配信: Cloudflare Pages
- 音源配信: Cloudflare R2 または別の公開CDN
- アプリ内データ: `data/questions.json` と `data/long-listening.json`

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
