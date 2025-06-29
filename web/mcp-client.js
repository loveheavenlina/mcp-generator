/**
 * 浏览器端MCP客户端实现
 * 支持WebSocket通信和指令解析
 */

// MCP协议常量和类型定义
const MCP_VERSION = "2024-11-05";

const JSON_RPC_VERSION = "2.0";

const MCP_ERRORS = {
    PARSE_ERROR: -32700,
    INVALID_REQUEST: -32600,
    METHOD_NOT_FOUND: -32601,
    INVALID_PARAMS: -32602,
    INTERNAL_ERROR: -32603,
    SERVER_ERROR_START: -32099,
    SERVER_ERROR_END: -32000,
    // MCP特定错误代码
    INVALID_REQUEST: -32000,
    RESOURCE_NOT_FOUND: -32001,
    TOOL_EXECUTION_ERROR: -32002,
    UNSUPPORTED_OPERATION: -32003
};

const LOG_LEVELS = {
    DEBUG: "debug",
    INFO: "info",
    NOTICE: "notice", 
    WARNING: "warning",
    ERROR: "error",
    CRITICAL: "critical",
    ALERT: "alert",
    EMERGENCY: "emergency"
};

/**
 * MCP错误类
 */
class MCPError extends Error {
    constructor(code, message, data = null) {
        super(message);
        this.name = 'MCPError';
        this.code = code;
        this.data = data;
    }

    toJSON() {
        return {
            code: this.code,
            message: this.message,
            data: this.data
        };
    }
}

/**
 * MCP消息类
 */
class MCPMessage {
    constructor(id = null) {
        this.jsonrpc = JSON_RPC_VERSION;
        this.id = id;
    }
}

/**
 * MCP请求类
 */
class MCPRequest extends MCPMessage {
    constructor(method, params = {}, id = null) {
        super(id || Date.now().toString());
        this.method = method;
        this.params = params;
    }
}

/**
 * MCP响应类
 */
class MCPResponse extends MCPMessage {
    constructor(result, id) {
        super(id);
        this.result = result;
    }
}

/**
 * MCP通知类
 */
class MCPNotification extends MCPMessage {
    constructor(method, params = {}) {
        super();
        this.method = method;
        this.params = params;
        delete this.id; // 通知没有id
    }
}

/**
 * 浏览器端MCP客户端类
 */
class WebMCPClient {
    constructor() {
        this.ws = null;
        this.connected = false;
        this.initialized = false;
        this.pendingRequests = new Map();
        this.requestTimeout = 30000; // 30秒超时
        this.clientInfo = {
            name: "Web MCP客户端",
            version: "1.0.0"
        };
        this.serverCapabilities = null;
        this.tools = [];
        this.resources = [];
        this.prompts = [];
        
        // 事件监听器
        this.listeners = {
            connected: [],
            disconnected: [],
            error: [],
            log: [],
            toolsUpdated: [],
            resourcesUpdated: [],
            promptsUpdated: []
        };
    }

    /**
     * 添加事件监听器
     */
    on(event, callback) {
        if (this.listeners[event]) {
            this.listeners[event].push(callback);
        }
    }

    /**
     * 移除事件监听器
     */
    off(event, callback) {
        if (this.listeners[event]) {
            const index = this.listeners[event].indexOf(callback);
            if (index > -1) {
                this.listeners[event].splice(index, 1);
            }
        }
    }

    /**
     * 触发事件
     */
    emit(event, ...args) {
        if (this.listeners[event]) {
            this.listeners[event].forEach(callback => {
                try {
                    callback(...args);
                } catch (error) {
                    console.error(`事件监听器错误 (${event}):`, error);
                }
            });
        }
    }

    /**
     * 连接到MCP服务器
     */
    async connect(url, clientName = null) {
        if (this.connected) {
            throw new Error('客户端已连接');
        }

        if (clientName) {
            this.clientInfo.name = clientName;
        }

        return new Promise((resolve, reject) => {
            try {
                this.ws = new WebSocket(url);

                this.ws.onopen = () => {
                    this.connected = true;
                    this.emit('connected', url);
                    this._log('info', `已连接到服务器: ${url}`);
                    
                    // 初始化连接
                    this._initialize()
                        .then(resolve)
                        .catch(reject);
                };

                this.ws.onclose = (event) => {
                    this.connected = false;
                    this.initialized = false;
                    this.emit('disconnected', event.code, event.reason);
                    this._log('warning', `连接已断开: ${event.reason || '未知原因'}`);
                };

                this.ws.onerror = (error) => {
                    this.emit('error', error);
                    this._log('error', `WebSocket错误: ${error.message || '连接失败'}`);
                    reject(new Error('WebSocket连接失败'));
                };

                this.ws.onmessage = (event) => {
                    this._handleMessage(event.data);
                };

            } catch (error) {
                this.emit('error', error);
                this._log('error', `连接错误: ${error.message}`);
                reject(error);
            }
        });
    }

    /**
     * 断开连接
     */
    disconnect() {
        if (this.ws && this.connected) {
            this.ws.close();
        }
        this.connected = false;
        this.initialized = false;
        
        // 清理待处理的请求
        this.pendingRequests.forEach((request, id) => {
            clearTimeout(request.timeout);
            request.reject(new Error('连接已断开'));
        });
        this.pendingRequests.clear();
    }

    /**
     * 初始化MCP连接
     */
    async _initialize() {
        try {
            const initRequest = new MCPRequest('initialize', {
                protocolVersion: MCP_VERSION,
                capabilities: {
                    roots: {
                        listChanged: true
                    },
                    sampling: {}
                },
                clientInfo: this.clientInfo
            });

            const response = await this._sendRequest(initRequest);
            this.serverCapabilities = response.capabilities;
            this.initialized = true;

            this._log('info', `MCP初始化成功, 服务器: ${response.serverInfo?.name || '未知'}`);

            // 发送初始化完成通知
            const initializedNotification = new MCPNotification('notifications/initialized');
            await this._sendNotification(initializedNotification);

            // 加载服务器数据
            await this._loadServerData();

            return response;
        } catch (error) {
            this._log('error', `MCP初始化失败: ${error.message}`);
            throw error;
        }
    }

    /**
     * 加载服务器数据
     */
    async _loadServerData() {
        try {
            // 总是尝试加载工具列表
            try {
                const toolsResponse = await this.listTools();
                this.tools = toolsResponse.tools || [];
                this.emit('toolsUpdated', this.tools);
                this._log('info', `已加载 ${this.tools.length} 个工具`);
            } catch (error) {
                this._log('warning', `加载工具列表失败: ${error.message}`);
                this.tools = [];
                this.emit('toolsUpdated', this.tools);
            }

            // 总是尝试加载资源列表
            try {
                const resourcesResponse = await this.listResources();
                this.resources = resourcesResponse.resources || [];
                this.emit('resourcesUpdated', this.resources);
                this._log('info', `已加载 ${this.resources.length} 个资源`);
            } catch (error) {
                this._log('warning', `加载资源列表失败: ${error.message}`);
                this.resources = [];
                this.emit('resourcesUpdated', this.resources);
            }

            // 总是尝试加载提示列表
            try {
                const promptsResponse = await this.listPrompts();
                this.prompts = promptsResponse.prompts || [];
                this.emit('promptsUpdated', this.prompts);
                this._log('info', `已加载 ${this.prompts.length} 个提示`);
            } catch (error) {
                this._log('warning', `加载提示列表失败: ${error.message}`);
                this.prompts = [];
                this.emit('promptsUpdated', this.prompts);
            }

        } catch (error) {
            this._log('error', `加载服务器数据失败: ${error.message}`);
        }
    }

    /**
     * 处理收到的消息
     */
    _handleMessage(data) {
        try {
            const message = JSON.parse(data);

            // 处理响应
            if (message.id && this.pendingRequests.has(message.id)) {
                const request = this.pendingRequests.get(message.id);
                this.pendingRequests.delete(message.id);
                clearTimeout(request.timeout);

                if (message.error) {
                    const error = new MCPError(
                        message.error.code,
                        message.error.message,
                        message.error.data
                    );
                    request.reject(error);
                } else {
                    request.resolve(message.result);
                }
                return;
            }

            // 处理通知
            if (message.method && !message.id) {
                this._handleNotification(message);
                return;
            }

            this._log('warning', `收到未知消息: ${JSON.stringify(message)}`);

        } catch (error) {
            this._log('error', `消息解析错误: ${error.message}`);
        }
    }

    /**
     * 处理服务器通知
     */
    _handleNotification(notification) {
        this._log('info', `收到通知: ${notification.method}`);

        switch (notification.method) {
            case 'notifications/message':
                this._handleLogMessage(notification.params);
                break;
            case 'notifications/tools/list_changed':
                this._refreshTools();
                break;
            case 'notifications/resources/list_changed':
                this._refreshResources();
                break;
            case 'notifications/prompts/list_changed':
                this._refreshPrompts();
                break;
            default:
                this._log('warning', `未知通知方法: ${notification.method}`);
        }
    }

    /**
     * 处理日志消息
     */
    _handleLogMessage(params) {
        if (params && params.level && params.data) {
            this._log(params.level, params.data);
        }
    }

    /**
     * 刷新工具列表
     */
    async _refreshTools() {
        try {
            const response = await this.listTools();
            this.tools = response.tools || [];
            this.emit('toolsUpdated', this.tools);
            this._log('info', `工具列表已更新: ${this.tools.length} 个工具`);
        } catch (error) {
            this._log('error', `刷新工具列表失败: ${error.message}`);
        }
    }

    /**
     * 刷新资源列表
     */
    async _refreshResources() {
        try {
            const response = await this.listResources();
            this.resources = response.resources || [];
            this.emit('resourcesUpdated', this.resources);
            this._log('info', `资源列表已更新: ${this.resources.length} 个资源`);
        } catch (error) {
            this._log('error', `刷新资源列表失败: ${error.message}`);
        }
    }

    /**
     * 刷新提示列表
     */
    async _refreshPrompts() {
        try {
            const response = await this.listPrompts();
            this.prompts = response.prompts || [];
            this.emit('promptsUpdated', this.prompts);
            this._log('info', `提示列表已更新: ${this.prompts.length} 个提示`);
        } catch (error) {
            this._log('error', `刷新提示列表失败: ${error.message}`);
        }
    }

    /**
     * 发送请求
     */
    async _sendRequest(request) {
        if (!this.connected) {
            throw new Error('客户端未连接');
        }

        return new Promise((resolve, reject) => {
            const timeoutId = setTimeout(() => {
                this.pendingRequests.delete(request.id);
                reject(new Error('请求超时'));
            }, this.requestTimeout);

            this.pendingRequests.set(request.id, {
                resolve,
                reject,
                timeout: timeoutId
            });

            this.ws.send(JSON.stringify(request));
        });
    }

    /**
     * 发送通知
     */
    async _sendNotification(notification) {
        if (!this.connected) {
            throw new Error('客户端未连接');
        }

        this.ws.send(JSON.stringify(notification));
    }

    /**
     * 记录日志
     */
    _log(level, message) {
        const timestamp = new Date().toLocaleTimeString();
        this.emit('log', {
            level,
            message,
            timestamp
        });
    }

    // === MCP协议方法 ===

    /**
     * 列出可用工具
     */
    async listTools() {
        if (!this.initialized) {
            throw new Error('客户端未初始化');
        }

        const request = new MCPRequest('tools/list');
        return await this._sendRequest(request);
    }

    /**
     * 调用工具
     */
    async callTool(name, arguments_ = {}) {
        if (!this.initialized) {
            throw new Error('客户端未初始化');
        }

        const request = new MCPRequest('tools/call', {
            name: name,
            arguments: arguments_
        });
        return await this._sendRequest(request);
    }

    /**
     * 列出可用资源
     */
    async listResources() {
        if (!this.initialized) {
            throw new Error('客户端未初始化');
        }

        const request = new MCPRequest('resources/list');
        return await this._sendRequest(request);
    }

    /**
     * 读取资源
     */
    async readResource(uri) {
        if (!this.initialized) {
            throw new Error('客户端未初始化');
        }

        const request = new MCPRequest('resources/read', {
            uri: uri
        });
        return await this._sendRequest(request);
    }

    /**
     * 列出可用提示
     */
    async listPrompts() {
        if (!this.initialized) {
            throw new Error('客户端未初始化');
        }

        const request = new MCPRequest('prompts/list');
        return await this._sendRequest(request);
    }

    /**
     * 获取提示内容
     */
    async getPrompt(name, arguments_ = {}) {
        if (!this.initialized) {
            throw new Error('客户端未初始化');
        }

        const request = new MCPRequest('prompts/get', {
            name: name,
            arguments: arguments_
        });
        return await this._sendRequest(request);
    }

    // === 便捷方法 ===

    /**
     * 获取服务器信息
     */
    getServerInfo() {
        return {
            connected: this.connected,
            initialized: this.initialized,
            capabilities: this.serverCapabilities,
            toolsCount: this.tools.length,
            resourcesCount: this.resources.length,
            promptsCount: this.prompts.length
        };
    }

    /**
     * 获取工具信息
     */
    getTool(name) {
        return this.tools.find(tool => tool.name === name);
    }

    /**
     * 获取资源信息
     */
    getResource(uri) {
        return this.resources.find(resource => resource.uri === uri);
    }

    /**
     * 获取提示信息
     */
    getPrompt(name) {
        return this.prompts.find(prompt => prompt.name === name);
    }
}

/**
 * 指令解析器
 */
class CommandParser {
    /**
     * 解析用户输入的指令
     */
    static parseCommand(input, commandType = 'tool') {
        if (!input || typeof input !== 'string') {
            throw new Error('无效的指令输入');
        }

        const trimmed = input.trim();
        
        // 处理特殊前缀
        if (trimmed.startsWith('resource:')) {
            return this._parseResourceCommand(trimmed.substring(9));
        }
        
        if (trimmed.startsWith('prompt:')) {
            return this._parsePromptCommand(trimmed.substring(7));
        }

        // 根据命令类型解析
        switch (commandType) {
            case 'tool':
                return this._parseToolCommand(trimmed);
            case 'resource':
                return this._parseResourceCommand(trimmed);
            case 'prompt':
                return this._parsePromptCommand(trimmed);
            case 'custom':
                return this._parseCustomCommand(trimmed);
            default:
                return this._parseToolCommand(trimmed);
        }
    }

    /**
     * 解析工具调用命令
     */
    static _parseToolCommand(input) {
        const parts = this._parseCommandParts(input);
        if (parts.length === 0) {
            throw new Error('工具名称不能为空');
        }

        const toolName = parts[0];
        const args = this._parseArguments(parts.slice(1));

        return {
            type: 'tool',
            tool: toolName,
            arguments: args
        };
    }

    /**
     * 解析资源读取命令
     */
    static _parseResourceCommand(input) {
        const trimmed = input.trim();
        if (!trimmed) {
            throw new Error('资源URI不能为空');
        }

        return {
            type: 'resource',
            uri: trimmed
        };
    }

    /**
     * 解析提示获取命令
     */
    static _parsePromptCommand(input) {
        const parts = this._parseCommandParts(input);
        if (parts.length === 0) {
            throw new Error('提示名称不能为空');
        }

        const promptName = parts[0];
        const args = this._parseArguments(parts.slice(1));

        return {
            type: 'prompt',
            prompt: promptName,
            arguments: args
        };
    }

    /**
     * 解析自定义命令
     */
    static _parseCustomCommand(input) {
        return {
            type: 'custom',
            raw: input
        };
    }

    /**
     * 解析命令部分
     */
    static _parseCommandParts(input) {
        const parts = [];
        let current = '';
        let inQuotes = false;
        let quoteChar = '';

        for (let i = 0; i < input.length; i++) {
            const char = input[i];
            
            if (!inQuotes && (char === '"' || char === "'")) {
                inQuotes = true;
                quoteChar = char;
            } else if (inQuotes && char === quoteChar) {
                inQuotes = false;
                quoteChar = '';
            } else if (!inQuotes && char === ' ') {
                if (current.trim()) {
                    parts.push(current.trim());
                    current = '';
                }
            } else {
                current += char;
            }
        }

        if (current.trim()) {
            parts.push(current.trim());
        }

        return parts;
    }

    /**
     * 解析参数
     */
    static _parseArguments(parts) {
        if (parts.length === 0) {
            return {};
        }

        // 如果只有一个参数，作为主参数处理
        if (parts.length === 1) {
            const part = parts[0];
            
            // 检查是否是JSON格式
            if ((part.startsWith('{') && part.endsWith('}')) || 
                (part.startsWith('[') && part.endsWith(']'))) {
                try {
                    return JSON.parse(part);
                } catch (e) {
                    return { input: part };
                }
            }
            
            // 检查是否是key=value格式
            if (part.includes('=')) {
                const args = {};
                const kvPairs = part.split(/,(?=\w+=)/);
                for (const pair of kvPairs) {
                    const [key, ...valueParts] = pair.split('=');
                    if (key && valueParts.length > 0) {
                        args[key.trim()] = valueParts.join('=').trim();
                    }
                }
                return args;
            }
            
            return { input: part };
        }

        // 多个参数的情况
        const args = {};
        let unnamed = [];

        for (const part of parts) {
            if (part.includes('=')) {
                const [key, ...valueParts] = part.split('=');
                if (key && valueParts.length > 0) {
                    args[key.trim()] = valueParts.join('=').trim();
                }
            } else {
                unnamed.push(part);
            }
        }

        // 如果有未命名参数，作为input处理
        if (unnamed.length > 0) {
            args.input = unnamed.join(' ');
        }

        return args;
    }

    /**
     * 生成命令建议
     */
    static generateSuggestions(input, tools = [], resources = [], prompts = []) {
        const suggestions = [];
        const trimmed = input.toLowerCase().trim();

        // 工具建议
        for (const tool of tools) {
            if (tool.name.toLowerCase().includes(trimmed)) {
                suggestions.push({
                    type: 'tool',
                    text: tool.name,
                    description: tool.description || '无描述'
                });
            }
        }

        // 资源建议
        for (const resource of resources) {
            const uri = resource.uri || resource.name || '';
            if (uri.toLowerCase().includes(trimmed)) {
                suggestions.push({
                    type: 'resource',
                    text: `resource:${uri}`,
                    description: resource.description || '无描述'
                });
            }
        }

        // 提示建议
        for (const prompt of prompts) {
            if (prompt.name.toLowerCase().includes(trimmed)) {
                suggestions.push({
                    type: 'prompt',
                    text: `prompt:${prompt.name}`,
                    description: prompt.description || '无描述'
                });
            }
        }

        return suggestions.slice(0, 10); // 限制建议数量
    }
}

// 导出给全局使用
if (typeof window !== 'undefined') {
    window.WebMCPClient = WebMCPClient;
    window.CommandParser = CommandParser;
    window.MCPError = MCPError;
} 