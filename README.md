# GDUT-Schedule-ng

功能：

- 全自动登录 SSO 并对接教务系统登录
- 爬取课表
- 生成 iCalendar 文件

现已支持部署至 Cloudflare Workers 等边缘计算服务作为 middleware 使用。

## 用法

### 本地部署：

1. 下载 Node.js 并安装
2. Clone 此代码库
3. `npm install`
4. `node index.js`

完成后请访问 `http://127.0.0.1/generated_学号_学年学期代码.ics?password=密码`

学年学期代码格式示例：`202102`（2021学年第二学期）

### Serveless 部署

1. 注册/登录 Cloudflare 账户
2. 创建 Cloudflare Workers
3. 把 `worker.js` 文件中的代码粘贴进去

完成后请访问 `https://你的域名/?username=学号&password=密码&xnxqdm=学年学期代码`
