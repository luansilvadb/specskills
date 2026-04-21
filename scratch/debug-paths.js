
const path = require('path');
const fs = require('fs');

console.log('CWD:', process.cwd());
console.log('__dirname:', __dirname);
console.log('Compiled path:', path.join(__dirname, '..', '..', 'templates'));
