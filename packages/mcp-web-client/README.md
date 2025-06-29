# MCP Web客户端

一个现代化的Web界面，用于与MCP (Model Context Protocol) 服务器进行交互。

## 功能特点

- 🌐 **现代化Web界面** - 响应式设计，支持桌面端和移动端
- 🔌 **WebSocket连接** - 实时通信，低延迟
- 🛠️ **工具调用** - 支持调用服务器端工具
- 📂 **资源访问** - 读取服务器端资源
- 💡 **提示模板** - 获取和使用提示模板
- 📝 **指令解析** - 智能解析用户输入的指令
- 📊 **实时日志** - 查看操作日志和执行结果
- 🎨 **美观界面** - 现代化UI设计，用户体验友好

## 快速开始

### 1. 启动服务器

在项目根目录运行：

```bash
npm run web
```

### 2. 访问Web界面

在浏览器中打开：http://localhost:3000

### 3. 连接MCP服务器

1. 点击右上角的"连接服务器"按钮
2. 确认服务器地址：`ws://localhost:8080`
3. 点击"连接"按钮

### 4. 开始使用

连接成功后，您可以输入指令与MCP服务器交互。

## 指令示例

```bash
# 计算器
calculator 2+3*4

# 获取时间
current_time Asia/Shanghai

# 生成随机数
random_number min=1 max=100

# 读取系统信息
resource:system://info

# 获取代码生成提示
prompt:code-generator language=JavaScript task=排序算法
```

## 技术栈

- **前端**: 原生HTML/CSS/JavaScript
- **后端**: Node.js + WebSocket
- **协议**: MCP (Model Context Protocol)

更多详细信息请参见项目根目录的README.md文件。 