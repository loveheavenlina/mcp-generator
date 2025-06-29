/**
 * MCP (Model Context Protocol) 主入口文件
 * 统一导出所有MCP相关模块
 */

// 核心类型和常量
const types = require('./types');

// 服务器和客户端
const MCPServer = require('./server');
const MCPClient = require('./client');

// 传输层
const transport = require('./transport');

// 导出所有模块
module.exports = {
  // 类型和常量
  ...types,
  
  // 核心类
  MCPServer,
  MCPClient,
  
  // 传输类
  ...transport,
  
  // 便捷工厂函数
  createServer: (serverInfo) => new MCPServer(serverInfo),
  createClient: (clientInfo) => new MCPClient(clientInfo),
  createMemoryTransport: () => new transport.MemoryTransport(),
  createWebSocketTransport: (url, WebSocket) => new transport.WebSocketTransport(url, WebSocket),
  createStdioTransport: () => new transport.StdioTransport(),
  createTransportConnector: (serverTransport, clientTransport) => 
    new transport.TransportConnector(serverTransport, clientTransport),
  
  // 版本信息
  version: require('../../package.json').version || '1.0.0'
}; 