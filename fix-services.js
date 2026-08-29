const fs = require('fs');
const files = [
  'server/services/orderService.js',
  'server/services/orderEventService.js'
];
for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/\\\`/g, '`');
  content = content.replace(/\\\${/g, '${');
  fs.writeFileSync(file, content);
}
console.log('Fixed services');
