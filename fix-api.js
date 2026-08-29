const fs = require('fs');
const files = [
  'client/src/services/admin/adminProductsApi.js',
  'client/src/services/admin/adminCategoriesApi.js'
];
for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/\\\`/g, '`');
  content = content.replace(/\\\${/g, '${');
  fs.writeFileSync(file, content);
}
console.log('Fixed API files');
