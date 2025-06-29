#!/usr/bin/env node

/**
 * MCP Web客户端启动脚本
 * 同时启动HTTP服务器和MCP WebSocket服务器
 */

const { startServers } = require('./server/server');

// 配置
const WEB_PORT = process.env.WEB_PORT || 3001;  // 改为3001避免冲突
const MCP_PORT = process.env.MCP_PORT || 8080;

console.log('===================================');
console.log('     MCP Web客户端启动器');
console.log('===================================');
console.log('');

console.log('正在启动服务器...');
console.log('');

try {
    startServers(WEB_PORT, MCP_PORT);
    
    console.log('');
    console.log('===================================');
    console.log('       服务器启动成功!');
    console.log('===================================');
    console.log('');
    console.log(`📱 Web客户端: http://localhost:${WEB_PORT}`);
    console.log(`🔌 MCP服务器: ws://localhost:${MCP_PORT}`);
    console.log('');
    console.log('使用说明:');
    console.log('1. 在浏览器中打开 http://localhost:' + WEB_PORT);
    console.log('2. 点击"连接服务器"按钮');
    console.log('3. 默认服务器地址为 ws://localhost:' + MCP_PORT);
    console.log('4. 连接成功后即可在界面中输入指令');
    console.log('');
    console.log('示例指令:');
    console.log('• calculator 2+3*4');
    console.log('• current_time Asia/Shanghai');
    console.log('• random_number min=1 max=100');
    console.log('• echo text="Hello MCP!"');
    console.log('• resource:system://info');
    console.log('• prompt:code-generator language=JavaScript task=排序算法');
    console.log('');
    console.log('按 Ctrl+C 退出');
    console.log('===================================');
    
} catch (error) {
    console.error('启动失败:', error.message);
    process.exit(1);
} 