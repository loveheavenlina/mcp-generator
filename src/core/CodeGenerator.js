/**
 * 代码生成器核心类
 * 负责根据模板和数据生成代码文件
 */

const fs = require('fs-extra');
const path = require('path');
const Mustache = require('mustache');

class CodeGenerator {
  constructor(templateManager, configManager) {
    this.templateManager = templateManager;
    this.configManager = configManager;
  }

  /**
   * 生成代码
   * @param {string} templateName - 模板名称
   * @param {Object} data - 模板数据
   * @param {string} outputPath - 输出路径
   * @returns {Object} 生成结果
   */
  async generate(templateName, data, outputPath) {
    // 获取模板内容
    const template = this.templateManager.getTemplate(templateName);
    if (!template) {
      throw new Error(`模板 "${templateName}" 不存在`);
    }

    // 预处理数据
    const processedData = this.preprocessData(data, template.config);

    // 如果是多文件模板
    if (template.type === 'multi-file') {
      return await this.generateMultipleFiles(template, processedData, outputPath);
    } else {
      return await this.generateSingleFile(template, processedData, outputPath);
    }
  }

  /**
   * 生成单个文件
   */
  async generateSingleFile(template, data, outputPath) {
    const content = Mustache.render(template.content, data);
    
    // 确保输出目录存在
    await fs.ensureDir(path.dirname(outputPath));
    
    // 写入文件
    await fs.writeFile(outputPath, content, 'utf8');
    
    return {
      type: 'single-file',
      outputPath,
      generatedFiles: [outputPath]
    };
  }

  /**
   * 生成多个文件
   */
  async generateMultipleFiles(template, data, outputPath) {
    const generatedFiles = [];
    
    // 确保输出目录存在
    await fs.ensureDir(outputPath);
    
    for (const file of template.files) {
      const fileName = Mustache.render(file.name, data);
      const content = Mustache.render(file.content, data);
      const filePath = path.join(outputPath, fileName);
      
      // 确保文件目录存在
      await fs.ensureDir(path.dirname(filePath));
      
      // 写入文件
      await fs.writeFile(filePath, content, 'utf8');
      generatedFiles.push(filePath);
    }
    
    return {
      type: 'multi-file',
      outputPath,
      generatedFiles
    };
  }

  /**
   * 预处理数据
   */
  preprocessData(data, templateConfig = {}) {
    const processed = { ...data };
    
    // 添加常用的辅助函数
    processed.helpers = {
      camelCase: (str) => str.replace(/-([a-z])/g, (g) => g[1].toUpperCase()),
      pascalCase: (str) => str.charAt(0).toUpperCase() + str.slice(1).replace(/-([a-z])/g, (g) => g[1].toUpperCase()),
      kebabCase: (str) => str.replace(/([A-Z])/g, '-$1').toLowerCase().replace(/^-/, ''),
      snakeCase: (str) => str.replace(/([A-Z])/g, '_$1').toLowerCase().replace(/^_/, ''),
      upperCase: (str) => str.toUpperCase(),
      lowerCase: (str) => str.toLowerCase(),
      currentDate: () => new Date().toLocaleDateString('zh-CN'),
      currentTime: () => new Date().toLocaleString('zh-CN'),
      timestamp: () => Date.now()
    };
    
    // 应用模板配置的默认值
    if (templateConfig.defaults) {
      Object.keys(templateConfig.defaults).forEach(key => {
        if (processed[key] === undefined) {
          processed[key] = templateConfig.defaults[key];
        }
      });
    }
    
    return processed;
  }

  /**
   * 验证模板数据
   */
  validateData(data, template) {
    if (!template.config || !template.config.required) {
      return true;
    }
    
    const missing = template.config.required.filter(field => !data[field]);
    if (missing.length > 0) {
      throw new Error(`缺少必需的字段: ${missing.join(', ')}`);
    }
    
    return true;
  }
}

module.exports = CodeGenerator; 