/**
 * Helper to trigger immediate WhatsApp emergency navigation when SOS is activated.
 * Launches WhatsApp without unloading the main web app tab, ensuring the siren audio continues playing.
 */
export const openWhatsAppSosEmergency = ({
  latitude,
  longitude,
  publicShareToken,
  emergencyContactPhone,
  userName,
} = {}) => {
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

  const lat = latitude;
  const lng = longitude;
  const mapLink = `https://www.google.com/maps?q=${lat},${lng}`;
  const trackingLink = publicShareToken
    ? `${window.location.origin}/live-track/${publicShareToken}`
    : mapLink;
  const nameStr = name ? `${name}` : 'Sakhi Member';

  const messageText =
    `🚨 EMERGENCY SOS ALERT! 🚨\n\n` +
    `I (${nameStr}) am in danger and need IMMEDIATE help!\n\n` +
    `📍 My Live GPS Location:\n${mapLink}\n\n` +
    `🔗 Live Tracking Link:\n${trackingLink}\n\n` +
    `Please check my location and send help immediately!`;

  const encodedMsg = encodeURIComponent(messageText);

  let whatsappUrl = `https://api.whatsapp.com/send?text=${encodedMsg}`;
  let whatsappDeepLink = `whatsapp://send?text=${encodedMsg}`;

  if (phone) {
    const cleanPhone = String(phone).replace(/\D/g, '');
    if (cleanPhone.length >= 10) {
      const fullPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
      whatsappUrl = `https://wa.me/${fullPhone}?text=${encodedMsg}`;
      whatsappDeepLink = `whatsapp://send?phone=${fullPhone}&text=${encodedMsg}`;
    }
  }

  // 1. Try launching native WhatsApp app directly on mobile devices using deep link iframe
  try {
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    iframe.src = whatsappDeepLink;
    document.body.appendChild(iframe);
    setTimeout(() => {
      try {
        document.body.removeChild(iframe);
      } catch (e) {}
    }, 2000);
  } catch (e) {}

  // 2. Open WhatsApp Web / App link in a new window/tab so web app tab stays open playing siren
  try {
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
  } catch (e) {}

  // 3. Open Phone Dialer with 112 (Emergency Police)
  setTimeout(() => {
    try {
      window.location.href = 'tel:112';
    } catch (e) {}
  }, 1000); // 1-second delay so WhatsApp registers first
};
