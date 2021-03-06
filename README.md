# GDUT-Schedule-ng

功能：

- 全自动登录 SSO 并对接教务系统登录
- 爬取课表
- 生成 iCalendar 文件

现已支持部署至 Cloudflare Workers 等边缘计算服务作为 middleware 使用。

## 用法

学年学期代码格式示例：`202102`（2021学年第二学期）

### 本地部署

1. 安装 [Deno](https://deno.land/#installation)
   - Windows 直接从 Releases 下载[最新版可执行文件](https://github.com/denoland/deno/releases/latest/download/deno-x86_64-pc-windows-msvc.zip)即可，无需安装。
2. Clone 此代码库
3. 打开代码库目录，把 Deno 可执行文件也复制进来，然后命令行执行 `./deno run --allow-net .\index.ts`

完成后请访问 `http://127.0.0.1:8080/generated_学号_学年学期代码.ics?password=密码`

**密码将不加密且明文传输**，仅在确保安全的局域网内使用。

### Serverless 部署

1. 注册/登录 Cloudflare 账户
2. 创建 Cloudflare Workers
3. 把 `worker.js` 文件中的代码粘贴进去

完成后请访问 `https://你的域名/generated_学号_学年学期代码.ics?password=密码`
