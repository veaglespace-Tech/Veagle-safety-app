const fs = require('fs');
const path = require('path');

const htmlPath = path.join(__dirname, '..', 'Veagle_Safety_Master_Deck.html');
let content = fs.readFileSync(htmlPath, 'utf8');

// Ensure all "Slide X of 15" become "Slide X of 16"
content = content.replace(/of 15/g, 'of 16');

// Update totalSlides in JS
content = content.replace(/totalSlides = 15/g, 'totalSlides = 16');

// Check if SLIDE 16 already exists
if (!content.includes('id="slide-16"')) {
  const slide16Html = `
    <!-- SLIDE 16 -->
    <section class="slide" id="slide-16">
      <div>
        <div class="slide-header">
          <div class="brand-logo"><div class="shield-icon">🛡️</div><span>VEAGLE SAFETY (सखी सुरक्षा)</span></div>
          <span class="slide-badge">Appreciation & Partnership</span>
        </div>
        <h1 class="slide-title">Thank You! Together We Can Build a Safer Tomorrow</h1>
        <p class="slide-subtitle">A Safer Tomorrow Begins with You • Women's Safety Our Priority</p>
        <div class="content-split">
          <div class="card" style="display: flex; flex-direction: column; justify-content: space-between;">
            <div>
              <div style="font-size: 2.2rem; font-weight: 900; color: #fff; margin-bottom: 8px;">THANK YOU!</div>
              <p style="color: #38bdf8; font-size: 1.05rem; font-style: italic; margin-bottom: 16px;">
                "Together we can build a safer and stronger community for every woman. ♡"
              </p>
              <ul class="bullet-list">
                <li><strong>A Safer Tomorrow Begins with You:</strong> Sakhi Suraksha is designed to keep every woman safe, connected, and empowered across daily commutes and emergencies.</li>
                <li><strong>Easy Registration for All:</strong> Scan the QR code on the poster for instant digital onboarding of Individuals (Women & Girls) and Institutes (Schools, Colleges, Corporates).</li>
                <li><strong>Referral Partner Opportunity:</strong> Join our mission as a campus or corporate ambassador to help protect more women across the community.</li>
                <li><strong>Comprehensive Safety Ecosystem:</strong> Instant 3-Sec SOS, 60fps Live Location Tracking, 5 Guardians Connection, Zero-Net SIM SMS, and 24/7 Police 112 Helpline.</li>
              </ul>
            </div>
            <div style="background: rgba(16, 185, 129, 0.15); border: 1px solid #10b981; border-radius: 10px; padding: 14px; margin-top: 16px;">
              <p style="color: #fff; font-size: 0.95rem; font-weight: 700; margin-bottom: 4px;">Need Support or Want More Services? Call / WhatsApp Us:</p>
              <p style="color: #34d399; font-size: 1.15rem; font-weight: 800; margin-bottom: 6px;">📞 +91 82379 99101  |  +91 92252 41608</p>
              <p style="color: #cbd5e1; font-size: 0.85rem;">🌐 <strong>Web Portal:</strong> https://sakhisuraksha.veaglespace.com &bull; 🏢 <strong>Veagle Space Technology Pvt. Ltd.</strong></p>
            </div>
          </div>
          <div class="mockup-container" style="justify-content: center;">
            <div class="phone-mockup" style="width: 330px; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
              <img src="Images/sakhi_suraksha_poster.jpg" alt="Sakhi Suraksha Official Poster" style="width: 100%; height: auto; display: block;">
            </div>
          </div>
        </div>
      </div>
      <div class="slide-footer"><span>Veagle Safety Ecosystem • Slide 16 of 16</span><span>Partnership & Appreciation</span></div>
    </section>
`;

  // Insert before <!-- Bottom Controller -->
  const marker = '<!-- Bottom Controller -->';
  content = content.replace(marker, slide16Html + '\n  ' + marker);
}

// Update Slide 1 text for QR and Universal login
content = content.replace(
  'Fast registration, medical vitals & 5 guardians',
  'Easy registration via Web/Poster QR, medical vitals & 5 guardians'
);
content = content.replace(
  '1-Scan QR login, battery whitelist & permissions',
  'Unified Universal Login (One Login for All Roles) & background permissions'
);

// Update Slide 4 bullets for QR
content = content.replace(
  'QR Handoff: Immediate QR code displayed to auto-login to the mobile app without typing credentials.',
  'Easy Registration via Web & Poster QR: Immediate QR registration for Individuals (Women & Girls) and Institutes (Schools, Colleges, Corporates).'
);

// Update Slide 5 bullets for Universal Login
content = content.replace(
  'One single app supports both Member Login and Parent/Guardian Portal.',
  'Unified Universal Login: One single login screen for all 4 roles (User, Parent, Organisation, Super Admin) with automatic dashboard routing.'
);

// Update phone number in Slide 15
content = content.replace(
  '+91 92252 41608',
  '+91 82379 99101 / +91 92252 41608'
);

fs.writeFileSync(htmlPath, content, 'utf8');
console.log('Successfully updated HTML deck with Slide 16 (Thank You + Poster Image)!');
