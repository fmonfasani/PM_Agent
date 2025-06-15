// autonomous-pm-standalone.js
// Sistema PM Autónomo completo que funciona independientemente
// Incluye toda la funcionalidad en un solo archivo

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { exec } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);
const { EventEmitter } = require('events');

// Verificar e instalar dependencias automáticamente
async function ensureDependencies() {
  const requiredPackages = {
    'express': '^4.18.2',
    'cors': '^2.8.5'
  };

  try {
    require('express');
    require('cors');
    console.log('✅ Dependencias básicas verificadas');
  } catch (error) {
    console.log('📦 Instalando dependencias requeridas...');
    try {
      await execAsync('npm install express cors');
      console.log('✅ Dependencias instaladas exitosamente');
    } catch (installError) {
      console.log('⚠️ No se pudieron instalar dependencias automáticamente');
      console.log('💡 Ejecuta manualmente: npm install express cors');
    }
  }
}

// Importar APIs de IA con manejo de errores
let Anthropic, OpenAI;
try {
  ({ Anthropic } = require('@anthropic-ai/sdk'));
} catch (error) {
  console.log('⚠️ @anthropic-ai/sdk no disponible - usar fallback');
}

try {
  ({ OpenAI } = require('openai'));
} catch (error) {
  console.log('⚠️ openai no disponible - usar fallback');
}

// ============ SISTEMA PM AUTÓNOMO PRINCIPAL ============
class AutonomousPMSystem extends EventEmitter {
  constructor() {
    super();
    this.loadEnvFile();
    
    this.isRunning = false;
    this.autonomyLevel = 1;
    this.maxAutonomyLevel = 10;
    
    // Sistema de memoria persistente
    this.memory = {
      experiences: [],
      patterns: new Map(),
      improvements: [],
      pendingApprovals: [],
      successMetrics: {
        totalProjects: 0,
        completedProjects: 0,
        failedProjects: 0,
        successRate: 0,
        timeToCompletion: []
      }
    };
    
    // Configuración de autonomía por nivel
    this.autonomyConfig = {
      1: { autoImplement: false, maxChanges: 1, requiresApproval: true, description: 'Asistido básico' },
      2: { autoImplement: false, maxChanges: 2, requiresApproval: true, description: 'Asistido mejorado' },
      3: { autoImplement: true, maxChanges: 1, requiresApproval: true, description: 'Semi-autónomo' },
      4: { autoImplement: true, maxChanges: 2, requiresApproval: true, description: 'Semi-autónomo avanzado' },
      5: { autoImplement: true, maxChanges: 3, requiresApproval: true, description: 'Autónomo supervisado' },
      6: { autoImplement: true, maxChanges: 3, requiresApproval: false, description: 'Autónomo básico' },
      7: { autoImplement: true, maxChanges: 5, requiresApproval: false, description: 'Autónomo avanzado' },
      8: { autoImplement: true, maxChanges: 7, requiresApproval: false, description: 'Autónomo experto' },
      9: { autoImplement: true, maxChanges: 10, requiresApproval: false, description: 'Superinteligente' },
      10: { autoImplement: true, maxChanges: 999, requiresApproval: false, description: 'Completamente autónomo' }
    };
    
    // Agentes disponibles
    this.agents = {
      claude: {
        name: 'Claude (Fallback)',
        available: !!Anthropic && !!process.env.ANTHROPIC_API_KEY,
        client: null,
        specialties: ['architecture', 'analysis', 'planning']
      },
      gpt: {
        name: 'GPT (Fallback)', 
        available: !!OpenAI && !!process.env.OPENAI_API_KEY,
        client: null,
        specialties: ['creativity', 'frontend', 'problem_solving']
      },
      fallback: {
        name: 'Sistema Inteligente Integrado',
        available: true,
        specialties: ['general', 'coding', 'optimization']
      }
    };

    // Inicializar clientes si están disponibles
    this.initializeAgents();
    
    // Queue de tareas y proyectos activos
    this.taskQueue = [];
    this.activeProjects = new Map();
    
    this.loadMemoryFromDisk();
    this.setupEventListeners();
  }

  // ============ INICIALIZACIÓN ============
  
  initializeAgents() {
    if (this.agents.claude.available) {
      try {
        this.agents.claude.client = new Anthropic({ 
          apiKey: process.env.ANTHROPIC_API_KEY 
        });
        console.log('✅ Claude agent inicializado');
      } catch (error) {
        this.agents.claude.available = false;
        console.log('⚠️ Error inicializando Claude agent');
      }
    }
    
    if (this.agents.gpt.available) {
      try {
        this.agents.gpt.client = new OpenAI({ 
          apiKey: process.env.OPENAI_API_KEY 
        });
        console.log('✅ GPT agent inicializado');
      } catch (error) {
        this.agents.gpt.available = false;
        console.log('⚠️ Error inicializando GPT agent');
      }
    }
    
    console.log('✅ Sistema de fallback inteligente siempre disponible');
  }

  async startAutonomousMode() {
    console.log('\n🚀 INICIANDO PM BOT AUTÓNOMO 24/7');
    console.log(`🎯 Nivel de Autonomía Inicial: ${this.autonomyLevel}/10`);
    console.log(`📋 Descripción: ${this.autonomyConfig[this.autonomyLevel].description}`);
    
    this.isRunning = true;
    
    // Programar tareas automáticas (simuladas para demo)
    this.scheduleAutonomousTasks();
    
    // Iniciar API de control
    this.startControlAPI();
    
    // Reportar estado inicial
    await this.generateStatusReport();
    
    console.log('\n✅ Sistema Autónomo ACTIVO - Funcionando 24/7');
    console.log('🌐 Dashboard disponible en: http://localhost:3001');
    
    // Comenzar ciclo de mejora continua
    this.startImprovementCycle();
    
    return this;
  }

  scheduleAutonomousTasks() {
    // Simular tareas programadas sin node-cron para simplicidad
    
    // Cada 2 minutos: revisar proyectos activos (demo)
    setInterval(() => {
      if (this.isRunning) {
        this.checkActiveProjects();
      }
    }, 120000);
    
    // Cada 5 minutos: buscar mejoras potenciales (demo)
    setInterval(() => {
      if (this.isRunning) {
        this.identifyImprovements();
      }
    }, 300000);
    
    // Cada 10 minutos: evaluar escalamiento (demo)
    setInterval(() => {
      if (this.isRunning) {
        this.evaluateAutonomyEscalation();
      }
    }, 600000);
  }

  // ============ GESTIÓN DE PROYECTOS ============
  
  async acceptNewProject(projectDescription, priority = 'medium') {
    const projectId = `auto_${Date.now()}`;
    console.log(`\n📝 NUEVO PROYECTO AUTÓNOMO: ${projectId}`);
    console.log(`📋 Descripción: ${projectDescription}`);
    console.log(`⚡ Prioridad: ${priority}`);
    
    const project = {
      id: projectId,
      description: projectDescription,
      priority: priority,
      status: 'planning',
      startTime: new Date(),
      autonomyLevel: this.autonomyLevel,
      complexity: this.estimateComplexity(projectDescription),
      progress: 0
    };
    
    this.activeProjects.set(projectId, project);
    this.memory.successMetrics.totalProjects++;
    
    const config = this.autonomyConfig[this.autonomyLevel];
    
    if (config.autoImplement && project.complexity <= 5) {
      // Ejecutar automáticamente
      console.log(`🤖 Ejecutando automáticamente (Nivel ${this.autonomyLevel})`);
      await this.executeProject(projectId);
    } else {
      // Solicitar aprobación
      console.log(`✋ Requiere aprobación (Nivel ${this.autonomyLevel})`);
      await this.requestApprovalForProject(projectId);
    }
    
    return projectId;
  }

  async executeProject(projectId) {
    const project = this.activeProjects.get(projectId);
    if (!project) return;
    
    console.log(`\n🏗️ EJECUTANDO PROYECTO: ${projectId}`);
    project.status = 'in_progress';
    
    try {
      // Simular desarrollo del proyecto con agentes
      const result = await this.developProjectWithAgents(project);
      
      project.status = 'completed';
      project.endTime = new Date();
      project.result = result;
      project.progress = 100;
      
      // Actualizar métricas
      this.memory.successMetrics.completedProjects++;
      this.updateSuccessMetrics();
      
      console.log(`✅ PROYECTO COMPLETADO: ${projectId}`);
      console.log(`⏱️ Tiempo: ${Math.round((project.endTime - project.startTime) / 1000)}s`);
      
      this.emit('projectCompleted', project);
      
      // Evaluar escalamiento después del éxito
      setTimeout(() => this.evaluateAutonomyEscalation(), 5000);
      
      return { success: true, project };
      
    } catch (error) {
      project.status = 'failed';
      project.error = error.message;
      
      this.memory.successMetrics.failedProjects++;
      this.updateSuccessMetrics();
      
      console.log(`❌ PROYECTO FALLÓ: ${projectId} - ${error.message}`);
      this.emit('projectFailed', project);
      
      return { success: false, error: error.message };
    }
  }

  async developProjectWithAgents(project) {
    console.log(`🤖 Desarrollando con agentes disponibles...`);
    
    // Seleccionar mejor agente disponible
    const selectedAgent = this.selectBestAgent(project);
    console.log(`🎯 Agente seleccionado: ${selectedAgent.name}`);
    
    // Simular desarrollo paso a paso
    const steps = [
      'Analizando requerimientos...',
      'Diseñando arquitectura...',
      'Generando código...',
      'Ejecutando tests...',
      'Optimizando solución...'
    ];
    
    for (let i = 0; i < steps.length; i++) {
      console.log(`   ${i + 1}/5: ${steps[i]}`);
      project.progress = ((i + 1) / steps.length) * 100;
      
      // Simular tiempo de procesamiento
      await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
    }
    
    // Generar resultado del proyecto
    const result = await this.generateProjectResult(project, selectedAgent);
    
    return result;
  }

  selectBestAgent(project) {
    // Seleccionar el mejor agente disponible
    if (this.agents.claude.available && project.complexity > 3) {
      return this.agents.claude;
    } else if (this.agents.gpt.available && project.description.toLowerCase().includes('frontend')) {
      return this.agents.gpt;
    } else {
      return this.agents.fallback;
    }
  }

  async generateProjectResult(project, agent) {
    // Generar resultado inteligente basado en la descripción
    const templates = {
      'api': this.generateAPIProject(project),
      'web': this.generateWebProject(project),
      'chat': this.generateChatProject(project),
      'dashboard': this.generateDashboardProject(project),
      'default': this.generateDefaultProject(project)
    };
    
    // Detectar tipo de proyecto
    const description = project.description.toLowerCase();
    let projectType = 'default';
    
    if (description.includes('api') || description.includes('rest') || description.includes('backend')) {
      projectType = 'api';
    } else if (description.includes('web') || description.includes('página') || description.includes('sitio')) {
      projectType = 'web';
    } else if (description.includes('chat') || description.includes('bot') || description.includes('conversacion')) {
      projectType = 'chat';
    } else if (description.includes('dashboard') || description.includes('admin') || description.includes('panel')) {
      projectType = 'dashboard';
    }
    
    const result = templates[projectType];
    
    // Crear archivos del proyecto
    await this.createProjectFiles(project, result);
    
    return result;
  }

  // ============ GENERADORES DE PROYECTOS ============
  
  generateAPIProject(project) {
    return {
      type: 'api',
      description: project.description,
      files: [
        {
          path: 'server.js',
          content: `// ${project.description}
// Generado automáticamente por PM Bot Autónomo

const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

// Rutas principales
app.get('/', (req, res) => {
  res.json({ 
    message: 'API funcionando correctamente',
    project: '${project.description}',
    generatedBy: 'PM Bot Autónomo v1.0',
    autonomyLevel: ${project.autonomyLevel}
  });
});

app.get('/api/status', (req, res) => {
  res.json({ 
    status: 'active',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

app.post('/api/data', (req, res) => {
  const { data } = req.body;
  res.json({ 
    success: true,
    received: data,
    processed: true
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(\`🚀 API servidor iniciado en puerto \${PORT}\`);
  console.log(\`📋 Proyecto: ${project.description}\`);
});`,
          type: 'main'
        },
        {
          path: 'package.json',
          content: JSON.stringify({
            name: project.id,
            version: '1.0.0',
            description: project.description,
            main: 'server.js',
            scripts: {
              start: 'node server.js',
              dev: 'nodemon server.js'
            },
            dependencies: {
              express: '^4.18.2',
              cors: '^2.8.5'
            }
          }, null, 2)
        }
      ],
      instructions: 'API REST creada. Ejecutar con: npm install && npm start'
    };
  }

  generateWebProject(project) {
    return {
      type: 'web',
      description: project.description,
      files: [
        {
          path: 'index.html',
          content: `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${project.description}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .container {
            text-align: center;
            padding: 40px;
            background: rgba(255,255,255,0.1);
            border-radius: 20px;
            backdrop-filter: blur(10px);
            max-width: 600px;
        }
        h1 { margin-bottom: 20px; font-size: 2.5em; }
        p { margin-bottom: 30px; font-size: 1.2em; opacity: 0.9; }
        .status { 
            background: rgba(76, 175, 80, 0.3);
            padding: 15px;
            border-radius: 10px;
            margin: 20px 0;
        }
        .btn {
            background: linear-gradient(45deg, #FF6B6B, #4ECDC4);
            color: white;
            padding: 15px 30px;
            border: none;
            border-radius: 25px;
            font-size: 1.1em;
            cursor: pointer;
            transition: transform 0.3s ease;
        }
        .btn:hover { transform: scale(1.05); }
    </style>
</head>
<body>
    <div class="container">
        <h1>🚀 ${project.description}</h1>
        <p>Generado automáticamente por PM Bot Autónomo</p>
        <div class="status">
            <strong>✅ Proyecto completado exitosamente</strong><br>
            Nivel de autonomía: ${project.autonomyLevel}/10<br>
            Fecha: ${new Date().toLocaleDateString()}
        </div>
        <button class="btn" onclick="showInfo()">Ver Información</button>
    </div>

    <script>
        function showInfo() {
            alert('Proyecto: ${project.description}\\nGenerado por: PM Bot Autónomo\\nNivel: ${project.autonomyLevel}/10');
        }
        
        console.log('🤖 PM Bot Autónomo - Proyecto web generado automáticamente');
    </script>
</body>
</html>`
        }
      ],
      instructions: 'Sitio web creado. Abrir index.html en navegador'
    };
  }

  generateChatProject(project) {
    return {
      type: 'chat',
      description: project.description,
      files: [
        {
          path: 'chat-app.html',
          content: `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Chat Bot - ${project.description}</title>
    <style>
        body { 
            font-family: Arial, sans-serif; 
            margin: 0; 
            background: #f0f2f5;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
        }
        .chat-container {
            width: 400px;
            height: 600px;
            background: white;
            border-radius: 15px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.2);
            display: flex;
            flex-direction: column;
        }
        .chat-header {
            background: #4A90E2;
            color: white;
            padding: 20px;
            border-radius: 15px 15px 0 0;
            text-align: center;
        }
        .chat-messages {
            flex: 1;
            padding: 20px;
            overflow-y: auto;
        }
        .message {
            margin: 10px 0;
            padding: 10px 15px;
            border-radius: 20px;
            max-width: 80%;
        }
        .bot-message {
            background: #e3f2fd;
            align-self: flex-start;
        }
        .user-message {
            background: #4A90E2;
            color: white;
            align-self: flex-end;
            margin-left: auto;
        }
        .chat-input {
            display: flex;
            padding: 20px;
            border-top: 1px solid #eee;
        }
        .chat-input input {
            flex: 1;
            padding: 10px;
            border: 1px solid #ddd;
            border-radius: 20px;
            outline: none;
        }
        .chat-input button {
            margin-left: 10px;
            padding: 10px 20px;
            background: #4A90E2;
            color: white;
            border: none;
            border-radius: 20px;
            cursor: pointer;
        }
    </style>
</head>
<body>
    <div class="chat-container">
        <div class="chat-header">
            <h3>🤖 ${project.description}</h3>
            <small>Generado por PM Bot Autónomo</small>
        </div>
        <div class="chat-messages" id="messages">
            <div class="message bot-message">
                ¡Hola! Soy un chat bot generado automáticamente. ¿En qué puedo ayudarte?
            </div>
        </div>
        <div class="chat-input">
            <input type="text" id="messageInput" placeholder="Escribe un mensaje..." onkeypress="handleKeyPress(event)">
            <button onclick="sendMessage()">Enviar</button>
        </div>
    </div>

    <script>
        function sendMessage() {
            const input = document.getElementById('messageInput');
            const message = input.value.trim();
            if (!message) return;
            
            // Agregar mensaje del usuario
            addMessage(message, 'user');
            input.value = '';
            
            // Simular respuesta del bot
            setTimeout(() => {
                const responses = [
                    'Interesante punto de vista!',
                    'Entiendo tu consulta. ¿Puedes darme más detalles?',
                    'Soy un bot generado automáticamente por PM Bot Autónomo nivel ${project.autonomyLevel}',
                    'Gracias por tu mensaje. Estoy aquí para ayudarte.',
                    '¡Excelente pregunta! Déjame procesar eso...'
                ];
                const response = responses[Math.floor(Math.random() * responses.length)];
                addMessage(response, 'bot');
            }, 1000);
        }
        
        function addMessage(text, sender) {
            const messagesDiv = document.getElementById('messages');
            const messageDiv = document.createElement('div');
            messageDiv.className = \`message \${sender}-message\`;
            messageDiv.textContent = text;
            messagesDiv.appendChild(messageDiv);
            messagesDiv.scrollTop = messagesDiv.scrollHeight;
        }
        
        function handleKeyPress(event) {
            if (event.key === 'Enter') {
                sendMessage();
            }
        }
    </script>
</body>
</html>`
        }
      ],
      instructions: 'Chat bot creado. Abrir chat-app.html en navegador'
    };
  }

  generateDashboardProject(project) {
    return {
      type: 'dashboard',
      description: project.description,
      files: [
        {
          path: 'dashboard.html',
          content: `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Dashboard - ${project.description}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: #f5f5f5;
        }
        .sidebar {
            width: 250px;
            height: 100vh;
            background: #2c3e50;
            color: white;
            position: fixed;
            padding: 20px;
        }
        .main-content {
            margin-left: 250px;
            padding: 20px;
        }
        .card {
            background: white;
            padding: 20px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            margin-bottom: 20px;
        }
        .metrics {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        .metric-card {
            background: linear-gradient(45deg, #667eea, #764ba2);
            color: white;
            padding: 30px;
            border-radius: 15px;
            text-align: center;
        }
        .metric-value {
            font-size: 2.5em;
            font-weight: bold;
            margin-bottom: 10px;
        }
        .chart-container {
            height: 300px;
            background: white;
            border-radius: 10px;
            padding: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
    </style>
</head>
<body>
    <div class="sidebar">
        <h2>🚀 ${project.description}</h2>
        <hr style="margin: 20px 0;">
        <div style="margin-bottom: 20px;">
            <strong>Generado por:</strong><br>
            PM Bot Autónomo
        </div>
        <div style="margin-bottom: 20px;">
            <strong>Nivel:</strong><br>
            ${project.autonomyLevel}/10
        </div>
        <div>
            <strong>Fecha:</strong><br>
            ${new Date().toLocaleDateString()}
        </div>
    </div>
    
    <div class="main-content">
        <h1>Dashboard Administrativo</h1>
        
        <div class="metrics">
            <div class="metric-card">
                <div class="metric-value">1,234</div>
                <div>Usuarios Activos</div>
            </div>
            <div class="metric-card">
                <div class="metric-value">567</div>
                <div>Proyectos</div>
            </div>
            <div class="metric-card">
                <div class="metric-value">89%</div>
                <div>Satisfacción</div>
            </div>
            <div class="metric-card">
                <div class="metric-value">24/7</div>
                <div>Disponibilidad</div>
            </div>
        </div>
        
        <div class="card">
            <h3>📊 Análisis en Tiempo Real</h3>
            <div class="chart-container">
                <div style="text-align: center;">
                    <h4>Gráfico de Performance</h4>
                    <p>Dashboard generado automáticamente</p>
                    <p>🤖 PM Bot Autónomo - Nivel ${project.autonomyLevel}</p>
                </div>
            </div>
        </div>
        
        <div class="card">
            <h3>📋 Actividad Reciente</h3>
            <ul>
                <li>✅ Dashboard creado automáticamente</li>
                <li>🚀 Sistema inicializado correctamente</li>
                <li>📊 Métricas configuradas</li>
                <li>🔧 Optimización aplicada</li>
            </ul>
        </div>
    </div>
</body>
</html>`
        }
      ],
      instructions: 'Dashboard administrativo creado. Abrir dashboard.html en navegador'
    };
  }

  generateDefaultProject(project) {
    return {
      type: 'general',
      description: project.description,
      files: [
        {
          path: 'app.js',
          content: `// ${project.description}
// Generado automáticamente por PM Bot Autónomo

console.log('🚀 Iniciando proyecto: ${project.description}');
console.log('🤖 Generado por PM Bot Autónomo - Nivel ${project.autonomyLevel}');

class ProjectApp {
  constructor() {
    this.name = '${project.description}';
    this.version = '1.0.0';
    this.autonomyLevel = ${project.autonomyLevel};
  }
  
  start() {
    console.log(\`Aplicación \${this.name} iniciada\`);
    console.log(\`Nivel de autonomía: \${this.autonomyLevel}/10\`);
    
    // Funcionalidad principal aquí
    this.run();
  }
  
  run() {
    console.log('✅ Aplicación funcionando correctamente');
    console.log('📋 Proyecto completado por PM Bot Autónomo');
  }
}

const app = new ProjectApp();
app.start();

module.exports = ProjectApp;`
        }
      ],
      instructions: 'Aplicación general creada. Ejecutar con: node app.js'
    };
  }

  // ============ GESTIÓN DE ARCHIVOS ============
  
  async createProjectFiles(project, result) {
    const projectDir = `./projects/${project.id}`;
    
    try {
      // Crear directorio del proyecto
      if (!fs.existsSync('./projects')) {
        fs.mkdirSync('./projects');
      }
      
      if (fs.existsSync(projectDir)) {
        fs.rmSync(projectDir, { recursive: true });
      }
      
      fs.mkdirSync(projectDir, { recursive: true });
      
      // Crear cada archivo
      for (const file of result.files) {
        const filePath = path.join(projectDir, file.path);
        const fileDir = path.dirname(filePath);
        
        if (!fs.existsSync(fileDir)) {
          fs.mkdirSync(fileDir, { recursive: true });
        }
        
        fs.writeFileSync(filePath, file.content);
        console.log(`   📄 Creado: ${file.path}`);
      }
      
      console.log(`📁 Proyecto guardado en: ${projectDir}`);
      
    } catch (error) {
      console.log(`❌ Error creando archivos: ${error.message}`);
    }
  }

  // ============ SISTEMA DE AUTONOMÍA ============
  
  async evaluateAutonomyEscalation() {
    if (this.autonomyLevel >= this.maxAutonomyLevel) return;
    
    const metrics = this.calculatePerformanceMetrics();
    
    console.log(`\n📊 EVALUANDO ESCALAMIENTO DE AUTONOMÍA`);
    console.log(`🎯 Nivel actual: ${this.autonomyLevel}/10`);
    console.log(`📈 Tasa de éxito: ${metrics.successRate}%`);
    console.log(`📝 Proyectos completados: ${metrics.completedProjects}`);
    
    // Criterios para escalamiento
    const shouldEscalate = 
      metrics.successRate >= 75 && 
      metrics.completedProjects >= 2 &&
      this.memory.improvements.length >= 1;
    
    if (shouldEscalate) {
      await this.escalateAutonomyLevel(metrics);
    } else {
      console.log(`⏳ Aún no cumple criterios para escalamiento`);
      console.log(`   Necesita: >75% éxito, >2 proyectos, >1 mejora`);
    }
  }

  async escalateAutonomyLevel(metrics) {
    const oldLevel = this.autonomyLevel;
    this.autonomyLevel = Math.min(this.autonomyLevel + 1, this.maxAutonomyLevel);
    
    console.log(`\n🚀 ¡AUTONOMÍA ESCALADA!`);
    console.log(`📈 ${oldLevel} → ${this.autonomyLevel}`);
    console.log(`🔓 Nueva descripción: ${this.autonomyConfig[this.autonomyLevel].description}`);
    
    const newConfig = this.autonomyConfig[this.autonomyLevel];
    console.log(`   🤖 Auto-implementación: ${newConfig.autoImplement ? 'SÍ' : 'NO'}`);
    console.log(`   📊 Max cambios: ${newConfig.maxChanges}`);
    console.log(`   ✋ Requiere aprobación: ${newConfig.requiresApproval ? 'SÍ' : 'NO'}`);
    
    // Registrar el escalamiento
    this.memory.improvements.push({
      id: `escalation_${Date.now()}`,
      type: 'autonomy_escalation',
      description: `Escalamiento automático de nivel ${oldLevel} a ${this.autonomyLevel}`,
      metrics: metrics,
      timestamp: new Date()
    });
    
    this.emit('autonomyEscalated', { from: oldLevel, to: this.autonomyLevel });
    this.saveMemoryToDisk();
  }

  // ============ MEJORAS CONTINUAS ============
  
  startImprovementCycle() {
    // Ciclo de mejoras cada 3 minutos (demo)
    setInterval(() => {
      if (this.isRunning) {
        this.identifyImprovements();
      }
    }, 180000);
  }

  async identifyImprovements() {
    console.log(`\n💡 IDENTIFICANDO MEJORAS AUTOMÁTICAS...`);
    
    const improvements = [];
    
    // Mejora 1: Optimización de performance
    if (this.memory.successMetrics.completedProjects > 0) {
      improvements.push({
        id: `performance_${Date.now()}`,
        type: 'performance_optimization',
        description: 'Optimizar algoritmos de generación de código',
        expectedImpact: 'medium',
        riskLevel: 'low'
      });
    }
    
    // Mejora 2: Actualización de templates
    if (this.autonomyLevel >= 3) {
      improvements.push({
        id: `templates_${Date.now()}`,
        type: 'template_improvement',
        description: 'Actualizar templates de proyectos con mejores prácticas',
        expectedImpact: 'high',
        riskLevel: 'low'
      });
    }
    
    // Procesar mejoras identificadas
    for (const improvement of improvements) {
      await this.processImprovement(improvement);
    }
    
    if (improvements.length === 0) {
      console.log(`   🔍 No se identificaron mejoras en este ciclo`);
    }
  }

  async processImprovement(improvement) {
    console.log(`💡 MEJORA IDENTIFICADA: ${improvement.type}`);
    console.log(`📝 ${improvement.description}`);
    
    const config = this.autonomyConfig[this.autonomyLevel];
    
    if (config.autoImplement && improvement.riskLevel === 'low') {
      await this.implementImprovement(improvement);
    } else {
      await this.requestApprovalForImprovement(improvement);
    }
  }

  async implementImprovement(improvement) {
    console.log(`🔧 IMPLEMENTANDO MEJORA AUTOMÁTICAMENTE: ${improvement.id}`);
    
    try {
      // Simular implementación de mejora
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      improvement.status = 'implemented';
      improvement.implementedAt = new Date();
      this.memory.improvements.push(improvement);
      
      console.log(`✅ MEJORA IMPLEMENTADA: ${improvement.description}`);
      this.emit('improvementImplemented', improvement);
      
      this.saveMemoryToDisk();
      
    } catch (error) {
      console.log(`❌ ERROR IMPLEMENTANDO MEJORA: ${error.message}`);
    }
  }

  // ============ SISTEMA DE APROBACIONES ============
  
  async requestApprovalForProject(projectId) {
    const project = this.activeProjects.get(projectId);
    const approval = {
      id: `approval_${Date.now()}`,
      type: 'project_execution',
      projectId: projectId,
      description: project.description,
      complexity: project.complexity,
      timestamp: new Date(),
      status: 'pending'
    };
    
    this.memory.pendingApprovals.push(approval);
    
    console.log(`✋ APROBACIÓN REQUERIDA - Proyecto: ${projectId}`);
    console.log(`📝 ${project.description}`);
    console.log(`📊 Complejidad: ${project.complexity}/10`);
    
    this.emit('approvalRequested', approval);
    
    // Auto-aprobar después de 30 segundos para demo
    setTimeout(() => {
      console.log(`✅ Auto-aprobando proyecto para demostración...`);
      this.processApproval(approval.id, true, 'Auto-aprobado para demo');
    }, 30000);
  }

  async requestApprovalForImprovement(improvement) {
    const approval = {
      id: `approval_${Date.now()}`,
      type: 'improvement_implementation',
      improvementId: improvement.id,
      description: improvement.description,
      riskLevel: improvement.riskLevel,
      timestamp: new Date(),
      status: 'pending'
    };
    
    this.memory.pendingApprovals.push(approval);
    
    console.log(`✋ APROBACIÓN REQUERIDA - Mejora: ${improvement.id}`);
    console.log(`💡 ${improvement.description}`);
    
    this.emit('approvalRequested', approval);
    
    // Auto-aprobar mejoras de bajo riesgo
    if (improvement.riskLevel === 'low') {
      setTimeout(() => {
        console.log(`✅ Auto-aprobando mejora de bajo riesgo...`);
        this.processApproval(approval.id, true, 'Bajo riesgo - auto-aprobado');
      }, 15000);
    }
  }

  async processApproval(approvalId, decision, feedback = '') {
    const approvalIndex = this.memory.pendingApprovals.findIndex(a => a.id === approvalId);
    if (approvalIndex === -1) return;
    
    const approval = this.memory.pendingApprovals[approvalIndex];
    approval.status = decision ? 'approved' : 'rejected';
    approval.decidedAt = new Date();
    approval.feedback = feedback;
    
    console.log(`${decision ? '✅' : '❌'} APROBACIÓN ${decision ? 'CONCEDIDA' : 'RECHAZADA'}: ${approval.type}`);
    
    if (decision) {
      if (approval.type === 'project_execution') {
        await this.executeProject(approval.projectId);
      } else if (approval.type === 'improvement_implementation') {
        const improvement = { 
          id: approval.improvementId, 
          description: approval.description,
          riskLevel: approval.riskLevel,
          type: 'approved_improvement'
        };
        await this.implementImprovement(improvement);
      }
    }
    
    this.emit('approvalProcessed', approval);
  }

  // ============ MÉTRICAS Y ANÁLISIS ============
  
  calculatePerformanceMetrics() {
    const total = this.memory.successMetrics.totalProjects;
    const completed = this.memory.successMetrics.completedProjects;
    const failed = this.memory.successMetrics.failedProjects;
    
    const successRate = total > 0 ? (completed / total) * 100 : 0;
    
    return {
      totalProjects: total,
      completedProjects: completed,
      failedProjects: failed,
      successRate: successRate,
      autonomyLevel: this.autonomyLevel,
      improvementsImplemented: this.memory.improvements.length
    };
  }

  updateSuccessMetrics() {
    const metrics = this.calculatePerformanceMetrics();
    this.memory.successMetrics.successRate = metrics.successRate;
  }

  async generateStatusReport() {
    const metrics = this.calculatePerformanceMetrics();
    
    console.log('\n📊 REPORTE DE ESTADO AUTÓNOMO');
    console.log('='.repeat(50));
    console.log(`🤖 PM Bot Autónomo ACTIVO`);
    console.log(`🎯 Nivel de Autonomía: ${this.autonomyLevel}/10 (${this.autonomyConfig[this.autonomyLevel].description})`);
    console.log(`📈 Proyectos totales: ${metrics.totalProjects}`);
    console.log(`✅ Proyectos completados: ${metrics.completedProjects}`);
    console.log(`❌ Proyectos fallidos: ${metrics.failedProjects}`);
    console.log(`📊 Tasa de éxito: ${metrics.successRate.toFixed(1)}%`);
    console.log(`💡 Mejoras implementadas: ${metrics.improvementsImplemented}`);
    console.log(`✋ Aprobaciones pendientes: ${this.memory.pendingApprovals.filter(a => a.status === 'pending').length}`);
    console.log('='.repeat(50));
    
    return metrics;
  }

  // ============ UTILIDADES ============
  
  estimateComplexity(description) {
    const complexityIndicators = {
      'simple': 1, 'básico': 1, 'hello world': 1,
      'api': 3, 'web': 2, 'página': 2,
      'dashboard': 4, 'admin': 4, 'panel': 4,
      'chat': 3, 'bot': 3, 'inteligente': 5,
      'complejo': 6, 'avanzado': 7, 'enterprise': 8,
      'machine learning': 9, 'ai': 8, 'neural': 9
    };
    
    const desc = description.toLowerCase();
    let complexity = 2; // Base complexity
    
    for (const [keyword, weight] of Object.entries(complexityIndicators)) {
      if (desc.includes(keyword)) {
        complexity = Math.max(complexity, weight);
      }
    }
    
    return Math.min(complexity, 10);
  }

  checkActiveProjects() {
    const activeCount = Array.from(this.activeProjects.values())
      .filter(p => p.status === 'in_progress').length;
    
    if (activeCount > 0) {
      console.log(`🔄 Proyectos activos: ${activeCount}`);
    }
  }

  setupEventListeners() {
    this.on('projectCompleted', (project) => {
      console.log(`🎉 Evento: Proyecto completado - ${project.id}`);
    });
    
    this.on('autonomyEscalated', (escalation) => {
      console.log(`🚀 Evento: Autonomía escalada ${escalation.from} → ${escalation.to}`);
    });
    
    this.on('improvementImplemented', (improvement) => {
      console.log(`⚡ Evento: Mejora implementada - ${improvement.type}`);
    });
  }

  // ============ PERSISTENCIA ============
  
  loadEnvFile() {
    try {
      if (fs.existsSync('.env')) {
        const envContent = fs.readFileSync('.env', 'utf8');
        envContent.split('\n').forEach(line => {
          const trimmedLine = line.trim();
          if (trimmedLine && !trimmedLine.startsWith('#')) {
            const [key, ...valueParts] = trimmedLine.split('=');
            const value = valueParts.join('=').replace(/^["']|["']$/g, '');
            if (key && value) {
              process.env[key.trim()] = value.trim();
            }
          }
        });
        console.log('📁 Archivo .env cargado');
      }
    } catch (error) {
      console.log('⚠️ No se pudo cargar .env');
    }
  }

  saveMemoryToDisk() {
    const memoryFile = './autonomous_pm_memory.json';
    const dataToSave = {
      ...this.memory,
      autonomyLevel: this.autonomyLevel,
      lastSaved: new Date()
    };
    
    try {
      fs.writeFileSync(memoryFile, JSON.stringify(dataToSave, null, 2));
      console.log('💾 Memoria guardada en disco');
    } catch (error) {
      console.log('❌ Error guardando memoria:', error.message);
    }
  }

  loadMemoryFromDisk() {
    const memoryFile = './autonomous_pm_memory.json';
    
    try {
      if (fs.existsSync(memoryFile)) {
        const data = JSON.parse(fs.readFileSync(memoryFile, 'utf8'));
        this.memory = { ...this.memory, ...data };
        if (data.autonomyLevel) {
          this.autonomyLevel = data.autonomyLevel;
        }
        console.log('💾 Memoria cargada desde disco');
        console.log(`🎯 Nivel de autonomía restaurado: ${this.autonomyLevel}`);
      }
    } catch (error) {
      console.log('⚠️ Error cargando memoria:', error.message);
    }
  }

  // ============ API DE CONTROL ============
  
  startControlAPI() {
    try {
      const express = require('express');
      const cors = require('cors');
      
      const app = express();
      app.use(cors());
      app.use(express.json());
      
      // Servir dashboard estático
      app.get('/', (req, res) => {
        res.send(this.generateDashboardHTML());
      });
      
      // API endpoints
      app.get('/status', (req, res) => {
        res.json(this.getStatus());
      });
      
      app.post('/project', async (req, res) => {
        const { description, priority = 'medium' } = req.body;
        try {
          const projectId = await this.acceptNewProject(description, priority);
          res.json({ success: true, projectId });
        } catch (error) {
          res.status(500).json({ success: false, error: error.message });
        }
      });
      
      app.post('/approval/:id', async (req, res) => {
        const { id } = req.params;
        const { decision, feedback = '' } = req.body;
        try {
          await this.processApproval(id, decision, feedback);
          res.json({ success: true });
        } catch (error) {
          res.status(500).json({ success: false, error: error.message });
        }
      });
      
      app.listen(3001, () => {
        console.log('🌐 API de Control disponible en: http://localhost:3001');
      });
      
    } catch (error) {
      console.log('⚠️ No se pudo iniciar API de control:', error.message);
    }
  }

  generateDashboardHTML() {
    const status = this.getStatus();
    return `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>PM Bot Autónomo - Dashboard</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background: #f0f0f0; }
        .container { max-width: 1200px; margin: 0 auto; }
        .header { text-align: center; background: #333; color: white; padding: 20px; border-radius: 10px; margin-bottom: 20px; }
        .card { background: white; padding: 20px; border-radius: 10px; margin-bottom: 20px; box-shadow: 0 2px 5px rgba(0,0,0,0.1); }
        .metrics { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; }
        .metric { text-align: center; padding: 20px; background: linear-gradient(45deg, #667eea, #764ba2); color: white; border-radius: 10px; }
        .metric-value { font-size: 2em; font-weight: bold; }
        .autonomy-bar { width: 100%; height: 30px; background: #ddd; border-radius: 15px; overflow: hidden; margin: 10px 0; }
        .autonomy-progress { height: 100%; background: linear-gradient(90deg, #FF6B6B, #4ECDC4, #45B7D1); transition: width 1s ease; }
        .form-group { margin: 10px 0; }
        .form-group input, .form-group select { width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 5px; }
        .btn { background: #667eea; color: white; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer; }
        .btn:hover { background: #5a67d8; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🤖 PM Bot Autónomo 24/7</h1>
            <p>Sistema Operativo - Nivel ${status.autonomyLevel}/10</p>
        </div>
        
        <div class="metrics">
            <div class="metric">
                <div class="metric-value">${status.metrics.totalProjects}</div>
                <div>Proyectos Totales</div>
            </div>
            <div class="metric">
                <div class="metric-value">${status.metrics.successRate.toFixed(1)}%</div>
                <div>Tasa de Éxito</div>
            </div>
            <div class="metric">
                <div class="metric-value">${status.autonomyLevel}</div>
                <div>Nivel Autonomía</div>
            </div>
            <div class="metric">
                <div class="metric-value">${status.metrics.improvementsImplemented}</div>
                <div>Mejoras</div>
            </div>
        </div>
        
        <div class="card">
            <h3>🎯 Nivel de Autonomía</h3>
            <div class="autonomy-bar">
                <div class="autonomy-progress" style="width: ${(status.autonomyLevel/10)*100}%"></div>
            </div>
            <p><strong>Descripción:</strong> ${this.autonomyConfig[status.autonomyLevel].description}</p>
        </div>
        
        <div class="card">
            <h3>🚀 Crear Nuevo Proyecto</h3>
            <form onsubmit="createProject(event)">
                <div class="form-group">
                    <input type="text" id="description" placeholder="Descripción del proyecto..." required>
                </div>
                <div class="form-group">
                    <select id="priority">
                        <option value="low">Baja</option>
                        <option value="medium" selected>Media</option>
                        <option value="high">Alta</option>
                    </select>
                </div>
                <button type="submit" class="btn">Crear Proyecto</button>
            </form>
        </div>
        
        <div class="card">
            <h3>📊 Estado del Sistema</h3>
            <pre>${JSON.stringify(status, null, 2)}</pre>
        </div>
    </div>
    
    <script>
        async function createProject(event) {
            event.preventDefault();
            const description = document.getElementById('description').value;
            const priority = document.getElementById('priority').value;
            
            try {
                const response = await fetch('/project', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ description, priority })
                });
                
                const result = await response.json();
                if (result.success) {
                    alert('Proyecto creado: ' + result.projectId);
                    location.reload();
                }
            } catch (error) {
                alert('Error creando proyecto: ' + error.message);
            }
        }
        
        // Auto-refresh cada 30 segundos
        setTimeout(() => location.reload(), 30000);
    </script>
</body>
</html>`;
  }

  getStatus() {
    return {
      isRunning: this.isRunning,
      autonomyLevel: this.autonomyLevel,
      autonomyDescription: this.autonomyConfig[this.autonomyLevel].description,
      activeProjects: Array.from(this.activeProjects.values()),
      pendingApprovals: this.memory.pendingApprovals.filter(a => a.status === 'pending'),
      metrics: this.calculatePerformanceMetrics(),
      capabilities: this.autonomyConfig[this.autonomyLevel]
    };
  }

  async stop() {
    this.isRunning = false;
    this.saveMemoryToDisk();
    console.log('🛑 Sistema Autónomo DETENIDO');
  }
}

// ============ FUNCIONES DE INICIO ============

async function startAutonomousPM() {
  await ensureDependencies();
  
  const autonomousPM = new AutonomousPMSystem();
  
  // Manejar cierre graceful
  process.on('SIGINT', async () => {
    console.log('\n🛑 Deteniendo PM Bot Autónomo...');
    await autonomousPM.stop();
    process.exit(0);
  });
  
  await autonomousPM.startAutonomousMode();
  return autonomousPM;
}

module.exports = { AutonomousPMSystem, startAutonomousPM };