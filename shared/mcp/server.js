/**
 * MCP Server 实现
 * 基于JSON-RPC 2.0协议的MCP服务器
 */

const EventEmitter = require('events');
const {
  MCP_VERSION,
  JSON_RPC_ERRORS,
  MCP_ERRORS,
  MCP_METHODS,
  LOG_LEVELS,
  MCPRequest,
  MCPResponse,
  MCPNotification,
  MCPError,
  Tool,
  Resource,
  Prompt
} = require('./types');

/**
 * MCP服务器类
 */
class MCPServer extends EventEmitter {
  constructor(serverInfo = {}) {
    super();
    
    this.serverInfo = {
      name: serverInfo.name || 'MCP Server',
      version: serverInfo.version || '1.0.0',
      ...serverInfo
    };
    
    this.tools = new Map();
    this.resources = new Map();
    this.prompts = new Map();
    this.capabilities = {
      tools: {},
      resources: {},
      prompts: {},
      logging: {}
    };
    
    this.isInitialized = false;
    this.logLevel = LOG_LEVELS.INFO;
    
    // 注册默认处理器
    this._setupDefaultHandlers();
  }

  /**
   * 设置默认消息处理器
   */
  _setupDefaultHandlers() {
    this.on('request', this._handleRequest.bind(this));
    this.on('notification', this._handleNotification.bind(this));
  }

  /**
   * 处理传入的消息
   */
  async handleMessage(message) {
    try {
      const parsed = typeof message === 'string' ? JSON.parse(message) : message;
      
      if (parsed.method) {
        if (parsed.id !== undefined) {
          // 这是一个请求
          this.emit('request', parsed);
        } else {
          // 这是一个通知
          this.emit('notification', parsed);
        }
      } else if (parsed.result !== undefined || parsed.error !== undefined) {
        // 这是一个响应（通常由客户端处理）
        this.emit('response', parsed);
      }
    } catch (error) {
      this.log(LOG_LEVELS.ERROR, '解析消息失败', { error: error.message, message });
      return this._createErrorResponse(null, JSON_RPC_ERRORS.PARSE_ERROR, '解析错误');
    }
  }

  /**
   * 处理请求消息
   */
  async _handleRequest(request) {
    try {
      let response;
      
      switch (request.method) {
        case MCP_METHODS.INITIALIZE:
          response = await this._handleInitialize(request);
          break;
          
        case MCP_METHODS.TOOLS_LIST:
          response = await this._handleToolsList(request);
          break;
          
        case MCP_METHODS.TOOLS_CALL:
          response = await this._handleToolsCall(request);
          break;
          
        case MCP_METHODS.RESOURCES_LIST:
          response = await this._handleResourcesList(request);
          break;
          
        case MCP_METHODS.RESOURCES_READ:
          response = await this._handleResourcesRead(request);
          break;
          
        case MCP_METHODS.PROMPTS_LIST:
          response = await this._handlePromptsList(request);
          break;
          
        case MCP_METHODS.PROMPTS_GET:
          response = await this._handlePromptsGet(request);
          break;
          
        default:
          response = this._createErrorResponse(
            request.id,
            JSON_RPC_ERRORS.METHOD_NOT_FOUND,
            `方法未找到: ${request.method}`
          );
      }
      
      this.emit('response', response);
      return response;
      
    } catch (error) {
      this.log(LOG_LEVELS.ERROR, '处理请求失败', { error: error.message, request });
      const errorResponse = this._createErrorResponse(
        request.id,
        JSON_RPC_ERRORS.INTERNAL_ERROR,
        '内部服务器错误'
      );
      this.emit('response', errorResponse);
      return errorResponse;
    }
  }

  /**
   * 处理通知消息
   */
  async _handleNotification(notification) {
    try {
      switch (notification.method) {
        case MCP_METHODS.INITIALIZED:
          this.isInitialized = true;
          this.log(LOG_LEVELS.INFO, '客户端初始化完成');
          break;
          
        case MCP_METHODS.LOGGING_SET_LEVEL:
          if (notification.params && notification.params.level) {
            this.logLevel = notification.params.level;
            this.log(LOG_LEVELS.INFO, `日志级别设置为: ${this.logLevel}`);
          }
          break;
          
        default:
          this.log(LOG_LEVELS.WARNING, `未知通知: ${notification.method}`);
      }
    } catch (error) {
      this.log(LOG_LEVELS.ERROR, '处理通知失败', { error: error.message, notification });
    }
  }

  /**
   * 处理初始化请求
   */
  async _handleInitialize(request) {
    const params = request.params || {};
    
    this.log(LOG_LEVELS.INFO, '收到初始化请求', params);
    
    const result = {
      protocolVersion: MCP_VERSION,
      capabilities: this.capabilities,
      serverInfo: this.serverInfo
    };
    
    return new MCPResponse(request.id, result);
  }

  /**
   * 处理工具列表请求
   */
  async _handleToolsList(request) {
    const tools = Array.from(this.tools.values());
    return new MCPResponse(request.id, { tools });
  }

  /**
   * 处理工具调用请求
   */
  async _handleToolsCall(request) {
    const { name, arguments: args } = request.params || {};
    
    if (!name) {
      return this._createErrorResponse(
        request.id,
        JSON_RPC_ERRORS.INVALID_PARAMS,
        '缺少工具名称'
      );
    }
    
    const tool = this.tools.get(name);
    if (!tool) {
      return this._createErrorResponse(
        request.id,
        MCP_ERRORS.UNKNOWN_TOOL,
        `未知工具: ${name}`
      );
    }
    
    try {
      const result = await tool.handler(args || {});
      return new MCPResponse(request.id, {
        content: [
          {
            type: 'text',
            text: typeof result === 'string' ? result : JSON.stringify(result, null, 2)
          }
        ]
      });
    } catch (error) {
      this.log(LOG_LEVELS.ERROR, `工具执行失败: ${name}`, { error: error.message });
      return this._createErrorResponse(
        request.id,
        MCP_ERRORS.TOOL_EXECUTION_ERROR,
        `工具执行失败: ${error.message}`
      );
    }
  }

  /**
   * 处理资源列表请求
   */
  async _handleResourcesList(request) {
    const resources = Array.from(this.resources.values()).map(resource => ({
      uri: resource.uri,
      name: resource.name,
      description: resource.description,
      mimeType: resource.mimeType
    }));
    return new MCPResponse(request.id, { resources });
  }

  /**
   * 处理资源读取请求
   */
  async _handleResourcesRead(request) {
    const { uri } = request.params || {};
    
    if (!uri) {
      return this._createErrorResponse(
        request.id,
        JSON_RPC_ERRORS.INVALID_PARAMS,
        '缺少资源URI'
      );
    }
    
    const resource = this.resources.get(uri);
    if (!resource) {
      return this._createErrorResponse(
        request.id,
        MCP_ERRORS.UNKNOWN_RESOURCE,
        `未知资源: ${uri}`
      );
    }
    
    try {
      const contents = await resource.handler();
      return new MCPResponse(request.id, { contents });
    } catch (error) {
      this.log(LOG_LEVELS.ERROR, `资源读取失败: ${uri}`, { error: error.message });
      return this._createErrorResponse(
        request.id,
        MCP_ERRORS.RESOURCE_ACCESS_ERROR,
        `资源访问失败: ${error.message}`
      );
    }
  }

  /**
   * 处理提示列表请求
   */
  async _handlePromptsList(request) {
    const prompts = Array.from(this.prompts.values()).map(prompt => ({
      name: prompt.name,
      description: prompt.description,
      arguments: prompt.arguments
    }));
    return new MCPResponse(request.id, { prompts });
  }

  /**
   * 处理提示获取请求
   */
  async _handlePromptsGet(request) {
    const { name, arguments: args } = request.params || {};
    
    if (!name) {
      return this._createErrorResponse(
        request.id,
        JSON_RPC_ERRORS.INVALID_PARAMS,
        '缺少提示名称'
      );
    }
    
    const prompt = this.prompts.get(name);
    if (!prompt) {
      return this._createErrorResponse(
        request.id,
        MCP_ERRORS.UNKNOWN_RESOURCE,
        `未知提示: ${name}`
      );
    }
    
    try {
      const result = await prompt.handler(args || {});
      return new MCPResponse(request.id, result);
    } catch (error) {
      this.log(LOG_LEVELS.ERROR, `提示生成失败: ${name}`, { error: error.message });
      return this._createErrorResponse(
        request.id,
        JSON_RPC_ERRORS.INTERNAL_ERROR,
        `提示生成失败: ${error.message}`
      );
    }
  }

  /**
   * 注册工具
   */
  registerTool(name, description, inputSchema, handler) {
    const tool = new Tool(name, description, inputSchema);
    tool.handler = handler;
    this.tools.set(name, tool);
    this.log(LOG_LEVELS.INFO, `注册工具: ${name}`);
    
    // 发送工具变更通知
    if (this.isInitialized) {
      this.sendNotification(MCP_METHODS.NOTIFICATIONS_TOOLS_CHANGED);
    }
  }

  /**
   * 注册资源
   */
  registerResource(uri, name, description, mimeType, handler) {
    const resource = new Resource(uri, name, description, mimeType);
    resource.handler = handler;
    this.resources.set(uri, resource);
    this.log(LOG_LEVELS.INFO, `注册资源: ${uri}`);
  }

  /**
   * 注册提示
   */
  registerPrompt(name, description, arguments_, handler) {
    const prompt = new Prompt(name, description, arguments_);
    prompt.handler = handler;
    this.prompts.set(name, prompt);
    this.log(LOG_LEVELS.INFO, `注册提示: ${name}`);
    
    // 发送提示变更通知
    if (this.isInitialized) {
      this.sendNotification(MCP_METHODS.NOTIFICATIONS_PROMPTS_CHANGED);
    }
  }

  /**
   * 发送通知
   */
  sendNotification(method, params = null) {
    const notification = new MCPNotification(method, params);
    try {
      this.emit('notification_out', notification);
    } catch (error) {
      // 忽略发送通知时的错误（如传输已断开）
    }
    return notification;
  }

  /**
   * 创建错误响应
   */
  _createErrorResponse(id, code, message, data = null) {
    const error = new MCPError(code, message, data);
    return new MCPResponse(id, null, error);
  }

  /**
   * 日志记录
   */
  log(level, message, data = null) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      data
    };
    
    this.emit('log', logEntry);
    
    // 发送日志通知（只在初始化且未停止时）
    if (this.isInitialized) {
      try {
        this.sendNotification(MCP_METHODS.NOTIFICATIONS_MESSAGE, {
          level,
          logger: this.serverInfo.name,
          data: logEntry
        });
      } catch (error) {
        // 忽略发送通知时的错误（如传输已断开）
      }
    }
  }

  /**
   * 设置服务器能力
   */
  setCapabilities(capabilities) {
    this.capabilities = { ...this.capabilities, ...capabilities };
  }

  /**
   * 启动服务器
   */
  start() {
    this.log(LOG_LEVELS.INFO, `MCP服务器启动: ${this.serverInfo.name} v${this.serverInfo.version}`);
    this.emit('start');
  }

  /**
   * 停止服务器
   */
  stop() {
    this.log(LOG_LEVELS.INFO, '停止MCP服务器');
    this.isInitialized = false;
    this.emit('stop');
  }
}

module.exports = MCPServer; 