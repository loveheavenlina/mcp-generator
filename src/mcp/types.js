/**
 * MCP (Model Context Protocol) 类型定义
 * 基于JSON-RPC 2.0协议
 */

// MCP协议版本
const MCP_VERSION = '2024-11-05';

// JSON-RPC错误代码
const JSON_RPC_ERRORS = {
  PARSE_ERROR: -32700,
  INVALID_REQUEST: -32600,
  METHOD_NOT_FOUND: -32601,
  INVALID_PARAMS: -32602,
  INTERNAL_ERROR: -32603
};

// MCP特定错误代码
const MCP_ERRORS = {
  UNKNOWN_TOOL: -32000,
  UNKNOWN_RESOURCE: -32001,
  TOOL_EXECUTION_ERROR: -32002,
  RESOURCE_ACCESS_ERROR: -32003
};

// MCP消息类型
const MESSAGE_TYPES = {
  REQUEST: 'request',
  RESPONSE: 'response',
  NOTIFICATION: 'notification'
};

// MCP方法名称
const MCP_METHODS = {
  // 初始化
  INITIALIZE: 'initialize',
  INITIALIZED: 'initialized',
  
  // 工具相关
  TOOLS_LIST: 'tools/list',
  TOOLS_CALL: 'tools/call',
  
  // 资源相关
  RESOURCES_LIST: 'resources/list',
  RESOURCES_READ: 'resources/read',
  RESOURCES_SUBSCRIBE: 'resources/subscribe',
  RESOURCES_UNSUBSCRIBE: 'resources/unsubscribe',
  
  // 提示相关
  PROMPTS_LIST: 'prompts/list',
  PROMPTS_GET: 'prompts/get',
  
  // 通知
  NOTIFICATIONS_CANCELLED: 'notifications/cancelled',
  NOTIFICATIONS_PROGRESS: 'notifications/progress',
  NOTIFICATIONS_MESSAGE: 'notifications/message',
  NOTIFICATIONS_RESOURCES_UPDATED: 'notifications/resources/updated',
  NOTIFICATIONS_TOOLS_CHANGED: 'notifications/tools/list_changed',
  NOTIFICATIONS_PROMPTS_CHANGED: 'notifications/prompts/list_changed',
  
  // 日志
  LOGGING_SET_LEVEL: 'logging/setLevel'
};

// 日志级别
const LOG_LEVELS = {
  DEBUG: 'debug',
  INFO: 'info',
  NOTICE: 'notice',
  WARNING: 'warning',
  ERROR: 'error',
  CRITICAL: 'critical',
  ALERT: 'alert',
  EMERGENCY: 'emergency'
};

// 工具输入类型
const TOOL_INPUT_TYPES = {
  STRING: 'string',
  NUMBER: 'number',
  BOOLEAN: 'boolean',
  OBJECT: 'object',
  ARRAY: 'array'
};

// 资源类型
const RESOURCE_TYPES = {
  TEXT: 'text',
  BLOB: 'blob'
};

/**
 * MCP消息基类
 */
class MCPMessage {
  constructor(jsonrpc = '2.0') {
    this.jsonrpc = jsonrpc;
  }
}

/**
 * MCP请求消息
 */
class MCPRequest extends MCPMessage {
  constructor(method, params = null, id = null) {
    super();
    this.method = method;
    this.params = params;
    this.id = id || this._generateId();
  }

  _generateId() {
    return Math.random().toString(36).substr(2, 9);
  }
}

/**
 * MCP响应消息
 */
class MCPResponse extends MCPMessage {
  constructor(id, result = null, error = null) {
    super();
    this.id = id;
    if (error) {
      this.error = error;
    } else {
      this.result = result;
    }
  }
}

/**
 * MCP通知消息
 */
class MCPNotification extends MCPMessage {
  constructor(method, params = null) {
    super();
    this.method = method;
    this.params = params;
  }
}

/**
 * MCP错误对象
 */
class MCPError {
  constructor(code, message, data = null) {
    this.code = code;
    this.message = message;
    if (data) {
      this.data = data;
    }
  }
}

/**
 * 工具定义
 */
class Tool {
  constructor(name, description, inputSchema = {}) {
    this.name = name;
    this.description = description;
    this.inputSchema = inputSchema;
  }
}

/**
 * 资源定义
 */
class Resource {
  constructor(uri, name, description = null, mimeType = null) {
    this.uri = uri;
    this.name = name;
    this.description = description;
    this.mimeType = mimeType;
  }
}

/**
 * 提示定义
 */
class Prompt {
  constructor(name, description, arguments_ = []) {
    this.name = name;
    this.description = description;
    this.arguments = arguments_;
  }
}

module.exports = {
  MCP_VERSION,
  JSON_RPC_ERRORS,
  MCP_ERRORS,
  MESSAGE_TYPES,
  MCP_METHODS,
  LOG_LEVELS,
  TOOL_INPUT_TYPES,
  RESOURCE_TYPES,
  MCPMessage,
  MCPRequest,
  MCPResponse,
  MCPNotification,
  MCPError,
  Tool,
  Resource,
  Prompt
}; 