/**
 * Helper to trigger immediate WhatsApp emergency navigation when SOS is activated.
 * Formats emergency message with Google Maps GPS pin and Live tracking link.
 */
export const openWhatsAppSosEmergency = ({ latitude, longitude, publicShareToken, emergencyContactPhone, userName } = {}) => {
  if (typeof window === 'undefined') return;

  let phone = emergencyContactPhone;
  let name = userName;

  if (!phone || !name) {
    try {
      const storedUserRaw = localStorage.getItem('tichi_user');
      if (storedUserRaw) {
        const storedUser = JSON.parse(storedUserRaw);
        if (!phone) phone = storedUser?.emergencyContactPhone || storedUser?.phone;
        if (!name) name = storedUser?.fullName;
      }
    } catch (e) {}
  }

  const lat = latitude || 18.5204;
  const lng = longitude || 73.8567;
  const mapLink = `https://www.google.com/maps?q=${lat},${lng}`;
  const trackingLink = publicShareToken ? `${window.location.origin}/live-track/${publicShareToken}` : mapLink;
  const nameStr = name ? `${name}` : 'Sakhi Member';

  const messageText = 
    `🚨 EMERGENCY SOS ALERT! 🚨\n\n` +
    `I (${nameStr}) am in danger and need IMMEDIATE help!\n\n` +
    `📍 My Live GPS Location:\n${mapLink}\n\n` +
    `🔗 Live Tracking Link:\n${trackingLink}\n\n` +
    `Please check my location and send help immediately!`;

  const encodedMsg = encodeURIComponent(messageText);

  let whatsappUrl = `https://api.whatsapp.com/send?text=${encodedMsg}`;

  if (phone) {
    const cleanPhone = String(phone).replace(/\D/g, '');
    if (cleanPhone.length >= 10) {
      const fullPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
      whatsappUrl = `https://wa.me/${fullPhone}?text=${encodedMsg}`;
    }
  }

  // Open WhatsApp in new tab / native app directly
  window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
};
