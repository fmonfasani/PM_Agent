# 🚀 PM Bot - Funcionando en 30 minutos

## ⚡ Setup Inmediato (HOY)

### 1. 📋 Prerequisitos (5 minutos)
```bash
# Instalar Node.js si no lo tienes
# https://nodejs.org/ (versión 16+)

# Verificar instalación
node --version
npm --version
```

### 2. 🔧 Configuración del Proyecto (10 minutos)

```bash
# Crear directorio
mkdir pm-bot-minimal
cd pm-bot-minimal

# Crear package.json
cat > package.json << 'EOF'
{
  "name": "pm-bot-minimal",
  "version": "1.0.0",
  "description": "PM Bot que funciona HOY",
  "main": "pm-bot.js",
  "scripts": {
    "start": "node pm-bot.js",
    "task": "node pm-bot.js",
    "test": "echo 'PM Bot Test Suite' && exit 0"
  },
  "dependencies": {
    "@anthropic-ai/sdk": "^0.27.0",
    "@octokit/rest": "^20.0.0"
  },
  "engines": {
    "node": ">=16.0.0"
  }
}
EOF

# Instalar dependencias
npm install
```

### 3. 🔑 Configurar Tokens (5 minutos)

```bash
# Crear archivo .env
cat > .env << 'EOF'
# Anthropic API Key (https://console.anthropic.com/)
ANTHROPIC_API_KEY=your_anthropic_key_here

# GitHub Token (https://github.com/settings/tokens)
GITHUB_TOKEN=your_github_token_here

# Tu usuario y repo de GitHub
GITHUB_OWNER=your_github_username
GITHUB_REPO=your_test_repo_name
EOF

# Crear .gitignore
echo ".env" > .gitignore
echo "node_modules" >> .gitignore
echo "temp_project" >> .gitignore
```

### 4. 🎯 Obtener Tokens

#### Anthropic API Key:
1. Ve a https://console.anthropic.com/
2. Login/Register
3. Ve a "API Keys"
4. Crea nueva key
5. Copia y pega en `.env`

#### GitHub Token:
1. Ve a https://github.com/settings/tokens
2. "Generate new token (classic)"
3. Permisos: `repo`, `workflow`, `write:packages`
4. Copia y pega en `.env`

#### GitHub Repo:
1. Crea un repo nuevo en GitHub (ej: "pm-bot-test")
2. Actualiza `GITHUB_OWNER` y `GITHUB_REPO` en `.env`

### 5. 🚀 Ejecutar (5 minutos)

```bash
# Cargar variables de entorno
source .env  # En Linux/Mac
# o set en Windows

# Copiar el código PM_BOT.js del artifact anterior a pm-bot.js

# Ejecutar tarea única
node pm-bot.js "Crear función que calcule factorial con tests"

# O modo continuo
npm start
```

## 🎯 Ejemplos de Tareas para Probar HOY

```bash
# Tareas simples para testear
node pm-bot.js "Crear función JavaScript que valide emails"
node pm-bot.js "API REST simple con un endpoint /hello"
node pm-bot.js "Componente React de contador"
node pm-bot.js "Utilidad para convertir CSV a JSON"
node pm-bot.js "Función que ordene array de objetos por fecha"
```

## 📱 Modo API Simple (Opcional)

Si quieres controlarlo via HTTP:

```javascript
// api-server.js
const express = require('express');
const SimplePM = require('./pm-bot');

const app = express();
app.use(express.json());

const pmBot = new SimplePM();

app.post('/task', async (req, res) => {
  const { description } = req.body;
  pmBot.addTask(description);
  res.json({ success: true, message: 'Task added to queue' });
});

app.get('/status', (req, res) => {
  res.json(pmBot.getStatus());
});

app.listen(3000, () => {
  console.log('🌐 PM Bot API running on http://localhost:3000');
  pmBot.startContinuousOperation();
});
```

```bash
# Instalar express
npm install express

# Ejecutar API
node api-server.js

# Usar desde cualquier lugar
curl -X POST http://localhost:3000/task \
  -H "Content-Type: application/json" \
  -d '{"description": "Crear calculadora simple"}'
```

## 🔍 Verificación que Funciona

El PM Bot debería:
1. ✅ Analizar tu tarea
2. ✅ Generar código funcional
3. ✅ Crear tests automáticamente  
4. ✅ Ejecutar los tests
5. ✅ Subir a GitHub como PR
6. ✅ Reportar resultados

**Output esperado:**
```
🚀 PM Bot iniciando tarea: Crear función que calcule factorial con tests
📋 Plan creado: Implementar función factorial con validación y tests unitarios
💻 Código generado
📁 Proyecto configurado
✅ Ejecutado: npm install
🧪 Tests ejecutados: ✅
📤 Código subido a GitHub: https://github.com/user/repo/pull/123

🎉 TAREA COMPLETADA EXITOSAMENTE
```

## ⚠️ Troubleshooting

### Error: "ANTHROPIC_API_KEY not found"
```bash
# Verificar variables de entorno
echo $ANTHROPIC_API_KEY
# Debe mostrar tu key, no vacío
```

### Error: GitHub push failed
```bash
# Verificar permisos del token
# El token debe tener permisos: repo, workflow
```

### Tests fallan
```bash
# El bot intentará auto-fix automáticamente
# Revisa los logs para ver el proceso de corrección
```

## 🎯 ¿Funciona? ¡Evolución Inmediata!

Una vez que confirmes que funciona, podemos evolucionar HOY MISMO:

### Mejoras Inmediatas (misma tarde):
- ✅ Integrar con Slack para notificaciones
- ✅ Agregar más tipos de proyectos (React, API, CLI)
- ✅ Mejor system prompting para código más robusto
- ✅ Deploy automático a Vercel/Netlify

### Mejoras Semana 1:
- ✅ Sistema de colas Redis
- ✅ Múltiples agentes especializados
- ✅ Dashboard web para monitoreo
- ✅ Integración con Jira/Linear

## 🚀 ¡Ejecuta y Confirma!

```bash
# Todo en una sola línea
cd pm-bot-minimal && npm install && node pm-bot.js "Crear función que reverse strings con tests"
```

**¿Listo para probarlo?** Una vez que confirmes que funciona, podemos escalar inmediatamente a la versión completa con MCP, múltiples agentes, y operación 24/7.