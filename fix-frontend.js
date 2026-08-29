const fs = require('fs');
const files = [
  'client/src/pages/admin/AdminCategoriesPage.jsx',
  'client/src/pages/admin/AdminProductsPage.jsx',
  'client/src/pages/admin/AdminProductForm.jsx'
];
for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/\\\`/g, '`');
  content = content.replace(/\\\${/g, '${');
  fs.writeFileSync(file, content);
}
console.log('Fixed frontend files');
