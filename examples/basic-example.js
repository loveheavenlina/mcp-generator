/**
 * MCP服务器和客户端基本示例
 * 演示如何创建和使用MCP工具、资源和提示
 */

const fs = require('fs').promises;
const path = require('path');
const MCPServer = require('../src/mcp/server');
const MCPClient = require('../src/mcp/client');
const { MemoryTransport, TransportConnector } = require('../src/mcp/transport');
const { TOOL_INPUT_TYPES, LOG_LEVELS } = require('../src/mcp/types');

/**
 * 创建并配置MCP服务器
 */
function createServer() {
  const server = new MCPServer({
    name: '文件工具服务器',
    version: '1.0.0',
    description: '提供文件操作和计算工具的MCP服务器'
  });

  // 设置服务器能力
  server.setCapabilities({
    tools: {
      listChanged: true
    },
    resources: {
      subscribe: true,
      listChanged: true
    },
    prompts: {
      listChanged: true
    },
    logging: {
      level: LOG_LEVELS.INFO
    }
  });

  // 注册计算器工具
  server.registerTool(
    'calculator',
    '执行基本数学计算',
    {
      type: 'object',
      properties: {
        expression: {
          type: TOOL_INPUT_TYPES.STRING,
          description: '要计算的数学表达式，如 "2 + 3 * 4"'
        }
      },
      required: ['expression']
    },
    async (args) => {
      try {
        // 简单的数学表达式求值（仅支持基本运算）
        const expression = args.expression.replace(/[^0-9+\-*/().\s]/g, '');
        const result = eval(expression);
        return `计算结果: ${args.expression} = ${result}`;
      } catch (error) {
        throw new Error(`计算失败: ${error.message}`);
      }
    }
  );

  // 注册文件读取工具
  server.registerTool(
    'read_file',
    '读取文件内容',
    {
      type: 'object',
      properties: {
        path: {
          type: TOOL_INPUT_TYPES.STRING,
          description: '要读取的文件路径'
        },
        encoding: {
          type: TOOL_INPUT_TYPES.STRING,
          description: '文件编码，默认为utf8',
          default: 'utf8'
        }
      },
      required: ['path']
    },
    async (args) => {
      try {
        const content = await fs.readFile(args.path, args.encoding || 'utf8');
        return `文件内容 (${args.path}):\n${content}`;
      } catch (error) {
        throw new Error(`读取文件失败: ${error.message}`);
      }
    }
  );

  // 注册文件写入工具
  server.registerTool(
    'write_file',
    '写入文件内容',
    {
      type: 'object',
      properties: {
        path: {
          type: TOOL_INPUT_TYPES.STRING,
          description: '要写入的文件路径'
        },
        content: {
          type: TOOL_INPUT_TYPES.STRING,
          description: '要写入的内容'
        },
        encoding: {
          type: TOOL_INPUT_TYPES.STRING,
          description: '文件编码，默认为utf8',
          default: 'utf8'
        }
      },
      required: ['path', 'content']
    },
    async (args) => {
      try {
        await fs.writeFile(args.path, args.content, args.encoding || 'utf8');
        return `成功写入文件: ${args.path}`;
      } catch (error) {
        throw new Error(`写入文件失败: ${error.message}`);
      }
    }
  );

  // 注册当前目录资源
  server.registerResource(
    'file://current-directory',
    '当前目录',
    '当前工作目录的文件列表',
    'application/json',
    async () => {
      try {
        const files = await fs.readdir(process.cwd());
        const fileDetails = await Promise.all(
          files.map(async (file) => {
            const stats = await fs.stat(path.join(process.cwd(), file));
            return {
              name: file,
              type: stats.isDirectory() ? 'directory' : 'file',
              size: stats.size,
              modified: stats.mtime.toISOString()
            };
          })
        );
        
        return [
          {
            uri: 'file://current-directory',
            mimeType: 'application/json',
            text: JSON.stringify(fileDetails, null, 2)
          }
        ];
      } catch (error) {
        throw new Error(`读取目录失败: ${error.message}`);
      }
    }
  );

  // 注册代码生成提示
  server.registerPrompt(
    'code-generator',
    '代码生成提示模板',
    [
      {
        name: 'language',
        description: '编程语言',
        required: true
      },
      {
        name: 'functionality',
        description: '功能描述',
        required: true
      },
      {
        name: 'style',
        description: '代码风格（可选）',
        required: false
      }
    ],
    async (args) => {
      const { language, functionality, style } = args;
      const styleHint = style ? ` 使用${style}风格` : '';
      
      return {
        description: '代码生成提示',
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: `请用${language}编程语言编写一个${functionality}的代码${styleHint}。要求代码清晰、注释完整、遵循最佳实践。`
            }
          }
        ]
      };
    }
  );

  // 设置日志处理
  server.on('log', (logEntry) => {
    const timestamp = new Date(logEntry.timestamp).toLocaleString('zh-CN');
    console.log(`[${timestamp}] [${logEntry.level.toUpperCase()}] ${logEntry.message}`);
    if (logEntry.data) {
      console.log('  数据:', JSON.stringify(logEntry.data, null, 2));
    }
  });

  return server;
}

/**
 * 创建并配置MCP客户端
 */
function createClient() {
  const client = new MCPClient({
    name: 'MCP测试客户端',
    version: '1.0.0',
    description: '用于测试MCP服务器功能的客户端'
  });

  // 设置日志处理
  client.on('log', (logEntry) => {
    const timestamp = new Date(logEntry.timestamp).toLocaleString('zh-CN');
    console.log(`[客户端] [${timestamp}] [${logEntry.level.toUpperCase()}] ${logEntry.message}`);
    if (logEntry.data) {
      console.log('  数据:', JSON.stringify(logEntry.data, null, 2));
    }
  });

  // 监听服务器消息
  client.on('server_message', (message) => {
    console.log('收到服务器消息:', message);
  });

  client.on('tools_changed', () => {
    console.log('工具列表已更新');
  });

  client.on('resources_updated', () => {
    console.log('资源已更新');
  });

  return client;
}

/**
 * 演示工具调用
 */
async function demonstrateTools(client) {
  console.log('\n=== 工具演示 ===');
  
  try {
    // 获取工具列表
    const tools = await client.listTools();
    console.log(`可用工具数量: ${tools.length}`);
    tools.forEach(tool => {
      console.log(`- ${tool.name}: ${tool.description}`);
    });

    // 演示计算器工具
    console.log('\n测试计算器工具:');
    const calcResult = await client.callTool('calculator', {
      expression: '10 + 5 * 2'
    });
    console.log(calcResult.content[0].text);

    // 演示文件写入工具
    console.log('\n测试文件写入工具:');
    const writeResult = await client.callTool('write_file', {
      path: 'test-output.txt',
      content: 'Hello from MCP Server!\n这是一个测试文件。'
    });
    console.log(writeResult.content[0].text);

    // 演示文件读取工具
    console.log('\n测试文件读取工具:');
    const readResult = await client.callTool('read_file', {
      path: 'test-output.txt'
    });
    console.log(readResult.content[0].text);

  } catch (error) {
    console.error('工具演示错误:', error.message);
  }
}

/**
 * 演示资源访问
 */
async function demonstrateResources(client) {
  console.log('\n=== 资源演示 ===');
  
  try {
    // 获取资源列表
    const resources = await client.listResources();
    console.log(`可用资源数量: ${resources.length}`);
    resources.forEach(resource => {
      console.log(`- ${resource.uri}: ${resource.name}`);
    });

    // 读取当前目录资源
    if (resources.length > 0) {
      const contents = await client.readResource(resources[0].uri);
      console.log('\n当前目录内容:');
      const directoryData = JSON.parse(contents[0].text);
      directoryData.slice(0, 5).forEach(item => { // 只显示前5个项目
        console.log(`  ${item.type === 'directory' ? '📁' : '📄'} ${item.name} (${item.size} bytes)`);
      });
      if (directoryData.length > 5) {
        console.log(`  ... 还有 ${directoryData.length - 5} 个项目`);
      }
    }

  } catch (error) {
    console.error('资源演示错误:', error.message);
  }
}

/**
 * 演示提示功能
 */
async function demonstratePrompts(client) {
  console.log('\n=== 提示演示 ===');
  
  try {
    // 获取提示列表
    const prompts = await client.listPrompts();
    console.log(`可用提示数量: ${prompts.length}`);
    prompts.forEach(prompt => {
      console.log(`- ${prompt.name}: ${prompt.description}`);
    });

    // 获取代码生成提示
    if (prompts.length > 0) {
      const prompt = await client.getPrompt('code-generator', {
        language: 'JavaScript',
        functionality: '排序算法',
        style: '函数式编程'
      });
      console.log('\n生成的提示:');
      console.log(prompt.messages[0].content.text);
    }

  } catch (error) {
    console.error('提示演示错误:', error.message);
  }
}

/**
 * 主函数
 */
async function main() {
  console.log('🚀 启动MCP服务器和客户端演示\n');

  // 创建服务器和客户端
  const server = createServer();
  const client = createClient();

  // 创建内存传输
  const serverTransport = new MemoryTransport();
  const clientTransport = new MemoryTransport();

  // 创建传输连接器
  const connector = new TransportConnector(serverTransport, clientTransport);

  try {
    // 启动服务器
    server.start();

    // 连接传输
    connector.connect(server, client);

    // 初始化客户端
    await client.initialize();

    console.log('✅ 服务器和客户端连接成功！');
    
    // 演示各种功能
    await demonstrateTools(client);
    await demonstrateResources(client);
    await demonstratePrompts(client);

    console.log('\n✅ 演示完成！');

  } catch (error) {
    console.error('❌ 演示失败:', error.message);
  } finally {
    // 清理
    await connector.disconnect();
    server.stop();
    console.log('\n👋 演示结束');
  }
}

// 如果直接运行此文件，则执行主函数
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  createServer,
  createClient,
  main
}; 