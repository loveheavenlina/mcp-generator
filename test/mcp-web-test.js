/**
 * Web MCP服务器功能测试
 */

const WebSocket = require('ws');

class MCPWebTest {
    constructor() {
        this.ws = null;
        this.connected = false;
        this.pendingRequests = new Map();
        this.requestId = 1;
    }

    async connect(url = 'ws://localhost:8080') {
        return new Promise((resolve, reject) => {
            console.log(`正在连接到 ${url}...`);
            
            this.ws = new WebSocket(url);

            this.ws.onopen = () => {
                this.connected = true;
                console.log('✅ WebSocket连接成功');
                resolve();
            };

            this.ws.onclose = () => {
                this.connected = false;
                console.log('❌ WebSocket连接已断开');
            };

            this.ws.onerror = (error) => {
                console.error('❌ WebSocket连接错误:', error.message);
                reject(error);
            };

            this.ws.onmessage = (event) => {
                this.handleMessage(event.data);
            };
        });
    }

    handleMessage(data) {
        try {
            const message = JSON.parse(data);
            
            if (message.id && this.pendingRequests.has(message.id)) {
                const request = this.pendingRequests.get(message.id);
                this.pendingRequests.delete(message.id);
                
                if (message.error) {
                    request.reject(new Error(message.error.message));
                } else {
                    request.resolve(message.result);
                }
            }
        } catch (error) {
            console.error('❌ 消息解析错误:', error.message);
        }
    }

    async sendRequest(method, params = {}) {
        return new Promise((resolve, reject) => {
            if (!this.connected) {
                reject(new Error('WebSocket未连接'));
                return;
            }

            const id = this.requestId++;
            const request = {
                jsonrpc: '2.0',
                method,
                params,
                id
            };

            this.pendingRequests.set(id, { resolve, reject });
            this.ws.send(JSON.stringify(request));

            // 设置超时
            setTimeout(() => {
                if (this.pendingRequests.has(id)) {
                    this.pendingRequests.delete(id);
                    reject(new Error('请求超时'));
                }
            }, 10000);
        });
    }

    async testInitialize() {
        console.log('\n🔧 测试初始化...');
        try {
            const result = await this.sendRequest('initialize', {
                protocolVersion: '2024-11-05',
                capabilities: {
                    roots: { listChanged: true },
                    sampling: {}
                },
                clientInfo: {
                    name: 'Test Client',
                    version: '1.0.0'
                }
            });

            console.log('✅ 初始化成功');
            console.log('   服务器信息:', result.serverInfo?.name || '未知');
            console.log('   协议版本:', result.protocolVersion);
            return result;
        } catch (error) {
            console.error('❌ 初始化失败:', error.message);
            throw error;
        }
    }

    async testToolsList() {
        console.log('\n🛠️  测试工具列表...');
        try {
            const result = await this.sendRequest('tools/list');
            console.log(`✅ 获取到 ${result.tools?.length || 0} 个工具:`);
            
            if (result.tools) {
                result.tools.forEach((tool, index) => {
                    console.log(`   ${index + 1}. ${tool.name}: ${tool.description}`);
                });
            }
            
            return result.tools;
        } catch (error) {
            console.error('❌ 获取工具列表失败:', error.message);
            throw error;
        }
    }

    async testResourcesList() {
        console.log('\n📁 测试资源列表...');
        try {
            const result = await this.sendRequest('resources/list');
            console.log(`✅ 获取到 ${result.resources?.length || 0} 个资源:`);
            
            if (result.resources) {
                result.resources.forEach((resource, index) => {
                    console.log(`   ${index + 1}. ${resource.name || resource.uri}: ${resource.description || ''}`);
                });
            }
            
            return result.resources;
        } catch (error) {
            console.error('❌ 获取资源列表失败:', error.message);
            throw error;
        }
    }

    async testPromptsList() {
        console.log('\n💡 测试提示列表...');
        try {
            const result = await this.sendRequest('prompts/list');
            console.log(`✅ 获取到 ${result.prompts?.length || 0} 个提示:`);
            
            if (result.prompts) {
                result.prompts.forEach((prompt, index) => {
                    console.log(`   ${index + 1}. ${prompt.name}: ${prompt.description}`);
                });
            }
            
            return result.prompts;
        } catch (error) {
            console.error('❌ 获取提示列表失败:', error.message);
            throw error;
        }
    }

    async testToolCall() {
        console.log('\n🧮 测试工具调用（计算器）...');
        try {
            const result = await this.sendRequest('tools/call', {
                name: 'calculator',
                arguments: {
                    expression: '2+3*4'
                }
            });

            console.log('✅ 工具调用成功');
            if (result.content && result.content[0]) {
                console.log('   结果:', result.content[0].text);
            }
            
            return result;
        } catch (error) {
            console.error('❌ 工具调用失败:', error.message);
            throw error;
        }
    }

    async testResourceRead() {
        console.log('\n📖 测试资源读取（系统信息）...');
        try {
            const result = await this.sendRequest('resources/read', {
                uri: 'system://info'
            });

            console.log('✅ 资源读取成功');
            if (result.contents && result.contents[0]) {
                console.log('   资源内容长度:', result.contents[0].text?.length || 0, '字符');
            }
            
            return result;
        } catch (error) {
            console.error('❌ 资源读取失败:', error.message);
            throw error;
        }
    }

    async runAllTests() {
        try {
            console.log('🚀 开始MCP Web服务器功能测试');
            console.log('================================');

            await this.connect();
            await this.testInitialize();
            
            // 发送初始化完成通知
            this.ws.send(JSON.stringify({
                jsonrpc: '2.0',
                method: 'notifications/initialized'
            }));

            const tools = await this.testToolsList();
            const resources = await this.testResourcesList();
            const prompts = await this.testPromptsList();

            if (tools && tools.length > 0) {
                await this.testToolCall();
            }

            if (resources && resources.length > 0) {
                await this.testResourceRead();
            }

            console.log('\n🎉 所有测试完成！');
            console.log('================================');
            
            return {
                success: true,
                toolsCount: tools?.length || 0,
                resourcesCount: resources?.length || 0,
                promptsCount: prompts?.length || 0
            };

        } catch (error) {
            console.error('\n💥 测试失败:', error.message);
            return {
                success: false,
                error: error.message
            };
        } finally {
            if (this.ws) {
                this.ws.close();
            }
        }
    }
}

// 如果直接运行此文件，执行测试
if (require.main === module) {
    const test = new MCPWebTest();
    test.runAllTests().then(result => {
        if (result.success) {
            console.log(`\n📊 测试结果摘要:`);
            console.log(`   工具数量: ${result.toolsCount}`);
            console.log(`   资源数量: ${result.resourcesCount}`);
            console.log(`   提示数量: ${result.promptsCount}`);
            process.exit(0);
        } else {
            console.error(`\n❌ 测试失败: ${result.error}`);
            process.exit(1);
        }
    });
}

module.exports = MCPWebTest; 