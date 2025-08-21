# 家族カレンダーアプリ

スマートフォン最適化された家族向けカレンダーアプリです。

## 🌟 特徴

- 📱 **スマホ最適化**: タッチ操作に完全対応
- 🔄 **リアルタイム同期**: Firebase使用で複数端末間の同期
- 👥 **家族メンバー管理**: 担当者別の色分け表示
- 🎨 **モダンUI**: Material Design風の美しいインターface
- 📱 **PWA対応**: ホーム画面に追加してアプリのように使用可能
- 🌙 **ダークモード**: システム設定に自動対応

## 🚀 機能

### カレンダー機能
- 月表示カレンダー
- 今日の日付のハイライト
- 前月/次月の簡単ナビゲーション

### イベント管理
- イベントの追加・編集・削除
- 日時、説明、担当者の詳細設定
- イベント詳細の表示

### 同期機能
- Firebase Realtime Databaseによるリアルタイム同期
- オフライン時のローカル保存
- オンライン復帰時の自動同期

### UI/UX
- タッチ操作最適化
- ハプティックフィードバック
- トースト通知
- レスポンシブデザイン

## 🛠 技術スタック

- **フロントエンド**: HTML5, CSS3, JavaScript (ES6+)
- **バックエンド**: Firebase Realtime Database
- **デザイン**: Material Design principles
- **デプロイ**: GitHub Pages

## 📦 セットアップ

### 1. クローン
```bash
git clone https://github.com/YOUR_USERNAME/family-calendar.git
cd family-calendar
```

### 2. Firebase設定
1. [Firebase Console](https://console.firebase.google.com/)でプロジェクト作成
2. Realtime Databaseを有効化
3. `script.js`のFirebase設定を更新:

```javascript
const firebaseConfig = {
    apiKey: "your-api-key",
    authDomain: "your-project.firebaseapp.com",
    databaseURL: "https://your-project-default-rtdb.firebaseio.com",
    projectId: "your-project-id"
};
```

### 3. デプロイ
- GitHub Pagesを使用する場合:
  1. GitHubリポジトリのSettings > Pages
  2. Source: Deploy from a branch
  3. Branch: main / (root)

## 💻 使用方法

### 基本操作
1. **イベント追加**: 日付をタップまたは右下の+ボタン
2. **イベント編集**: 既存イベントをタップ
3. **月移動**: ヘッダーの矢印ボタン

### 担当者設定
- けんじ: 青色で表示
- あい: ピンク色で表示  
- 二人: 紫色で表示

### 同期について
- 同じFirebaseプロジェクトに接続した全端末で自動同期
- オフライン時はローカルに保存
- オンライン復帰時に自動でサーバーと同期

## 📱 PWAとして使用

1. スマートフォンのブラウザでアクセス
2. ブラウザメニューから「ホーム画面に追加」
3. ネイティブアプリのように使用可能

## 🔧 カスタマイズ

### 担当者の変更
`index.html`, `style.css`, `script.js`の該当部分を編集:

```html
<!-- index.html -->
<option value="新しい名前">🆕 新しい名前</option>
```

```css
/* style.css */
.event.member-新しい名前 { background: #color; }
```

```javascript
// script.js
const memberEmojis = {
    '新しい名前': '🆕'
};
```

## 🤝 コントリビューション

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 ライセンス

MIT License - 詳細は[LICENSE](LICENSE)ファイルを参照

## 📞 サポート

問題やバグを見つけた場合は、[Issues](https://github.com/YOUR_USERNAME/family-calendar/issues)で報告してください。

---

❤️ **家族での使用を想定して作られたカレンダーアプリです。みなさんの日常がより便利になることを願っています！**