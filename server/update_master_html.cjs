const fs = require('fs');
const path = require('path');

const htmlPath = path.join(__dirname, '..', 'Veagle_Safety_Master_Deck.html');
let content = fs.readFileSync(htmlPath, 'utf8');

// Replace total count
content = content.replace(/of 16/g, 'of 15');

// Find start of SLIDE 11 and end of SLIDE 12 (start of SLIDE 13)
const slide11Marker = '<!-- SLIDE 11 -->';
const slide13Marker = '<!-- SLIDE 13 -->';

const idx11 = content.indexOf(slide11Marker);
const idx13 = content.indexOf(slide13Marker);

if (idx11 === -1 || idx13 === -1) {
  console.error('Could not find slide markers!');
  process.exit(1);
}

const newSlide11 = `<!-- SLIDE 11 -->
    <section class="slide" id="slide-11">
      <div>
        <div class="slide-header">
          <div class="brand-logo"><div class="shield-icon">🛡️</div><span>VEAGLE SAFETY</span></div>
          <span class="slide-badge">Step 9: Crisis Screen & 112</span>
        </div>
        <h1 class="slide-title">Step 9: Active Crisis Command Screen & 112 Police Helpline</h1>
        <p class="slide-subtitle">Page 11: Real-Time Incident Telemetry, Embedded Leaflet Map & 112 Police Dialer</p>
        <div class="content-split">
          <div class="card">
            <h2 class="card-title" style="color: #f87171;">Tactical Incident Control & Police Assistance</h2>
            <ul class="bullet-list">
              <li><strong>Live Accuracy Telemetry:</strong> Displays real-time GPS accuracy (±7.0m), contacts notified status, and incident duration clock.</li>
              <li><strong>Leaflet Map Stream:</strong> Interactive OpenStreetMap with Satellite and Lock Target camera follow.</li>
              <li><strong>Pre-Configured 1-Tap 112 Dialer:</strong> Instant dialer connecting directly to National Emergency Response Support System (112) with on-screen street name.</li>
              <li><strong>Direct WhatsApp Buttons:</strong> One-touch individual WhatsApp dispatch buttons ("Send to Abhijeet", "Send to Rushi").</li>
              <li><strong>"I'M SAFE NOW" Resolution:</strong> Safely disarms the alert with PIN verification and notifies guardians that the crisis has passed.</li>
            </ul>
          </div>
          <div class="mockup-container">
            <div class="phone-mockup"><img src="Images/User/17.jpeg" alt="Active Crisis Command Screen"></div>
            <div class="phone-mockup"><img src="Images/User/9.jpeg" alt="112 Emergency Dialer"></div>
          </div>
        </div>
      </div>
      <div class="slide-footer"><span>Veagle Safety Ecosystem • Slide 11 of 15</span><span>User Flow: Step 9</span></div>
    </section>

    `;

// Replace from idx11 to idx13 with newSlide11
content = content.substring(0, idx11) + newSlide11 + content.substring(idx13);

// Now renumber slides 13, 14, 15, 16 -> 12, 13, 14, 15
content = content.replace('<!-- SLIDE 13 -->', '<!-- SLIDE 12 -->');
content = content.replace('id="slide-13"', 'id="slide-12"');
content = content.replace('Step 11: Guardian Hub', 'Step 10: Guardian Hub');
content = content.replace('Step 11: Guardian Hub – Zero-Code Auto-Link & Panic Alarm', 'Step 10: Guardian Hub – Zero-Code Auto-Link & Panic Alarm');
content = content.replace('Page 13 & 14: Guardian Login', 'Page 12: Guardian Login');
content = content.replace('Slide 13 of 15', 'Slide 12 of 15');
content = content.replace('Guardian Flow: Step 11', 'Guardian Flow: Step 10');

content = content.replace('<!-- SLIDE 14 -->', '<!-- SLIDE 13 -->');
content = content.replace('id="slide-14"', 'id="slide-13"');
content = content.replace('Step 12: 60fps Live Leaflet Map', 'Step 11: Tactical 60fps Live Leaflet Map');
content = content.replace('Step 12: Tactical 60fps Live Leaflet Map & Turn-by-Turn GPS Navigation', 'Step 11: Tactical 60fps Live Leaflet Map & Turn-by-Turn GPS');
content = content.replace('Page 15 & 16: Tactical Live Incident', 'Page 13: Tactical Live Incident');
content = content.replace('Slide 14 of 15', 'Slide 13 of 15');
content = content.replace('Guardian Flow: Step 12', 'Guardian Flow: Step 11');

content = content.replace('<!-- SLIDE 15 -->', '<!-- SLIDE 14 -->');
content = content.replace('id="slide-15"', 'id="slide-14"');
content = content.replace('Slide 15 of 15', 'Slide 14 of 15');

content = content.replace('<!-- SLIDE 16 -->', '<!-- SLIDE 15 -->');
content = content.replace('id="slide-16"', 'id="slide-15"');
content = content.replace('Slide 16 of 15', 'Slide 15 of 15');

fs.writeFileSync(htmlPath, content, 'utf8');
console.log('Successfully updated Veagle_Safety_Master_Deck.html to 15 clean slides!');
