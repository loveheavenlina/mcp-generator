/**
 * 简单的HTTP服务器，用于托管MCP Web客户端
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const WebSocket = require('ws');

// 导入MCP服务器 - 更新路径到共享模块
const { MCPServer, WebSocketTransport } = require('../../../shared/mcp');

/**
 * MIME类型映射
 */
const mimeTypes = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'text/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.gif': 'image/gif',
    '.ico': 'image/x-icon'
};

/**
 * 获取文件的MIME类型
 */
function getMimeType(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    return mimeTypes[ext] || 'text/plain';
}

/**
 * HTTP服务器类
 */
class WebServer {
    constructor(port = 3001) {
        this.port = port;
        this.webRoot = path.join(__dirname, '../public'); // 更新webRoot路径
        this.server = null;
    }

    /**
     * 启动HTTP服务器
     */
    start() {
        this.server = http.createServer((req, res) => {
            this.handleRequest(req, res);
        });

        this.server.listen(this.port, () => {
            console.log(`Web服务器已启动: http://localhost:${this.port}`);
            console.log(`请在浏览器中打开 http://localhost:${this.port} 访问MCP客户端`);
        });

        return this.server;
    }

    /**
     * 处理HTTP请求
     */
    handleRequest(req, res) {
        let filePath = req.url === '/' ? '/index.html' : req.url;
        filePath = path.join(this.webRoot, filePath);

        // 安全检查：防止路径遍历攻击
        if (!filePath.startsWith(this.webRoot)) {
            this.sendError(res, 403, 'Forbidden');
            return;
        }

        fs.readFile(filePath, (err, data) => {
            if (err) {
                if (err.code === 'ENOENT') {
                    this.sendError(res, 404, 'File Not Found');
                } else {
                    this.sendError(res, 500, 'Internal Server Error');
                }
            } else {
                const mimeType = getMimeType(filePath);
                res.writeHead(200, {
                    'Content-Type': mimeType,
                    'Cache-Control': 'no-cache'
                });
                res.end(data);
            }
        });
    }

    /**
     * 发送错误响应
     */
    sendError(res, statusCode, message) {
        res.writeHead(statusCode, { 'Content-Type': 'text/plain' });
        res.end(message);
    }

    /**
     * 停止服务器
     */
    stop() {
        if (this.server) {
            this.server.close();
            console.log('Web服务器已停止');
        }
    }
}

/**
 * MCP WebSocket服务器类
 */
class MCPWebSocketServer {
    constructor(port = 8080) {
        this.port = port;
        this.wss = null;
        this.mcpServer = null;
    }

    /**
     * 启动WebSocket服务器
     */
    start() {
        // 创建WebSocket服务器
        this.wss = new WebSocket.Server({ 
            port: this.port,
            perMessageDeflate: false
        });

        console.log(`MCP WebSocket服务器已启动: ws://localhost:${this.port}`);

        // 处理WebSocket连接
        this.wss.on('connection', (ws, req) => {
            console.log(`新的WebSocket连接: ${req.socket.remoteAddress}`);
            this.handleConnection(ws);
        });

        this.wss.on('error', (error) => {
            console.error('WebSocket服务器错误:', error);
        });
    }

    /**
     * 处理WebSocket连接
     */
    handleConnection(ws) {
        console.log('处理新的WebSocket连接');
        
        // 为每个连接创建独立的MCP服务器实例
        const mcpServer = new MCPServer();
        
        // 注册示例工具
        this.registerTools(mcpServer);

        // 注册示例资源
        this.registerResources(mcpServer);

        // 注册示例提示
        this.registerPrompts(mcpServer);

        // 创建WebSocket传输层（用于服务器端）
        const transport = new WebSocketTransport();
        transport.ws = ws;
        transport.isConnected = true;

        // 处理WebSocket消息
        ws.on('message', async (data) => {
            try {
                console.log('收到WebSocket消息:', data.toString());
                const response = await mcpServer.handleMessage(data.toString());
                if (response) {
                    console.log('发送响应:', JSON.stringify(response));
                    ws.send(JSON.stringify(response));
                }
            } catch (error) {
                console.error('处理消息错误:', error);
                const errorResponse = {
                    jsonrpc: '2.0',
                    error: {
                        code: -32603,
                        message: '内部服务器错误',
                        data: error.message
                    },
                    id: null
                };
                ws.send(JSON.stringify(errorResponse));
            }
        });

        // 服务器响应和通知处理
        mcpServer.on('response', (response) => {
            try {
                console.log('MCP服务器响应:', JSON.stringify(response));
                ws.send(JSON.stringify(response));
            } catch (error) {
                console.error('发送响应错误:', error);
            }
        });

        mcpServer.on('notification_out', (notification) => {
            try {
                console.log('MCP服务器通知:', JSON.stringify(notification));
                ws.send(JSON.stringify(notification));
            } catch (error) {
                console.error('发送通知错误:', error);
            }
        });

        // 连接断开处理
        ws.on('close', () => {
            console.log('WebSocket连接已断开');
            transport.isConnected = false;
        });

        ws.on('error', (error) => {
            console.error('WebSocket连接错误:', error);
            transport.isConnected = false;
        });

        console.log('WebSocket连接处理完成');
    }

    /**
     * 注册示例工具
     */
    registerTools(server) {
        const self = this; // 保存this引用
        
        // 计算器工具
        server.registerTool(
            'calculator',
            '简单的数学计算器',
            {
                type: 'object',
                properties: {
                    expression: {
                        type: 'string',
                        description: '要计算的数学表达式，如 "2+3*4"'
                    }
                },
                required: ['expression']
            },
            async (params) => {
                try {
                    const expression = params.expression || params.input;
                    // 简单的表达式计算（仅支持基本运算符）
                    const result = self.safeEval(expression);
                    return {
                        content: [{
                            type: 'text',
                            text: `计算结果: ${expression} = ${result}`
                        }]
                    };
                } catch (error) {
                    throw new Error(`计算错误: ${error.message}`);
                }
            }
        );

        // 时间工具
        server.registerTool(
            'current_time',
            '获取当前时间',
            {
                type: 'object',
                properties: {
                    timezone: {
                        type: 'string',
                        description: '时区，如 "Asia/Shanghai"'
                    }
                }
            },
            async (params) => {
                const timezone = params.timezone || 'Asia/Shanghai';
                const now = new Date();
                const timeString = now.toLocaleString('zh-CN', { 
                    timeZone: timezone,
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit'
                });
                
                return {
                    content: [{
                        type: 'text',
                        text: `当前时间 (${timezone}): ${timeString}`
                    }]
                };
            }
        );

        // 随机数生成器
        server.registerTool(
            'random_number',
            '生成随机数',
            {
                type: 'object',
                properties: {
                    min: {
                        type: 'number',
                        description: '最小值'
                    },
                    max: {
                        type: 'number',
                        description: '最大值'
                    }
                }
            },
            async (params) => {
                const min = params.min || 1;
                const max = params.max || 100;
                const randomNum = Math.floor(Math.random() * (max - min + 1)) + min;
                
                return {
                    content: [{
                        type: 'text',
                        text: `随机数 (${min}-${max}): ${randomNum}`
                    }]
                };
            }
        );

        // Echo工具
        server.registerTool(
            'echo',
            '回显输入的文本',
            {
                type: 'object',
                properties: {
                    text: {
                        type: 'string',
                        description: '要回显的文本'
                    }
                },
                required: ['text']
            },
            async (params) => {
                const text = params.text || params.input || '';
                return {
                    content: [{
                        type: 'text',
                        text: `回显: ${text}`
                    }]
                };
            }
        );
    }

    /**
     * 注册示例资源
     */
    registerResources(server) {
        // 系统信息资源
        server.registerResource(
            'system://info',
            '系统信息',
            '获取系统基本信息',
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
                
                return {
                    contents: [{
                        uri: 'system://info',
                        mimeType: 'application/json',
                        text: JSON.stringify(info, null, 2)
                    }]
                };
            }
        );

        // 当前目录资源
        server.registerResource(
            'file://current-dir',
            '当前目录',
            '当前工作目录的文件列表',
            'text/plain',
            async () => {
                const files = fs.readdirSync(process.cwd());
                const fileList = files.map(file => {
                    const stats = fs.statSync(path.join(process.cwd(), file));
                    return `${stats.isDirectory() ? '[DIR]' : '[FILE]'} ${file}`;
                }).join('\n');
                
                return {
                    contents: [{
                        uri: 'file://current-dir',
                        mimeType: 'text/plain',
                        text: fileList
                    }]
                };
            }
        );
    }

    /**
     * 注册示例提示
     */
    registerPrompts(server) {
        // 代码生成提示
        server.registerPrompt(
            'code-generator',
            '代码生成助手',
            [{
                name: 'language',
                description: '编程语言',
                required: true
            }, {
                name: 'task',
                description: '要实现的功能',
                required: true
            }],
            async (params) => {
                const language = params.language || 'JavaScript';
                const task = params.task || '示例函数';
                
                return {
                    description: `生成${language}代码来实现${task}`,
                    messages: [{
                        role: 'user',
                        content: {
                            type: 'text',
                            text: `请用${language}编写代码来实现以下功能：${task}\n\n请包含详细注释并遵循最佳实践。`
                        }
                    }]
                };
            }
        );

        // 问题解决提示
        server.registerPrompt(
            'problem-solver',
            '问题解决助手',
            [{
                name: 'problem',
                description: '要解决的问题',
                required: true
            }],
            async (params) => {
                const problem = params.problem || '一般问题';
                
                return {
                    description: `分析和解决问题：${problem}`,
                    messages: [{
                        role: 'user',
                        content: {
                            type: 'text',
                            text: `请帮我分析并解决以下问题：\n\n${problem}\n\n请提供详细的解决方案和步骤。`
                        }
                    }]
                };
            }
        );
    }

    /**
     * 安全的表达式计算
     */
    safeEval(expression) {
        // 移除空格
        const cleaned = expression.replace(/\s+/g, '');
        
        // 只允许数字、基本运算符和小数点
        if (!/^[0-9+\-*/.()]+$/.test(cleaned)) {
            throw new Error('不支持的字符，只允许数字和基本运算符 (+, -, *, /, (, ))');
        }
        
        // 使用Function构造函数进行安全计算
        try {
            return Function(`"use strict"; return (${cleaned})`)();
        } catch (error) {
            throw new Error('表达式无效');
        }
    }

    /**
     * 停止服务器
     */
    stop() {
        if (this.wss) {
            this.wss.close();
            console.log('MCP WebSocket服务器已停止');
        }
    }
}

/**
 * 启动服务器
 */
function startServers(webPort = null, mcpPort = null) {
    const actualWebPort = webPort || process.env.WEB_PORT || 3001;
    const actualMcpPort = mcpPort || process.env.MCP_PORT || 8080;

    // 启动Web服务器
    const webServer = new WebServer(actualWebPort);
    webServer.start();

    // 启动MCP WebSocket服务器
    const mcpServer = new MCPWebSocketServer(actualMcpPort);
    mcpServer.start();

    // 处理退出信号
    process.on('SIGINT', () => {
        console.log('\n正在关闭服务器...');
        webServer.stop();
        mcpServer.stop();
        process.exit(0);
    });

    process.on('SIGTERM', () => {
        console.log('\n正在关闭服务器...');
        webServer.stop();
        mcpServer.stop();
        process.exit(0);
    });
}

// 如果直接运行这个文件，启动服务器
if (require.main === module) {
    console.log('启动MCP Web客户端服务器...');
    startServers();
}

module.exports = {
    WebServer,
    MCPWebSocketServer,
    startServers
}; 