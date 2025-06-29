/**
 * 模板管理器
 * 负责加载、管理和提供模板
 */

const fs = require('fs-extra');
const path = require('path');

class TemplateManager {
  constructor() {
    this.templates = new Map();
    this.templatesDir = path.join(__dirname, '../../templates');
  }

  /**
   * 加载所有模板
   */
  async loadTemplates() {
    try {
      // 确保模板目录存在
      await fs.ensureDir(this.templatesDir);
      
      // 读取模板目录
      const templateDirs = await fs.readdir(this.templatesDir);
      
      for (const templateDir of templateDirs) {
        const templatePath = path.join(this.templatesDir, templateDir);
        const stat = await fs.stat(templatePath);
        
        if (stat.isDirectory()) {
          await this.loadTemplate(templateDir, templatePath);
        }
      }
      
      console.log(`📦 已加载 ${this.templates.size} 个模板`);
    } catch (error) {
      console.warn('⚠️ 加载模板时出现警告:', error.message);
    }
  }

  /**
   * 加载单个模板
   */
  async loadTemplate(templateName, templatePath) {
    try {
      const configPath = path.join(templatePath, 'template.json');
      
      // 检查配置文件是否存在
      if (!(await fs.pathExists(configPath))) {
        console.warn(`⚠️ 模板 "${templateName}" 缺少配置文件 template.json`);
        return;
      }
      
      // 读取模板配置
      const config = await fs.readJson(configPath);
      
      // 根据模板类型加载内容
      let template;
      if (config.type === 'multi-file') {
        template = await this.loadMultiFileTemplate(templatePath, config);
      } else {
        template = await this.loadSingleFileTemplate(templatePath, config);
      }
      
      template.name = templateName;
      template.path = templatePath;
      this.templates.set(templateName, template);
      
    } catch (error) {
      console.error(`❌ 加载模板 "${templateName}" 失败:`, error.message);
    }
  }

  /**
   * 加载单文件模板
   */
  async loadSingleFileTemplate(templatePath, config) {
    const contentPath = path.join(templatePath, config.file || 'template.mustache');
    const content = await fs.readFile(contentPath, 'utf8');
    
    return {
      type: 'single-file',
      config,
      content
    };
  }

  /**
   * 加载多文件模板
   */
  async loadMultiFileTemplate(templatePath, config) {
    const files = [];
    
    for (const fileConfig of config.files) {
      const filePath = path.join(templatePath, fileConfig.template);
      const content = await fs.readFile(filePath, 'utf8');
      
      files.push({
        name: fileConfig.name,
        content,
        config: fileConfig
      });
    }
    
    return {
      type: 'multi-file',
      config,
      files
    };
  }

  /**
   * 获取模板
   */
  getTemplate(templateName) {
    return this.templates.get(templateName);
  }

  /**
   * 获取模板列表
   */
  getTemplateList() {
    return Array.from(this.templates.entries()).map(([name, template]) => ({
      name,
      description: template.config.description || '无描述',
      type: template.type,
      author: template.config.author || '未知',
      version: template.config.version || '1.0.0'
    }));
  }

  /**
   * 检查模板是否存在
   */
  hasTemplate(templateName) {
    return this.templates.has(templateName);
  }

  /**
   * 创建新模板
   */
  async createTemplate(templateName, templateConfig) {
    const templatePath = path.join(this.templatesDir, templateName);
    
    // 创建模板目录
    await fs.ensureDir(templatePath);
    
    // 写入配置文件
    const configPath = path.join(templatePath, 'template.json');
    await fs.writeJson(configPath, templateConfig, { spaces: 2 });
    
    // 创建默认模板文件
    if (templateConfig.type === 'single-file') {
      const templateFile = path.join(templatePath, templateConfig.file || 'template.mustache');
      await fs.writeFile(templateFile, '// {{description}}\n// 这是一个新的模板文件\n', 'utf8');
    }
    
    console.log(`✅ 模板 "${templateName}" 创建成功`);
  }

  /**
   * 删除模板
   */
  async removeTemplate(templateName) {
    if (!this.hasTemplate(templateName)) {
      throw new Error(`模板 "${templateName}" 不存在`);
    }
    
    const template = this.getTemplate(templateName);
    await fs.remove(template.path);
    this.templates.delete(templateName);
    
    console.log(`✅ 模板 "${templateName}" 删除成功`);
  }

  /**
   * 获取模板详细信息
   */
  getTemplateInfo(templateName) {
    const template = this.getTemplate(templateName);
    if (!template) {
      return null;
    }
    
    return {
      name: templateName,
      description: template.config.description,
      type: template.type,
      author: template.config.author,
      version: template.config.version,
      required: template.config.required || [],
      defaults: template.config.defaults || {},
      examples: template.config.examples || []
    };
  }
}

module.exports = TemplateManager; 