# MCP Generator

> 一个集成的开发工具集，包含JavaScript代码生成器和MCP协议Web客户端

## 📋 项目概述

MCP Generator是一个综合性的开发工具集，提供两个主要功能：

1. **JavaScript代码生成器** - 基于模板快速生成各种类型的JavaScript代码
2. **MCP Web客户端** - 浏览器界面的Model Context Protocol (MCP)客户端

## 🏗️ 项目结构

```
mcp-generator/
├── packages/                   # 功能模块包
│   ├── code-generator/         # JavaScript代码生成器
│   │   ├── src/               # 源代码
│   │   │   ├── core/          # 核心模块
│   │   │   ├── ui/            # 用户界面
│   │   │   └── index.js       # 主入口
│   │   ├── templates/         # 代码模板
│   │   ├── examples/          # 使用示例
│   │   ├── bin/              # 命令行工具
│   │   └── package.json      # 包配置
│   └── mcp-web-client/        # MCP Web客户端
│       ├── public/           # 前端文件
│       │   ├── index.html    # 主页面
│       │   ├── app.js        # 应用逻辑
│       │   ├── style.css     # 样式文件
│       │   └── mcp-client.js # MCP客户端
│       ├── server/           # 服务器端
│       │   └── server.js     # 服务器实现
│       ├── start.js          # 启动脚本
│       └── package.json      # 包配置
├── shared/                    # 共享模块
│   └── mcp/                  # MCP协议实现
│       ├── server.js         # MCP服务器
│       ├── client.js         # MCP客户端
│       ├── transport.js      # 传输层
│       └── types.js          # 类型定义
├── test/                     # 测试文件
├── docs/                     # 文档
├── output/                   # 输出目录
├── package.json              # 主包配置
└── README.md                 # 项目说明
```

## 🚀 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 使用代码生成器

```bash
# 交互式代码生成
npm run generate

# 或直接使用命令行工具
node packages/code-generator/bin/mcp-gen.js
```

### 3. 启动MCP Web客户端

```bash
# 启动Web客户端和MCP服务器
npm run web

# 在浏览器中打开
# http://localhost:3001
```

## 📦 功能模块

### JavaScript代码生成器

基于Mustache模板的代码生成器，支持多种常用代码模板。

**主要特性：**
- 🎨 多种内置模板（React组件、Angular组件、Express路由等）
- 🔧 交互式配置界面
- 💻 命令行工具支持
- 📝 自定义模板支持

**使用示例：**

```bash
# 生成React组件
npm run generate -- --template react-component

# 生成Express路由
npm run generate -- --template express-route
```

**支持的模板：**
- `js-class` - JavaScript类
- `express-route` - Express路由处理器
- `react-component` - React函数组件
- `angular-component` - Angular组件

### MCP Web客户端

现代化的Web界面，用于与MCP（Model Context Protocol）服务器交互。

**主要特性：**
- 🌐 现代化Web界面
- 🔌 WebSocket实时通信
- 🛠️ 内置示例工具和资源
- 📱 响应式设计
- 🔍 实时日志和结果显示

**内置工具：**
- `calculator` - 数学计算器
- `current_time` - 时间查询
- `random_number` - 随机数生成
- `echo` - 文本回显

**内置资源：**
- `system://info` - 系统信息
- `file://current-dir` - 目录列表

**使用步骤：**

1. 启动服务器：`npm run web`
2. 打开浏览器：`http://localhost:3001`
3. 连接MCP服务器：`ws://localhost:8080`
4. 使用工具和资源

**指令示例：**

```bash
# 工具调用
calculator 2+3*4
current_time Asia/Shanghai
random_number min=1 max=100

# 资源访问
resource:system://info
resource:file://current-dir

# 提示获取
prompt:code-generator language=JavaScript task=排序算法
```

## 🔧 开发脚本

```bash
# 代码生成器
npm run generate              # 交互式代码生成
npm run generate:example      # 运行基础示例

# MCP Web客户端
npm run web                   # 启动Web客户端（生产模式）
npm run web:dev              # 启动Web客户端（开发模式）

# 测试
npm test                      # 运行所有测试
npm run test:mcp             # 测试MCP Web服务器
npm run test:generator       # 测试代码生成器

# 工具
npm run clean                # 清理输出目录
npm run build                # 构建所有包
```

## 🛠️ 技术栈

### 代码生成器
- **核心技术**: Node.js, Mustache.js
- **CLI工具**: Commander.js, Inquirer.js
- **文件处理**: fs-extra

### MCP Web客户端
- **前端**: 原生HTML/CSS/JavaScript
- **后端**: Node.js + WebSocket
- **协议**: MCP (Model Context Protocol)
- **传输**: JSON-RPC 2.0 over WebSocket

### 共享模块
- **MCP协议**: 完整的MCP服务器/客户端实现
- **传输层**: WebSocket, 内存传输
- **类型系统**: 完整的MCP类型定义

## 📖 详细文档

### 代码生成器

详细使用说明请参考：[packages/code-generator/README.md](packages/code-generator/README.md)

### MCP Web客户端

详细使用说明请参考：[packages/mcp-web-client/README.md](packages/mcp-web-client/README.md)

## 🔗 API参考

### 代码生成器API

```javascript
const { CodeGenerator } = require('./packages/code-generator/src');

const generator = new CodeGenerator();

// 生成代码
await generator.generateCode('react-component', {
  componentName: 'MyButton',
  outputPath: './src/components'
});

// 列出模板
const templates = generator.listTemplates();
```

### MCP客户端API

```javascript
const { WebMCPClient } = require('./packages/mcp-web-client/public/mcp-client');

const client = new WebMCPClient();

// 连接服务器
await client.connect('ws://localhost:8080');

// 调用工具
const result = await client.callTool('calculator', { expression: '2+3' });

// 读取资源
const data = await client.readResource('system://info');
```

## 🧪 测试

项目包含完整的测试套件：

```bash
# 运行所有测试
npm test

# 测试特定模块
npm run test:mcp-web         # MCP Web服务器功能测试
npm run test:generator       # 代码生成器测试
```

测试包括：
- 单元测试
- 集成测试
- 功能测试
- WebSocket连接测试

## 🤝 贡献指南

1. Fork项目
2. 创建功能分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 打开Pull Request

## 📄 许可证

MIT License - 详见 [LICENSE](LICENSE) 文件

## 🙋‍♂️ 支持

如有问题或建议，请：

1. 查看 [文档](docs/)
2. 提交 [Issue](../../issues)
3. 参与 [讨论](../../discussions)

## 🔄 更新日志

### v1.0.0
- ✨ 初始版本发布
- 🚀 JavaScript代码生成器
- 🌐 MCP Web客户端
- 📦 模块化项目结构
- 🧪 完整测试套件

---

**Made with ❤️ by MCP Generator Team** 