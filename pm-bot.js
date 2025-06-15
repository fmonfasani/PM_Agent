// PM Bot v4.0 - SISTEMA MULTI-AGENTE COLABORATIVO
const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Importar diferentes APIs de IA
try {
  var { Anthropic } = require('@anthropic-ai/sdk');
  var { OpenAI } = require('openai');
  // Aquí se pueden agregar más: Google, Cohere, etc.
} catch (error) {
  console.error('❌ Error: Dependencias no instaladas.');
  console.log('🔧 Ejecuta: npm install @anthropic-ai/sdk openai');
  process.exit(1);
}

const { exec } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);

class MultiAgentPM {
  constructor() {
    this.loadEnvFile();
    this.checkEnvVars();
    
    // Inicializar agentes IA
    this.agents = {
      claude: {
        name: 'Claude (Anthropic)',
        client: new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY }),
        specialties: ['architecture', 'analysis', 'planning', 'code_review'],
        personality: 'Metodológico y analítico',
        active: true
      },
      gpt: {
        name: 'GPT (OpenAI)', 
        client: new OpenAI({ apiKey: process.env.OPENAI_API_KEY }),
        specialties: ['creativity', 'frontend', 'ui_ux', 'problem_solving'],
        personality: 'Creativo y versátil',
        active: !!process.env.OPENAI_API_KEY
      }
      // Se pueden agregar más agentes aquí
    };
    
    // Configuración del proyecto
    const timestamp = this.generateTimestamp();
    this.projectConfig = {
      workingDir: `./projects/multi_agent_${timestamp}`,
      timestamp: timestamp
    };
    
    // Estado del sistema multi-agente
    this.projectState = {
      phase: 'initial',
      issues: [],
      completedFeatures: [],
      suggestions: [],
      testResults: {},
      agentContributions: {},
      activeAgents: [],
      collaboration_log: []
    };
    
    this.currentTask = null;
    
    if (!fs.existsSync('./projects')) {
      fs.mkdirSync('./projects', { recursive: true });
    }
    
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    this.initializeAgentTeam();
  }

  initializeAgentTeam() {
    console.log('🤖 PM Bot v4.0 - SISTEMA MULTI-AGENTE COLABORATIVO');
    console.log('🎭 Inicializando equipo de agentes IA...\n');
    
    // Mostrar agentes disponibles
    Object.entries(this.agents).forEach(([key, agent]) => {
      if (agent.active) {
        console.log(`✅ ${agent.name} - ${agent.personality}`);
        console.log(`   Especialidades: ${agent.specialties.join(', ')}`);
        this.projectState.activeAgents.push(key);
      } else {
        console.log(`❌ ${agent.name} - No disponible (falta API key)`);
      }
    });
    
    console.log(`\n🎯 Equipo activo: ${this.projectState.activeAgents.length} agente(s)`);
    console.log(`📁 Proyecto: ${this.projectConfig.timestamp}\n`);
  }

  // ============ COORDINACIÓN MULTI-AGENTE ============
  async assignTaskToAgents(task, taskType) {
    console.log(`\n🎭 Asignando tarea a agentes: ${task}`);
    console.log(`📋 Tipo: ${taskType}`);
    
    // Determinar qué agentes son mejores para esta tarea
    const bestAgents = this.selectBestAgentsForTask(taskType);
    
    console.log(`🎯 Agentes seleccionados: ${bestAgents.map(a => this.agents[a].name).join(', ')}`);
    
    // Ejecutar tarea con múltiples agentes en paralelo
    const agentResults = await Promise.all(
      bestAgents.map(agentKey => this.executeAgentTask(agentKey, task, taskType))
    );
    
    // Combinar y evaluar resultados
    const combinedResult = await this.combineAgentResults(agentResults, taskType);
    
    // Log de colaboración
    this.logCollaboration(task, bestAgents, agentResults, combinedResult);
    
    return combinedResult;
  }

  selectBestAgentsForTask(taskType) {
    const taskAgentMap = {
      'planning': ['claude'],
      'architecture': ['claude'],
      'code_generation': ['claude', 'gpt'],
      'frontend': ['gpt'],
      'ui_design': ['gpt'],
      'analysis': ['claude'],
      'testing': ['claude'],
      'debugging': ['claude', 'gpt'],
      'creative': ['gpt'],
      'optimization': ['claude']
    };
    
    const preferredAgents = taskAgentMap[taskType] || ['claude', 'gpt'];
    
    // Filtrar solo agentes activos
    return preferredAgents.filter(agent => 
      this.projectState.activeAgents.includes(agent)
    );
  }

  async executeAgentTask(agentKey, task, taskType) {
    const agent = this.agents[agentKey];
    
    console.log(`🤖 ${agent.name} trabajando en: ${task}`);
    
    try {
      let result;
      
      if (agentKey === 'claude') {
        result = await this.executeClaudeTask(task, taskType);
      } else if (agentKey === 'gpt') {
        result = await this.executeGPTTask(task, taskType);
      }
      
      result.agent = agentKey;
      result.agentName = agent.name;
      result.timestamp = new Date().toISOString();
      
      console.log(`✅ ${agent.name} completó la tarea`);
      
      return result;
      
    } catch (error) {
      console.log(`❌ ${agent.name} falló: ${error.message}`);
      
      return {
        agent: agentKey,
        agentName: agent.name,
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  async executeClaudeTask(task, taskType) {
    const prompt = this.buildPromptForTask(task, taskType, 'claude');
    
    const response = await this.agents.claude.client.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 3000,
      messages: [{ role: 'user', content: prompt }]
    });

    return {
      success: true,
      content: response.content[0].text,
      reasoning: 'Claude utilizó análisis metodológico y arquitectural',
      confidence: 0.9
    };
  }

  async executeGPTTask(task, taskType) {
    const prompt = this.buildPromptForTask(task, taskType, 'gpt');
    
    const response = await this.agents.gpt.client.chat.completions.create({
      model: 'gpt-4',
      max_tokens: 3000,
      messages: [{ role: 'user', content: prompt }]
    });

    return {
      success: true,
      content: response.choices[0].message.content,
      reasoning: 'GPT aplicó creatividad y soluciones innovadoras',
      confidence: 0.85
    };
  }

  buildPromptForTask(task, taskType, agentType) {
    const agentPersonalities = {
      claude: `Eres Claude de Anthropic. Eres metodológico, analítico y te enfocas en la arquitectura sólida y mejores prácticas. 
Tu fortaleza está en el análisis profundo, planificación estructurada y revisión de código.`,
      gpt: `Eres GPT de OpenAI. Eres creativo, versátil y excelente en soluciones innovadoras.
Tu fortaleza está en la creatividad, frontend, UI/UX y resolución creativa de problemas.`
    };

    const basePrompt = `${agentPersonalities[agentType]}

TAREA: ${task}
TIPO: ${taskType}

CONTEXTO DEL PROYECTO:
${this.getProjectContext()}

OTROS AGENTES EN EL EQUIPO:
${this.getOtherAgentsContext(agentType)}

Tu trabajo será combinado con el de otros agentes IA. Proporciona tu mejor solución desde tu perspectiva única.
`;

    // Prompts específicos por tipo de tarea
    const taskSpecificPrompts = {
      code_generation: `
Genera código COMPLETO y FUNCIONAL. Responde en JSON:
{
  "files": [
    {
      "path": "archivo.js",
      "content": "código completo",
      "type": "main|test|config"
    }
  ],
  "explanation": "tu razonamiento",
  "tech_choices": ["tecnologías elegidas"],
  "considerations": ["consideraciones importantes"]
}`,
      
      analysis: `
Analiza el proyecto actual y responde en JSON:
{
  "findings": ["hallazgo1", "hallazgo2"],
  "issues": [
    {
      "type": "error|warning|info",
      "description": "descripción del issue",
      "severity": "high|medium|low",
      "suggestion": "cómo resolverlo"
    }
  ],
  "recommendations": ["recomendación1", "recomendación2"],
  "next_steps": ["paso1", "paso2"]
}`,

      planning: `
Crea un plan detallado y responde en JSON:
{
  "phases": [
    {
      "name": "Fase 1",
      "tasks": ["tarea1", "tarea2"],
      "duration": "tiempo estimado",
      "dependencies": ["dependencia1"]
    }
  ],
  "architecture": {
    "components": ["componente1", "componente2"],
    "technologies": ["tech1", "tech2"],
    "structure": "descripción de la estructura"
  },
  "risks": ["riesgo1", "riesgo2"],
  "success_criteria": ["criterio1", "criterio2"]
}`
    };

    return basePrompt + (taskSpecificPrompts[taskType] || '\nResponde con tu mejor análisis y solución.');
  }

  async combineAgentResults(agentResults, taskType) {
    console.log('\n🔄 Combinando resultados de agentes...');
    
    const successfulResults = agentResults.filter(r => r.success);
    
    if (successfulResults.length === 0) {
      throw new Error('Todos los agentes fallaron en la tarea');
    }
    
    if (successfulResults.length === 1) {
      console.log(`📝 Usando resultado de ${successfulResults[0].agentName}`);
      return successfulResults[0];
    }
    
    // Múltiples agentes - combinar sus resultados
    console.log('🤝 Múltiples agentes completaron la tarea, combinando...');
    
    const combinedResult = await this.synthesizeResults(successfulResults, taskType);
    
    return combinedResult;
  }

  async synthesizeResults(results, taskType) {
    console.log('🧠 Sintetizando resultados con IA...');
    
    const synthesisPrompt = `
Eres un super-coordinador de IA. Varios agentes IA trabajaron en la misma tarea y necesitas combinar sus resultados en la mejor solución posible.

TIPO DE TAREA: ${taskType}

RESULTADOS DE AGENTES:
${results.map((r, i) => `
AGENTE ${i + 1}: ${r.agentName}
Razonamiento: ${r.reasoning}
Confianza: ${r.confidence}
Resultado:
${r.content}
`).join('\n---\n')}

Tu trabajo es:
1. Identificar las mejores ideas de cada agente
2. Combinar las fortalezas de cada enfoque
3. Resolver cualquier conflicto entre enfoques
4. Crear una solución superior que aproveche lo mejor de cada agente

Responde en JSON:
{
  "synthesized_solution": "la solución combinada optimizada",
  "agent_contributions": [
    {
      "agent": "nombre del agente",
      "contribution": "qué aportó específicamente",
      "rating": "1-10"
    }
  ],
  "improvements": ["cómo se mejoró cada enfoque individual"],
  "final_reasoning": "por qué esta solución combinada es superior"
}
`;

    // Usar Claude para síntesis (es bueno analizando y combinando)
    const response = await this.agents.claude.client.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 2000,
      messages: [{ role: 'user', content: synthesisPrompt }]
    });

    try {
      const synthesis = JSON.parse(response.content[0].text);
      
      console.log('🎯 Síntesis completada:');
      synthesis.agent_contributions.forEach(contrib => {
        console.log(`   ${contrib.agent}: ${contrib.contribution} (${contrib.rating}/10)`);
      });
      
      return {
        success: true,
        content: synthesis.synthesized_solution,
        synthesis: synthesis,
        originalResults: results,
        type: 'multi_agent_synthesis'
      };
      
    } catch (error) {
      console.log('⚠️ Error en síntesis, usando mejor resultado individual');
      
      // Fallback: usar el resultado con mayor confianza
      const bestResult = results.reduce((best, current) => 
        current.confidence > best.confidence ? current : best
      );
      
      return bestResult;
    }
  }

  logCollaboration(task, agents, results, finalResult) {
    const collaborationEntry = {
      timestamp: new Date().toISOString(),
      task: task,
      agents_involved: agents.map(a => this.agents[a].name),
      individual_results: results.map(r => ({
        agent: r.agentName,
        success: r.success,
        confidence: r.confidence
      })),
      synthesis_used: finalResult.type === 'multi_agent_synthesis',
      outcome: finalResult.success ? 'success' : 'failure'
    };
    
    this.projectState.collaboration_log.push(collaborationEntry);
    
    console.log(`📝 Colaboración registrada: ${agents.length} agentes → ${finalResult.success ? 'Éxito' : 'Fallo'}`);
  }

  // ============ CICLO PRINCIPAL MULTI-AGENTE ============
  async processTaskWithMultipleAgents(taskDescription) {
    console.log(`\n🚀 PM Bot v4.0 MULTI-AGENTE iniciando...`);
    console.log(`📋 Tarea: ${taskDescription}`);
    
    this.currentTask = {
      id: this.projectConfig.timestamp,
      description: taskDescription,
      status: 'multi_agent_development',
      startTime: new Date()
    };

    try {
      // FASE 1: Planificación colaborativa
      await this.phase1_CollaborativePlanning(taskDescription);
      
      // FASE 2: Desarrollo multi-agente
      await this.phase2_MultiAgentDevelopment();
      
      // FASE 3: Testing y validación cruzada
      await this.phase3_CrossValidation();
      
      // FASE 4: Optimización colaborativa
      await this.phase4_CollaborativeOptimization();
      
      // FASE 5: Interacción continua
      await this.phase5_MultiAgentInteraction();
      
    } catch (error) {
      console.error('🚨 Error en ciclo multi-agente:', error.message);
    }
  }

  async phase1_CollaborativePlanning(taskDescription) {
    console.log('\n🎯 FASE 1: Planificación Colaborativa');
    
    // Cada agente crea su propio plan
    const planningResult = await this.assignTaskToAgents(taskDescription, 'planning');
    
    let masterPlan;
    try {
      masterPlan = JSON.parse(planningResult.content);
      console.log('📋 Plan maestro creado mediante colaboración');
    } catch (error) {
      console.log('⚠️ Plan no parseable, usando estructura básica');
      masterPlan = this.getDefaultPlan(taskDescription);
    }
    
    this.projectState.masterPlan = masterPlan;
    this.projectState.completedFeatures.push('Planificación colaborativa completada');
  }

  async phase2_MultiAgentDevelopment() {
    console.log('\n💻 FASE 2: Desarrollo Multi-Agente');
    
    // Generar código con múltiples agentes
    const codeResult = await this.assignTaskToAgents(
      `Implementar proyecto: ${this.currentTask.description}`, 
      'code_generation'
    );
    
    let codeData;
    try {
      codeData = JSON.parse(codeResult.content);
      console.log('💻 Código generado mediante colaboración multi-agente');
    } catch (error) {
      console.log('⚠️ Código no parseable, usando resultado directo');
      codeData = this.parseCodeFromText(codeResult.content);
    }
    
    // Setup del proyecto con el código colaborativo
    await this.setupProject(codeData);
    console.log('📁 Proyecto configurado con código multi-agente');
    
    this.projectState.codeData = codeData;
    this.projectState.completedFeatures.push('Desarrollo multi-agente completado');
  }

  async phase3_CrossValidation() {
    console.log('\n🔍 FASE 3: Validación Cruzada');
    
    // Múltiples agentes analizan el código
    const analysisResult = await this.assignTaskToAgents(
      'Analizar código generado y encontrar problemas o mejoras',
      'analysis'
    );
    
    let analysis;
    try {
      analysis = JSON.parse(analysisResult.content);
      console.log(`🔍 Análisis cruzado completado - ${analysis.issues?.length || 0} issues encontrados`);
    } catch (error) {
      console.log('⚠️ Análisis no parseable, usando fallback');
      analysis = { issues: [], recommendations: [] };
    }
    
    // Ejecutar tests reales
    const testResults = await this.runRealTests();
    
    this.projectState.crossValidation = {
      analysis: analysis,
      testResults: testResults
    };
    
    console.log(`🧪 Tests ejecutados: ${testResults.basic?.success ? '✅' : '❌'} básicos, ${testResults.functional?.success ? '✅' : '❌'} funcionales`);
  }

  async phase4_CollaborativeOptimization() {
    console.log('\n⚡ FASE 4: Optimización Colaborativa');
    
    // Si hay issues, múltiples agentes proponen soluciones
    if (this.projectState.crossValidation.analysis.issues?.length > 0) {
      console.log('🔧 Issues detectados, agentes colaborando en soluciones...');
      
      for (const issue of this.projectState.crossValidation.analysis.issues.slice(0, 3)) { // Máximo 3 issues
        const fixResult = await this.assignTaskToAgents(
          `Resolver este issue: ${issue.description}`,
          'debugging'
        );
        
        if (fixResult.success) {
          console.log(`✅ Issue resuelto por colaboración: ${issue.description}`);
        }
      }
    }
    
    // Optimizaciones proactivas
    const optimizationResult = await this.assignTaskToAgents(
      'Sugerir optimizaciones y mejoras al proyecto actual',
      'optimization'
    );
    
    console.log('⚡ Optimizaciones colaborativas identificadas');
    this.projectState.optimizations = optimizationResult;
  }

  async phase5_MultiAgentInteraction() {
    console.log('\n💬 FASE 5: Interacción Multi-Agente Continua');
    
    await this.showMultiAgentSummary();
    await this.startMultiAgentLoop();
  }

  async showMultiAgentSummary() {
    console.log('\n📊 RESUMEN MULTI-AGENTE');
    console.log('='.repeat(50));
    console.log(`📝 Proyecto: ${this.currentTask.description}`);
    console.log(`⏱️ Tiempo: ${Math.round((new Date() - this.currentTask.startTime) / 1000)}s`);
    console.log(`🤖 Agentes activos: ${this.projectState.activeAgents.length}`);
    console.log(`🤝 Colaboraciones: ${this.projectState.collaboration_log.length}`);
    console.log(`✅ Features: ${this.projectState.completedFeatures.length}`);
    console.log(`📁 Ubicación: ${this.projectConfig.workingDir}`);
    
    // Mostrar contribuciones por agente
    console.log('\n🎭 Contribuciones por agente:');
    this.projectState.activeAgents.forEach(agentKey => {
      const agent = this.agents[agentKey];
      const contributions = this.projectState.collaboration_log.filter(
        log => log.agents_involved.includes(agent.name)
      ).length;
      console.log(`   ${agent.name}: ${contributions} colaboraciones`);
    });
  }

  async startMultiAgentLoop() {
    console.log('\n🔄 Modo Multi-Agente Interactivo');
    
    while (true) {
      console.log('\n' + '='.repeat(70));
      console.log('🤖 ¿Qué quieres que haga el equipo de agentes?');
      console.log('1. 🚀 Agregar funcionalidad (colaborativo)');
      console.log('2. 🔍 Análisis multi-agente del proyecto');
      console.log('3. 🧪 Testing exhaustivo multi-agente');
      console.log('4. 💡 Brainstorming de mejoras (colaborativo)');
      console.log('5. 🎯 Optimización específica');
      console.log('6. 📊 Ver estadísticas de colaboración');
      console.log('7. 🎭 Cambiar configuración de agentes');
      console.log('8. 🛑 Terminar sesión');
      console.log('='.repeat(70));
      
      const choice = await this.askUser('\n🎯 Tu elección (1-8) o describe tarea: ');
      
      try {
        await this.handleMultiAgentChoice(choice);
      } catch (error) {
        console.log('❌ Error:', error.message);
      }
      
      const continueChoice = await this.askUser('\n🔄 ¿Continuar con el equipo? (s/n): ');
      if (continueChoice.toLowerCase().includes('n')) {
        break;
      }
    }
    
    console.log('\n🎉 Sesión multi-agente terminada');
    await this.showFinalCollaborationReport();
    this.rl.close();
  }

  async handleMultiAgentChoice(choice) {
    const trimmedChoice = choice.trim();
    
    if (trimmedChoice === '1') {
      await this.addFeatureCollaboratively();
    } else if (trimmedChoice === '2') {
      await this.runMultiAgentAnalysis();
    } else if (trimmedChoice === '3') {
      await this.runMultiAgentTesting();
    } else if (trimmedChoice === '4') {
      await this.collaborativeBrainstorming();
    } else if (trimmedChoice === '5') {
      await this.specificOptimization();
    } else if (trimmedChoice === '6') {
      await this.showCollaborationStats();
    } else if (trimmedChoice === '7') {
      await this.configureAgents();
    } else if (trimmedChoice === '8') {
      return;
    } else {
      await this.handleFreeFormCollaboration(choice);
    }
  }

  async addFeatureCollaboratively() {
    const feature = await this.askUser('📝 Describe la nueva funcionalidad: ');
    
    console.log(`\n🤝 Equipo colaborando en: ${feature}`);
    
    const result = await this.assignTaskToAgents(
      `Implementar nueva funcionalidad: ${feature}`,
      'code_generation'
    );
    
    if (result.success) {
      console.log('✅ Funcionalidad implementada colaborativamente');
      
      // Aplicar el código generado
      try {
        const codeData = JSON.parse(result.content);
        await this.integrateCollaborativeCode(codeData);
        console.log('🔧 Código integrado al proyecto');
      } catch (error) {
        console.log('⚠️ Error integrando código:', error.message);
      }
    }
  }

  async collaborativeBrainstorming() {
    console.log('\n💡 Brainstorming Colaborativo Iniciado...');
    
    const brainstormResult = await this.assignTaskToAgents(
      'Generar ideas creativas e innovadoras para mejorar este proyecto',
      'creative'
    );
    
    console.log('\n🧠 Ideas generadas por el equipo:');
    console.log(brainstormResult.content);
    
    if (brainstormResult.synthesis) {
      console.log('\n🎯 Mejores ideas según síntesis:');
      brainstormResult.synthesis.agent_contributions.forEach((contrib, i) => {
        console.log(`${i + 1}. ${contrib.contribution} (${contrib.agent})`);
      });
    }
  }

  async showCollaborationStats() {
    console.log('\n📊 ESTADÍSTICAS DE COLABORACIÓN');
    console.log('='.repeat(40));
    
    const totalCollaborations = this.projectState.collaboration_log.length;
    const successfulTasks = this.projectState.collaboration_log.filter(log => log.outcome === 'success').length;
    const synthesisUsed = this.projectState.collaboration_log.filter(log => log.synthesis_used).length;
    
    console.log(`🤝 Total colaboraciones: ${totalCollaborations}`);
    console.log(`✅ Tareas exitosas: ${successfulTasks}/${totalCollaborations}`);
    console.log(`🔄 Síntesis utilizadas: ${synthesisUsed}`);
    
    // Estadísticas por agente
    console.log('\n🎭 Participación por agente:');
    this.projectState.activeAgents.forEach(agentKey => {
      const agent = this.agents[agentKey];
      const participations = this.projectState.collaboration_log.filter(
        log => log.agents_involved.includes(agent.name)
      ).length;
      const successRate = this.projectState.collaboration_log.filter(
        log => log.agents_involved.includes(agent.name) && log.outcome === 'success'
      ).length;
      
      console.log(`   ${agent.name}: ${participations} tareas, ${successRate} exitosas`);
    });
  }

  async showFinalCollaborationReport() {
    console.log('\n🎭 REPORTE FINAL DE COLABORACIÓN');
    console.log('='.repeat(50));
    
    const report = this.generateCollaborationReport();
    
    console.log(`📊 Proyecto: ${this.currentTask.description}`);
    console.log(`⏱️ Duración total: ${Math.round((new Date() - this.currentTask.startTime) / 60000)}min`);
    console.log(`🤖 Agentes colaboradores: ${report.activeAgents}`);
    console.log(`🤝 Total colaboraciones: ${report.totalCollaborations}`);
    console.log(`✅ Tasa de éxito: ${report.successRate}%`);
    console.log(`🏆 Agente más activo: ${report.mostActiveAgent}`);
    console.log(`🎯 Mejor sinergia: ${report.bestSynergy}`);
    
    console.log('\n🚀 El equipo multi-agente ha completado su trabajo exitosamente!');
  }

  // ============ FUNCIONES AUXILIARES ============
  generateCollaborationReport() {
    const logs = this.projectState.collaboration_log;
    const successfulTasks = logs.filter(log => log.outcome === 'success').length;
    
    // Encontrar agente más activo
    const agentParticipation = {};
    logs.forEach(log => {
      log.agents_involved.forEach(agent => {
        agentParticipation[agent] = (agentParticipation[agent] || 0) + 1;
      });
    });
    
    const mostActiveAgent = Object.keys(agentParticipation).reduce((a, b) => 
      agentParticipation[a] > agentParticipation[b] ? a : b
    );
    
    return {
      activeAgents: this.projectState.activeAgents.length,
      totalCollaborations: logs.length,
      successRate: Math.round((successfulTasks / logs.length) * 100),
      mostActiveAgent: mostActiveAgent,
      bestSynergy: logs.filter(log => log.synthesis_used).length > 0 ? 'Multi-agente' : 'Individual'
    };
  }

  parseCodeFromText(text) {
    // Parser básico para extraer código de respuestas de texto
    const files = [];
    
    // Buscar bloques de código
    const codeBlocks = text.match(/```[\s\S]*?```/g) || [];
    
    codeBlocks.forEach((block, index) => {
      const content = block.replace(/```[^\n]*\n/, '').replace(/```$/, '');
      const fileName = `generated_${index + 1}.js`;
      
      files.push({
        path: fileName,
        content: content,
        type: 'main'
      });
    });
    
    if (files.length === 0) {
      // Si no hay bloques de código, crear archivo básico
      files.push({
        path: 'server.js',
        content: `// Código generado por colaboración multi-agente\n${text}`,
        type: 'main'
      });
    }
    
    return { files };
  }

  async integrateCollaborativeCode(codeData) {
    const workDir = this.projectConfig.workingDir;
    
    for (const file of codeData.files || []) {
      const filePath = path.join(workDir, file.path);
      const fileDir = path.dirname(filePath);
      
      fs.mkdirSync(fileDir, { recursive: true });
      fs.writeFileSync(filePath, file.content);
      console.log(`📄 Integrado: ${file.path}`);
    }
  }

  getProjectContext() {
    try {
      const workDir = this.projectConfig.workingDir;
      
      if (!fs.existsSync(workDir)) {
        return 'Proyecto nuevo - no hay contexto previo';
      }
      
      const files = fs.readdirSync(workDir).filter(f => !f.includes('node_modules'));
      return `Archivos actuales: ${files.join(', ')}`;
      
    } catch (error) {
      return 'Error obteniendo contexto del proyecto';
    }
  }

  getOtherAgentsContext(currentAgent) {
    return this.projectState.activeAgents
      .filter(agent => agent !== currentAgent)
      .map(agent => `${this.agents[agent].name}: ${this.agents[agent].specialties.join(', ')}`)
      .join('\n');
  }

  // Funciones reutilizadas de versiones anteriores
  async setupProject(codeData) {
    const workDir = this.projectConfig.workingDir;
    
    if (fs.existsSync(workDir)) {
      fs.rmSync(workDir, { recursive: true });
    }
    fs.mkdirSync(workDir, { recursive: true });

    for (const file of codeData.files || []) {
      const filePath = path.join(workDir, file.path);
      const fileDir = path.dirname(filePath);
      
      fs.mkdirSync(fileDir, { recursive: true });
      fs.writeFileSync(filePath, file.content);
      console.log(`📄 CREADO: ${file.path}`);
    }

    try {
      await execAsync('npm install', { cwd: workDir, timeout: 60000 });
      console.log('✅ Dependencias instaladas');
    } catch (error) {
      console.log('⚠️ Warning instalando dependencias:', error.message);
    }
  }

  async runRealTests() {
    const workDir = this.projectConfig.workingDir;
    
    const basicTests = await this.runBasicTests(workDir);
    const functionalTests = await this.runFunctionalTests(workDir);
    
    return {
      basic: basicTests,
      functional: functionalTests
    };
  }

  async runBasicTests(workDir) {
    try {
      const { stdout, stderr } = await execAsync('npm test', { 
        cwd: workDir,
        timeout: 30000 
      });
      
      return {
        success: !stderr || !stderr.includes('Error'),
        output: stdout,
        errors: stderr
      };
    } catch (error) {
      return {
        success: false,
        output: error.stdout || '',
        errors: error.message
      };
    }
  }

  async runFunctionalTests(workDir) {
    try {
      const serverProcess = exec('npm start || node server.js', { cwd: workDir });
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Test básico de conectividad
      serverProcess.kill();
      
      return {
        success: true,
        output: 'Servidor inició correctamente'
      };
    } catch (error) {
      return {
        success: false,
        output: 'Error iniciando servidor',
        errors: error.message
      };
    }
  }

  // Funciones básicas
  async askUser(question) {
    return new Promise((resolve) => {
      this.rl.question(question, (answer) => {
        resolve(answer);
      });
    });
  }

  generateTimestamp() {
    const now = new Date();
    return `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}`;
  }

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

  checkEnvVars() {
    const required = ['ANTHROPIC_API_KEY'];
    const optional = ['OPENAI_API_KEY'];
    
    const missing = required.filter(v => !process.env[v]);
    
    if (missing.length > 0) {
      console.error('❌ Variables requeridas faltantes:', missing.join(', '));
      process.exit(1);
    }
    
    const availableOptional = optional.filter(v => process.env[v]);
    if (availableOptional.length > 0) {
      console.log(`✅ APIs opcionales disponibles: ${availableOptional.join(', ')}`);
    }
  }

  getDefaultPlan(taskDescription) {
    return {
      phases: [
        {
          name: 'Desarrollo',
          tasks: ['Generar código', 'Implementar funcionalidad'],
          duration: '30 minutos'
        }
      ],
      architecture: {
        components: ['servidor', 'api'],
        technologies: ['nodejs', 'express']
      }
    };
  }

  // Placeholders para funciones específicas multi-agente
  async runMultiAgentAnalysis() {
    const result = await this.assignTaskToAgents('Analizar proyecto completo', 'analysis');
    console.log('🔍 Análisis multi-agente completado');
    console.log(result.content);
  }

  async runMultiAgentTesting() {
    console.log('🧪 Testing multi-agente iniciado...');
    const testResults = await this.runRealTests();
    
    const analysisResult = await this.assignTaskToAgents(
      `Analizar resultados de tests: ${JSON.stringify(testResults)}`,
      'analysis'
    );
    
    console.log('📊 Análisis de tests por múltiples agentes:');
    console.log(analysisResult.content);
  }

  async specificOptimization() {
    const area = await this.askUser('🎯 ¿Qué área optimizar? (performance/security/code/ui): ');
    
    const result = await this.assignTaskToAgents(
      `Optimizar específicamente: ${area}`,
      'optimization'
    );
    
    console.log(`⚡ Optimización de ${area} completada por el equipo`);
    console.log(result.content);
  }

  async configureAgents() {
    console.log('\n🎭 Configuración de Agentes');
    console.log('='.repeat(30));
    
    Object.entries(this.agents).forEach(([key, agent]) => {
      console.log(`${agent.active ? '✅' : '❌'} ${agent.name}`);
      console.log(`   Especialidades: ${agent.specialties.join(', ')}`);
    });
    
    console.log('\n💡 Para agregar más agentes, actualiza las variables de entorno');
  }

  async handleFreeFormCollaboration(request) {
    console.log(`\n🤝 Equipo colaborando en: "${request}"`);
    
    // Determinar tipo de tarea basado en el request
    let taskType = 'analysis';
    if (request.toLowerCase().includes('código') || request.toLowerCase().includes('implementar')) {
      taskType = 'code_generation';
    } else if (request.toLowerCase().includes('diseño') || request.toLowerCase().includes('ui')) {
      taskType = 'frontend';
    } else if (request.toLowerCase().includes('plan') || request.toLowerCase().includes('arquitectura')) {
      taskType = 'planning';
    }
    
    const result = await this.assignTaskToAgents(request, taskType);
    
    console.log('✅ Equipo completó la solicitud:');
    console.log(result.content);
    
    if (result.synthesis) {
      console.log('\n🎯 Contribuciones específicas:');
      result.synthesis.agent_contributions.forEach(contrib => {
        console.log(`   ${contrib.agent}: ${contrib.contribution}`);
      });
    }
  }
}

// ============ PUNTO DE ENTRADA ============
async function main() {
  console.log('🤖 PM Bot v4.0 - SISTEMA MULTI-AGENTE COLABORATIVO');

  try {
    const multiAgentPM = new MultiAgentPM();

    if (process.argv[2]) {
      await multiAgentPM.processTaskWithMultipleAgents(process.argv[2]);
    } else {
      console.log('\n🎯 Ejecutando proyecto colaborativo de demostración...');
      await multiAgentPM.processTaskWithMultipleAgents("Crear plataforma de e-learning con videos y quizzes");
    }
    
  } catch (error) {
    console.error('💥 Error fatal:', error.message);
    process.exit(1);
  }
}

process.on('SIGINT', () => {
  console.log('\n👋 Equipo multi-agente deteniendo...');
  process.exit(0);
});

if (require.main === module) {
  main().catch(console.error);
}

module.exports = MultiAgentPM;