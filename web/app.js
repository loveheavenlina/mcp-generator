/**
 * MCP Web客户端主应用程序
 * 处理用户界面交互和MCP客户端集成
 */

class MCPWebApp {
    constructor() {
        this.client = null;
        this.currentResults = [];
        this.commandHistory = [];
        this.historyIndex = -1;
        
        this.initializeElements();
        this.bindEvents();
        this.updateUI();
        
        this.log('系统', 'MCP Web客户端已加载');
    }

    /**
     * 初始化DOM元素引用
     */
    initializeElements() {
        // 连接相关
        this.connectBtn = document.getElementById('connectBtn');
        this.statusIndicator = document.getElementById('statusIndicator');
        this.statusText = document.getElementById('statusText');
        this.connectionModal = document.getElementById('connectionModal');
        this.modalClose = document.getElementById('modalClose');
        this.cancelConnect = document.getElementById('cancelConnect');
        this.confirmConnect = document.getElementById('confirmConnect');
        this.loadingOverlay = document.getElementById('loadingOverlay');

        // 配置输入
        this.serverUrlInput = document.getElementById('serverUrl');
        this.clientNameInput = document.getElementById('clientName');
        this.timeoutInput = document.getElementById('timeout');

        // 服务器信息
        this.serverInfo = document.getElementById('serverInfo');
        this.toolsList = document.getElementById('toolsList');
        this.resourcesList = document.getElementById('resourcesList');
        this.promptsList = document.getElementById('promptsList');

        // 命令输入
        this.commandType = document.getElementById('commandType');
        this.commandInput = document.getElementById('commandInput');
        this.executeBtn = document.getElementById('executeBtn');

        // 结果和日志
        this.resultsContainer = document.getElementById('resultsContainer');
        this.logsContainer = document.getElementById('logsContainer');
    }

    /**
     * 绑定事件监听器
     */
    bindEvents() {
        // 连接按钮
        this.connectBtn.addEventListener('click', () => {
            if (this.client && this.client.connected) {
                this.disconnect();
            } else {
                this.showConnectionModal();
            }
        });

        // 模态框事件
        this.modalClose.addEventListener('click', () => this.hideConnectionModal());
        this.cancelConnect.addEventListener('click', () => this.hideConnectionModal());
        this.confirmConnect.addEventListener('click', () => this.connect());

        // 点击模态框外部关闭
        this.connectionModal.addEventListener('click', (e) => {
            if (e.target === this.connectionModal) {
                this.hideConnectionModal();
            }
        });

        // 命令输入
        this.commandInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.executeCommand();
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                this.navigateHistory(-1);
            } else if (e.key === 'ArrowDown') {
                e.preventDefault();
                this.navigateHistory(1);
            }
        });

        this.commandInput.addEventListener('input', () => {
            this.updateExecuteButton();
        });

        this.executeBtn.addEventListener('click', () => this.executeCommand());

        // 键盘快捷键
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === 'Enter') {
                this.executeCommand();
            }
        });
    }

    /**
     * 显示连接配置模态框
     */
    showConnectionModal() {
        this.connectionModal.classList.add('show');
        this.serverUrlInput.focus();
    }

    /**
     * 隐藏连接配置模态框
     */
    hideConnectionModal() {
        this.connectionModal.classList.remove('show');
    }

    /**
     * 显示/隐藏加载遮罩
     */
    showLoading(show = true) {
        if (show) {
            this.loadingOverlay.classList.add('show');
        } else {
            this.loadingOverlay.classList.remove('show');
        }
    }

    /**
     * 连接到MCP服务器
     */
    async connect() {
        const serverUrl = this.serverUrlInput.value.trim();
        const clientName = this.clientNameInput.value.trim();
        const timeout = parseInt(this.timeoutInput.value) * 1000;

        if (!serverUrl) {
            alert('请输入服务器地址');
            return;
        }

        this.hideConnectionModal();
        this.showLoading(true);

        try {
            this.client = new WebMCPClient();
            this.client.requestTimeout = timeout;

            // 绑定客户端事件
            this.bindClientEvents();

            await this.client.connect(serverUrl, clientName);
            
            this.log('成功', `已连接到MCP服务器: ${serverUrl}`);
            this.updateUI();

        } catch (error) {
            this.log('错误', `连接失败: ${error.message}`);
            this.client = null;
            this.updateUI();
        } finally {
            this.showLoading(false);
        }
    }

    /**
     * 断开连接
     */
    disconnect() {
        if (this.client) {
            this.client.disconnect();
            this.client = null;
            this.log('警告', '已断开与MCP服务器的连接');
            this.updateUI();
        }
    }

    /**
     * 绑定MCP客户端事件
     */
    bindClientEvents() {
        if (!this.client) return;

        this.client.on('connected', (url) => {
            this.updateConnectionStatus('connected', '已连接');
        });

        this.client.on('disconnected', (code, reason) => {
            this.updateConnectionStatus('disconnected', '已断开');
            this.log('警告', `连接断开: ${reason || '未知原因'}`);
        });

        this.client.on('error', (error) => {
            this.log('错误', `客户端错误: ${error.message}`);
        });

        this.client.on('log', (logData) => {
            this.log(logData.level, logData.message);
        });

        this.client.on('toolsUpdated', (tools) => {
            this.updateToolsList(tools);
        });

        this.client.on('resourcesUpdated', (resources) => {
            this.updateResourcesList(resources);
        });

        this.client.on('promptsUpdated', (prompts) => {
            this.updatePromptsList(prompts);
        });
    }

    /**
     * 更新连接状态显示
     */
    updateConnectionStatus(status, text) {
        this.statusIndicator.className = `status-indicator ${status}`;
        this.statusText.textContent = text;
    }

    /**
     * 更新UI状态
     */
    updateUI() {
        const connected = this.client && this.client.connected;
        const initialized = this.client && this.client.initialized;

        // 更新连接按钮
        this.connectBtn.innerHTML = connected 
            ? '<i class="fas fa-unlink"></i> 断开连接'
            : '<i class="fas fa-plug"></i> 连接服务器';

        // 更新状态指示器
        if (connected && initialized) {
            this.updateConnectionStatus('connected', '已连接');
        } else if (connected) {
            this.updateConnectionStatus('connecting', '连接中');
        } else {
            this.updateConnectionStatus('disconnected', '未连接');
        }

        // 更新执行按钮状态
        this.updateExecuteButton();

        // 更新服务器信息
        this.updateServerInfo();
    }

    /**
     * 更新执行按钮状态
     */
    updateExecuteButton() {
        const canExecute = this.client && 
                          this.client.initialized && 
                          this.commandInput.value.trim();
        this.executeBtn.disabled = !canExecute;
    }

    /**
     * 更新服务器信息显示
     */
    updateServerInfo() {
        if (!this.client || !this.client.initialized) {
            this.serverInfo.innerHTML = '<p class="no-data">未连接到服务器</p>';
            return;
        }

        const info = this.client.getServerInfo();
        const serverCapabilities = info.capabilities;

        this.serverInfo.innerHTML = `
            <div class="info-item">
                <span class="info-label">连接状态:</span>
                <span class="info-value">${info.connected ? '已连接' : '未连接'}</span>
            </div>
            <div class="info-item">
                <span class="info-label">初始化状态:</span>
                <span class="info-value">${info.initialized ? '已初始化' : '未初始化'}</span>
            </div>
            <div class="info-item">
                <span class="info-label">工具数量:</span>
                <span class="info-value">${info.toolsCount}</span>
            </div>
            <div class="info-item">
                <span class="info-label">资源数量:</span>
                <span class="info-value">${info.resourcesCount}</span>
            </div>
            <div class="info-item">
                <span class="info-label">提示数量:</span>
                <span class="info-value">${info.promptsCount}</span>
            </div>
            ${serverCapabilities ? `
            <div class="info-item">
                <span class="info-label">服务器能力:</span>
                <span class="info-value">${Object.keys(serverCapabilities).join(', ')}</span>
            </div>
            ` : ''}
        `;
    }

    /**
     * 更新工具列表
     */
    updateToolsList(tools) {
        if (!tools || tools.length === 0) {
            this.toolsList.innerHTML = '<p class="no-data">无可用工具</p>';
            return;
        }

        this.toolsList.innerHTML = tools.map(tool => `
            <div class="tool-item" data-tool-name="${tool.name}">
                <h4>${tool.name}</h4>
                <p>${tool.description || '无描述'}</p>
            </div>
        `).join('');

        // 添加点击事件
        this.toolsList.querySelectorAll('.tool-item').forEach(item => {
            item.addEventListener('click', () => {
                const toolName = item.dataset.toolName;
                this.commandInput.value = toolName;
                this.commandType.value = 'tool';
                this.commandInput.focus();
                this.updateExecuteButton();
            });
        });
    }

    /**
     * 更新资源列表
     */
    updateResourcesList(resources) {
        if (!resources || resources.length === 0) {
            this.resourcesList.innerHTML = '<p class="no-data">无可用资源</p>';
            return;
        }

        this.resourcesList.innerHTML = resources.map(resource => `
            <div class="resource-item" data-resource-uri="${resource.uri}">
                <h4>${resource.name || resource.uri}</h4>
                <p>${resource.description || '无描述'}</p>
            </div>
        `).join('');

        // 添加点击事件
        this.resourcesList.querySelectorAll('.resource-item').forEach(item => {
            item.addEventListener('click', () => {
                const resourceUri = item.dataset.resourceUri;
                this.commandInput.value = `resource:${resourceUri}`;
                this.commandType.value = 'resource';
                this.commandInput.focus();
                this.updateExecuteButton();
            });
        });
    }

    /**
     * 更新提示列表
     */
    updatePromptsList(prompts) {
        if (!prompts || prompts.length === 0) {
            this.promptsList.innerHTML = '<p class="no-data">无可用提示</p>';
            return;
        }

        this.promptsList.innerHTML = prompts.map(prompt => `
            <div class="prompt-item" data-prompt-name="${prompt.name}">
                <h4>${prompt.name}</h4>
                <p>${prompt.description || '无描述'}</p>
            </div>
        `).join('');

        // 添加点击事件
        this.promptsList.querySelectorAll('.prompt-item').forEach(item => {
            item.addEventListener('click', () => {
                const promptName = item.dataset.promptName;
                this.commandInput.value = `prompt:${promptName}`;
                this.commandType.value = 'prompt';
                this.commandInput.focus();
                this.updateExecuteButton();
            });
        });
    }

    /**
     * 执行命令
     */
    async executeCommand() {
        if (!this.client || !this.client.initialized) {
            this.log('错误', '客户端未连接或未初始化');
            return;
        }

        const commandText = this.commandInput.value.trim();
        if (!commandText) {
            return;
        }

        // 添加到历史记录
        this.addToHistory(commandText);

        this.log('执行', `执行命令: ${commandText}`);

        try {
            // 解析命令
            const commandType = this.commandType.value;
            const command = CommandParser.parseCommand(commandText, commandType);

            let result;
            const startTime = Date.now();

            // 执行对应的操作
            switch (command.type) {
                case 'tool':
                    result = await this.client.callTool(command.tool, command.arguments);
                    break;
                case 'resource':
                    result = await this.client.readResource(command.uri);
                    break;
                case 'prompt':
                    result = await this.client.getPrompt(command.prompt, command.arguments);
                    break;
                default:
                    throw new Error(`不支持的命令类型: ${command.type}`);
            }

            const duration = Date.now() - startTime;
            this.addResult(commandText, result, true, duration);
            this.log('成功', `命令执行完成 (${duration}ms)`);

        } catch (error) {
            this.addResult(commandText, error.message, false);
            this.log('错误', `命令执行失败: ${error.message}`);
        }

        // 清空输入框
        this.commandInput.value = '';
        this.updateExecuteButton();
    }

    /**
     * 添加执行结果
     */
    addResult(command, result, success, duration = null) {
        const resultId = Date.now().toString();
        const timestamp = new Date().toLocaleTimeString();

        const resultData = {
            id: resultId,
            command,
            result,
            success,
            timestamp,
            duration
        };

        this.currentResults.unshift(resultData);

        // 限制结果数量
        if (this.currentResults.length > 50) {
            this.currentResults = this.currentResults.slice(0, 50);
        }

        this.updateResultsDisplay();
    }

    /**
     * 更新结果显示
     */
    updateResultsDisplay() {
        if (this.currentResults.length === 0) {
            this.resultsContainer.innerHTML = `
                <div class="no-results">
                    <i class="fas fa-info-circle"></i>
                    <p>在此查看指令执行结果</p>
                </div>
            `;
            return;
        }

        this.resultsContainer.innerHTML = this.currentResults.map(result => {
            const resultText = typeof result.result === 'object' 
                ? JSON.stringify(result.result, null, 2)
                : String(result.result);

            const durationText = result.duration 
                ? ` (${result.duration}ms)`
                : '';

            return `
                <div class="result-item ${result.success ? 'result-success' : 'result-error'}">
                    <div class="result-header">
                        <span class="result-command">${result.command}</span>
                        <span class="result-time">${result.timestamp}${durationText}</span>
                    </div>
                    <div class="result-content">${resultText}</div>
                </div>
            `;
        }).join('');
    }

    /**
     * 添加到命令历史
     */
    addToHistory(command) {
        // 避免重复
        const index = this.commandHistory.indexOf(command);
        if (index > -1) {
            this.commandHistory.splice(index, 1);
        }

        this.commandHistory.unshift(command);

        // 限制历史记录数量
        if (this.commandHistory.length > 100) {
            this.commandHistory = this.commandHistory.slice(0, 100);
        }

        this.historyIndex = -1;
    }

    /**
     * 导航命令历史
     */
    navigateHistory(direction) {
        if (this.commandHistory.length === 0) return;

        this.historyIndex += direction;

        if (this.historyIndex < -1) {
            this.historyIndex = -1;
        } else if (this.historyIndex >= this.commandHistory.length) {
            this.historyIndex = this.commandHistory.length - 1;
        }

        if (this.historyIndex === -1) {
            this.commandInput.value = '';
        } else {
            this.commandInput.value = this.commandHistory[this.historyIndex];
        }

        this.updateExecuteButton();
    }

    /**
     * 记录日志
     */
    log(level, message) {
        const timestamp = new Date().toLocaleTimeString();
        const logEntry = document.createElement('div');
        logEntry.className = `log-entry ${level.toLowerCase()}`;
        
        logEntry.innerHTML = `
            <span class="log-time">${timestamp}</span>
            <span class="log-message">[${level}] ${message}</span>
        `;

        this.logsContainer.insertBefore(logEntry, this.logsContainer.firstChild);

        // 限制日志条数
        const logs = this.logsContainer.querySelectorAll('.log-entry');
        if (logs.length > 200) {
            for (let i = 200; i < logs.length; i++) {
                logs[i].remove();
            }
        }

        // 滚动到最新日志
        logEntry.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
}

// 当页面加载完成时初始化应用
document.addEventListener('DOMContentLoaded', () => {
    window.mcpApp = new MCPWebApp();
});

// 导出给全局使用
if (typeof window !== 'undefined') {
    window.MCPWebApp = MCPWebApp;
} 