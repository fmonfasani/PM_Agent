// quick-start.js
// Quick Start corregido para PM Bot Autónomo

const { AutonomousPMSystem, startAutonomousPM } = require('./autonomous-pm-standalone');

async function quickStart() {
  console.log('🚀 PM BOT AUTÓNOMO 24/7 - QUICK START');
  console.log('🤖 Versión: 1.0.0 - Standalone');
  console.log('📅 ' + new Date().toLocaleString());
  console.log('');
  
  try {
    console.log('📦 Inicializando sistema autónomo...');
    
    // Crear e iniciar el sistema autónomo
    const pmBot = await startAutonomousPM();
    
    // Configurar eventos de demostración
    setupDemoEvents(pmBot);
    
    console.log('\n🎬 DEMOSTRACIÓN AUTOMÁTICA INICIADA');
    console.log('=' .repeat(50));
    
    // Ejecutar demo automática
    await runAutomatedDemo(pmBot);
    
    console.log('\n✅ Sistema funcionando 24/7');
    console.log('📊 Dashboard disponible en: http://localhost:3001');
    console.log('🔍 Monitorea el progreso en la consola...');
    
    // Mantener sistema funcionando
    keepSystemRunning(pmBot);
    
  } catch (error) {
    console.error('💥 Error en Quick Start:', error.message);
    console.log('\n🔧 Intentando modo de recuperación...');
    await fallbackMode();
  }
}

function setupDemoEvents(pmBot) {
  // Configurar eventos para mostrar progreso
  pmBot.on('projectCompleted', (project) => {
    console.log(`\n🎉 ¡PROYECTO COMPLETADO AUTOMÁTICAMENTE!`);
    console.log(`📝 ${project.description}`);
    console.log(`⏱️ Tiempo: ${Math.round((project.endTime - project.startTime) / 1000)}s`);
    console.log(`🎯 Nivel de autonomía: ${project.autonomyLevel}/10`);
    console.log(`📁 Archivos en: ./projects/${project.id}/`);
  });
  
  pmBot.on('autonomyEscalated', (escalation) => {
    console.log(`\n🚀 ¡AUTONOMÍA ESCALADA AUTOMÁTICAMENTE!`);
    console.log(`📈 Nivel ${escalation.from} → ${escalation.to}`);
    console.log(`🔓 Nuevas capacidades desbloqueadas`);
    
    // Mostrar nuevas capacidades
    const newConfig = pmBot.autonomyConfig[escalation.to];
    console.log(`   🤖 Auto-implementación: ${newConfig.autoImplement ? 'SÍ' : 'NO'}`);
    console.log(`   📊 Max cambios: ${newConfig.maxChanges}`);
    console.log(`   ✋ Requiere aprobación: ${newConfig.requiresApproval ? 'SÍ' : 'NO'}`);
  });
  
  pmBot.on('improvementImplemented', (improvement) => {
    console.log(`\n⚡ ¡MEJORA IMPLEMENTADA AUTOMÁTICAMENTE!`);
    console.log(`💡 ${improvement.description}`);
    console.log(`📊 Tipo: ${improvement.type}`);
  });
  
  pmBot.on('approvalRequested', (approval) => {
    console.log(`\n✋ SOLICITUD DE APROBACIÓN`);
    console.log(`📋 Tipo: ${approval.type}`);
    console.log(`📝 ${approval.description || 'Proyecto: ' + approval.projectId}`);
    console.log(`⏳ Auto-aprobación en 30 segundos...`);
  });
}

async function runAutomatedDemo(pmBot) {
  console.log('🎬 Ejecutando demo de proyectos automáticos...');
  
  // Proyectos de demostración con delays escalonados
  const demoProjects = [
    {
      description: "Crear página web corporativa simple",
      priority: "medium",
      delay: 3000
    },
    {
      description: "Desarrollar API REST para gestión de usuarios",
      priority: "high", 
      delay: 20000
    },
    {
      description: "Implementar chat bot inteligente",
      priority: "medium",
      delay: 40000
    },
    {
      description: "Crear dashboard administrativo con métricas",
      priority: "high",
      delay: 60000
    },
    {
      description: "Sistema de notificaciones en tiempo real",
      priority: "high",
      delay: 80000
    }
  ];
  
  console.log(`📋 Se ejecutarán ${demoProjects.length} proyectos de demostración`);
  console.log('⏱️ Duración estimada: ~2 minutos\n');
  
  // Programar ejecución de proyectos
  demoProjects.forEach((project, index) => {
    setTimeout(async () => {
      console.log(`\n🚀 DEMO ${index + 1}/${demoProjects.length}: Iniciando proyecto automático`);
      console.log(`🎯 ${project.description}`);
      console.log(`⚡ Prioridad: ${project.priority}`);
      
      try {
        await pmBot.acceptNewProject(project.description, project.priority);
      } catch (error) {
        console.log(`❌ Error en demo ${index + 1}: ${error.message}`);
      }
      
    }, project.delay);
  });
  
  // Mostrar estado cada 15 segundos
  const statusInterval = setInterval(() => {
    const status = pmBot.getStatus();
    console.log(`\n📊 ESTADO ACTUAL:`);
    console.log(`   🎯 Autonomía: ${status.autonomyLevel}/10`);
    console.log(`   📝 Proyectos: ${status.metrics.totalProjects} total, ${status.metrics.completedProjects} completados`);
    console.log(`   ✅ Éxito: ${status.metrics.successRate.toFixed(1)}%`);
  }, 15000);
  
  // Detener el intervalo después de la demo
  setTimeout(() => {
    clearInterval(statusInterval);
  }, 100000);
}

function keepSystemRunning(pmBot) {
  console.log('\n🔄 SISTEMA EN FUNCIONAMIENTO CONTINUO');
  console.log('=' .repeat(40));
  console.log('💡 Comandos disponibles:');
  console.log('   📊 Estado: curl http://localhost:3001/status');
  console.log('   🌐 Dashboard: open http://localhost:3001');
  console.log('   🛑 Detener: Ctrl+C');
  console.log('=' .repeat(40));
  
  // Estadísticas cada 60 segundos
  const statsInterval = setInterval(() => {
    const status = pmBot.getStatus();
    const timestamp = new Date().toLocaleTimeString();
    
    console.log(`\n📈 ESTADÍSTICAS ${timestamp}:`);
    console.log(`   🎯 Autonomía: ${status.autonomyLevel}/10 (${status.autonomyDescription})`);
    console.log(`   🏗️ Proyectos activos: ${status.activeProjects.filter(p => p.status === 'in_progress').length}`);
    console.log(`   ✅ Tasa de éxito: ${status.metrics.successRate.toFixed(1)}%`);
    console.log(`   💡 Mejoras: ${status.metrics.improvementsImplemented}`);
    console.log(`   ✋ Aprobaciones pendientes: ${status.pendingApprovals.length}`);
    
  }, 60000);
  
  // Mantener proceso vivo
  process.stdin.resume();
  
  // Limpiar al cerrar
  process.on('SIGINT', () => {
    clearInterval(statsInterval);
    console.log('\n\n🛑 Deteniendo PM Bot Autónomo...');
    pmBot.stop().then(() => {
      console.log('👋 ¡Sistema detenido correctamente!');
      process.exit(0);
    });
  });
  
  // Manejo de errores no capturados
  process.on('uncaughtException', (error) => {
    console.log('\n🚨 Error no capturado:', error.message);
    console.log('🔄 El sistema continúa funcionando...');
  });
}

async function fallbackMode() {
  console.log('🔄 Iniciando modo de recuperación...');
  
  try {
    // Crear sistema básico sin dependencias externas
    const basicPM = new AutonomousPMSystem();
    await basicPM.startAutonomousMode();
    
    console.log('✅ Modo de recuperación activo');
    console.log('🌐 Dashboard básico en: http://localhost:3001');
    
    // Ejecutar un proyecto de prueba
    setTimeout(() => {
      basicPM.acceptNewProject("Proyecto de prueba en modo recuperación", "low");
    }, 5000);
    
    keepSystemRunning(basicPM);
    
  } catch (error) {
    console.error('💥 Error crítico en modo recuperación:', error.message);
    console.log('\n📝 Instrucciones de recuperación manual:');
    console.log('1. Verificar que tienes Node.js instalado');
    console.log('2. Ejecutar: npm install express cors');
    console.log('3. Crear archivo .env con ANTHROPIC_API_KEY (opcional)');
    console.log('4. Reintentar: node quick-start.js');
  }
}

function showWelcomeMessage() {
  console.log('\n🎯 BIENVENIDO AL PM BOT AUTÓNOMO 24/7');
  console.log('=' .repeat(50));
  console.log('🤖 Tu Project Manager artificial que nunca duerme');
  console.log('🚀 Funciona las 24 horas, los 7 días de la semana');
  console.log('🧠 Aprende y mejora automáticamente');
  console.log('📈 Escala su autonomía basado en resultados');
  console.log('=' .repeat(50));
  console.log('\n🎬 Iniciando demostración automática...');
}

function checkEnvironment() {
  console.log('🔍 Verificando entorno de ejecución...');
  
  // Verificar Node.js
  const nodeVersion = process.version;
  console.log(`✅ Node.js: ${nodeVersion}`);
  
  // Verificar variables de entorno opcionales
  if (process.env.ANTHROPIC_API_KEY) {
    console.log('✅ ANTHROPIC_API_KEY configurada');
  } else {
    console.log('⚠️ ANTHROPIC_API_KEY no encontrada (se usará sistema fallback)');
  }
  
  if (process.env.OPENAI_API_KEY) {
    console.log('✅ OPENAI_API_KEY configurada');
  } else {
    console.log('⚠️ OPENAI_API_KEY no encontrada (se usará sistema fallback)');
  }
  
  console.log('🎯 Sistema listo para funcionar con o sin APIs externas\n');
}

// ============ MODO INTERACTIVO OPCIONAL ============

async function interactiveMode() {
  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  console.log('\n🎮 MODO INTERACTIVO ACTIVADO');
  console.log('💬 Comandos: proyecto, estado, escalamiento, mejoras, dashboard, salir\n');
  
  const pmBot = await startAutonomousPM();
  
  const askCommand = () => {
    rl.question('🤖 PM Bot > ', async (input) => {
      const command = input.toLowerCase().trim();
      
      try {
        switch (command) {
          case 'proyecto':
            rl.question('📝 Describe el proyecto: ', async (description) => {
              await pmBot.acceptNewProject(description, 'medium');
              console.log('✅ Proyecto creado y en proceso...');
              askCommand();
            });
            break;
            
          case 'estado':
            const status = pmBot.getStatus();
            console.log(`🎯 Autonomía: ${status.autonomyLevel}/10`);
            console.log(`📊 Proyectos: ${status.metrics.totalProjects} total`);
            console.log(`✅ Éxito: ${status.metrics.successRate.toFixed(1)}%`);
            console.log(`💡 Mejoras: ${status.metrics.improvementsImplemented}`);
            askCommand();
            break;
            
          case 'escalamiento':
            await pmBot.evaluateAutonomyEscalation();
            askCommand();
            break;
            
          case 'mejoras':
            await pmBot.identifyImprovements();
            askCommand();
            break;
            
          case 'dashboard':
            console.log('🌐 Dashboard disponible en: http://localhost:3001');
            askCommand();
            break;
            
          case 'salir':
            console.log('👋 Saliendo del modo interactivo...');
            await pmBot.stop();
            rl.close();
            process.exit(0);
            
          default:
            if (command.length > 5) {
              // Tratar como descripción de proyecto
              await pmBot.acceptNewProject(input, 'medium');
              console.log('✅ Proyecto creado automáticamente');
            } else {
              console.log('❓ Comando no reconocido. Usa: proyecto, estado, escalamiento, mejoras, dashboard, salir');
            }
            askCommand();
        }
      } catch (error) {
        console.log(`❌ Error: ${error.message}`);
        askCommand();
      }
    });
  };
  
  askCommand();
}

// ============ MENÚ PRINCIPAL ============

async function showMainMenu() {
  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  showWelcomeMessage();
  checkEnvironment();
  
  console.log('🎯 Modos de ejecución disponibles:');
  console.log('1. 🎬 Demo Automático (recomendado)');
  console.log('2. 🎮 Modo Interactivo');
  console.log('3. 🔄 Funcionamiento Continuo');
  console.log('4. 🚀 Inicio Rápido');
  
  rl.question('\n¿Qué modo prefieres? (1-4): ', async (choice) => {
    rl.close();
    
    switch (choice.trim()) {
      case '1':
        await quickStart();
        break;
        
      case '2':
        await interactiveMode();
        break;
        
      case '3':
        const continuousPM = await startAutonomousPM();
        keepSystemRunning(continuousPM);
        break;
        
      case '4':
        const rapidPM = await startAutonomousPM();
        setTimeout(() => {
          rapidPM.acceptNewProject("Sistema de ejemplo rápido", "medium");
        }, 2000);
        keepSystemRunning(rapidPM);
        break;
        
      default:
        console.log('🎬 Ejecutando demo automático por defecto...');
        await quickStart();
    }
  });
}

// ============ PUNTO DE ENTRADA ============

async function main() {
  try {
    // Verificar si se ejecuta directamente o con argumentos
    if (process.argv.length > 2) {
      const command = process.argv[2].toLowerCase();
      
      switch (command) {
        case 'demo':
          await quickStart();
          break;
        case 'interactive':
          await interactiveMode();
          break;
        case 'rapid':
          const rapidPM = await startAutonomousPM();
          keepSystemRunning(rapidPM);
          break;
        default:
          // Tratar como descripción de proyecto
          const description = process.argv.slice(2).join(' ');
          const pmBot = await startAutonomousPM();
          await pmBot.acceptNewProject(description, 'medium');
          keepSystemRunning(pmBot);
      }
    } else {
      // Mostrar menú interactivo
      await showMainMenu();
    }
    
  } catch (error) {
    console.error('💥 Error crítico:', error.message);
    await fallbackMode();
  }
}

// Ejecutar si es el archivo principal
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { quickStart, interactiveMode, fallbackMode };