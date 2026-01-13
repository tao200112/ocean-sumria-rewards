# Apple 登录配置指南 (Supabase)

您截图中的错误是因为填入了格式不正确的信息。
- **Client ID**: 不能包含空格，必须是 Apple Developer 后台创建的 `Services ID` (如 `com.yourcompany.app.service`)。
- **Secret Key**: 不能是短字符串，必须是一个生成的长字符串 (JWT)。

### 第一步：Apple Developer 后台设置

1.  登录 [Apple Developer Portal](https://developer.apple.com/account/).
2.  进入 **Certificates, Identifiers & Profiles**.
3.  **创建 App ID (如果还没有)**:
    *   点击 Identifiers 旁边的 `+`.
    *   选择 **App IDs** -> App.
    *   填写 Description (如 Ocean Samurai) 和 Bundle ID (如 `com.yourcompany.oceansamurai`).
    *   在下方 Capabilities 中勾选 **Sign In with Apple**.
    *   保存 (Register).
4.  **创建 Services ID (用于 Web/Supabase)**:
    *   再次点击 Identifiers 旁边的 `+`.
    *   选择 **Services IDs**.
    *   Identifier 输入类似于 `com.yourcompany.oceansamurai.service` (这才是你要填入 Supabase **Client ID** 的内容).
    *   Description 随便填.
    *   保存 (Register).
    *   **重要**: 保存后点击刚刚创建的 Services ID 进入编辑模式。
    *   勾选 **Sign In with Apple**, 点击旁边的 Configure.
    *   **Primary App ID**: 选择刚才创建的 App ID.
    *   **Domains and Subdomains**: 填入 `ocean-sumria-rewards.vercel.app` (不需要 https://).
    *   **Return URLs**: 填入 Supabase 面板上显示的 Callback URL (例如 `https://vuhllswkulcllrealkgq.supabase.co/auth/v1/callback`).
    *   保存 -> Continue -> Save.
5.  **创建 Private Key (.p8 文件)**:
    *   进入 **Keys**.
    *   点击 `+`.
    *   Key Name 随便填.
    *   勾选 **Sign In with Apple**.
    *   点击 Configure, 选择关联的 Primary App ID.
    *   Save -> Download. **保存好这个 `.p8` 文件，只能下载一次！**
    *   记下页面上的 **Key ID** 和右上角的 **Team ID**.

### 第二步：生成 Secret Key (JWT)

Supabase 需要一个 JWT 字符串作为 Secret Key。我为您准备了一个生成脚本。

1.  将下载的 `.p8` 文件放到项目根目录或 `scripts/` 目录下。
2.  打开 `scripts/generate-apple-secret.js` 文件。
3.  修改顶部的配置信息：
    ```javascript
    const PRIVATE_KEY_PATH = './你的文件名.p8'; 
    const TEAM_ID = '你的TeamID'; 
    const KEY_ID = '你的KeyID'; 
    const CLIENT_ID = '你的ServicesID'; // 例如 com.yourcompany.oceansamurai.service
    ```
4.  在终端运行脚本：
    ```bash
    npm install jsonwebtoken
    node scripts/generate-apple-secret.js
    ```
5.  脚本会输出一长串字符（以 `eyJ` 开头），这就是您的 **Secret Key**。

### 第三步：Supabase 配置

回到 Supabase Dashboard -> Authentication -> Providers -> Apple:

1.  **Client ID**: 填入您的 Services ID (例如 `com.yourcompany.oceansamurai.service`)。
2.  **Secret Key**: 填入上一步脚本生成的长字符串。
3.  **启用**: 打开 Enable Sign in with Apple 开关。
4.  点击 Save。

### 前端代码
前端代码已经准备好。只要 Supabase 配置正确，点击登录页面的 "Continue with Apple" 即可跳转。
