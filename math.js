// Simplified math.js subset for graphing
const math = {
  compile: function(expr) {
    const fn = function(x) {
      try {
        return evaluate(expr, {x: x});
      } catch(e) {
        throw new Error(`Error evaluating at x=${x}: ${e.message}`);
      }
    };
    fn.evaluate = fn;
    return fn;
  }
};

function evaluate(expr, scope) {
  // Remove whitespace
  expr = expr.replace(/\s+/g, '');
  
  // Handle parentheses
  while (expr.includes('(')) {
    expr = expr.replace(/\(([^()]+)\)/g, (match, inner) => evaluate(inner, scope));
  }
  
  // Handle exponents
  expr = expr.replace(/([\d.]+|x)\^([\d.]+|x)/g, (match, a, b) => 
    Math.pow(resolve(a, scope), resolve(b, scope)));
  
  // Handle multiplication/division
  expr = expr.replace(/([\d.]+|x)([*\/])([\d.]+|x)/g, (match, a, op, b) => 
    op === '*' ? resolve(a, scope) * resolve(b, scope) : resolve(a, scope) / resolve(b, scope));
  
  // Handle addition/subtraction
  expr = expr.replace(/([\d.]+|x)([+-])([\d.]+|x)/g, (match, a, op, b) => 
    op === '+' ? resolve(a, scope) + resolve(b, scope) : resolve(a, scope) - resolve(b, scope));
  
  // Handle functions
  const functions = {
    sin: Math.sin,
    cos: Math.cos,
    tan: Math.tan,
    sqrt: Math.sqrt,
    log: Math.log,
    abs: Math.abs,
    exp: Math.exp
  };
  
  for (const [fnName, fn] of Object.entries(functions)) {
    expr = expr.replace(new RegExp(`${fnName}\\(([^)]+)\\)`, 'g'), (match, inner) => 
      fn(evaluate(inner, scope)));
  }
  
  return resolve(expr, scope);
}

function resolve(token, scope) {
  if (token === 'x') return scope.x;
  if (token === 'e') return Math.E;
  if (token === 'pi') return Math.PI;
  const num = parseFloat(token);
  if (!isNaN(num)) return num;
  throw new Error(`Unknown token: ${token}`);
}