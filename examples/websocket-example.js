/**
 * MCP WebSocket服务器和客户端示例
 * 演示如何通过WebSocket网络连接使用MCP
 */

const WebSocket = require('ws');
const MCPServer = require('../src/mcp/server');
const MCPClient = require('../src/mcp/client');
const { WebSocketTransport, TransportConnector } = require('../src/mcp/transport');
const { TOOL_INPUT_TYPES, LOG_LEVELS } = require('../src/mcp/types');

/**
 * 创建WebSocket MCP服务器
 */
function createWebSocketServer(port = 8080) {
  const server = new MCPServer({
    name: 'WebSocket MCP服务器',
    version: '1.0.0',
    description: '通过WebSocket提供服务的MCP服务器'
  });

  // 设置服务器能力
  server.setCapabilities({
    tools: { listChanged: true },
    resources: { subscribe: true, listChanged: true },
    prompts: { listChanged: true },
    logging: { level: LOG_LEVELS.INFO }
  });

  // 注册时间工具
  server.registerTool(
    'current_time',
    '获取当前时间',
    {
      type: 'object',
      properties: {
        timezone: {
          type: TOOL_INPUT_TYPES.STRING,
          description: '时区（可选），如 "Asia/Shanghai"',
          default: 'Asia/Shanghai'
        },
        format: {
          type: TOOL_INPUT_TYPES.STRING,
          description: '时间格式（可选）',
          default: 'full'
        }
      }
    },
    async (args) => {
      const now = new Date();
      const timezone = args.timezone || 'Asia/Shanghai';
      
      let timeString;
      if (args.format === 'iso') {
        timeString = now.toISOString();
      } else {
        timeString = now.toLocaleString('zh-CN', { 
          timeZone: timezone,
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        });
      }
      
      return `当前时间: ${timeString} (${timezone})`;
    }
  );

  // 注册随机数生成工具
  server.registerTool(
    'random_number',
    '生成随机数',
    {
      type: 'object',
      properties: {
        min: {
          type: TOOL_INPUT_TYPES.NUMBER,
          description: '最小值',
          default: 0
        },
        max: {
          type: TOOL_INPUT_TYPES.NUMBER,
          description: '最大值',
          default: 100
        },
        count: {
          type: TOOL_INPUT_TYPES.NUMBER,
          description: '生成数量',
          default: 1
        }
      }
    },
    async (args) => {
      const min = args.min || 0;
      const max = args.max || 100;
      const count = args.count || 1;
      
      const numbers = [];
      for (let i = 0; i < count; i++) {
        numbers.push(Math.floor(Math.random() * (max - min + 1)) + min);
      }
      
      return `生成的随机数: ${numbers.join(', ')}`;
    }
  );

  // 注册系统信息资源
  server.registerResource(
    'system://info',
    '系统信息',
    '服务器系统信息',
    'application/json',
    async () => {
      const info = {
        platform: process.platform,
        arch: process.arch,
        nodeVersion: process.version,
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        timestamp: new Date().toISOString()
      };
      
      return [
        {
          uri: 'system://info',
          mimeType: 'application/json',
          text: JSON.stringify(info, null, 2)
        }
      ];
    }
  );

  // 设置日志处理
  server.on('log', (logEntry) => {
    const timestamp = new Date(logEntry.timestamp).toLocaleString('zh-CN');
    console.log(`[服务器] [${timestamp}] [${logEntry.level.toUpperCase()}] ${logEntry.message}`);
  });

  // 创建WebSocket服务器
  const wsServer = new WebSocket.Server({ port });
  console.log(`🌐 WebSocket MCP服务器启动，监听端口: ${port}`);

  wsServer.on('connection', (ws, req) => {
    console.log(`📱 新客户端连接: ${req.socket.remoteAddress}`);
    
    // 为每个连接创建一个传输实例
    const transport = new WebSocketTransport();
    transport.ws = ws;
    transport.isConnected = true;

    // 设置WebSocket事件处理
    ws.on('message', async (data) => {
      try {
        const response = await server.handleMessage(data.toString());
        if (response) {
          ws.send(JSON.stringify(response));
        }
      } catch (error) {
        console.error('处理消息错误:', error);
      }
    });

    ws.on('close', () => {
      console.log('📱 客户端断开连接');
      transport.isConnected = false;
    });

    ws.on('error', (error) => {
      console.error('WebSocket错误:', error);
    });

    // 设置服务器输出处理
    const handleServerOutput = async (message) => {
      if (transport.isConnected) {
        ws.send(JSON.stringify(message));
      }
    };

    server.on('response', handleServerOutput);
    server.on('notification_out', handleServerOutput);

    // 启动服务器（如果还未启动）
    if (!server.isInitialized) {
      server.start();
    }

    // 清理函数
    ws.on('close', () => {
      server.removeListener('response', handleServerOutput);
      server.removeListener('notification_out', handleServerOutput);
    });
  });

  return { server, wsServer };
}

/**
 * 创建WebSocket MCP客户端
 */
async function createWebSocketClient(url = 'ws://localhost:8080') {
  const client = new MCPClient({
    name: 'WebSocket MCP客户端',
    version: '1.0.0',
    description: '通过WebSocket连接的MCP客户端'
  });

  // 创建WebSocket传输
  const transport = new WebSocketTransport(url, WebSocket);

  // 设置日志处理
  client.on('log', (logEntry) => {
    const timestamp = new Date(logEntry.timestamp).toLocaleString('zh-CN');
    console.log(`[客户端] [${timestamp}] [${logEntry.level.toUpperCase()}] ${logEntry.message}`);
  });

  // 连接WebSocket
  await transport.connect();

  // 设置消息处理
  transport.on('message', async (message) => {
    await client.handleMessage(message);
  });

  // 设置客户端输出处理
  client.on('request_out', async (request) => {
    await transport.send(request);
  });

  client.on('notification_out', async (notification) => {
    await transport.send(notification);
  });

  return { client, transport };
}

/**
 * 演示WebSocket功能
 */
async function demonstrateWebSocketFeatures(client) {
  console.log('\n=== WebSocket MCP功能演示 ===');

  try {
    // 初始化客户端
    await client.initialize();
    console.log('✅ 客户端初始化成功');

    // 获取并调用工具
    const tools = await client.listTools();
    console.log(`\n可用工具: ${tools.length}个`);
    
    for (const tool of tools) {
      console.log(`- ${tool.name}: ${tool.description}`);
    }

    // 测试时间工具
    console.log('\n测试时间工具:');
    const timeResult = await client.callTool('current_time', {
      timezone: 'Asia/Shanghai',
      format: 'full'
    });
    console.log(timeResult.content[0].text);

    // 测试随机数工具
    console.log('\n测试随机数工具:');
    const randomResult = await client.callTool('random_number', {
      min: 1,
      max: 10,
      count: 5
    });
    console.log(randomResult.content[0].text);

    // 获取系统信息资源
    console.log('\n获取系统信息:');
    const resources = await client.listResources();
    if (resources.length > 0) {
      const systemInfo = await client.readResource(resources[0].uri);
      const info = JSON.parse(systemInfo[0].text);
      console.log(`平台: ${info.platform} (${info.arch})`);
      console.log(`Node.js版本: ${info.nodeVersion}`);
      console.log(`运行时间: ${Math.floor(info.uptime)} 秒`);
      console.log(`内存使用: ${Math.round(info.memory.used / 1024 / 1024)} MB`);
    }

  } catch (error) {
    console.error('WebSocket功能演示错误:', error.message);
  }
}

/**
 * 主函数 - 服务器模式
 */
async function runServer(port = 8080) {
  console.log('🚀 启动WebSocket MCP服务器');
  const { server, wsServer } = createWebSocketServer(port);
  
  // 处理优雅关闭
  process.on('SIGINT', () => {
    console.log('\n📱 正在关闭服务器...');
    wsServer.close(() => {
      server.stop();
      console.log('👋 服务器已关闭');
      process.exit(0);
    });
  });

  console.log(`✅ 服务器运行中，使用 Ctrl+C 停止`);
}

/**
 * 主函数 - 客户端模式
 */
async function runClient(url = 'ws://localhost:8080') {
  console.log('🚀 启动WebSocket MCP客户端');
  
  try {
    const { client, transport } = await createWebSocketClient(url);
    console.log('✅ 连接到服务器成功');
    
    await demonstrateWebSocketFeatures(client);
    
    console.log('\n✅ 演示完成');
    await transport.disconnect();
    console.log('👋 客户端已断开连接');
    
  } catch (error) {
    console.error('❌ 客户端错误:', error.message);
  }
}

// 命令行参数处理
const args = process.argv.slice(2);
const mode = args[0] || 'demo';

if (require.main === module) {
  if (mode === 'server') {
    const port = parseInt(args[1]) || 8080;
    runServer(port);
  } else if (mode === 'client') {
    const url = args[1] || 'ws://localhost:8080';
    runClient(url);
  } else {
    console.log('📖 WebSocket MCP示例用法:');
    console.log('');
    console.log('启动服务器: node websocket-example.js server [port]');
    console.log('启动客户端: node websocket-example.js client [url]');
    console.log('');
    console.log('示例:');
    console.log('  node websocket-example.js server 8080');
    console.log('  node websocket-example.js client ws://localhost:8080');
    console.log('');
    console.log('默认端口: 8080');
    console.log('默认URL: ws://localhost:8080');
  }
}

module.exports = {
  createWebSocketServer,
  createWebSocketClient,
  runServer,
  runClient
}; 