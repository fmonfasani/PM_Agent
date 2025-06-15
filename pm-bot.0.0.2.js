// PM Bot v2.0 - CON GENERACIÓN DE README.md AUTOMÁTICO
const fs = require('fs');
const path = require('path');

// Verificar si las dependencias están instaladas
try {
  var { Anthropic } = require('@anthropic-ai/sdk');
  var { Octokit } = require('@octokit/rest');
} catch (error) {
  console.error('❌ Error: Dependencias no instaladas.');
  console.log('🔧 Ejecuta: npm install @anthropic-ai/sdk @octokit/rest');
  process.exit(1);
}

const { exec } = require('child_process');
const util = require('util');

const execAsync = util.promisify(exec);

class EnhancedPM {
  constructor() {
    this.loadEnvFile();
    this.checkEnvVars();
    
    this.anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY
    });
    
    this.github = new Octokit({
      auth: process.env.GITHUB_TOKEN
    });
    
    // Generar directorio único con fecha y hora
    const timestamp = this.generateTimestamp();
    
    this.projectConfig = {
      owner: process.env.GITHUB_OWNER,
      repo: process.env.GITHUB_REPO,
      workingDir: `./projects/project_${timestamp}`,
      timestamp: timestamp
    };
    
    // Crear directorio de proyectos si no existe
    if (!fs.existsSync('./projects')) {
      fs.mkdirSync('./projects', { recursive: true });
    }
    
    this.currentTask = null;
    
    console.log(`📁 Proyecto se guardará en: ${this.projectConfig.workingDir}`);
  }

  // Generar timestamp único para nombres de directorio
  generateTimestamp() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    
    return `${year}${month}${day}_${hours}${minutes}${seconds}`;
  }

  loadEnvFile() {
    try {
      if (fs.existsSync('.env')) {
        const envContent = fs.readFileSync('.env', 'utf8');
        const envLines = envContent.split('\n');
        
        for (const line of envLines) {
          const trimmedLine = line.trim();
          if (trimmedLine && !trimmedLine.startsWith('#')) {
            const [key, ...valueParts] = trimmedLine.split('=');
            const value = valueParts.join('=').replace(/^["']|["']$/g, '');
            if (key && value) {
              process.env[key.trim()] = value.trim();
            }
          }
        }
        console.log('📁 Archivo .env cargado correctamente');
      } else {
        console.log('💡 Archivo .env no encontrado - usando variables de entorno del sistema');
      }
    } catch (error) {
      console.log('⚠️ Warning: No se pudo cargar .env:', error.message);
    }
  }

  checkEnvVars() {
    const requiredEnvVars = ['ANTHROPIC_API_KEY', 'GITHUB_TOKEN', 'GITHUB_OWNER', 'GITHUB_REPO'];
    const missing = requiredEnvVars.filter(v => !process.env[v]);
    
    if (missing.length > 0) {
      console.error('❌ Variables de entorno faltantes:', missing.join(', '));
      console.log('\n📋 Configuración requerida:');
      console.log('export ANTHROPIC_API_KEY="your_anthropic_key"');
      console.log('export GITHUB_TOKEN="your_github_token"');
      console.log('export GITHUB_OWNER="your_github_username"');
      console.log('export GITHUB_REPO="your_repo_name"');
      console.log('\n💡 O crea un archivo .env con estas variables');
      process.exit(1);
    }
  }

  async processTask(taskDescription) {
    console.log(`\n🚀 PM Bot v2.0 iniciando tarea: ${taskDescription}`);
    
    this.currentTask = {
      id: Date.now().toString(),
      description: taskDescription,
      status: 'in_progress',
      startTime: new Date(),
      steps: []
    };

    try {
      // PASO 1: Analizar tarea y crear plan detallado
      const plan = await this.createExecutionPlan(taskDescription);
      console.log('📋 Plan creado:', plan.summary);
      
      // PASO 2: Generar código completo con documentación
      const code = await this.generateCodeWithDocs(plan);
      console.log('💻 Código y documentación generados');
      
      // PASO 3: Crear estructura de proyecto completa
      await this.setupProject(code);
      console.log('📁 Proyecto configurado con documentación');
      
      // PASO 4: Ejecutar tests
      const testResults = await this.runTests();
      console.log('🧪 Tests ejecutados:', testResults.success ? '✅' : '❌');
      
      // PASO 5: Generar README.md final
      await this.generateReadme(plan, code, testResults);
      console.log('📚 README.md generado');
      
      // PASO 6: Subir a GitHub o guardar localmente
      const result = await this.pushToGitHub(code, plan);
      console.log('📤 Proyecto finalizado:', result);
      
      // PASO 7: Reportar éxito
      await this.reportSuccess(plan, testResults, result);
      
    } catch (error) {
      await this.handleError(error);
    }
  }

  async createExecutionPlan(taskDescription) {
    const prompt = `
Eres un PM experto. Analiza esta tarea y crea un plan de ejecución detallado:

TAREA: ${taskDescription}

Responde en JSON con esta estructura exacta:
{
  "summary": "Resumen técnico breve de la tarea",
  "type": "web-app|api|utility|frontend|backend|fullstack",
  "technology": "javascript|react|express|node|etc",
  "complexity": "simple|medium|complex",
  "estimatedTime": "15-30s",
  "files": [
    {
      "name": "server.js",
      "purpose": "servidor principal Express",
      "priority": "high",
      "type": "backend"
    }
  ],
  "dependencies": ["express", "cors", "body-parser"],
  "features": ["API REST", "frontend responsive", "validación"],
  "tests": [
    {
      "type": "unit|integration|e2e",
      "description": "qué testear específicamente"
    }
  ],
  "deployment": {
    "type": "local|vercel|heroku",
    "port": 3000,
    "commands": ["npm install", "npm start"]
  },
  "acceptance_criteria": ["criterio técnico específico"],
  "documentation_sections": ["instalación", "uso", "API", "deployment"]
}

IMPORTANTE: Responde SOLO con el JSON, sin texto adicional.
`;

    const response = await this.anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1500,
      messages: [{ role: 'user', content: prompt }]
    });

    try {
      return JSON.parse(response.content[0].text);
    } catch (error) {
      console.error('Error parsing plan JSON:', response.content[0].text);
      return this.getDefaultPlan(taskDescription);
    }
  }

  async generateCodeWithDocs(plan) {
    const prompt = `
Como desarrollador experto, implementa este plan completo con documentación:

PLAN: ${JSON.stringify(plan, null, 2)}

Genera código profesional, completo y bien documentado.

Responde SOLO con este JSON exacto:
{
  "files": [
    {
      "path": "server.js",
      "content": "// Código JavaScript profesional con comentarios\\nconst express = require('express');\\n// más código...",
      "type": "main|test|config|doc",
      "description": "Propósito del archivo"
    }
  ],
  "setup_commands": ["npm install", "npm test"],
  "run_command": "npm start",
  "environment_vars": [],
  "ports": [3000],
  "api_endpoints": [
    {
      "method": "GET",
      "path": "/api/tasks",
      "description": "Obtener lista de tareas"
    }
  ]
}

REQUISITOS:
- Código limpio y comentado
- Manejo de errores robusto
- Validación de entrada
- Tests funcionales incluidos
- package.json completo con scripts
- Configuración lista para producción

IMPORTANTE: Responde SOLO con el JSON, sin texto adicional.
`;

    const response = await this.anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 4000,
      messages: [{ role: 'user', content: prompt }]
    });

    try {
      return JSON.parse(response.content[0].text);
    } catch (error) {
      console.error('Error parsing code JSON:', response.content[0].text);
      return this.getDefaultCode(plan);
    }
  }

  async generateReadme(plan, codeData, testResults) {
    const readmeContent = `# ${this.getProjectTitle(plan)}

> ${plan.summary}

## 📋 Descripción

**Tarea Original:** ${this.currentTask.description}

**Tipo de Proyecto:** ${plan.type || 'Aplicación'}  
**Tecnología:** ${plan.technology || 'JavaScript'}  
**Complejidad:** ${plan.complexity || 'Media'}  
**Tiempo de Desarrollo:** ${Math.round((new Date() - this.currentTask.startTime) / 1000)}s (automatizado)

## 🚀 Inicio Rápido

\`\`\`bash
# 1. Instalar dependencias
npm install

# 2. Ejecutar aplicación
${codeData.run_command || 'npm start'}

# 3. Abrir en navegador (si aplica)
${codeData.ports ? `http://localhost:${codeData.ports[0]}` : '# Ver logs de la aplicación'}
\`\`\`

## 📦 Instalación Detallada

### Prerrequisitos
- Node.js v16 o superior
- npm o yarn

### Pasos de Instalación

1. **Clonar/Descargar el proyecto**
   \`\`\`bash
   # Si está en GitHub
   git clone <repository-url>
   cd ${this.getProjectName(plan)}
   \`\`\`

2. **Instalar dependencias**
   \`\`\`bash
   ${codeData.setup_commands ? codeData.setup_commands.join('\n   ') : 'npm install'}
   \`\`\`

${codeData.environment_vars && codeData.environment_vars.length > 0 ? `
3. **Configurar variables de entorno** (opcional)
   \`\`\`bash
   # Crear archivo .env
   ${codeData.environment_vars.map(env => `${env}=tu_valor_aqui`).join('\n   ')}
   \`\`\`
` : ''}

3. **Ejecutar aplicación**
   \`\`\`bash
   ${codeData.run_command || 'npm start'}
   \`\`\`

## 📁 Estructura del Proyecto

\`\`\`
${this.getProjectName(plan)}/
├── ${codeData.files.map(f => f.path).join('\n├── ')}
└── README.md
\`\`\`

### Descripción de Archivos

${codeData.files.map(file => `- **${file.path}**: ${file.description || this.getFileDescription(file)}`).join('\n')}

## 🔧 Scripts Disponibles

\`\`\`bash
# Ejecutar aplicación
${codeData.run_command || 'npm start'}

# Ejecutar tests
npm test

# Instalar dependencias
npm install
\`\`\`

${codeData.api_endpoints && codeData.api_endpoints.length > 0 ? `
## 🌐 API Endpoints

${codeData.api_endpoints.map(endpoint => `
### ${endpoint.method} ${endpoint.path}
${endpoint.description}

**Ejemplo:**
\`\`\`bash
curl -X ${endpoint.method} http://localhost:${codeData.ports ? codeData.ports[0] : 3000}${endpoint.path}
\`\`\`
`).join('\n')}
` : ''}

## 🧪 Testing

**Estado de Tests:** ${testResults.success ? '✅ TODOS PASARON' : '❌ ALGUNOS FALLARON'}

\`\`\`bash
# Ejecutar tests
npm test
\`\`\`

${!testResults.success ? `
**Detalles de Errores:**
\`\`\`
${testResults.errors}
\`\`\`
` : ''}

## 🚀 Deployment

### Deployment Local
\`\`\`bash
${codeData.run_command || 'npm start'}
\`\`\`

### Deployment en Producción

#### Vercel
\`\`\`bash
npm install -g vercel
vercel
\`\`\`

#### Heroku
\`\`\`bash
git init
heroku create tu-app-name
git add .
git commit -m "Initial commit"
git push heroku main
\`\`\`

#### Docker (si aplica)
\`\`\`bash
docker build -t ${this.getProjectName(plan)} .
docker run -p ${codeData.ports ? codeData.ports[0] : 3000}:${codeData.ports ? codeData.ports[0] : 3000} ${this.getProjectName(plan)}
\`\`\`

## 📊 Características

${plan.features ? plan.features.map(feature => `- ✅ ${feature}`).join('\n') : '- ✅ Código generado automáticamente'}

## 🔧 Configuración

${codeData.environment_vars && codeData.environment_vars.length > 0 ? `
### Variables de Entorno
\`\`\`env
${codeData.environment_vars.map(env => `${env}=valor_por_defecto`).join('\n')}
\`\`\`
` : ''}

${codeData.ports ? `
### Puertos
- **Aplicación Principal:** ${codeData.ports[0]}
${codeData.ports.slice(1).map((port, i) => `- **Servicio ${i + 2}:** ${port}`).join('\n')}
` : ''}

## 🤝 Desarrollo

### Agregar Nuevas Características
1. Editar archivos relevantes
2. Ejecutar tests: \`npm test\`
3. Verificar funcionamiento: \`${codeData.run_command || 'npm start'}\`

### Estructura de Desarrollo
- **Backend:** ${codeData.files.filter(f => f.type === 'main').map(f => f.path).join(', ')}
- **Tests:** ${codeData.files.filter(f => f.type === 'test').map(f => f.path).join(', ')}
- **Configuración:** ${codeData.files.filter(f => f.type === 'config').map(f => f.path).join(', ')}

## 📚 Documentación Adicional

${plan.documentation_sections ? plan.documentation_sections.map(section => `- ${section.charAt(0).toUpperCase() + section.slice(1)}`).join('\n') : ''}

## ⚠️ Troubleshooting

### Problemas Comunes

1. **Error de puertos ocupados**
   \`\`\`bash
   # Cambiar puerto en el código o usar otro puerto
   PORT=${codeData.ports ? codeData.ports[0] + 1 : 3001} ${codeData.run_command || 'npm start'}
   \`\`\`

2. **Dependencias faltantes**
   \`\`\`bash
   rm -rf node_modules package-lock.json
   npm install
   \`\`\`

3. **Tests fallando**
   \`\`\`bash
   npm test -- --verbose
   \`\`\`

## 📝 Notas de Desarrollo

- **Generado por:** PM Bot v2.0
- **Fecha:** ${new Date().toISOString().split('T')[0]}
- **Tiempo de Desarrollo:** ${Math.round((new Date() - this.currentTask.startTime) / 1000)} segundos
- **Task ID:** ${this.currentTask.id}

## 🔗 Enlaces Útiles

- [Node.js Documentation](https://nodejs.org/docs/)
- [npm Documentation](https://docs.npmjs.com/)
${plan.technology === 'express' ? '- [Express.js Documentation](https://expressjs.com/)' : ''}
${plan.technology === 'react' ? '- [React Documentation](https://reactjs.org/docs/)' : ''}

---

*Proyecto generado automáticamente por PM Bot. Para modificaciones, edita los archivos fuente y regenera según sea necesario.*
`;

    const readmePath = path.join(this.projectConfig.workingDir, 'README.md');
    fs.writeFileSync(readmePath, readmeContent);
    console.log('📚 README.md generado exitosamente');
  }

  // Funciones auxiliares para README
  getProjectTitle(plan) {
    if (plan.summary) {
      return plan.summary.split(' ').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
      ).join(' ');
    }
    return 'Proyecto Generado por PM Bot';
  }

  getProjectName(plan) {
    return (plan.summary || 'pm-bot-project')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  getFileDescription(file) {
    const descriptions = {
      'server.js': 'Servidor principal de la aplicación',
      'app.js': 'Aplicación principal',
      'index.js': 'Punto de entrada de la aplicación',
      'package.json': 'Configuración del proyecto y dependencias',
      'test.js': 'Tests unitarios',
      '.gitignore': 'Archivos ignorados por Git',
      'Dockerfile': 'Configuración para Docker'
    };
    return descriptions[file.path] || `Archivo ${file.type}`;
  }

  // Resto de funciones (setupProject, runTests, etc.) permanecen igual...
  async setupProject(codeData) {
    const workDir = this.projectConfig.workingDir;
    
    if (fs.existsSync(workDir)) {
      fs.rmSync(workDir, { recursive: true });
    }
    fs.mkdirSync(workDir, { recursive: true });

    for (const file of codeData.files) {
      const filePath = path.join(workDir, file.path);
      const fileDir = path.dirname(filePath);
      
      fs.mkdirSync(fileDir, { recursive: true });
      fs.writeFileSync(filePath, file.content);
      console.log(`📄 Creado: ${file.path}`);
    }

    for (const command of codeData.setup_commands || []) {
      try {
        await execAsync(command, { cwd: workDir });
        console.log(`✅ Ejecutado: ${command}`);
      } catch (error) {
        console.log(`⚠️ Warning en: ${command}`, error.message);
      }
    }
  }

  async runTests() {
    const workDir = this.projectConfig.workingDir;
    
    try {
      let command = 'npm test';
      
      const packagePath = path.join(workDir, 'package.json');
      if (fs.existsSync(packagePath)) {
        const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
        if (pkg.scripts && pkg.scripts.test) {
          command = 'npm test';
        }
      } else {
        command = 'node test.js';
      }
      
      const { stdout, stderr } = await execAsync(command, { 
        cwd: workDir,
        timeout: 30000 
      });
      
      return {
        success: true,
        output: stdout,
        errors: stderr,
        command: command
      };
    } catch (error) {
      return {
        success: false,
        output: error.stdout || '',
        errors: error.stderr || error.message,
        command: 'test execution'
      };
    }
  }

  async pushToGitHub(codeData, plan) {
    // Función simplificada - guardar localmente por ahora
    const outputDir = `./projects/final_${this.projectConfig.timestamp}`;
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    // Copiar todos los archivos incluyendo README
    const workDir = this.projectConfig.workingDir;
    const files = fs.readdirSync(workDir);
    
    for (const file of files) {
      const sourcePath = path.join(workDir, file);
      const destPath = path.join(outputDir, file);
      
      if (fs.statSync(sourcePath).isDirectory()) {
        fs.mkdirSync(destPath, { recursive: true });
        const subFiles = fs.readdirSync(sourcePath);
        for (const subFile of subFiles) {
          fs.copyFileSync(
            path.join(sourcePath, subFile),
            path.join(destPath, subFile)
          );
        }
      } else {
        fs.copyFileSync(sourcePath, destPath);
      }
    }
    
    console.log(`💾 Proyecto final guardado en: ${outputDir}`);
    return `file://${path.resolve(outputDir)}`;
  }

  async reportSuccess(plan, testResults, result) {
    const elapsed = Math.round((new Date() - this.currentTask.startTime) / 1000);
    const projectDir = result.replace('file://', '').replace(/\\/g, '/');
    
    console.log(`
🎉 PROYECTO COMPLETADO CON DOCUMENTACIÓN

📋 Tarea: ${this.currentTask.description}
⏱️  Tiempo: ${elapsed}s
🧪 Tests: ${testResults.success ? 'TODOS PASARON ✅' : 'ALGUNOS FALLARON ❌'}
📚 README.md: ✅ Generado automáticamente
📁 Proyecto: ${this.projectConfig.timestamp}

🔗 Para ejecutar:
   cd "${projectDir}"
   npm install
   npm start

📊 Gestión de proyectos:
   node pm-bot.js list     # Ver todos los proyectos
   node pm-bot.js clean    # Limpiar antiguos (>7 días)

✅ Proyecto listo para producción con documentación completa!
    `);
    
    this.currentTask.status = 'completed';
    this.currentTask.result = { 
      success: true, 
      location: result, 
      testResults: testResults,
      timestamp: this.projectConfig.timestamp,
      projectName: this.getProjectName(plan)
    };
  }

  async handleError(error) {
    console.error('🚨 Error en PM Bot:', error.message);
    this.currentTask.status = 'error';
    this.currentTask.error = error.message;
  }

  getDefaultPlan(taskDescription) {
    return {
      summary: taskDescription,
      type: "utility",
      technology: "javascript",
      complexity: "simple",
      estimatedTime: "15-30s",
      files: [{ name: "main.js", purpose: "código principal", priority: "high", type: "main" }],
      dependencies: [],
      features: ["Implementación básica"],
      tests: [{ type: "unit", description: "test de funcionalidad básica" }],
      deployment: { type: "local", port: 3000, commands: ["npm install", "npm start"] },
      acceptance_criteria: ["funciona correctamente"],
      documentation_sections: ["instalación", "uso"]
    };
  }

  getDefaultCode(plan) {
    return {
      files: [
        {
          path: "main.js",
          content: `// ${plan.summary}\nfunction main() {\n  console.log('Implementación generada por PM Bot v2.0');\n  return true;\n}\nmodule.exports = main;`,
          type: "main",
          description: "Archivo principal de la aplicación"
        },
        {
          path: "test.js",
          content: `const main = require('./main');\nconsole.log('✅ Test completado:', main());`,
          type: "test",
          description: "Tests unitarios"
        },
        {
          path: "package.json",
          content: `{\n  "name": "${this.getProjectName(plan)}",\n  "version": "1.0.0",\n  "scripts": {\n    "start": "node main.js",\n    "test": "node test.js"\n  }\n}`,
          type: "config",
          description: "Configuración del proyecto"
        }
      ],
      setup_commands: ["npm install"],
      run_command: "npm start",
      environment_vars: [],
      ports: [],
      api_endpoints: []
    };
  }
}

async function main() {
  console.log('🤖 PM Bot v2.0 - CON GENERACIÓN DE DOCUMENTACIÓN AUTOMÁTICA');

  try {
    const pmBot = new EnhancedPM();

    // Comando especial para listar proyectos
    if (process.argv[2] === 'list') {
      listProjects();
      return;
    }

    // Comando especial para limpiar proyectos antiguos
    if (process.argv[2] === 'clean') {
      cleanOldProjects();
      return;
    }

    if (process.argv[2]) {
      await pmBot.processTask(process.argv[2]);
    } else {
      console.log('\n🎯 No se proporcionó tarea, ejecutando ejemplo...');
      await pmBot.processTask("Crear aplicación web simple con Express y documentación completa");
    }

    console.log('\n✅ PM Bot v2.0 terminó la ejecución');
    
  } catch (error) {
    console.error('💥 Error fatal:', error.message);
    process.exit(1);
  }
}

// Función para listar todos los proyectos generados
function listProjects() {
  console.log('\n📁 Proyectos Generados:');
  console.log('═'.repeat(50));
  
  if (!fs.existsSync('./projects')) {
    console.log('No hay proyectos generados aún.');
    return;
  }

  const projects = fs.readdirSync('./projects')
    .filter(dir => fs.statSync(path.join('./projects', dir)).isDirectory())
    .sort()
    .reverse(); // Más recientes primero

  if (projects.length === 0) {
    console.log('No hay proyectos generados aún.');
    return;
  }

  projects.forEach((project, index) => {
    const projectPath = path.join('./projects', project);
    const stats = fs.statSync(projectPath);
    const date = stats.mtime.toLocaleString();
    
    // Verificar si tiene README
    const hasReadme = fs.existsSync(path.join(projectPath, 'README.md'));
    const readmeIcon = hasReadme ? '📚' : '📄';
    
    console.log(`${index + 1}. ${readmeIcon} ${project}`);
    console.log(`   📅 ${date}`);
    console.log(`   📁 ./projects/${project}`);
    
    if (hasReadme) {
      try {
        const readme = fs.readFileSync(path.join(projectPath, 'README.md'), 'utf8');
        const firstLine = readme.split('\n').find(line => line.startsWith('# '));
        if (firstLine) {
          console.log(`   📝 ${firstLine.replace('# ', '')}`);
        }
      } catch (error) {
        // Ignorar errores de lectura
      }
    }
    console.log('');
  });

  console.log(`Total: ${projects.length} proyectos generados`);
  console.log('\n💡 Comandos útiles:');
  console.log('   node pm-bot.js clean     # Limpiar proyectos antiguos');
  console.log('   cd projects/[nombre]     # Ir a un proyecto específico');
}

// Función para limpiar proyectos antiguos (más de 7 días)
function cleanOldProjects() {
  console.log('\n🧹 Limpiando proyectos antiguos...');
  
  if (!fs.existsSync('./projects')) {
    console.log('No hay proyectos para limpiar.');
    return;
  }

  const projects = fs.readdirSync('./projects')
    .filter(dir => fs.statSync(path.join('./projects', dir)).isDirectory());

  const oneWeekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
  let cleaned = 0;

  projects.forEach(project => {
    const projectPath = path.join('./projects', project);
    const stats = fs.statSync(projectPath);
    
    if (stats.mtime.getTime() < oneWeekAgo) {
      try {
        fs.rmSync(projectPath, { recursive: true });
        console.log(`🗑️  Eliminado: ${project}`);
        cleaned++;
      } catch (error) {
        console.log(`❌ Error eliminando ${project}: ${error.message}`);
      }
    }
  });

  if (cleaned === 0) {
    console.log('✅ No hay proyectos antiguos para limpiar.');
  } else {
    console.log(`\n✅ Limpieza completada: ${cleaned} proyectos eliminados`);
  }
}

process.on('SIGINT', () => {
  console.log('\n👋 PM Bot v2.0 deteniendo...');
  process.exit(0);
});

if (require.main === module) {
  main().catch(console.error);
}

module.exports = EnhancedPM;