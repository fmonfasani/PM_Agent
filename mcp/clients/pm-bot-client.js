// mcp/clients/pm-bot-client.js
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { spawn } from "child_process";
import fs from 'fs/promises';
import path from 'path';

export class MCPClientManager {
  constructor() {
    this.clients = new Map();
    this.availableTools = new Map();
    this.availableResources = new Map();
    this.config = null;
    this.connectionStatus = new Map();
  }

  async initialize(configPath = './mcp/config/mcp-config.json') {
    try {
      const configContent = await fs.readFile(configPath, 'utf8');
      this.config = JSON.parse(configContent);
      console.log('📄 MCP Client configuration loaded');
      
      await this.connectToMCPServers();
      return true;
    } catch (error) {
      console.error('❌ Error loading MCP config:', error.message);
      return false;
    }
  }

  async connectToMCPServers() {
    console.log('🔗 Connecting to MCP servers...');
    
    for (const [serverName, serverConfig] of Object.entries(this.config.mcpServers)) {
      try {
        await this.connectToServer(serverName, serverConfig);
      } catch (error) {
        console.error(`❌ Failed to connect to ${serverName}:`, error.message);
        this.connectionStatus.set(serverName, { connected: false, error: error.message });
      }
    }

    const connectedCount = Array.from(this.connectionStatus.values())
      .filter(status => status.connected).length;
    
    console.log(`🎯 Connected to ${connectedCount}/${Object.keys(this.config.mcpServers).length} MCP servers`);
  }

  async connectToServer(serverName, serverConfig) {
    console.log(`🔌 Connecting to ${serverName}...`);
    
    // Crear transporte
    const transport = new StdioClientTransport({
      command: serverConfig.command,
      args: serverConfig.args,
      env: { 
        ...process.env, 
        ...(serverConfig.env || {}) 
      }
    });

    // Crear cliente
    const client = new Client(
      {
        name: "pm-bot-client",
        version: "4.1.0"
      },
      {
        capabilities: {
          sampling: false
        }
      }
    );

    // Conectar
    await client.connect(transport);
    
    // Descubrir herramientas y recursos
    await this.discoverCapabilities(client, serverName);
    
    // Guardar cliente
    this.clients.set(serverName, client);
    this.connectionStatus.set(serverName, { 
      connected: true, 
      connectedAt: new Date().toISOString(),
      capabilities: {
        tools: this.availableTools.get(serverName)?.length || 0,
        resources: this.availableResources.get(serverName)?.length || 0
      }
    });

    console.log(`✅ Connected to ${serverName} MCP server`);
  }

  async discoverCapabilities(client, serverName) {
    try {
      // Descubrir herramientas
      const toolsResponse = await client.request("tools/list", {});
      const tools = toolsResponse.tools || [];
      this.availableTools.set(serverName, tools);
      
      console.log(`  🔧 ${serverName}: ${tools.length} tools available`);
      
      // Descubrir recursos
      const resourcesResponse = await client.request("resources/list", {});
      const resources = resourcesResponse.resources || [];
      this.availableResources.set(serverName, resources);
      
      console.log(`  📊 ${serverName}: ${resources.length} resources available`);
      
    } catch (error) {
      console.warn(`⚠️ Could not discover capabilities for ${serverName}:`, error.message);
      this.availableTools.set(serverName, []);
      this.availableResources.set(serverName, []);
    }
  }

  async callTool(serverName, toolName, args = {}) {
    const client = this.clients.get(serverName);
    if (!client) {
      throw new Error(`No connection to server: ${serverName}`);
    }

    console.log(`🛠️ Calling ${serverName}.${toolName} with args:`, args);

    try {
      const response = await client.request("tools/call", {
        name: toolName,
        arguments: args
      });

      console.log(`✅ Tool ${serverName}.${toolName} executed successfully`);
      return response;
    } catch (error) {
      console.error(`❌ Tool ${serverName}.${toolName} failed:`, error.message);
      throw error;
    }
  }

  async readResource(serverName, resourceUri) {
    const client = this.clients.get(serverName);
    if (!client) {
      throw new Error(`No connection to server: ${serverName}`);
    }

    console.log(`📖 Reading resource ${resourceUri} from ${serverName}`);

    try {
      const response = await client.request("resources/read", {
        uri: resourceUri
      });

      console.log(`✅ Resource ${resourceUri} read successfully`);
      return response;
    } catch (error) {
      console.error(`❌ Resource ${resourceUri} read failed:`, error.message);
      throw error;
    }
  }

  getAvailableTools() {
    const allTools = [];
    
    for (const [serverName, tools] of this.availableTools) {
      for (const tool of tools) {
        allTools.push({
          server: serverName,
          name: tool.name,
          description: tool.description,
          inputSchema: tool.inputSchema,
          fullName: `${serverName}.${tool.name}`
        });
      }
    }
    
    return allTools;
  }

  getAvailableResources() {
    const allResources = [];
    
    for (const [serverName, resources] of this.availableResources) {
      for (const resource of resources) {
        allResources.push({
          server: serverName,
          name: resource.name,
          uri: resource.uri,
          description: resource.description,
          mimeType: resource.mimeType
        });
      }
    }
    
    return allResources;
  }

  getToolsForAgent(agentType) {
    const agentConfig = this.config.agentMappings[agentType];
    if (!agentConfig) {
      return this.getAvailableTools();
    }

    const preferredServers = agentConfig.preferredTools || [];
    const tools = this.getAvailableTools();
    
    // Filtrar herramientas preferidas para este agente
    return tools.filter(tool => 
      preferredServers.includes(tool.server) ||
      agentConfig.specialties.some(specialty => 
        tool.description.toLowerCase().includes(specialty.toLowerCase())
      )
    );
  }

  getConnectionStatus() {
    const status = {};
    for (const [serverName, details] of this.connectionStatus) {
      status[serverName] = {
        ...details,
        tools: this.availableTools.get(serverName)?.map(t => t.name) || [],
        resources: this.availableResources.get(serverName)?.map(r => r.name) || []
      };
    }
    return status;
  }

  async executeAgentTask(agentType, task, context = {}) {
    console.log(`🎭 Executing task for ${agentType}: ${task}`);
    
    // Obtener herramientas relevantes para este agente
    const relevantTools = this.getToolsForAgent(agentType);
    
    // Analizar la tarea para determinar qué herramientas usar
    const selectedTools = this.selectToolsForTask(task, relevantTools);
    
    console.log(`🔧 Selected ${selectedTools.length} tools for ${agentType}`);
    
    const results = [];
    
    // Ejecutar herramientas seleccionadas
    for (const tool of selectedTools) {
      try {
        const args = this.generateToolArgs(task, tool, context);
        const result = await this.callTool(tool.server, tool.name, args);
        
        results.push({
          tool: tool.fullName,
          success: true,
          result: result
        });
      } catch (error) {
        results.push({
          tool: tool.fullName,
          success: false,
          error: error.message
        });
      }
    }

    return {
      agentType,
      task,
      toolsUsed: selectedTools.length,
      results,
      summary: `${agentType} completed task using ${selectedTools.length} MCP tools`
    };
  }

  selectToolsForTask(task, availableTools) {
    const taskLower = task.toLowerCase();
    const selectedTools = [];

    // Lógica simple de selección basada en keywords
    if (taskLower.includes('file') || taskLower.includes('project') || taskLower.includes('code')) {
      const fileTool = availableTools.find(t => t.server === 'filesystem');
      if (fileTool) selectedTools.push(fileTool);
    }

    if (taskLower.includes('data') || taskLower.includes('store') || taskLower.includes('save')) {
      const dbTool = availableTools.find(t => t.server === 'sqlite');
      if (dbTool) selectedTools.push(dbTool);
    }

    if (taskLower.includes('search') || taskLower.includes('find') || taskLower.includes('research')) {
      const searchTool = availableTools.find(t => t.server === 'brave-search');
      if (searchTool) selectedTools.push(searchTool);
    }

    // Si no se seleccionó nada, usar las primeras disponibles
    if (selectedTools.length === 0 && availableTools.length > 0) {
      selectedTools.push(availableTools[0]);
    }

    return selectedTools;
  }

  generateToolArgs(task, tool, context) {
    // Generar argumentos básicos basados en el tipo de herramienta
    const args = {};

    if (tool.server === 'filesystem') {
      if (tool.name === 'write_file') {
        args.path = context.filePath || './test-file.txt';
        args.content = context.content || `Generated by PM Bot: ${task}`;
      } else if (tool.name === 'read_file') {
        args.path = context.filePath || './README.md';
      }
    } else if (tool.server === 'sqlite') {
      if (tool.name === 'execute_query') {
        args.query = context.query || `SELECT datetime('now') as timestamp, '${task}' as task`;
      }
    } else if (tool.server === 'brave-search') {
      if (tool.name === 'search') {
        args.query = context.searchQuery || task;
      }
    }

    return args;
  }

  async disconnect() {
    console.log('🔌 Disconnecting from MCP servers...');
    
    for (const [serverName, client] of this.clients) {
      try {
        // Note: MCP SDK doesn't have explicit disconnect in current version
        // This will be handled by process termination
        console.log(`✅ Disconnected from ${serverName}`);
      } catch (error) {
        console.error(`❌ Error disconnecting from ${serverName}:`, error.message);
      }
    }
    
    this.clients.clear();
    this.connectionStatus.clear();
  }
}