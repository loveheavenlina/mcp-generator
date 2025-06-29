#!/usr/bin/env node

/**
 * MCP代码生成器 CLI工具
 * 提供命令行界面支持
 */

const { Command } = require('commander');
const MCPGenerator = require('../src/index');
const InteractiveInterface = require('../src/ui/InteractiveInterface');
const packageInfo = require('../package.json');

// 简单的颜色函数
const colors = {
  red: (str) => `\x1b[31m${str}\x1b[0m`,
  green: (str) => `\x1b[32m${str}\x1b[0m`,
  blue: (str) => `\x1b[34m${str}\x1b[0m`,
  yellow: (str) => `\x1b[33m${str}\x1b[0m`,
  cyan: (str) => `\x1b[36m${str}\x1b[0m`,
  gray: (str) => `\x1b[90m${str}\x1b[0m`
};

const program = new Command();

// 配置程序信息
program
  .name('mcp-gen')
  .description('MCP代码生成器 - 强大的模板化代码生成工具')
  .version(packageInfo.version);

// 生成代码命令
program
  .command('generate <template>')
  .alias('gen')
  .description('使用指定模板生成代码')
  .option('-o, --output <path>', '输出路径')
  .option('-d, --data <data>', '模板数据(JSON格式)')
  .option('-f, --file <file>', '从文件读取模板数据')
  .action(async (template, options) => {
    try {
      const generator = new MCPGenerator();
      await generator.init();
      
      // 准备模板数据
      let data = {};
      if (options.data) {
        try {
          data = JSON.parse(options.data);
        } catch (error) {
          console.error(colors.red('❌ 无效的JSON数据格式'));
          process.exit(1);
        }
      } else if (options.file) {
        const fs = require('fs');
        try {
          const fileContent = fs.readFileSync(options.file, 'utf8');
          data = JSON.parse(fileContent);
        } catch (error) {
          console.error(colors.red(`❌ 读取数据文件失败: ${error.message}`));
          process.exit(1);
        }
      }
      
      // 生成输出路径
      const outputPath = options.output || `./generated/${template}`;
      
      // 执行生成
      const result = await generator.generate(template, data, outputPath);
      console.log(colors.green('✅ 代码生成成功!'));
      console.log(colors.gray(`📁 输出路径: ${result.outputPath}`));
      
    } catch (error) {
      console.error(colors.red('❌ 生成失败:'), error.message);
      process.exit(1);
    }
  });

// 列出模板命令
program
  .command('list')
  .alias('ls')
  .description('列出所有可用的模板')
  .action(async () => {
    try {
      const generator = new MCPGenerator();
      await generator.init();
      
      const templates = generator.getAvailableTemplates();
      
      if (templates.length === 0) {
        console.log(colors.yellow('⚠️ 没有可用的模板'));
        return;
      }
      
      console.log(colors.blue('\n📋 可用模板列表:'));
      console.log(colors.gray('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
      
      templates.forEach((template, index) => {
        console.log(`${index + 1}. ${colors.cyan(template.name)}`);
        console.log(`   ${colors.gray(template.description)}`);
        console.log(`   ${colors.gray(`类型: ${template.type} | 作者: ${template.author}`)}`);
        console.log('');
      });
      
    } catch (error) {
      console.error(colors.red('❌ 获取模板列表失败:'), error.message);
      process.exit(1);
    }
  });

// 查看模板详情命令
program
  .command('info <template>')
  .description('查看指定模板的详细信息')
  .action(async (template) => {
    try {
      const generator = new MCPGenerator();
      await generator.init();
      
      const info = generator.templateManager.getTemplateInfo(template);
      
      if (!info) {
        console.error(colors.red(`❌ 模板 "${template}" 不存在`));
        process.exit(1);
      }
      
      console.log(colors.blue(`\n🔍 模板详情: ${info.name}`));
      console.log(colors.gray('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
      console.log(`📄 描述: ${info.description || '无描述'}`);
      console.log(`🏷️ 类型: ${info.type}`);
      console.log(`👤 作者: ${info.author || '未知'}`);
      console.log(`🔢 版本: ${info.version || '1.0.0'}`);
      
      if (info.required && info.required.length > 0) {
        console.log(`📝 必需字段: ${info.required.join(', ')}`);
      }
      
      if (info.defaults && Object.keys(info.defaults).length > 0) {
        console.log(`⚙️ 默认值:`);
        Object.entries(info.defaults).forEach(([key, value]) => {
          console.log(`   ${key}: ${value}`);
        });
      }
      
    } catch (error) {
      console.error(colors.red('❌ 获取模板信息失败:'), error.message);
      process.exit(1);
    }
  });

// 创建模板命令
program
  .command('create <name>')
  .description('创建新的模板')
  .option('-t, --type <type>', '模板类型 (single-file|multi-file)', 'single-file')
  .option('-d, --description <desc>', '模板描述')
  .option('-a, --author <author>', '作者名称')
  .action(async (name, options) => {
    try {
      const generator = new MCPGenerator();
      await generator.init();
      
      const templateConfig = {
        name,
        description: options.description || `${name} 模板`,
        type: options.type,
        author: options.author || generator.configManager.get('author'),
        version: '1.0.0',
        file: 'template.mustache'
      };
      
      await generator.templateManager.createTemplate(name, templateConfig);
      console.log(colors.green(`✅ 模板 "${name}" 创建成功`));
      
    } catch (error) {
      console.error(colors.red('❌ 创建模板失败:'), error.message);
      process.exit(1);
    }
  });

// 配置命令
program
  .command('config')
  .description('显示当前配置信息')
  .option('--set <key=value>', '设置配置项')
  .action(async (options) => {
    try {
      const generator = new MCPGenerator();
      await generator.init();
      
      if (options.set) {
        const [key, value] = options.set.split('=');
        if (!key || value === undefined) {
          console.error(colors.red('❌ 配置格式错误，请使用: --set key=value'));
          process.exit(1);
        }
        
        generator.configManager.set(key, value);
        await generator.configManager.saveConfig();
        console.log(colors.green(`✅ 配置 ${key} 已更新为: ${value}`));
      } else {
        generator.configManager.displayConfig();
      }
      
    } catch (error) {
      console.error(colors.red('❌ 配置操作失败:'), error.message);
      process.exit(1);
    }
  });

// 交互模式命令
program
  .command('interactive')
  .alias('i')
  .description('启动交互式界面')
  .action(async () => {
    const interface = new InteractiveInterface();
    await interface.start();
  });

// 默认命令 - 启动交互式界面
program
  .action(async () => {
    const interface = new InteractiveInterface();
    await interface.start();
  });

// 错误处理
program.on('command:*', () => {
  console.error(colors.red('❌ 未知命令'));
  console.log(colors.gray('使用 --help 查看可用命令'));
  process.exit(1);
});

// 解析命令行参数
program.parse(); 