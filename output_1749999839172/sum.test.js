const sum = require('./sum');

function runTests() {
  // Test números positivos
  console.assert(sum(2, 3) === 5, 'Suma de positivos fallida');

  // Test números negativos
  console.assert(sum(-2, -3) === -5, 'Suma de negativos fallida');

  // Test parámetros inválidos
  try {
    sum('2', 3);
    console.assert(false, 'Debería fallar con string');
  } catch (e) {
    console.assert(e.message === 'Los parámetros deben ser números', 'Error mensaje incorrecto');
  }

  console.log('Todos los tests pasaron!');
}

runTests();