const fs = require('fs');
const files = [
  'client/src/pages/admin/AdminInventoryPage.jsx',
  'client/src/pages/admin/components/InventoryAdjustmentModal.jsx',
  'client/src/pages/admin/components/InventoryHistoryModal.jsx'
];
for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/\\\`/g, '`');
  content = content.replace(/\\\${/g, '${');
  fs.writeFileSync(file, content);
}
console.log('Fixed inventory frontend files');
