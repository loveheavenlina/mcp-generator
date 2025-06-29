/**
 * MCP功能测试
 * 测试MCP服务器和客户端的基本功能
 */

const assert = require('assert');
const MCP = require('../src/mcp');

/**
 * 测试基本MCP功能
 */
async function testBasicMCP() {
  console.log('🧪 开始基本MCP功能测试...');

  // 创建服务器
  const server = MCP.createServer({
    name: '测试服务器',
    version: '1.0.0'
  });

  // 注册测试工具
  server.registerTool(
    'echo',
    '回显输入的消息',
    {
      type: 'object',
      properties: {
        message: {
          type: MCP.TOOL_INPUT_TYPES.STRING,
          description: '要回显的消息'
        }
      },
      required: ['message']
    },
    async (args) => {
      return `回显: ${args.message}`;
    }
  );

  // 注册测试资源
  server.registerResource(
    'test://data',
    '测试数据',
    '测试用的静态数据',
    'application/json',
    async () => {
      return [
        {
          uri: 'test://data',
          mimeType: 'application/json',
          text: JSON.stringify({ test: 'data', timestamp: Date.now() })
        }
      ];
    }
  );

  // 创建客户端
  const client = MCP.createClient({
    name: '测试客户端',
    version: '1.0.0'
  });

  // 创建内存传输
  const serverTransport = MCP.createMemoryTransport();
  const clientTransport = MCP.createMemoryTransport();
  const connector = MCP.createTransportConnector(serverTransport, clientTransport);

  try {
    // 启动服务器
    server.start();

    // 连接传输
    connector.connect(server, client);

    // 初始化客户端
    const initResult = await client.initialize();
    assert(initResult.serverInfo.name === '测试服务器', '服务器信息不匹配');
    console.log('✅ 客户端初始化成功');

    // 测试工具列表
    const tools = await client.listTools();
    assert(tools.length === 1, '工具数量不正确');
    assert(tools[0].name === 'echo', '工具名称不正确');
    console.log('✅ 工具列表测试通过');

    // 测试工具调用
    const echoResult = await client.callTool('echo', { message: 'Hello MCP!' });
    assert(echoResult.content[0].text === '回显: Hello MCP!', '工具调用结果不正确');
    console.log('✅ 工具调用测试通过');

    // 测试资源列表
    const resources = await client.listResources();
    assert(resources.length === 1, '资源数量不正确');
    assert(resources[0].uri === 'test://data', '资源URI不正确');
    console.log('✅ 资源列表测试通过');

    // 测试资源读取
    const resourceContents = await client.readResource('test://data');
    const data = JSON.parse(resourceContents[0].text);
    assert(data.test === 'data', '资源内容不正确');
    console.log('✅ 资源读取测试通过');

    console.log('🎉 所有基本功能测试通过！');

  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    throw error;
  } finally {
    // 清理
    await connector.disconnect();
    server.stop();
  }
}

/**
 * 测试错误处理
 */
async function testErrorHandling() {
  console.log('\n🧪 开始错误处理测试...');

  const server = MCP.createServer({ name: '错误测试服务器' });
  const client = MCP.createClient({ name: '错误测试客户端' });

  // 注册一个会抛出错误的工具
  server.registerTool(
    'error_tool',
    '会抛出错误的测试工具',
    {
      type: 'object',
      properties: {
        shouldError: {
          type: MCP.TOOL_INPUT_TYPES.BOOLEAN,
          description: '是否应该抛出错误'
        }
      }
    },
    async (args) => {
      if (args.shouldError) {
        throw new Error('这是一个测试错误');
      }
      return '没有错误';
    }
  );

  const serverTransport = MCP.createMemoryTransport();
  const clientTransport = MCP.createMemoryTransport();
  const connector = MCP.createTransportConnector(serverTransport, clientTransport);

  try {
    server.start();
    connector.connect(server, client);
    await client.initialize();

    // 测试工具错误处理
    try {
      await client.callTool('error_tool', { shouldError: true });
      assert(false, '应该抛出错误');
    } catch (error) {
      assert(error.message.includes('这是一个测试错误'), '错误消息不正确');
      console.log('✅ 工具错误处理测试通过');
    }

    // 测试未知工具调用
    try {
      await client.callTool('unknown_tool', {});
      assert(false, '应该抛出错误');
    } catch (error) {
      assert(error.message.includes('未知工具'), '错误消息不正确');
      console.log('✅ 未知工具错误处理测试通过');
    }

    // 测试未知资源访问
    try {
      await client.readResource('unknown://resource');
      assert(false, '应该抛出错误');
    } catch (error) {
      assert(error.message.includes('未知资源'), '错误消息不正确');
      console.log('✅ 未知资源错误处理测试通过');
    }

    console.log('🎉 所有错误处理测试通过！');

  } catch (error) {
    console.error('❌ 错误处理测试失败:', error.message);
    throw error;
  } finally {
    await connector.disconnect();
    server.stop();
  }
}

/**
 * 测试消息类型
 */
function testMessageTypes() {
  console.log('\n🧪 开始消息类型测试...');

  // 测试请求消息
  const request = new MCP.MCPRequest('test_method', { param: 'value' });
  assert(request.jsonrpc === '2.0', 'JSON-RPC版本不正确');
  assert(request.method === 'test_method', '方法名不正确');
  assert(request.params.param === 'value', '参数不正确');
  assert(typeof request.id === 'string', 'ID类型不正确');
  console.log('✅ 请求消息测试通过');

  // 测试响应消息
  const response = new MCP.MCPResponse(request.id, { result: 'success' });
  assert(response.jsonrpc === '2.0', 'JSON-RPC版本不正确');
  assert(response.id === request.id, 'ID不匹配');
  assert(response.result.result === 'success', '结果不正确');
  console.log('✅ 响应消息测试通过');

  // 测试通知消息
  const notification = new MCP.MCPNotification('test_notification', { data: 'value' });
  assert(notification.jsonrpc === '2.0', 'JSON-RPC版本不正确');
  assert(notification.method === 'test_notification', '方法名不正确');
  assert(notification.params.data === 'value', '参数不正确');
  assert(notification.id === undefined, '通知不应该有ID');
  console.log('✅ 通知消息测试通过');

  // 测试错误对象
  const error = new MCP.MCPError(MCP.JSON_RPC_ERRORS.INVALID_PARAMS, '参数无效', { extra: 'info' });
  assert(error.code === MCP.JSON_RPC_ERRORS.INVALID_PARAMS, '错误代码不正确');
  assert(error.message === '参数无效', '错误消息不正确');
  assert(error.data.extra === 'info', '错误数据不正确');
  console.log('✅ 错误对象测试通过');

  console.log('🎉 所有消息类型测试通过！');
}

/**
 * 主测试函数
 */
async function runTests() {
  console.log('🚀 开始MCP功能测试\n');

  try {
    // 运行消息类型测试
    testMessageTypes();

    // 运行基本功能测试
    await testBasicMCP();

    // 运行错误处理测试
    await testErrorHandling();

    console.log('\n🎉 所有测试通过！MCP实现工作正常。');

  } catch (error) {
    console.error('\n❌ 测试失败:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// 如果直接运行此文件，则执行测试
if (require.main === module) {
  runTests();
}

module.exports = {
  testBasicMCP,
  testErrorHandling,
  testMessageTypes,
  runTests
}; 