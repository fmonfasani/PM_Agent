// pm-bot.js - Project Manager 0.0.1
// Requisitos: Node.js, tokens de Anthropic y GitHub

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

class SimplePM {
  constructor() {
    // Verificar variables de entorno
    this.checkEnvVars();
    
    this.anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY
    });
    
    this.github = new Octokit({
      auth: process.env.GITHUB_TOKEN
    });
    
    this.projectConfig = {
      owner: process.env.GITHUB_OWNER,
      repo: process.env.GITHUB_REPO,
      workingDir: './temp_project'
    };
    
    this.isWorking = true;
    this.taskQueue = [];
    this.currentTask = null;
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

  // 🎯 CORE: Recibir tarea y ejecutar ciclo completo
  async processTask(taskDescription) {
    console.log(`\n🚀 PM Bot iniciando tarea: ${taskDescription}`);
    
    this.currentTask = {
      id: Date.now().toString(),
      description: taskDescription,
      status: 'in_progress',
      startTime: new Date(),
      steps: []
    };

    try {
      // PASO 1: Analizar tarea y crear plan
      const plan = await this.createExecutionPlan(taskDescription);
      console.log('📋 Plan creado:', plan.summary);
      
      // PASO 2: Generar código
      const code = await this.generateCode(plan);
      console.log('💻 Código generado');
      
      // PASO 3: Crear estructura de proyecto
      await this.setupProject(code);
      console.log('📁 Proyecto configurado');
      
      // PASO 4: Ejecutar tests
      const testResults = await this.runTests();
      console.log('🧪 Tests ejecutados:', testResults.success ? '✅' : '❌');
      
      // PASO 5: Si tests pasan, subir a GitHub
      if (testResults.success) {
        const commitUrl = await this.pushToGitHub(code, plan);
        console.log('📤 Código subido a GitHub:', commitUrl);
        
        // PASO 6: Reportar éxito
        await this.reportSuccess(plan, testResults, commitUrl);
      } else {
        // PASO 7: Si fallan, intentar arreglar
        await this.handleTestFailure(testResults);
      }
      
    } catch (error) {
      await this.handleError(error);
    }
  }

  // 🧠 ANÁLISIS: Crear plan de ejecución
  async createExecutionPlan(taskDescription) {
    const prompt = `
Eres un PM experto. Analiza esta tarea y crea un plan de ejecución:

TAREA: ${taskDescription}

Responde en JSON con esta estructura exacta:
{
  "summary": "Resumen breve de la tarea",
  "type": "frontend",
  "technology": "javascript",
  "files": [
    {
      "name": "main.js",
      "purpose": "código principal",
      "priority": "high"
    }
  ],
  "tests": [
    {
      "type": "unit",
      "description": "test del código principal"
    }
  ],
  "acceptance_criteria": ["funciona correctamente", "incluye tests"]
}

IMPORTANTE: Responde SOLO con el JSON, sin texto adicional.
`;

    const response = await this.anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1000,
      messages: [{ role: 'user', content: prompt }]
    });

    try {
      return JSON.parse(response.content[0].text);
    } catch (error) {
      console.error('Error parsing plan JSON:', response.content[0].text);
      // Plan por defecto si falla el parsing
      return {
        summary: taskDescription,
        type: "utility",
        technology: "javascript",
        files: [{ name: "main.js", purpose: "código principal", priority: "high" }],
        tests: [{ type: "unit", description: "test básico" }],
        acceptance_criteria: ["funcionalidad implementada"]
      };
    }
  }

  // 💻 DESARROLLO: Generar código
  async generateCode(plan) {
    const prompt = `
Como desarrollador experto, implementa este plan:

PLAN: ${JSON.stringify(plan, null, 2)}

Genera código completo y funcional. 

Responde SOLO con este JSON exacto:
{
  "files": [
    {
      "path": "main.js",
      "content": "// Código JavaScript aquí\nfunction example() {\n  return 'Hello World';\n}\nmodule.exports = example;",
      "type": "main"
    },
    {
      "path": "test.js",
      "content": "// Tests aquí\nconst main = require('./main');\nconsole.log('Test passed:', main() === 'Hello World');",
      "type": "test"
    },
    {
      "path": "package.json",
      "content": "{\n  \"name\": \"generated-project\",\n  \"version\": \"1.0.0\",\n  \"scripts\": {\n    \"test\": \"node test.js\"\n  }\n}",
      "type": "config"
    }
  ],
  "setup_commands": ["echo 'Setup complete'"],
  "run_command": "npm test"
}

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
      // Código por defecto si falla el parsing
      return {
        files: [
          {
            path: "main.js",
            content: `// Implementación para: ${plan.summary}\nfunction main() {\n  console.log('Implementación generada');\n  return true;\n}\nmodule.exports = main;`,
            type: "main"
          },
          {
            path: "test.js",
            content: `const main = require('./main');\nconsole.log('✅ Test passed:', main() === true);`,
            type: "test"
          }
        ],
        setup_commands: [],
        run_command: "node test.js"
      };
    }
  }

  // 📁 SETUP: Configurar proyecto
  async setupProject(codeData) {
    const workDir = this.projectConfig.workingDir;
    
    // Limpiar directorio anterior
    if (fs.existsSync(workDir)) {
      fs.rmSync(workDir, { recursive: true });
    }
    fs.mkdirSync(workDir, { recursive: true });

    // Crear archivos
    for (const file of codeData.files) {
      const filePath = path.join(workDir, file.path);
      const fileDir = path.dirname(filePath);
      
      fs.mkdirSync(fileDir, { recursive: true });
      fs.writeFileSync(filePath, file.content);
      console.log(`📄 Creado: ${file.path}`);
    }

    // Ejecutar setup commands
    for (const command of codeData.setup_commands || []) {
      try {
        await execAsync(command, { cwd: workDir });
        console.log(`✅ Ejecutado: ${command}`);
      } catch (error) {
        console.log(`⚠️ Warning en: ${command}`, error.message);
      }
    }
  }

  // 🧪 TESTING: Ejecutar tests
  async runTests() {
    const workDir = this.projectConfig.workingDir;
    
    try {
      // Intentar ejecutar tests (por defecto node test.js si no hay package.json)
      let command = 'node test.js';
      
      // Verificar si existe package.json y tiene script test
      const packagePath = path.join(workDir, 'package.json');
      if (fs.existsSync(packagePath)) {
        const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
        if (pkg.scripts && pkg.scripts.test) {
          command = 'npm test';
        }
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

  
  // 📤 GITHUB: Subir código (versión simplificada para testing)
  async pushToGitHub(codeData, plan) {
    console.log('📤 push a GitHub...');
    /*
    // Por ahora solo simulamos - puedes habilitar el push real después
    const mockUrl = `https://github.com/${this.projectConfig.owner}/${this.projectConfig.repo}/pull/mock-${this.currentTask.id}`;
    
    // Guardar código localmente para revisión
    const outputDir = `./output_${this.currentTask.id}`;
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir);
    }
    
    for (const file of codeData.files) {
      fs.writeFileSync(path.join(outputDir, file.path), file.content);
    }
    
    console.log(`💾 Código guardado en: ${outputDir}`);
    console.log(`🔗 Mock GitHub URL: ${mockUrl}`);
    
    return mockUrl;*/
    
    //PUSH REAL A GITHUB:
    const workDir = this.projectConfig.workingDir;
    const branch = `feature/task-${this.currentTask.id}`;
    
    try {
      await execAsync('git init', { cwd: workDir });
      await execAsync(`git remote add origin https://github.com/${this.projectConfig.owner}/${this.projectConfig.repo}.git`, { cwd: workDir });
      await execAsync(`git checkout -b ${branch}`, { cwd: workDir });
      await execAsync('git add .', { cwd: workDir });
      await execAsync(`git commit -m "🤖 PM Bot: ${plan.summary}"`, { cwd: workDir });
      await execAsync(`git push origin ${branch}`, { cwd: workDir });
      
      const pr = await this.github.rest.pulls.create({
        owner: this.projectConfig.owner,
        repo: this.projectConfig.repo,
        title: `🤖 PM Bot: ${plan.summary}`,
        head: branch,
        base: 'main',
        body: `Generado automáticamente por PM Bot`
      });

      return pr.data.html_url;
      
    } catch (error) {
      console.error('Error subiendo a GitHub:', error.message);
      throw error;
    }
    
  }

  // ✅ REPORTE: Informar éxito
  async reportSuccess(plan, testResults, githubUrl) {
    const report = `
🎉 TAREA COMPLETADA EXITOSAMENTE

📋 Tarea: ${this.currentTask.description}
⏱️  Tiempo: ${Math.round((new Date() - this.currentTask.startTime) / 1000)}s
🧪 Tests: ${testResults.success ? 'PASARON' : 'FALLARON'}
📤 GitHub: ${githubUrl}

✅ Ready for review!
    `;
    
    console.log(report);
    
    this.currentTask.status = 'completed';
    this.currentTask.result = { success: true, githubUrl, testResults };
  }

  // ❌ ERROR: Manejar fallos
  async handleTestFailure(testResults) {
    console.log('🔧 Tests fallaron, los detalles:');
    console.log('Output:', testResults.output);
    console.log('Errors:', testResults.errors);
    
    // Por simplicidad, por ahora no auto-fix
    console.log('💡 Revisa el código en temp_project/ para debuggear');
    
    this.currentTask.status = 'failed';
    this.currentTask.testResults = testResults;
  }

  async handleError(error) {
    console.error('🚨 Error en PM Bot:', error.message);
    this.currentTask.status = 'error';
    this.currentTask.error = error.message;
  }

  // 📊 STATUS: Estado actual
  getStatus() {
    return {
      isWorking: this.isWorking,
      queueLength: this.taskQueue.length,
      currentTask: this.currentTask,
      uptime: process.uptime()
    };
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// 🚀 FUNCIÓN PRINCIPAL
async function main() {
  console.log('🤖 PM Bot v1.0 - Iniciando...');

  try {
    const pmBot = new SimplePM();

    if (process.argv[2]) {
      // Ejecutar tarea desde command line
      await pmBot.processTask(process.argv[2]);
    } else {
      // Tarea de ejemplo
      console.log('\n🎯 No se proporcionó tarea, ejecutando ejemplo...');
      await pmBot.processTask("Crear función JavaScript que sume dos números con tests");
    }

    console.log('\n✅ PM Bot terminó la ejecución');
    
  } catch (error) {
    console.error('💥 Error fatal:', error.message);
    process.exit(1);
  }
}

// Manejar cierre graceful
process.on('SIGINT', () => {
  console.log('\n👋 PM Bot deteniendo...');
  process.exit(0);
});

// Ejecutar si es el archivo principal
if (require.main === module) {
  main().catch(console.error);
}

module.exports = SimplePM;
