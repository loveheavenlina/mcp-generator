/**
 * MCP代码生成器 - 主入口文件
 * 这是一个强大的代码生成工具，支持模板化生成各种类型的代码
 */

const CodeGenerator = require('./core/CodeGenerator');
const TemplateManager = require('./core/TemplateManager');
const ConfigManager = require('./core/ConfigManager');

class MCPGenerator {
  constructor() {
    this.templateManager = new TemplateManager();
    this.configManager = new ConfigManager();
    this.codeGenerator = new CodeGenerator(this.templateManager, this.configManager);
  }

  /**
   * 初始化生成器
   */
  async init() {
    console.log('🚀 MCP代码生成器正在初始化...');
    await this.templateManager.loadTemplates();
    await this.configManager.loadConfig();
    console.log('✅ 初始化完成');
  }

  /**
   * 生成代码
   * @param {string} templateName - 模板名称
   * @param {Object} data - 数据对象
   * @param {string} outputPath - 输出路径
   */
  async generate(templateName, data, outputPath) {
    try {
      console.log(`📝 正在使用模板 "${templateName}" 生成代码...`);
      const result = await this.codeGenerator.generate(templateName, data, outputPath);
      console.log(`✅ 代码生成成功！输出到: ${result.outputPath}`);
      return result;
    } catch (error) {
      console.error('❌ 代码生成失败:', error.message);
      throw error;
    }
  }

  /**
   * 获取可用模板列表
   */
  getAvailableTemplates() {
    return this.templateManager.getTemplateList();
  }
}

module.exports = MCPGenerator;

// 如果直接运行此文件，启动交互式界面
if (require.main === module) {
  const InteractiveInterface = require('./ui/InteractiveInterface');
  const interface = new InteractiveInterface();
  interface.start();
} 