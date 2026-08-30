const pool = require('../config/db');

// GET /api/admin/settings
exports.getSettings = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT setting_key, setting_value, setting_group FROM settings');
    
    // Group settings by group for easier consumption on frontend
    const settings = rows.reduce((acc, row) => {
      acc[row.setting_key] = row.setting_value;
      return acc;
    }, {});

    res.json({
      success: true,
      data: settings
    });
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({ success: false, message: 'Server error fetching settings' });
  }
};

// PUT /api/admin/settings
// Expects body: { settings: [{ key: 'store_name', value: 'GLACE' }, ...] }
exports.updateSettings = async (req, res) => {
  const { settings } = req.body;

  if (!settings || !Array.isArray(settings)) {
    return res.status(422).json({ success: false, message: 'Invalid settings format. Expected array.' });
  }

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    for (const setting of settings) {
      if (!setting.key) continue;
      
      await connection.query(
        `INSERT INTO settings (setting_key, setting_value) 
         VALUES (?, ?) 
         ON DUPLICATE KEY UPDATE setting_value = ?`,
        [setting.key, setting.value, setting.value]
      );
    }

    await connection.commit();

    res.json({
      success: true,
      message: 'Settings updated successfully'
    });
  } catch (error) {
    await connection.rollback();
    console.error('Error updating settings:', error);
    res.status(500).json({ success: false, message: 'Server error updating settings' });
  } finally {
    connection.release();
  }
};
