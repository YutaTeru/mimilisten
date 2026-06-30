# 聞こえない英語ドリル MVP

英語の音変化に気づくための、スマホ向けリスニングドリルです。

## 使うデータ

- 音源: `audio/`
- 問題データ: `data/questions.json`
- 出題対象: `reviewStatus` が `approved` の問題だけ

`reviewStatus` を `rejected` にすると、音源ファイルが残っていてもアプリには出ません。

## 起動

このフォルダーで以下を実行します。

```powershell
python -m http.server 8787
```

ブラウザで開きます。

```text
http://127.0.0.1:8787/
```

## MVPで入っている機能

- 今日の5問
- 似た選択肢4択
- 通常再生 / ゆっくり再生
- 正誤判定
- 見える化、カナ補助、ポイント表示
- 文音源での再確認
- localStorage による苦手タグ保存
- 苦手だけ復習
- 音変化タイプ一覧
- 講師レビュー画面
- 採用 / 保留 / 不採用の切り替え
- 練習モード
- カタカナ予測
- 全体の再生速度設定
- 長めモノローグ練習

## 問題を大量生成する流れ

問題候補は `data/question-seeds.json` に追加します。

```powershell
python tools\generate_questions.py
```

このコマンドで `data/questions.json` を作り直します。

`question-seeds.json` では、正解1つと誤答3つを持たせます。誤答には必ず `reason` と `weaknessTag` を入れます。

練習モード用に、必要に応じて以下も入れます。

- `kanaChoices`
- `answerKana`
- `practiceText`
- `sentenceText`
- `targetChunk`
- `highlightChunks`

## 長めモノローグ

長め音源は以下で管理します。

- データ: `data/long-listening.json`
- 音源: `audio/long-monologues/round-X/`

長めモノローグは、既存モノローグを単純につなぐのではなく、音変化が多く入る新規原稿として作ります。

## 講師レビュー

ホームの「講師レビュー」から、問題ごとに採用 / 保留 / 不採用を切り替えられます。

- 採用: アプリに出る
- 保留: アプリに出ない
- 不採用: アプリに出ない

レビュー結果はこの端末のブラウザに保存されます。音源ファイルは消えません。

「レビュー結果を書き出す」から、上書き結果をJSONとして保存できます。
