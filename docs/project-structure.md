# 项目结构说明

## 项目重构概述

MCP Generator项目已经过重新设计和优化，采用现代化的monorepo结构，将功能模块化分离，提高了项目的可维护性和扩展性。

## 新的目录结构

```
mcp-generator/
├── packages/                   # 功能模块包
│   ├── code-generator/         # JavaScript代码生成器包
│   │   ├── src/               # 源代码
│   │   │   ├── core/          # 核心模块
│   │   │   │   ├── CodeGenerator.js    # 代码生成器核心
│   │   │   │   ├── TemplateManager.js  # 模板管理器
│   │   │   │   └── ConfigManager.js    # 配置管理器
│   │   │   ├── ui/            # 用户界面
│   │   │   │   └── InteractiveInterface.js
│   │   │   └── index.js       # 主入口文件
│   │   ├── templates/         # 代码模板
│   │   │   ├── js-class/      # JavaScript类模板
│   │   │   ├── express-route/ # Express路由模板
│   │   │   ├── react-component/ # React组件模板
│   │   │   └── angular-component/ # Angular组件模板
│   │   ├── examples/          # 使用示例
│   │   │   ├── basic-example.js
│   │   │   └── websocket-example.js
│   │   ├── bin/              # 命令行工具
│   │   │   └── mcp-gen.js    # CLI工具
│   │   ├── package.json      # 包配置
│   │   └── README.md         # 包文档
│   └── mcp-web-client/        # MCP Web客户端包
│       ├── public/           # 前端静态文件
│       │   ├── index.html    # 主页面
│       │   ├── app.js        # 应用程序逻辑
│       │   ├── style.css     # 样式文件
│       │   └── mcp-client.js # MCP客户端实现
│       ├── server/           # 服务器端
│       │   └── server.js     # 服务器实现
│       ├── start.js          # 启动脚本
│       ├── package.json      # 包配置
│       └── README.md         # 包文档
├── shared/                    # 共享模块
│   └── mcp/                  # MCP协议实现
│       ├── server.js         # MCP服务器实现
│       ├── client.js         # MCP客户端实现
│       ├── transport.js      # 传输层实现
│       ├── types.js          # MCP类型定义
│       └── index.js          # MCP模块入口
├── test/                     # 测试文件
│   ├── test.js              # 代码生成器测试
│   ├── mcp-test.js          # MCP功能测试
│   └── mcp-web-test.js      # MCP Web客户端测试
├── docs/                     # 文档目录
│   └── project-structure.md # 项目结构说明
├── output/                   # 输出目录
│   ├── generated/           # 原生成文件目录
│   └── test-output/         # 原测试输出目录
├── package.json              # 主包配置
└── README.md                 # 项目主文档
```

## 结构优化详情

### 1. 模块化分离

**之前的问题：**
- 所有功能混合在一个扁平的结构中
- 代码生成器和MCP客户端功能耦合
- 难以独立开发和维护

**现在的解决方案：**
- 采用packages目录分离功能模块
- 每个包有独立的package.json和README
- 清晰的模块边界和职责划分

### 2. 共享模块抽取

**MCP协议实现 (shared/mcp/)**
- 所有MCP相关的核心实现
- 可被多个包复用
- 统一的协议实现，避免重复代码

### 3. 文件分类优化

**代码生成器包 (packages/code-generator/)**
- 核心业务逻辑在src/core/
- 用户界面代码在src/ui/
- 模板文件统一管理
- 独立的CLI工具

**MCP Web客户端包 (packages/mcp-web-client/)**
- 前端文件在public/目录
- 服务器端文件在server/目录
- 清晰的前后端分离

### 4. 配置文件优化

**主package.json**
- 工作区(workspaces)配置
- 统一的脚本管理
- 全局依赖管理

**子包package.json**
- 独立的版本管理
- 包特定的依赖
- 专门化的脚本命令

## 脚本命令体系

### 全局命令 (根目录)

```bash
# 代码生成器
npm run generate              # 交互式代码生成
npm run generate:example      # 运行生成器示例

# MCP Web客户端
npm run web                   # 启动Web客户端
npm run web:dev              # 开发模式启动

# 测试
npm test                      # 运行所有测试
npm run test:generator        # 测试代码生成器
npm run test:mcp             # 测试MCP功能
npm run test:mcp-web         # 测试Web客户端

# 工具
npm run clean                # 清理输出目录
npm run build                # 构建项目
npm run install:all          # 安装所有依赖
```

### 包级命令

**代码生成器包**
```bash
cd packages/code-generator
npm start                    # 启动交互界面
npm run example:basic        # 基础示例
npm run example:websocket    # WebSocket示例
npm test                     # 包测试
```

**MCP Web客户端包**
```bash
cd packages/mcp-web-client
npm start                    # 启动Web服务器
npm run dev                  # 开发模式
npm test                     # 包测试
```

## 迁移完成的功能

### ✅ 已迁移文件

1. **代码生成器核心**
   - src/core/* → packages/code-generator/src/core/*
   - src/ui/* → packages/code-generator/src/ui/*
   - src/index.js → packages/code-generator/src/index.js
   - bin/* → packages/code-generator/bin/*
   - templates/* → packages/code-generator/templates/*
   - examples/* → packages/code-generator/examples/*

2. **MCP Web客户端**
   - web/index.html → packages/mcp-web-client/public/index.html
   - web/app.js → packages/mcp-web-client/public/app.js
   - web/style.css → packages/mcp-web-client/public/style.css
   - web/mcp-client.js → packages/mcp-web-client/public/mcp-client.js
   - web/server.js → packages/mcp-web-client/server/server.js
   - web/start.js → packages/mcp-web-client/start.js

3. **共享MCP协议**
   - src/mcp/* → shared/mcp/*

4. **输出文件**
   - generated/* → output/generated/*
   - test-output/* → output/test-output/*

### ✅ 已更新引用

1. **路径引用修复**
   - MCP Web客户端服务器引用共享MCP模块
   - 启动脚本更新服务器路径引用
   - 包配置文件引用路径

2. **配置文件创建**
   - 各包的独立package.json
   - 各包的独立README.md
   - 主项目README重写

## 使用指南

### 开发代码生成器功能

```bash
# 进入代码生成器包目录
cd packages/code-generator

# 开发和测试
npm start                    # 交互式开发
npm run example:basic        # 测试基础功能

# 添加新模板
# 在 templates/ 目录下创建新模板文件夹
```

### 开发MCP Web客户端

```bash
# 进入Web客户端包目录
cd packages/mcp-web-client

# 启动开发服务器
npm run dev

# 测试功能
npm test
```

### 开发共享MCP模块

```bash
# 修改共享MCP模块
edit shared/mcp/*

# 在使用该模块的包中测试
cd packages/mcp-web-client && npm test
```

## 未来扩展

这种模块化结构为未来扩展提供了良好的基础：

1. **新功能包**
   - 可以轻松添加新的packages/*包
   - 共享MCP协议实现
   - 独立开发和版本管理

2. **插件系统**
   - 代码生成器支持插件扩展
   - MCP服务器支持工具插件

3. **多语言支持**
   - 可以添加其他语言的代码生成器
   - 统一的模板系统

4. **部署优化**
   - 每个包可以独立部署
   - 容器化支持更简单

## 总结

新的项目结构实现了：

- ✅ **模块化分离** - 功能模块独立，职责清晰
- ✅ **代码复用** - 共享模块避免重复实现
- ✅ **易于维护** - 每个包独立开发和测试
- ✅ **扩展性强** - 支持添加新功能包
- ✅ **文档完善** - 每个包都有详细文档
- ✅ **工具支持** - 完整的开发和测试脚本

这种结构为项目的长期发展和维护提供了坚实的基础。 