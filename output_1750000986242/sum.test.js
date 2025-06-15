const sum = require('./sum');

function runTests() {
  console.log('Running tests...');

  // Test positive numbers
  console.assert(sum(2, 3) === 5, 'Should sum positive numbers');

  // Test negative numbers
  console.assert(sum(-2, -3) === -5, 'Should sum negative numbers');
  console.assert(sum(-2, 3) === 1, 'Should sum mixed numbers');

  // Test invalid input
  try {
    sum('2', 3);
    console.assert(false, 'Should throw error for non-number input');
  } catch (e) {
    console.assert(e.message === 'Parameters must be numbers', 'Should validate number type');
  }

  console.log('All tests passed!');
}

runTests();