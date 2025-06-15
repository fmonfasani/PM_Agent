/**
 * Suma dos números
 * @param {number} a - Primer número
 * @param {number} b - Segundo número
 * @returns {number} La suma de los dos números
 * @throws {Error} Si los parámetros no son números
 */
function sum(a, b) {
  if (typeof a !== 'number' || typeof b !== 'number') {
    throw new Error('Los parámetros deben ser números');
  }
  return a + b;
}

module.exports = sum;