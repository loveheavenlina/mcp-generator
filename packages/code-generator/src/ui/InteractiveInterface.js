/**
 * 交互式界面
 * 提供用户友好的命令行交互体验
 */

const inquirer = require('inquirer');
const chalk = require('chalk');
const MCPGenerator = require('../index');

class InteractiveInterface {
  constructor() {
    this.generator = new MCPGenerator();
    this.isInitialized = false;
  }

  /**
   * 启动交互式界面
   */
  async start() {
    try {
      this.displayWelcome();
      
      // 初始化生成器
      if (!this.isInitialized) {
        await this.generator.init();
        this.isInitialized = true;
      }
      
      // 显示主菜单
      await this.showMainMenu();
      
    } catch (error) {
      console.error(chalk.red('❌ 启动失败:'), error.message);
      process.exit(1);
    }
  }

  /**
   * 显示欢迎信息
   */
  displayWelcome() {
    console.clear();
    console.log(chalk.cyan.bold('\n🚀 MCP代码生成器'));
    console.log(chalk.gray('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
    console.log(chalk.green('欢迎使用MCP代码生成器！'));
    console.log(chalk.gray('这是一个强大的模板化代码生成工具\n'));
  }

  /**
   * 显示主菜单
   */
  async showMainMenu() {
    const { action } = await inquirer.prompt([
      {
        type: 'list',
        name: 'action',
        message: '请选择要执行的操作:',
        choices: [
          { name: '📝 生成代码', value: 'generate' },
          { name: '📋 查看模板列表', value: 'list' },
          { name: '🔍 查看模板详情', value: 'info' },
          { name: '➕ 创建新模板', value: 'create' },
          { name: '⚙️ 配置设置', value: 'config' },
          { name: '🚪 退出', value: 'exit' }
        ]
      }
    ]);

    switch (action) {
      case 'generate':
        await this.handleGenerate();
        break;
      case 'list':
        await this.handleList();
        break;
      case 'info':
        await this.handleInfo();
        break;
      case 'create':
        await this.handleCreate();
        break;
      case 'config':
        await this.handleConfig();
        break;
      case 'exit':
        this.displayGoodbye();
        process.exit(0);
        break;
    }

    // 显示继续操作选项
    await this.askContinue();
  }

  /**
   * 处理代码生成
   */
  async handleGenerate() {
    const templates = this.generator.getAvailableTemplates();
    
    if (templates.length === 0) {
      console.log(chalk.yellow('⚠️ 没有可用的模板'));
      return;
    }

    // 选择模板
    const { templateName } = await inquirer.prompt([
      {
        type: 'list',
        name: 'templateName',
        message: '选择要使用的模板:',
        choices: templates.map(t => ({
          name: `${t.name} - ${t.description}`,
          value: t.name
        }))
      }
    ]);

    // 获取模板信息
    const templateInfo = this.generator.templateManager.getTemplateInfo(templateName);
    
    // 收集模板数据
    const data = await this.collectTemplateData(templateInfo);
    
    // 获取输出路径
    const { outputPath } = await inquirer.prompt([
      {
        type: 'input',
        name: 'outputPath',
        message: '输出路径:',
        default: templateInfo.type === 'multi-file' ? `./generated/${templateName}` : `./generated/${templateName}.js`
      }
    ]);

    try {
      const result = await this.generator.generate(templateName, data, outputPath);
      console.log(chalk.green('\n✅ 代码生成成功!'));
      console.log(chalk.gray(`📁 输出路径: ${result.outputPath}`));
      console.log(chalk.gray(`📄 生成文件: ${result.generatedFiles.length} 个`));
    } catch (error) {
      console.log(chalk.red('\n❌ 生成失败:'), error.message);
    }
  }

  /**
   * 收集模板数据
   */
  async collectTemplateData(templateInfo) {
    const data = {};
    
    console.log(chalk.blue(`\n📝 配置模板 "${templateInfo.name}"`));
    
    // 收集必需字段
    if (templateInfo.required && templateInfo.required.length > 0) {
      console.log(chalk.gray('请输入必需的字段:'));
      
      for (const field of templateInfo.required) {
        const { value } = await inquirer.prompt([
          {
            type: 'input',
            name: 'value',
            message: `${field}:`,
            validate: (input) => input.trim() !== '' || '此字段不能为空'
          }
        ]);
        data[field] = value;
      }
    }

    // 询问是否配置可选字段
    const { configOptional } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'configOptional',
        message: '是否配置可选字段?',
        default: false
      }
    ]);

    if (configOptional && templateInfo.defaults) {
      console.log(chalk.gray('可选字段 (按Enter使用默认值):'));
      
      for (const [field, defaultValue] of Object.entries(templateInfo.defaults)) {
        if (!data[field]) {
          const { value } = await inquirer.prompt([
            {
              type: 'input',
              name: 'value',
              message: `${field}:`,
              default: defaultValue
            }
          ]);
          data[field] = value;
        }
      }
    }

    return data;
  }

  /**
   * 处理模板列表
   */
  async handleList() {
    const templates = this.generator.getAvailableTemplates();
    
    if (templates.length === 0) {
      console.log(chalk.yellow('\n⚠️ 没有可用的模板'));
      return;
    }

    console.log(chalk.blue('\n📋 可用模板列表:'));
    console.log(chalk.gray('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
    
    templates.forEach((template, index) => {
      console.log(`${index + 1}. ${chalk.cyan(template.name)}`);
      console.log(`   ${chalk.gray(template.description)}`);
      console.log(`   ${chalk.gray(`类型: ${template.type} | 作者: ${template.author} | 版本: ${template.version}`)}`);
      console.log('');
    });
  }

  /**
   * 处理模板详情
   */
  async handleInfo() {
    const templates = this.generator.getAvailableTemplates();
    
    if (templates.length === 0) {
      console.log(chalk.yellow('⚠️ 没有可用的模板'));
      return;
    }

    const { templateName } = await inquirer.prompt([
      {
        type: 'list',
        name: 'templateName',
        message: '选择要查看的模板:',
        choices: templates.map(t => ({ name: t.name, value: t.name }))
      }
    ]);

    const info = this.generator.templateManager.getTemplateInfo(templateName);
    
    console.log(chalk.blue(`\n🔍 模板详情: ${info.name}`));
    console.log(chalk.gray('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
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
  }

  /**
   * 处理创建模板
   */
  async handleCreate() {
    console.log(chalk.blue('\n➕ 创建新模板'));
    
    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'name',
        message: '模板名称:',
        validate: (input) => input.trim() !== '' || '模板名称不能为空'
      },
      {
        type: 'input',
        name: 'description',
        message: '模板描述:'
      },
      {
        type: 'list',
        name: 'type',
        message: '模板类型:',
        choices: [
          { name: '单文件模板', value: 'single-file' },
          { name: '多文件模板', value: 'multi-file' }
        ]
      },
      {
        type: 'input',
        name: 'author',
        message: '作者:',
        default: this.generator.configManager.get('author')
      }
    ]);

    const templateConfig = {
      name: answers.name,
      description: answers.description,
      type: answers.type,
      author: answers.author,
      version: '1.0.0',
      file: 'template.mustache'
    };

    try {
      await this.generator.templateManager.createTemplate(answers.name, templateConfig);
      console.log(chalk.green(`✅ 模板 "${answers.name}" 创建成功`));
    } catch (error) {
      console.log(chalk.red('❌ 创建失败:'), error.message);
    }
  }

  /**
   * 处理配置设置
   */
  async handleConfig() {
    this.generator.configManager.displayConfig();
    
    const { action } = await inquirer.prompt([
      {
        type: 'list',
        name: 'action',
        message: '选择配置操作:',
        choices: [
          { name: '📝 修改输出目录', value: 'outputDir' },
          { name: '👤 修改作者信息', value: 'author' },
          { name: '🔄 修改覆盖设置', value: 'overwrite' },
          { name: '💾 修改备份设置', value: 'backup' },
          { name: '🔙 返回主菜单', value: 'back' }
        ]
      }
    ]);

    if (action === 'back') return;

    await this.handleConfigChange(action);
  }

  /**
   * 处理配置修改
   */
  async handleConfigChange(configKey) {
    const currentValue = this.generator.configManager.get(configKey);
    
    let prompt;
    switch (configKey) {
      case 'outputDir':
        prompt = {
          type: 'input',
          name: 'value',
          message: '输出目录:',
          default: currentValue
        };
        break;
      case 'author':
        prompt = {
          type: 'input',
          name: 'value',  
          message: '作者名称:',
          default: currentValue
        };
        break;
      case 'overwrite':
      case 'backup':
        prompt = {
          type: 'confirm',
          name: 'value',
          message: `${configKey === 'overwrite' ? '是否允许覆盖文件' : '是否创建备份'}:`,
          default: currentValue
        };
        break;
    }

    const { value } = await inquirer.prompt([prompt]);
    
    this.generator.configManager.set(configKey, value);
    await this.generator.configManager.saveConfig();
    
    console.log(chalk.green('✅ 配置已更新'));
  }

  /**
   * 询问是否继续
   */
  async askContinue() {
    const { continue: shouldContinue } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'continue',
        message: '是否继续使用?',
        default: true
      }
    ]);

    if (shouldContinue) {
      await this.showMainMenu();
    } else {
      this.displayGoodbye();
      process.exit(0);
    }
  }

  /**
   * 显示再见信息
   */
  displayGoodbye() {
    console.log(chalk.green('\n👋 感谢使用MCP代码生成器!'));
    console.log(chalk.gray('再见! 🚀\n'));
  }
}

module.exports = InteractiveInterface; 