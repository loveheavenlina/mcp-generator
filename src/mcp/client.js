/**
 * MCP Client 实现
 * 基于JSON-RPC 2.0协议的MCP客户端
 */

const EventEmitter = require('events');
const {
  MCP_VERSION,
  JSON_RPC_ERRORS,
  MCP_METHODS,
  LOG_LEVELS,
  MCPRequest,
  MCPResponse,
  MCPNotification,
  MCPError
} = require('./types');

/**
 * MCP客户端类
 */
class MCPClient extends EventEmitter {
  constructor(clientInfo = {}) {
    super();
    
    this.clientInfo = {
      name: clientInfo.name || 'MCP Client',
      version: clientInfo.version || '1.0.0',
      ...clientInfo
    };
    
    this.capabilities = {
      experimental: {},
      sampling: {}
    };
    
    this.isConnected = false;
    this.isInitialized = false;
    this.serverInfo = null;
    this.serverCapabilities = null;
    this.pendingRequests = new Map();
    this.requestId = 0;
    
    // 注册默认处理器
    this._setupDefaultHandlers();
  }

  /**
   * 设置默认消息处理器
   */
  _setupDefaultHandlers() {
    this.on('response', this._handleResponse.bind(this));
    this.on('notification', this._handleNotification.bind(this));
  }

  /**
   * 生成请求ID
   */
  _generateRequestId() {
    return ++this.requestId;
  }

  /**
   * 发送请求并等待响应
   */
  async sendRequest(method, params = null, timeout = 30000) {
    if (!this.isConnected) {
      throw new Error('客户端未连接到服务器');
    }

    const id = this._generateRequestId();
    const request = new MCPRequest(method, params, id);
    
    return new Promise((resolve, reject) => {
      // 设置超时
      const timeoutId = setTimeout(() => {
        this.pendingRequests.delete(id);
        reject(new Error(`请求超时: ${method}`));
      }, timeout);
      
      // 存储待处理的请求
      this.pendingRequests.set(id, {
        resolve,
        reject,
        timeoutId,
        method
      });
      
      // 发送请求
      this.emit('request_out', request);
    });
  }

  /**
   * 发送通知（不等待响应）
   */
  sendNotification(method, params = null) {
    if (!this.isConnected) {
      throw new Error('客户端未连接到服务器');
    }

    const notification = new MCPNotification(method, params);
    this.emit('notification_out', notification);
    return notification;
  }

  /**
   * 处理传入的消息
   */
  async handleMessage(message) {
    try {
      const parsed = typeof message === 'string' ? JSON.parse(message) : message;
      
      if (parsed.method) {
        // 这是一个通知或请求
        this.emit('notification', parsed);
      } else if (parsed.result !== undefined || parsed.error !== undefined) {
        // 这是一个响应
        this.emit('response', parsed);
      }
    } catch (error) {
      this.log(LOG_LEVELS.ERROR, '解析消息失败', { error: error.message, message });
    }
  }

  /**
   * 处理响应消息
   */
  _handleResponse(response) {
    const pending = this.pendingRequests.get(response.id);
    if (!pending) {
      this.log(LOG_LEVELS.WARNING, `收到未知请求的响应: ${response.id}`);
      return;
    }
    
    // 清理
    clearTimeout(pending.timeoutId);
    this.pendingRequests.delete(response.id);
    
    if (response.error) {
      const error = new Error(response.error.message);
      error.code = response.error.code;
      error.data = response.error.data;
      pending.reject(error);
    } else {
      pending.resolve(response.result);
    }
  }

  /**
   * 处理通知消息
   */
  _handleNotification(notification) {
    this.log(LOG_LEVELS.DEBUG, `收到通知: ${notification.method}`, notification.params);
    
    switch (notification.method) {
      case MCP_METHODS.NOTIFICATIONS_MESSAGE:
        this.emit('server_message', notification.params);
        break;
        
      case MCP_METHODS.NOTIFICATIONS_RESOURCES_UPDATED:
        this.emit('resources_updated', notification.params);
        break;
        
      case MCP_METHODS.NOTIFICATIONS_TOOLS_CHANGED:
        this.emit('tools_changed', notification.params);
        break;
        
      case MCP_METHODS.NOTIFICATIONS_PROMPTS_CHANGED:
        this.emit('prompts_changed', notification.params);
        break;
        
      default:
        this.emit('unknown_notification', notification);
    }
  }

  /**
   * 连接到服务器
   */
  async connect() {
    this.isConnected = true;
    this.log(LOG_LEVELS.INFO, '已连接到MCP服务器');
    this.emit('connect');
  }

  /**
   * 断开连接
   */
  async disconnect() {
    this.isConnected = false;
    this.isInitialized = false;
    this.serverInfo = null;
    this.serverCapabilities = null;
    
    // 拒绝所有待处理的请求
    for (const [id, pending] of this.pendingRequests) {
      clearTimeout(pending.timeoutId);
      pending.reject(new Error('连接已断开'));
    }
    this.pendingRequests.clear();
    
    this.log(LOG_LEVELS.INFO, '已断开与MCP服务器的连接');
    this.emit('disconnect');
  }

  /**
   * 初始化与服务器的连接
   */
  async initialize() {
    if (!this.isConnected) {
      await this.connect();
    }

    try {
      const result = await this.sendRequest(MCP_METHODS.INITIALIZE, {
        protocolVersion: MCP_VERSION,
        capabilities: this.capabilities,
        clientInfo: this.clientInfo
      });
      
      this.serverInfo = result.serverInfo;
      this.serverCapabilities = result.capabilities;
      this.isInitialized = true;
      
      // 发送initialized通知
      this.sendNotification(MCP_METHODS.INITIALIZED);
      
      this.log(LOG_LEVELS.INFO, '初始化完成', { serverInfo: this.serverInfo });
      this.emit('initialized', result);
      
      return result;
    } catch (error) {
      this.log(LOG_LEVELS.ERROR, '初始化失败', { error: error.message });
      throw error;
    }
  }

  /**
   * 获取工具列表
   */
  async listTools() {
    if (!this.isInitialized) {
      throw new Error('客户端未初始化');
    }
    
    try {
      const result = await this.sendRequest(MCP_METHODS.TOOLS_LIST);
      return result.tools || [];
    } catch (error) {
      this.log(LOG_LEVELS.ERROR, '获取工具列表失败', { error: error.message });
      throw error;
    }
  }

  /**
   * 调用工具
   */
  async callTool(name, arguments_ = {}) {
    if (!this.isInitialized) {
      throw new Error('客户端未初始化');
    }
    
    try {
      const result = await this.sendRequest(MCP_METHODS.TOOLS_CALL, {
        name,
        arguments: arguments_
      });
      return result;
    } catch (error) {
      this.log(LOG_LEVELS.ERROR, `调用工具失败: ${name}`, { error: error.message });
      throw error;
    }
  }

  /**
   * 获取资源列表
   */
  async listResources() {
    if (!this.isInitialized) {
      throw new Error('客户端未初始化');
    }
    
    try {
      const result = await this.sendRequest(MCP_METHODS.RESOURCES_LIST);
      return result.resources || [];
    } catch (error) {
      this.log(LOG_LEVELS.ERROR, '获取资源列表失败', { error: error.message });
      throw error;
    }
  }

  /**
   * 读取资源
   */
  async readResource(uri) {
    if (!this.isInitialized) {
      throw new Error('客户端未初始化');
    }
    
    try {
      const result = await this.sendRequest(MCP_METHODS.RESOURCES_READ, { uri });
      return result.contents || [];
    } catch (error) {
      this.log(LOG_LEVELS.ERROR, `读取资源失败: ${uri}`, { error: error.message });
      throw error;
    }
  }

  /**
   * 订阅资源
   */
  async subscribeToResource(uri) {
    if (!this.isInitialized) {
      throw new Error('客户端未初始化');
    }
    
    try {
      await this.sendRequest(MCP_METHODS.RESOURCES_SUBSCRIBE, { uri });
    } catch (error) {
      this.log(LOG_LEVELS.ERROR, `订阅资源失败: ${uri}`, { error: error.message });
      throw error;
    }
  }

  /**
   * 取消订阅资源
   */
  async unsubscribeFromResource(uri) {
    if (!this.isInitialized) {
      throw new Error('客户端未初始化');
    }
    
    try {
      await this.sendRequest(MCP_METHODS.RESOURCES_UNSUBSCRIBE, { uri });
    } catch (error) {
      this.log(LOG_LEVELS.ERROR, `取消订阅资源失败: ${uri}`, { error: error.message });
      throw error;
    }
  }

  /**
   * 获取提示列表
   */
  async listPrompts() {
    if (!this.isInitialized) {
      throw new Error('客户端未初始化');
    }
    
    try {
      const result = await this.sendRequest(MCP_METHODS.PROMPTS_LIST);
      return result.prompts || [];
    } catch (error) {
      this.log(LOG_LEVELS.ERROR, '获取提示列表失败', { error: error.message });
      throw error;
    }
  }

  /**
   * 获取提示
   */
  async getPrompt(name, arguments_ = {}) {
    if (!this.isInitialized) {
      throw new Error('客户端未初始化');
    }
    
    try {
      const result = await this.sendRequest(MCP_METHODS.PROMPTS_GET, {
        name,
        arguments: arguments_
      });
      return result;
    } catch (error) {
      this.log(LOG_LEVELS.ERROR, `获取提示失败: ${name}`, { error: error.message });
      throw error;
    }
  }

  /**
   * 设置日志级别
   */
  setLogLevel(level) {
    this.sendNotification(MCP_METHODS.LOGGING_SET_LEVEL, { level });
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
  }

  /**
   * 设置客户端能力
   */
  setCapabilities(capabilities) {
    this.capabilities = { ...this.capabilities, ...capabilities };
  }

  /**
   * 获取服务器信息
   */
  getServerInfo() {
    return this.serverInfo;
  }

  /**
   * 获取服务器能力
   */
  getServerCapabilities() {
    return this.serverCapabilities;
  }

  /**
   * 检查服务器是否支持某个能力
   */
  hasServerCapability(capability) {
    return this.serverCapabilities && this.serverCapabilities[capability];
  }
}

module.exports = MCPClient; 