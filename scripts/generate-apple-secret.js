const jwt = require('jsonwebtoken');
const fs = require('fs');

// ================= 配置区域 =================
// 1. 从 Apple Developer 下载的 .p8 文件路径 (例如: './AuthKey_ABC123.p8')
const PRIVATE_KEY_PATH = './AuthKey_XXXXXXXXXX.p8';

// 2. 你的 Team ID (在 Apple Developer 右上角可以看到，例如: 'A1B2C3D4E5')
const TEAM_ID = 'YOUR_TEAM_ID';

// 3. 你的 Key ID (生成 .p8 文件时获得的 ID，例如: 'ABC1234567')
const KEY_ID = 'YOUR_KEY_ID';

// 4. 你的 Client ID (Services ID) (例如: 'com.example.app.service')
//    注意：这必须是在 Apple Developer > Identifiers > Services IDs 中创建的 ID
const CLIENT_ID = 'com.example.app.service';
// ===========================================

try {
    if (PRIVATE_KEY_PATH.includes('XXXXXXXXXX')) {
        console.error('❌ 错误：请先在脚本中配置 PRIVATE_KEY_PATH, TEAM_ID, KEY_ID 和 CLIENT_ID');
        process.exit(1);
    }

    const privateKey = fs.readFileSync(PRIVATE_KEY_PATH);

    const token = jwt.sign({}, privateKey, {
        algorithm: 'ES256',
        expiresIn: '180d', // 6个月有效期 (Apple 最大允许 6 个月)
        audience: 'https://appleid.apple.com',
        issuer: TEAM_ID,
        subject: CLIENT_ID,
        keyid: KEY_ID,
    });

    console.log('\n✅ Apple Secret Key (JWT) 生成成功！\n');
    console.log('请复制下面的字符串粘贴到 Supabase 的 "Secret Key" 输入框中：\n');
    console.log(token);
    console.log('\n⚠️ 注意：此 Key 有效期为 6 个月。6 个月后需要重新生成并在 Supabase 更新。');

} catch (e) {
    if (e.code === 'ENOENT') {
        console.error(`❌ 错误：找不到私钥文件 "${PRIVATE_KEY_PATH}"`);
    } else if (e.code === 'MODULE_NOT_FOUND') {
        console.error('❌ 错误：缺少依赖库。请运行 "npm install jsonwebtoken" 安装依赖。');
    } else {
        console.error('❌ 未知错误:', e.message);
    }
}
