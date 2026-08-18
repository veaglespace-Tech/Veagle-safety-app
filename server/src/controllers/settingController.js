import { prisma } from '../config/prisma.js';

export const getSettings = async (req, res) => {
  try {
    const { keys } = req.query; // optional comma-separated list of keys
    
    let whereClause = {};
    if (keys) {
      const keyArray = keys.split(',').map((k) => k.trim());
      whereClause = { key: { in: keyArray } };
    }

    const settings = await prisma.systemSetting.findMany({
      where: whereClause
    });

    // Parse JSON strings back to objects for the client
    const formattedSettings = {};
    settings.forEach(setting => {
      try {
        formattedSettings[setting.key] = JSON.parse(setting.value);
      } catch (e) {
        // If not valid JSON, just return string
        formattedSettings[setting.key] = setting.value;
      }
    });

    res.status(200).json({
      success: true,
      data: formattedSettings
    });
  } catch (error) {
    console.error('Error in getSettings:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch settings' });
  }
};

export const updateSettings = async (req, res) => {
  try {
    const { settings } = req.body; 
    // settings should be an object of key-value pairs, e.g., { SUPPORT_EMAIL: "foo@bar.com", GALLERY_ITEMS: [...] }
    
    if (!settings || typeof settings !== 'object') {
      return res.status(400).json({ success: false, message: 'Invalid settings payload' });
    }

    const updatePromises = Object.entries(settings).map(async ([key, value]) => {
      const stringValue = typeof value === 'object' ? JSON.stringify(value) : String(value);
      return prisma.systemSetting.upsert({
        where: { key },
        update: { value: stringValue },
        create: { key, value: stringValue }
      });
    });

    await Promise.all(updatePromises);

    res.status(200).json({ success: true, message: 'Settings updated successfully' });
  } catch (error) {
    console.error('Error in updateSettings:', error);
    res.status(500).json({ success: false, message: 'Failed to update settings' });
  }
};
