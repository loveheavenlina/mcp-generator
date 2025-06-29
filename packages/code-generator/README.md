# JavaScript代码生成器

基于模板的JavaScript代码生成器，支持生成各种类型的代码文件。

## 功能特性

- 🚀 **多模板支持**：内置多种常用代码模板
- 🎨 **可定制模板**：支持自定义Mustache模板
- 💻 **命令行工具**：提供便捷的CLI接口
- 🔧 **交互式配置**：智能化的参数输入体验
- 📁 **多种输出格式**：支持不同的项目结构

## 支持的模板

- **JavaScript类** (`js-class`) - 标准JavaScript类模板
- **Express路由** (`express-route`) - Express.js路由处理器
- **React组件** (`react-component`) - 现代React函数组件
- **Angular组件** (`angular-component`) - Angular组件及其相关文件

## 安装使用

### 命令行使用

```bash
# 交互式生成代码
node bin/mcp-gen.js

# 指定模板和输出目录
node bin/mcp-gen.js --template react-component --output ./components
```

### 编程接口

```javascript
const { CodeGenerator } = require('./src/core/CodeGenerator');

const generator = new CodeGenerator();

// 生成React组件
await generator.generateCode('react-component', {
  componentName: 'MyButton',
  outputPath: './src/components'
});
```

## 模板结构

每个模板包含以下文件：

```
templates/{template-name}/
├── template.json      # 模板配置
├── *.mustache        # 模板文件
└── README.md         # 模板说明
```

### 模板配置示例

```json
{
  "name": "react-component",
  "description": "React函数组件模板",
  "version": "1.0.0",
  "files": [
    {
      "template": "component.mustache",
      "output": "{{componentName}}.jsx"
    },
    {
      "template": "styles.mustache", 
      "output": "{{componentName}}.module.css"
    }
  ],
  "prompts": [
    {
      "name": "componentName",
      "message": "组件名称:",
      "type": "input",
      "validate": "required"
    }
  ]
}
```

## 目录结构

```
src/
├── core/              # 核心模块
│   ├── CodeGenerator.js   # 代码生成器
│   ├── TemplateManager.js # 模板管理器
│   └── ConfigManager.js   # 配置管理器
├── ui/                # 用户界面
│   └── InteractiveInterface.js
└── index.js           # 主入口文件

templates/             # 模板文件
examples/              # 使用示例
bin/                   # 命令行工具
```

## 开发指南

### 创建自定义模板

1. 在`templates/`目录下创建新的模板文件夹
2. 添加`template.json`配置文件
3. 创建Mustache模板文件
4. 测试模板生成

### 扩展生成器

```javascript
const generator = new CodeGenerator();

// 注册自定义处理器
generator.registerHandler('my-template', (config, data) => {
  // 自定义生成逻辑
});
```

## API参考

### CodeGenerator

主要的代码生成器类。

#### 方法

- `generateCode(templateName, options)` - 生成代码
- `listTemplates()` - 列出可用模板
- `validateTemplate(templateName)` - 验证模板

### TemplateManager

模板管理器类。

#### 方法

- `loadTemplate(templateName)` - 加载模板
- `renderTemplate(template, data)` - 渲染模板
- `getTemplateConfig(templateName)` - 获取模板配置

## 许可证

MIT License 