/**
 * 配置管理器
 * 负责加载和管理全局配置
 */

const fs = require('fs-extra');
const path = require('path');
const os = require('os');

class ConfigManager {
  constructor() {
    this.config = {};
    this.configDir = path.join(os.homedir(), '.mcp-generator');
    this.configFile = path.join(this.configDir, 'config.json');
    this.defaultConfig = {
      outputDir: './generated',
      templateDir: './templates',
      author: os.userInfo().username || 'Unknown',
      encoding: 'utf8',
      overwrite: false,
      backup: true,
      prettify: true,
      log: {
        level: 'info',
        timestamp: true
      },
      templates: {
        defaultExtension: '.js',
        defaultEncoding: 'utf8'
      }
    };
  }

  /**
   * 加载配置
   */
  async loadConfig() {
    try {
      // 确保配置目录存在
      await fs.ensureDir(this.configDir);
      
      // 如果配置文件不存在，创建默认配置
      if (!(await fs.pathExists(this.configFile))) {
        await this.createDefaultConfig();
      }
      
      // 读取配置文件
      const userConfig = await fs.readJson(this.configFile);
      
      // 合并默认配置和用户配置
      this.config = { ...this.defaultConfig, ...userConfig };
      
      console.log('⚙️ 配置加载完成');
    } catch (error) {
      console.warn('⚠️ 加载配置失败，使用默认配置:', error.message);
      this.config = { ...this.defaultConfig };
    }
  }

  /**
   * 创建默认配置文件
   */
  async createDefaultConfig() {
    await fs.writeJson(this.configFile, this.defaultConfig, { spaces: 2 });
    console.log(`✅ 默认配置文件已创建: ${this.configFile}`);
  }

  /**
   * 保存配置
   */
  async saveConfig() {
    try {
      await fs.writeJson(this.configFile, this.config, { spaces: 2 });
      console.log('✅ 配置保存成功');
    } catch (error) {
      console.error('❌ 配置保存失败:', error.message);
      throw error;
    }
  }

  /**
   * 获取配置值
   */
  get(key, defaultValue = null) {
    const keys = key.split('.');
    let value = this.config;
    
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        return defaultValue;
      }
    }
    
    return value;
  }

  /**
   * 设置配置值
   */
  set(key, value) {
    const keys = key.split('.');
    let target = this.config;
    
    for (let i = 0; i < keys.length - 1; i++) {
      const k = keys[i];
      if (!(k in target) || typeof target[k] !== 'object') {
        target[k] = {};
      }
      target = target[k];
    }
    
    target[keys[keys.length - 1]] = value;
  }

  /**
   * 获取所有配置
   */
  getAll() {
    return { ...this.config };
  }

  /**
   * 重置配置为默认值
   */
  reset() {
    this.config = { ...this.defaultConfig };
  }

  /**
   * 更新配置
   */
  update(newConfig) {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * 获取输出目录
   */
  getOutputDir() {
    return path.resolve(this.get('outputDir'));
  }

  /**
   * 获取模板目录
   */
  getTemplateDir() {
    return path.resolve(this.get('templateDir'));
  }

  /**
   * 获取用户信息
   */
  getUserInfo() {
    return {
      author: this.get('author'),
      email: this.get('email', ''),
      website: this.get('website', '')
    };
  }

  /**
   * 检查是否需要备份
   */
  shouldBackup() {
    return this.get('backup', true);
  }

  /**
   * 检查是否允许覆盖
   */
  shouldOverwrite() {
    return this.get('overwrite', false);
  }

  /**
   * 获取日志配置
   */
  getLogConfig() {
    return this.get('log', { level: 'info', timestamp: true });
  }

  /**
   * 验证配置
   */
  validate() {
    const errors = [];
    
    // 验证输出目录
    const outputDir = this.get('outputDir');
    if (!outputDir || typeof outputDir !== 'string') {
      errors.push('输出目录配置无效');
    }
    
    // 验证作者信息
    const author = this.get('author');
    if (!author || typeof author !== 'string') {
      errors.push('作者信息配置无效');
    }
    
    // 验证编码
    const encoding = this.get('encoding');
    const validEncodings = ['utf8', 'utf16le', 'latin1', 'ascii'];
    if (!validEncodings.includes(encoding)) {
      errors.push('编码配置无效');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * 显示配置信息
   */
  displayConfig() {
    console.log('\n📋 当前配置:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`📁 输出目录: ${this.getOutputDir()}`);
    console.log(`📄 模板目录: ${this.getTemplateDir()}`);
    console.log(`👤 作者: ${this.get('author')}`);
    console.log(`📝 编码: ${this.get('encoding')}`);
    console.log(`🔄 覆盖文件: ${this.shouldOverwrite() ? '是' : '否'}`);
    console.log(`💾 创建备份: ${this.shouldBackup() ? '是' : '否'}`);
    console.log(`📊 日志级别: ${this.get('log.level')}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  }
}

module.exports = ConfigManager; 