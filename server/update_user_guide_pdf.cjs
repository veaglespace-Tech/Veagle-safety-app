const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const guideHtmlPath = path.join(__dirname, '..', 'Veagle_Safety_User_Guide.html');
let content = fs.readFileSync(guideHtmlPath, 'utf8');

// Update support phone numbers everywhere in User Guide
content = content.replace(/\+91 92252 41608/g, '+91 82379 99101 / +91 92252 41608');
content = content.replace(/9225241608/g, '8237999101');

// Update Page 10 to include the official poster image as a visual companion
const page10FooterMarker = '<div class="doc-footer">';
const p10Idx = content.lastIndexOf(page10FooterMarker);

if (p10Idx !== -1) {
  const posterSection = `
      <div style="margin-top: 18px; text-align: center; background: white; border: 1px solid var(--border-color); border-radius: 12px; padding: 14px;">
        <h3 style="font-size: 0.95rem; color: var(--primary); margin-bottom: 8px;">📢 अधिकृत सखी सुरक्षा माहिती पत्रक (Official Campaign Poster)</h3>
        <p style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 12px;">कॉलेज कॅम्पस, हॉस्टेल आणि कॉर्पोरेट नोटीस बोर्डावर लावण्यासाठी अधिकृत क्यूआर कोडसह पोस्टर:</p>
        <img src="Images/sakhi_suraksha_poster.jpg" alt="Official Sakhi Suraksha Poster" style="max-height: 280px; width: auto; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); margin: 0 auto; display: block;">
      </div>
  `;
  content = content.substring(0, p10Idx) + posterSection + '\n' + content.substring(p10Idx);
}

fs.writeFileSync(guideHtmlPath, content, 'utf8');
console.log('Successfully updated Veagle_Safety_User_Guide.html!');

// Now run headless edge
try {
  const pdfPath = path.join(__dirname, '..', 'Veagle_Safety_User_Guide.pdf');
  const cmd = `msedge --headless --disable-gpu --print-to-pdf="${pdfPath}" "${guideHtmlPath}"`;
  execSync(cmd);
  console.log('Successfully re-rendered Veagle_Safety_User_Guide.pdf!');
} catch (e) {
  console.error('Error re-rendering PDF:', e.message);
}
