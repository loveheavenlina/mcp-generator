# MCP代码生成器

🚀 一个强大的JavaScript代码生成器MCP工具，支持模板化生成各种类型的代码。

## 功能特性

- ✨ **模板化生成**: 支持自定义模板，灵活生成各种代码
- 🎯 **多文件支持**: 支持单文件和多文件模板
- 🛠️ **交互式界面**: 友好的命令行交互体验
- ⚙️ **配置管理**: 灵活的配置系统
- 📦 **内置模板**: 提供常用的代码模板
- 🔧 **辅助函数**: 内置字符串转换等辅助功能

## 安装

```bash
# 克隆项目
git clone <repository-url>
cd mcp-generator

# 安装依赖
npm install

# 全局安装（可选）
npm link
```

## 快速开始

### 1. 交互式使用

```bash
# 启动交互式界面
node src/index.js
# 或者
npm start
```

### 2. 命令行使用

```bash
# 查看所有可用模板
npx mcp-gen list

# 生成代码
npx mcp-gen generate js-class -d '{"className":"MyClass","description":"我的类"}'

# 查看模板详情
npx mcp-gen info js-class

# 创建新模板
npx mcp-gen create my-template -t single-file -d "我的模板"
```

## 内置模板

### 1. JavaScript类模板 (js-class)
生成ES6类文件，支持继承、构造函数等特性。

**必需参数**: 
- `className`: 类名

**可选参数**:
- `description`: 类描述
- `author`: 作者
- `extends`: 继承的父类
- `constructor`: 是否包含构造函数
- `methods`: 方法列表

**使用示例**:
```bash
npx mcp-gen generate js-class -d '{"className":"UserService","description":"用户服务类","author":"开发者"}'
```

### 2. Express路由模板 (express-route)
生成Express.js路由文件，包含CRUD操作。

**必需参数**:
- `routeName`: 路由名称

**可选参数**:
- `description`: 路由描述
- `basePath`: 基础路径
- `middleware`: 中间件列表
- `routes`: 路由配置列表

**使用示例**:
```bash
npx mcp-gen generate express-route -d '{"routeName":"user","description":"用户管理路由","basePath":"/api/users"}'
```

### 3. React组件模板 (react-component)
生成React函数组件，包含组件文件、样式文件、测试文件等。

**必需参数**:
- `componentName`: 组件名称

**可选参数**:
- `description`: 组件描述
- `useHooks`: 是否使用Hooks
- `useState`: 是否使用useState
- `useEffect`: 是否使用useEffect
- `props`: 属性列表
- `css`: 是否包含样式文件
- `test`: 是否包含测试文件

**使用示例**:
```bash
npx mcp-gen generate react-component -d '{"componentName":"Button","description":"按钮组件"}' -o ./components/Button
```

## 配置

### 全局配置文件位置
配置文件位于: `~/.mcp-generator/config.json`

### 默认配置
```json
{
  "outputDir": "./generated",
  "templateDir": "./templates",
  "author": "系统用户名",
  "encoding": "utf8",
  "overwrite": false,
  "backup": true,
  "prettify": true,
  "log": {
    "level": "info",
    "timestamp": true
  },
  "templates": {
    "defaultExtension": ".js",
    "defaultEncoding": "utf8"
  }
}
```

### 修改配置
```bash
# 查看当前配置
npx mcp-gen config

# 修改配置项
npx mcp-gen config --set author=YourName
npx mcp-gen config --set outputDir=./my-output
```

## 创建自定义模板

### 1. 单文件模板结构
```
templates/
  my-template/
    template.json      # 模板配置文件
    template.mustache  # 模板文件
```

### 2. 多文件模板结构
```
templates/
  my-multi-template/
    template.json      # 模板配置文件
    file1.mustache     # 模板文件1
    file2.mustache     # 模板文件2
```

### 3. 模板配置示例 (template.json)
```json
{
  "name": "my-template",
  "description": "我的自定义模板",
  "type": "single-file",
  "author": "作者名",
  "version": "1.0.0",
  "file": "template.mustache",
  "required": ["name"],
  "defaults": {
    "description": "默认描述",
    "author": "默认作者"
  }
}
```

### 4. 模板语法
使用 [Mustache](https://mustache.github.io/) 模板引擎语法:

```mustache
/**
 * {{name}} - {{description}}
 * @author {{author}}
 * @created {{helpers.currentTime}}
 */

{{#isClass}}
class {{helpers.pascalCase name}} {
{{/isClass}}
{{^isClass}}
function {{helpers.camelCase name}}() {
{{/isClass}}
  // TODO: 实现代码
}
```

### 5. 内置辅助函数
- `helpers.camelCase`: 转换为驼峰命名
- `helpers.pascalCase`: 转换为帕斯卡命名
- `helpers.kebabCase`: 转换为短横线命名
- `helpers.snakeCase`: 转换为下划线命名
- `helpers.upperCase`: 转换为大写
- `helpers.lowerCase`: 转换为小写
- `helpers.currentDate`: 当前日期
- `helpers.currentTime`: 当前时间
- `helpers.timestamp`: 时间戳

## API 使用

```javascript
const MCPGenerator = require('./src/index');

async function example() {
  const generator = new MCPGenerator();
  await generator.init();
  
  // 生成代码
  const result = await generator.generate('js-class', {
    className: 'MyClass',
    description: '我的类'
  }, './output/MyClass.js');
  
  console.log('生成成功:', result);
}
```

## 测试

```bash
# 运行测试
npm test

# 开发模式
npm run dev
```

## 命令行选项

### 全局选项
- `--version, -V`: 显示版本号
- `--help, -h`: 显示帮助信息

### generate 命令
```bash
npx mcp-gen generate <template> [options]
```

**选项**:
- `-o, --output <path>`: 输出路径
- `-d, --data <data>`: 模板数据(JSON格式)
- `-f, --file <file>`: 从文件读取模板数据

### list 命令
```bash
npx mcp-gen list
```
列出所有可用的模板

### info 命令
```bash
npx mcp-gen info <template>
```
查看指定模板的详细信息

### create 命令
```bash
npx mcp-gen create <name> [options]
```

**选项**:
- `-t, --type <type>`: 模板类型 (single-file|multi-file)
- `-d, --description <desc>`: 模板描述
- `-a, --author <author>`: 作者名称

### config 命令
```bash
npx mcp-gen config [options]
```

**选项**:
- `--set <key=value>`: 设置配置项

## 开发

### 项目结构
```
mcp-generator/
├── src/                    # 源代码
│   ├── core/              # 核心模块
│   │   ├── CodeGenerator.js
│   │   ├── TemplateManager.js
│   │   └── ConfigManager.js
│   ├── ui/                # 用户界面
│   │   └── InteractiveInterface.js
│   └── index.js           # 主入口文件
├── templates/             # 内置模板
│   ├── js-class/
│   ├── express-route/
│   └── react-component/
├── test/                  # 测试文件
├── bin/                   # 命令行工具
└── package.json
```

### 扩展开发
1. 在 `src/core/` 中添加新的核心功能
2. 在 `templates/` 中添加新的模板
3. 在 `test/` 中添加相应的测试
4. 更新文档

## 许可证

MIT License

## 贡献

欢迎提交 Issue 和 Pull Request！

## 更新日志

### v1.0.0
- 初始版本发布
- 支持单文件和多文件模板
- 内置JavaScript类、Express路由、React组件模板
- 交互式命令行界面
- 配置管理系统 