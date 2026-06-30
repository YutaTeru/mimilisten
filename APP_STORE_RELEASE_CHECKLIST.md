# 聞こえない英語ドリル iOSリリース前チェック

このアプリは現時点では静的Webアプリです。iOSアプリとして出す前に、Xcode/Capacitorなどで包んだあとに下記を確認します。

## このアプリで今できていること

- ログインなし。デモアカウント不要。
- カメラ、マイク、通知などの権限は現状未使用。
- アプリアイコンは `assets/app-icon-1024.png` が 1024x1024、RGB、透過なし。
- Web manifest は `orientation: portrait` 設定済み。
- アプリ説明文は `index.html` と `manifest.webmanifest` に設定済み。

## iOS化したあとに必ず確認すること

1. `Info.plist` の権限文言
   - 現状は権限未使用なので追加不要。
   - 将来、通知、マイク、カメラ、写真などを使う場合は UsageDescription を必ず追加する。

2. App Store Connect の言語
   - 日本人向けなので日本語メタデータを用意する。
   - 海外表示も考える場合は英語メタデータも追加する。

3. iPad対応
   - 最初は iPhone 専用が安全。
   - iPad対応をONにするなら、iPad表示とiPad用スクリーンショットを必ず確認する。

4. Deployment Target
   - iOS 16以上を推奨。
   - 古すぎるiOS対応は表示崩れや音声再生不具合の原因になる。

5. Device Orientation
   - 基本は Portrait のみ。
   - Landscape をONにするなら横画面で全画面を確認する。

6. スクリーンショット
   - App Storeのスクリーンショットは、提出直前の実UIで撮り直す。
   - 古いUI、存在しない機能、実画面と違う見た目を載せない。

7. App Review Information
   - ログインなしで使えることを書く。
   - 何を学ぶアプリか、どのボタンから試せるかを英語で短く書く。
   - 可能なら短い操作動画を添付する。

## 音源の扱い

GitHubには音源を入れない方針です。音源は Cloudflare R2 などに置き、アプリ側の `audioUrl` / `sentenceAudioUrl` / `monologueAudioUrl` / `long-listening.json` の `audioUrl` を公開URLに向けます。

例:

```json
{
  "audioUrl": "https://audio.example.com/chunks/round-2/chunk001.mp3"
}
```

## App Review Notes の英語例

```text
This app helps Japanese learners practice English listening sound changes such as linking, reduction, assimilation, elision, flapping, and stress rhythm.

No login is required. Reviewers can tap "今日の5問を始める" to try the main quiz, or "練習モード" to view practice modes with visible explanations.

The app stores progress locally on the device only. It does not require camera, microphone, photo library, location, or notification permissions.
```

## リリース直前の最終確認

- 音声が実機で再生できる。
- 機内モードや通信不良時の見え方が破綻しない。
- すべてのApp Storeスクリーンショットが現UIと一致している。
- iPhone SE相当の小さい画面で文字が重ならない。
- 画面回転時に崩れない、または縦固定になっている。
- Cloudflare上の音源URLが403/404になっていない。
