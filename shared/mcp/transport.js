/**
 * MCP传输层实现
 * 支持不同的传输方式：内存、WebSocket、标准输入输出等
 */

const EventEmitter = require('events');

/**
 * 传输基类
 */
class Transport extends EventEmitter {
  constructor() {
    super();
    this.isConnected = false;
  }

  /**
   * 发送消息
   */
  async send(message) {
    throw new Error('send method must be implemented');
  }

  /**
   * 连接
   */
  async connect() {
    throw new Error('connect method must be implemented');
  }

  /**
   * 断开连接
   */
  async disconnect() {
    throw new Error('disconnect method must be implemented');
  }
}

/**
 * 内存传输实现
 * 用于在同一进程中连接客户端和服务器
 */
class MemoryTransport extends Transport {
  constructor() {
    super();
    this.peer = null;
  }

  /**
   * 连接到对等端
   */
  connectTo(peer) {
    this.peer = peer;
    peer.peer = this;
    this.isConnected = true;
    peer.isConnected = true;
    
    this.emit('connect');
    peer.emit('connect');
  }

  /**
   * 发送消息
   */
  async send(message) {
    if (!this.isConnected || !this.peer) {
      throw new Error('未连接到对等端');
    }

    const messageStr = typeof message === 'string' ? message : JSON.stringify(message);
    
    // 异步发送消息到对等端
    setImmediate(() => {
      this.peer.emit('message', messageStr);
    });
  }

  /**
   * 连接
   */
  async connect() {
    this.isConnected = true;
    this.emit('connect');
  }

  /**
   * 断开连接
   */
  async disconnect() {
    this.isConnected = false;
    if (this.peer) {
      this.peer.isConnected = false;
      this.peer.emit('disconnect');
      this.peer.peer = null;
      this.peer = null;
    }
    this.emit('disconnect');
  }
}

/**
 * WebSocket传输实现
 */
class WebSocketTransport extends Transport {
  constructor(url = null, WebSocket = null) {
    super();
    this.url = url;
    this.WebSocket = WebSocket || (typeof window !== 'undefined' ? window.WebSocket : require('ws'));
    this.ws = null;
  }

  /**
   * 连接到WebSocket服务器
   */
  async connect() {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new this.WebSocket(this.url);
        
        this.ws.onopen = () => {
          this.isConnected = true;
          this.emit('connect');
          resolve();
        };
        
        this.ws.onmessage = (event) => {
          this.emit('message', event.data);
        };
        
        this.ws.onclose = () => {
          this.isConnected = false;
          this.emit('disconnect');
        };
        
        this.ws.onerror = (error) => {
          this.emit('error', error);
          reject(error);
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * 发送消息
   */
  async send(message) {
    if (!this.isConnected || !this.ws) {
      throw new Error('WebSocket未连接');
    }

    const messageStr = typeof message === 'string' ? message : JSON.stringify(message);
    this.ws.send(messageStr);
  }

  /**
   * 断开连接
   */
  async disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.isConnected = false;
  }
}

/**
 * 标准输入输出传输实现
 * 用于命令行工具
 */
class StdioTransport extends Transport {
  constructor() {
    super();
    this.setupStdio();
  }

  /**
   * 设置标准输入输出
   */
  setupStdio() {
    if (process.stdin && process.stdout) {
      process.stdin.setEncoding('utf8');
      process.stdin.on('data', (chunk) => {
        const lines = chunk.split('\n');
        for (const line of lines) {
          if (line.trim()) {
            try {
              this.emit('message', line.trim());
            } catch (error) {
              this.emit('error', error);
            }
          }
        }
      });
    }
  }

  /**
   * 连接
   */
  async connect() {
    this.isConnected = true;
    this.emit('connect');
  }

  /**
   * 发送消息
   */
  async send(message) {
    if (!this.isConnected) {
      throw new Error('标准输入输出传输未连接');
    }

    const messageStr = typeof message === 'string' ? message : JSON.stringify(message);
    process.stdout.write(messageStr + '\n');
  }

  /**
   * 断开连接
   */
  async disconnect() {
    this.isConnected = false;
    this.emit('disconnect');
  }
}

/**
 * 传输连接器
 * 用于连接MCP客户端和服务器
 */
class TransportConnector {
  constructor(serverTransport, clientTransport) {
    this.serverTransport = serverTransport;
    this.clientTransport = clientTransport;
  }

  /**
   * 连接服务器和客户端传输
   */
  connect(server, client) {
    // 服务器传输事件处理
    this.serverTransport.on('message', async (message) => {
      const response = await server.handleMessage(message);
      if (response) {
        await this.serverTransport.send(response);
      }
    });

    // 服务器输出事件处理
    server.on('response', async (response) => {
      try {
        await this.serverTransport.send(response);
      } catch (error) {
        // 忽略发送失败（如传输已断开）
      }
    });

    server.on('notification_out', async (notification) => {
      try {
        await this.serverTransport.send(notification);
      } catch (error) {
        // 忽略发送失败（如传输已断开）
      }
    });

    // 客户端传输事件处理
    this.clientTransport.on('message', async (message) => {
      await client.handleMessage(message);
    });

    // 客户端输出事件处理
    client.on('request_out', async (request) => {
      await this.clientTransport.send(request);
    });

    client.on('notification_out', async (notification) => {
      await this.clientTransport.send(notification);
    });

    // 连接传输
    if (this.serverTransport instanceof MemoryTransport && 
        this.clientTransport instanceof MemoryTransport) {
      this.serverTransport.connectTo(this.clientTransport);
    }
  }

  /**
   * 断开连接
   */
  async disconnect() {
    await this.serverTransport.disconnect();
    await this.clientTransport.disconnect();
  }
}

module.exports = {
  Transport,
  MemoryTransport,
  WebSocketTransport,
  StdioTransport,
  TransportConnector
}; 