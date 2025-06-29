# MCP Generator

一个强大的代码生成器工具，支持多种模板类型和MCP (Model Context Protocol) 服务。

## 功能特性

### 代码生成器
- 🎯 支持多种代码模板：JavaScript类、Express路由、React组件、Angular组件
- 🎨 基于Mustache模板引擎的灵活模板系统  
- 🔧 支持自定义模板和配置
- 📁 智能文件结构生成
- ✨ 交互式命令行界面

### MCP (Model Context Protocol) 支持
- 🌐 完整的MCP协议实现（基于JSON-RPC 2.0）
- 🔧 MCP服务器：提供工具、资源和提示
- 📱 MCP客户端：连接和使用MCP服务
- 🚀 多种传输方式：内存、WebSocket、标准输入输出
- 🛠️ 丰富的示例和工具
- 💻 **Web客户端界面**：现代化的浏览器界面，支持实时交互

## 安装

```bash
git clone <repository-url>
cd mcp-generator
npm install
```

## 代码生成器使用

### 命令行使用

```bash
# 查看可用模板
node bin/mcp-gen.js list

# 交互式生成
node bin/mcp-gen.js generate

# 使用指定模板生成
node bin/mcp-gen.js generate angular-component

# 指定输出目录
node bin/mcp-gen.js generate -o ./output angular-component
```

### 可用模板

1. **JavaScript类** (`js-class`)
   - 生成ES6类文件
   - 支持构造函数、方法、属性

2. **Express路由** (`express-route`)
   - 生成Express.js路由文件
   - 支持多种HTTP方法

3. **React组件** (`react-component`)
   - 生成React函数组件
   - 包含样式文件和测试文件

4. **Angular组件** (`angular-component`)
   - 生成Angular standalone组件
   - 包含TypeScript、HTML、CSS和测试文件
   - 支持输入属性、输出事件、生命周期钩子

## MCP Web客户端

### 快速启动

```bash
# 启动Web客户端（包含HTTP服务器和MCP服务器）
npm run web
```

在浏览器中打开 `http://localhost:3000`，点击"连接服务器"按钮连接到 `ws://localhost:8080`。

### 功能特点

- 🌐 **现代化Web界面** - 响应式设计，支持桌面端和移动端
- 🔌 **实时WebSocket连接** - 低延迟的实时通信
- 🛠️ **工具调用** - 可视化的工具执行界面
- 📂 **资源访问** - 直观的资源浏览和读取
- 💡 **提示模板** - 交互式提示获取和使用
- 📝 **智能指令解析** - 支持多种指令格式
- 📊 **实时日志** - 完整的操作历史记录

### 内置示例工具

- **calculator** - 数学计算器：`calculator 2+3*4`
- **current_time** - 时间工具：`current_time Asia/Shanghai`
- **random_number** - 随机数生成：`random_number min=1 max=100`
- **echo** - 文本回显：`echo text="Hello MCP!"`

### 内置示例资源

- **system://info** - 系统信息：`resource:system://info`
- **file://current-dir** - 当前目录：`resource:file://current-dir`

### 内置示例提示

- **code-generator** - 代码生成：`prompt:code-generator language=JavaScript task=排序算法`
- **problem-solver** - 问题解决：`prompt:problem-solver problem=性能优化`

## MCP 命令行使用

### 基本示例

```javascript
const MCP = require('./src/mcp');

// 创建MCP服务器
const server = MCP.createServer({
  name: '我的MCP服务器',
  version: '1.0.0'
});

// 注册工具
server.registerTool(
  'calculator',
  '执行数学计算',
  {
    type: 'object',
    properties: {
      expression: {
        type: 'string',
        description: '数学表达式'
      }
    },
    required: ['expression']
  },
  async (args) => {
    return `结果: ${eval(args.expression)}`;
  }
);

// 创建客户端
const client = MCP.createClient({
  name: '我的MCP客户端',
  version: '1.0.0'
});

// 使用内存传输连接
const serverTransport = MCP.createMemoryTransport();
const clientTransport = MCP.createMemoryTransport();
const connector = MCP.createTransportConnector(serverTransport, clientTransport);

// 启动和连接
server.start();
connector.connect(server, client);
await client.initialize();

// 调用工具
const result = await client.callTool('calculator', { expression: '2 + 3' });
console.log(result.content[0].text); // 输出: 结果: 5
```

### WebSocket示例

#### 启动WebSocket服务器
```bash
node examples/websocket-example.js server 8080
```

#### 连接WebSocket客户端
```bash
node examples/websocket-example.js client ws://localhost:8080
```

### 运行完整示例

```bash
# 运行基本示例（内存传输）
node examples/basic-example.js

# 运行WebSocket示例
node examples/websocket-example.js server
# 在另一个终端运行
node examples/websocket-example.js client
```

## MCP API

### 服务器 API

```javascript
const server = new MCP.MCPServer(serverInfo);

// 注册工具
server.registerTool(name, description, inputSchema, handler);

// 注册资源
server.registerResource(uri, name, description, mimeType, handler);

// 注册提示
server.registerPrompt(name, description, arguments, handler);

// 设置能力
server.setCapabilities(capabilities);

// 启动服务器
server.start();
```

### 客户端 API

```javascript
const client = new MCP.MCPClient(clientInfo);

// 初始化连接
await client.initialize();

// 获取工具列表
const tools = await client.listTools();

// 调用工具
const result = await client.callTool(name, arguments);

// 获取资源列表
const resources = await client.listResources();

// 读取资源
const contents = await client.readResource(uri);

// 获取提示列表
const prompts = await client.listPrompts();

// 获取提示
const prompt = await client.getPrompt(name, arguments);
```

### 传输层

```javascript
// 内存传输（同进程）
const transport = MCP.createMemoryTransport();

// WebSocket传输（网络）
const transport = MCP.createWebSocketTransport(url, WebSocket);

// 标准输入输出传输（命令行）
const transport = MCP.createStdioTransport();

// 传输连接器
const connector = MCP.createTransportConnector(serverTransport, clientTransport);
connector.connect(server, client);
```

## 测试

```bash
# 运行所有测试
npm test

# 运行MCP功能测试
node test/mcp-test.js

# 运行代码生成器测试
node test/test.js
```

## 项目结构

```
mcp-generator/
├── bin/                    # 命令行工具
│   └── mcp-gen.js
├── src/                    # 源代码
│   ├── core/              # 核心模块
│   │   ├── CodeGenerator.js
│   │   ├── ConfigManager.js
│   │   └── TemplateManager.js
│   ├── mcp/               # MCP实现
│   │   ├── types.js       # 类型定义
│   │   ├── server.js      # MCP服务器
│   │   ├── client.js      # MCP客户端
│   │   ├── transport.js   # 传输层
│   │   └── index.js       # 主入口
│   ├── ui/                # 用户界面
│   │   └── InteractiveInterface.js
│   └── index.js
├── templates/             # 模板文件
│   ├── angular-component/
│   ├── express-route/
│   ├── js-class/
│   └── react-component/
├── examples/              # 示例文件
│   ├── basic-example.js
│   └── websocket-example.js
├── test/                  # 测试文件
├── generated/             # 生成的代码
└── README.md
```

## 贡献

欢迎提交 Issue 和 Pull Request！

## 许可证

MIT 