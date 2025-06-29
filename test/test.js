/**
 * MCP代码生成器测试文件
 * 验证各个模块的基本功能
 */

const fs = require('fs-extra');
const path = require('path');
const MCPGenerator = require('../packages/code-generator/src/index');

async function runTests() {
  console.log('🧪 开始测试MCP代码生成器...\n');
  
  try {
    // 测试1: 初始化生成器
    console.log('📋 测试1: 初始化生成器');
    const generator = new MCPGenerator();
    await generator.init();
    console.log('✅ 生成器初始化成功\n');
    
    // 测试2: 获取模板列表
    console.log('📋 测试2: 获取模板列表');
    const templates = generator.getAvailableTemplates();
    console.log(`✅ 找到 ${templates.length} 个模板:`);
    templates.forEach(template => {
      console.log(`   - ${template.name}: ${template.description}`);
    });
    console.log('');
    
    // 测试3: 测试JavaScript类模板生成
    if (generator.templateManager.hasTemplate('js-class')) {
      console.log('📋 测试3: 生成JavaScript类');
      const data = {
        className: 'TestClass',
        description: '测试类',
        author: 'Test Author'
      };
      
      const outputPath = './test-output/TestClass.js';
      await generator.generate('js-class', data, outputPath);
      
      // 验证文件是否生成
      if (await fs.pathExists(outputPath)) {
        console.log('✅ JavaScript类生成成功');
        const content = await fs.readFile(outputPath, 'utf8');
        console.log('   生成的内容包含:');
        console.log(`   - 类名: ${content.includes('TestClass') ? '✓' : '✗'}`);
        console.log(`   - 描述: ${content.includes('测试类') ? '✓' : '✗'}`);
        console.log(`   - 作者: ${content.includes('Test Author') ? '✓' : '✗'}`);
      } else {
        console.log('❌ JavaScript类生成失败');
      }
      console.log('');
    }
    
    // 测试4: 测试Express路由模板生成
    if (generator.templateManager.hasTemplate('express-route')) {
      console.log('📋 测试4: 生成Express路由');
      const data = {
        routeName: 'user',
        description: '用户管理路由',
        basePath: '/api/users'
      };
      
      const outputPath = './test-output/userRoutes.js';
      await generator.generate('express-route', data, outputPath);
      
      // 验证文件是否生成
      if (await fs.pathExists(outputPath)) {
        console.log('✅ Express路由生成成功');
        const content = await fs.readFile(outputPath, 'utf8');
        console.log('   生成的内容包含:');
        console.log(`   - 路由名: ${content.includes('user') ? '✓' : '✗'}`);
        console.log(`   - Express路由: ${content.includes('router') ? '✓' : '✗'}`);
        console.log(`   - API路径: ${content.includes('/api/users') ? '✓' : '✗'}`);
      } else {
        console.log('❌ Express路由生成失败');
      }
      console.log('');
    }
    
    // 测试5: 测试React组件多文件生成
    if (generator.templateManager.hasTemplate('react-component')) {
      console.log('📋 测试5: 生成React组件');
      const data = {
        componentName: 'TestButton',
        description: '测试按钮组件'
      };
      
      const outputPath = './test-output/react-component';
      const result = await generator.generate('react-component', data, outputPath);
      
      console.log('✅ React组件生成成功');
      console.log(`   生成了 ${result.generatedFiles.length} 个文件:`);
      result.generatedFiles.forEach(file => {
        console.log(`   - ${path.basename(file)}`);
      });
      console.log('');
    }
    
    // 测试6: 配置管理测试
    console.log('📋 测试6: 配置管理');
    const config = generator.configManager.getAll();
    console.log('✅ 配置管理正常');
    console.log(`   输出目录: ${config.outputDir}`);
    console.log(`   作者: ${config.author}`);
    console.log(`   编码: ${config.encoding}`);
    console.log('');
    
    console.log('🎉 所有测试完成！');
    console.log('📁 测试输出文件保存在 ./test-output 目录中');
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// 清理测试输出
async function cleanup() {
  try {
    await fs.remove('./test-output');
    console.log('🧹 清理测试文件完成');
  } catch (error) {
    console.warn('⚠️ 清理测试文件时出现警告:', error.message);
  }
}

// 如果直接运行此文件，执行测试
if (require.main === module) {
  runTests().finally(cleanup);
}

module.exports = { runTests, cleanup }; 