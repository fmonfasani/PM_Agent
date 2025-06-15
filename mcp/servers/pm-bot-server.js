// mcp/servers/pm-bot-server.js
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

// Simulación del PM Bot (en producción, importarías el real)
class PMBotMCPInterface {
  constructor() {
    this.projects = new Map();
    this.agents = new Map([
      ['claude', { name: 'Claude (Anthropic)', specialties: ['architecture', 'analysis'], active: true }],
      ['gpt', { name: 'GPT (OpenAI)', specialties: ['creativity', 'frontend'], active: true }]
    ]);
    this.collaborationLog = [];
  }

  async createProject(description, complexity = 'medium') {
    const projectId = `proj_${Date.now()}`;
    const project = {
      id: projectId,
      description,
      complexity,
      status: 'created',
      timestamp: new Date().toISOString(),
      agents_assigned: ['claude', 'gpt']
    };
    
    this.projects.set(projectId, project);
    this.logCollaboration('create_project', { projectId, description });
    
    return project;
  }

  async assignTask(projectId, task, agentType, priority = 'medium') {
    const project = this.projects.get(projectId);
    if (!project) {
      throw new Error(`Project not found: ${projectId}`);
    }

    const assignment = {
      id: `task_${Date.now()}`,
      projectId,
      task,
      agentType,
      priority,
      status: 'assigned',
      timestamp: new Date().toISOString()
    };

    this.logCollaboration('assign_task', assignment);
    return assignment;
  }

  async runAnalysis(projectId, analysisType = 'comprehensive') {
    const project = this.projects.get(projectId);
    if (!project) {
      throw new Error(`Project not found: ${projectId}`);
    }

    const analysis = {
      projectId,
      analysisType,
      findings: ['Code structure is well organized', 'Multi-agent collaboration effective'],
      issues: [
        { type: 'warning', description: 'Consider adding more unit tests', severity: 'medium' }
      ],
      recommendations: ['Implement CI/CD pipeline', 'Add performance monitoring'],
      timestamp: new Date().toISOString()
    };

    this.logCollaboration('run_analysis', { projectId, analysisType });
    return analysis;
  }

  async getProjectStatus() {
    return {
      totalProjects: this.projects.size,
      activeAgents: Array.from(this.agents.values()).filter(a => a.active).length,
      totalCollaborations: this.collaborationLog.length,
      projects: Array.from(this.projects.values())
    };
  }

  async getAgentMetrics() {
    return {
      agents: Array.from(this.agents.entries()).map(([key, agent]) => ({
        id: key,
        name: agent.name,
        specialties: agent.specialties,
        active: agent.active,
        participations: this.collaborationLog.filter(log => 
          log.data.agentType === key || log.data.agents_assigned?.includes(key)
        ).length
      }))
    };
  }

  logCollaboration(action, data) {
    this.collaborationLog.push({
      id: `collab_${Date.now()}`,
      action,
      data,
      timestamp: new Date().toISOString()
    });
  }
}

// Crear instancia del PM Bot
const pmBot = new PMBotMCPInterface();

// Crear servidor MCP
const server = new Server(
  {
    name: "pm-bot-server",
    version: "4.1.0",
  },
  {
    capabilities: {
      tools: {},
      resources: {},
    },
  }
);

// ============ HERRAMIENTAS MCP ============

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "create_project",
        description: "Create a new project with multi-agent collaboration",
        inputSchema: {
          type: "object",
          properties: {
            description: {
              type: "string",
              description: "Project description"
            },
            complexity: {
              type: "string",
              enum: ["simple", "medium", "complex"],
              description: "Project complexity level"
            }
          },
          required: ["description"]
        }
      },
      {
        name: "assign_task",
        description: "Assign a specific task to an agent",
        inputSchema: {
          type: "object",
          properties: {
            project_id: {
              type: "string",
              description: "Project ID"
            },
            task: {
              type: "string",
              description: "Task description"
            },
            agent_type: {
              type: "string",
              enum: ["claude", "gpt"],
              description: "Type of agent to assign the task to"
            },
            priority: {
              type: "string",
              enum: ["high", "medium", "low"],
              description: "Task priority"
            }
          },
          required: ["project_id", "task", "agent_type"]
        }
      },
      {
        name: "run_analysis",
        description: "Run multi-agent analysis on a project",
        inputSchema: {
          type: "object",
          properties: {
            project_id: {
              type: "string",
              description: "Project ID to analyze"
            },
            analysis_type: {
              type: "string",
              enum: ["comprehensive", "code", "architecture", "performance"],
              description: "Type of analysis to perform"
            }
          },
          required: ["project_id"]
        }
      },
      {
        name: "get_collaboration_stats",
        description: "Get collaboration statistics between agents",
        inputSchema: {
          type: "object",
          properties: {},
          required: []
        }
      }
    ]
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case "create_project":
        const project = await pmBot.createProject(args.description, args.complexity);
        return {
          content: [
            {
              type: "text",
              text: `✅ Project created successfully!\n\nProject ID: ${project.id}\nDescription: ${project.description}\nComplexity: ${project.complexity}\nAgents assigned: ${project.agents_assigned.join(', ')}\n\nThe multi-agent team is ready to start working on this project.`
            }
          ]
        };

      case "assign_task":
        const assignment = await pmBot.assignTask(
          args.project_id, 
          args.task, 
          args.agent_type, 
          args.priority
        );
        return {
          content: [
            {
              type: "text",
              text: `🎯 Task assigned successfully!\n\nTask ID: ${assignment.id}\nAgent: ${assignment.agentType}\nPriority: ${assignment.priority}\nTask: ${assignment.task}\n\nThe ${assignment.agentType} agent will begin working on this task.`
            }
          ]
        };

      case "run_analysis":
        const analysis = await pmBot.runAnalysis(args.project_id, args.analysis_type);
        return {
          content: [
            {
              type: "text",
              text: `🔍 Multi-agent analysis completed!\n\nProject: ${analysis.projectId}\nAnalysis Type: ${analysis.analysisType}\n\n📋 Key Findings:\n${analysis.findings.map(f => `• ${f}`).join('\n')}\n\n⚠️ Issues Identified:\n${analysis.issues.map(i => `• [${i.severity.toUpperCase()}] ${i.description}`).join('\n')}\n\n💡 Recommendations:\n${analysis.recommendations.map(r => `• ${r}`).join('\n')}`
            }
          ]
        };

      case "get_collaboration_stats":
        const projectStatus = await pmBot.getProjectStatus();
        const agentMetrics = await pmBot.getAgentMetrics();
        return {
          content: [
            {
              type: "text",
              text: `📊 PM Bot Collaboration Statistics\n\n🚀 Projects: ${projectStatus.totalProjects}\n🤖 Active Agents: ${projectStatus.activeAgents}\n🤝 Total Collaborations: ${projectStatus.totalCollaborations}\n\n👥 Agent Performance:\n${agentMetrics.agents.map(a => `• ${a.name}: ${a.participations} participations`).join('\n')}`
            }
          ]
        };

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    return {
      content: [
        {
          type: "text",
          text: `❌ Error executing ${name}: ${error.message}`
        }
      ],
      isError: true
    };
  }
});

// ============ RECURSOS MCP ============

server.setRequestHandler(ListResourcesRequestSchema, async () => {
  return {
    resources: [
      {
        uri: "pmbot://projects/status",
        mimeType: "application/json",
        name: "Project Status",
        description: "Current status of all projects"
      },
      {
        uri: "pmbot://agents/metrics",
        mimeType: "application/json", 
        name: "Agent Metrics",
        description: "Performance metrics for all agents"
      },
      {
        uri: "pmbot://collaboration/log",
        mimeType: "application/json",
        name: "Collaboration Log",
        description: "Log of all multi-agent collaborations"
      }
    ]
  };
});

server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const { uri } = request.params;

  switch (uri) {
    case "pmbot://projects/status":
      const projectStatus = await pmBot.getProjectStatus();
      return {
        contents: [
          {
            uri,
            mimeType: "application/json",
            text: JSON.stringify(projectStatus, null, 2)
          }
        ]
      };

    case "pmbot://agents/metrics":
      const agentMetrics = await pmBot.getAgentMetrics();
      return {
        contents: [
          {
            uri,
            mimeType: "application/json",
            text: JSON.stringify(agentMetrics, null, 2)
          }
        ]
      };

    case "pmbot://collaboration/log":
      return {
        contents: [
          {
            uri,
            mimeType: "application/json",
            text: JSON.stringify({
              total: pmBot.collaborationLog.length,
              recent: pmBot.collaborationLog.slice(-10),
              summary: "Multi-agent collaboration working effectively"
            }, null, 2)
          }
        ]
      };

    default:
      throw new Error(`Resource not found: ${uri}`);
  }
});

// ============ INICIALIZAR SERVIDOR ============

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  
  console.error("🔗 PM Bot MCP Server iniciado");
  console.error("🎯 Herramientas disponibles: create_project, assign_task, run_analysis");
  console.error("📊 Recursos disponibles: projects/status, agents/metrics, collaboration/log");
}

main().catch((error) => {
  console.error("❌ Error starting PM Bot MCP server:", error);
  process.exit(1);
});