const sum = require('./sum');

function runTests() {
  console.log('Ejecutando tests...');

  // Test 1: Suma correcta
  try {
    const result = sum(2, 3);
    console.log('Test 1:', result === 5 ? 'PASS' : 'FAIL');
  } catch (e) {
    console.log('Test 1: FAIL', e.message);
  }

  // Test 2: Parámetros inválidos
  try {
    sum('2', 3);
    console.log('Test 2: FAIL');
  } catch (e) {
    console.log('Test 2: PASS');
  }
}

runTests();