const db = require('../config/db');

async function syncDeliveries() {
  try {
    console.log('Starting synchronization of cancelled deliveries...');
    
    // Find inconsistent records
    const [inconsistent] = await db.query(`
      SELECT d.id, d.order_id, d.status as delivery_status, o.order_status
      FROM deliveries d
      JOIN orders o ON d.order_id = o.id
      WHERE o.order_status = 'cancelled' AND d.status != 'cancelled'
    `);

    if (inconsistent.length === 0) {
      console.log('No inconsistent records found. Everything is in sync.');
    } else {
      console.log(`Found ${inconsistent.length} inconsistent delivery records. Updating...`);
      
      for (const record of inconsistent) {
        console.log(`Fixing delivery ID ${record.id} for cancelled order ID ${record.order_id} (current status: ${record.delivery_status})`);
        
        await db.query(`
          UPDATE deliveries 
          SET status = 'cancelled', updated_at = NOW() 
          WHERE id = ?
        `, [record.id]);
      }
      console.log('Synchronization complete.');
    }

  } catch (error) {
    console.error('Error during synchronization:', error);
  } finally {
    process.exit(0);
  }
}

syncDeliveries();
