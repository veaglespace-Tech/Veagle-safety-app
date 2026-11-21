const pptxgen = require('pptxgenjs');
const path = require('path');
const fs = require('fs');

async function createMasterDeck() {
  const pres = new pptxgen();
  
  // Exact 16:9 Widescreen layout (13.333 x 7.500 inches)
  pres.defineLayout({ name: 'WIDE_16x9', width: 13.333, height: 7.5 });
  pres.layout = 'WIDE_16x9';

  // Master Color Palette
  const BG_DARK = '0A0F1D';
  const CARD_BG = '131B2E';
  const CARD_BORDER = '23304A';
  const ACCENT_RED = 'EF4444';
  const ACCENT_BLUE = '3B82F6';
  const ACCENT_GREEN = '10B981';
  const ACCENT_PURPLE = '8B5CF6';
  const ACCENT_PINK = 'EC4899';
  const TEXT_WHITE = 'FFFFFF';
  const TEXT_MUTED = '94A3B8';
  const TEXT_LIGHT = 'E2E8F0';

  const imgBase = path.join(__dirname, '..', 'Images');

  // Master Header Helper
  function addSlideHeader(slide, title, category, slideNum, totalSlides = 16) {
    slide.background = { color: BG_DARK };

    // Top Category / Tag
    slide.addText(category.toUpperCase(), {
      x: 0.8,
      y: 0.45,
      w: 8.0,
      h: 0.3,
      fontSize: 10,
      bold: true,
      color: ACCENT_BLUE,
      charSpacing: 2,
    });

    // Main Slide Title
    slide.addText(title, {
      x: 0.8,
      y: 0.75,
      w: 9.0,
      h: 0.65,
      fontSize: 20,
      bold: true,
      color: TEXT_WHITE,
    });

    // Top Right Logo / Brand
    slide.addText('🛡️ SAKHI SURAKSHA', {
      x: 9.8,
      y: 0.45,
      w: 2.7,
      h: 0.3,
      fontSize: 11,
      bold: true,
      color: ACCENT_RED,
      align: 'right',
    });

    // Bottom Footer
    slide.addText('Veagle Safety (सखी सुरक्षा) • Official Enterprise & Institutional Master Deck', {
      x: 0.8,
      y: 6.85,
      w: 8.5,
      h: 0.3,
      fontSize: 9,
      color: TEXT_MUTED,
    });

    slide.addText(`Slide ${slideNum} of ${totalSlides}`, {
      x: 10.0,
      y: 6.85,
      w: 2.5,
      h: 0.3,
      fontSize: 9,
      color: TEXT_MUTED,
      align: 'right',
    });
  }

  // -------------------------------------------------------------
  // SLIDE 1: Master Title & Ecosystem Architecture
  // -------------------------------------------------------------
  {
    const slide = pres.addSlide();
    slide.background = { color: BG_DARK };

    // Badge
    slide.addShape(pres.ShapeType.roundRect, {
      x: 0.8, y: 0.8, w: 5.5, h: 0.45,
      fill: { color: '1E293B' }, line: { color: ACCENT_BLUE, width: 1 }, rectRadius: 0.2
    });
    slide.addText('🛡️ VEAGLE SPACE TECHNOLOGY • OFFICIAL PITCH DECK', {
      x: 0.9, y: 0.85, w: 5.3, h: 0.35,
      fontSize: 9.5, bold: true, color: ACCENT_BLUE, charSpacing: 1.5
    });

    // Main Title
    slide.addText('VEAGLE SAFETY\n(सखी सुरक्षा)', {
      x: 0.8, y: 1.4, w: 6.2, h: 1.5,
      fontSize: 34, bold: true, color: TEXT_WHITE
    });

    slide.addText('Technology for a Safer Tomorrow • Women\'s Safety Our Priority', {
      x: 0.8, y: 2.95, w: 6.2, h: 0.4,
      fontSize: 13, bold: true, color: ACCENT_RED
    });

    slide.addText('A holistic enterprise & campus safety ecosystem: Web Registration, Mobile Personal Safety, 3-Sec Offline SOS, and 60fps Guardian Live Tracking.', {
      x: 0.8, y: 3.4, w: 6.2, h: 0.5,
      fontSize: 10.5, color: TEXT_MUTED
    });

    // Workflow Card
    slide.addShape(pres.ShapeType.roundRect, {
      x: 0.8, y: 3.95, w: 6.2, h: 2.7,
      fill: { color: CARD_BG }, line: { color: CARD_BORDER, width: 1 }, rectRadius: 0.15
    });

    slide.addText('CORE 4-PILLAR ECOSYSTEM WORKFLOW:', {
      x: 1.0, y: 4.15, w: 5.8, h: 0.3,
      fontSize: 10, bold: true, color: ACCENT_GREEN
    });

    const bullets = [
      { text: 'Easy Registration: Web Portal & Poster QR code for Individuals & Institutes', options: { bullet: true, color: TEXT_LIGHT, fontSize: 11 } },
      { text: 'Universal Mobile App: One single login for all accounts (User, Parent, Org) with background permissions', options: { bullet: true, color: TEXT_LIGHT, fontSize: 11 } },
      { text: 'Proactive Commute Shield: Safe Journey virtual escort with 30s live breadcrumb trail & check-in timer', options: { bullet: true, color: TEXT_LIGHT, fontSize: 11 } },
      { text: 'Emergency Dispatch & Reassurance: Direct SIM SMS (Offline), WhatsApp & 60fps Leaflet tracking', options: { bullet: true, color: TEXT_LIGHT, fontSize: 11 } },
    ];
    slide.addText(bullets, { x: 1.0, y: 4.5, w: 5.8, h: 2.0, lineSpacingMultiple: 1.2 });

    const webImg = path.join(imgBase, 'registration', 'sakhisuraksha.veaglespace.com_.png');
    if (fs.existsSync(webImg)) {
      slide.addImage({
        path: webImg,
        x: 7.3, y: 1.55, w: 5.2, h: 5.0,
        sizing: { type: 'contain' }
      });
    }
  }

  // -------------------------------------------------------------
  // SLIDE 2: Real-World Commute & Duty of Care Challenge
  // -------------------------------------------------------------
  {
    const slide = pres.addSlide();
    addSlideHeader(slide, 'The Real-World Commute Dilemma & Corporate Duty of Care', 'Strategic Context', 2);

    const challenges = [
      {
        title: 'The "Last-Mile" Transit Dilemma',
        icon: '🚶‍♀️',
        desc: 'Over 78% of female students and night-shift employees report acute anxiety during transit through unlit alleys, transit hubs, and private cab rides.'
      },
      {
        title: 'The Silent Failsafe Gap',
        icon: '📵',
        desc: 'Conventional apps fail in basements, elevators, or spotty connectivity because they rely purely on 4G internet rather than cellular SIM hardware.'
      },
      {
        title: 'Institutional Statutory Liability',
        icon: '⚖️',
        desc: 'POSH Act compliance, state factory transport mandates, and UGC safety guidelines hold organizations accountable for off-site transit safety.'
      }
    ];

    challenges.forEach((item, idx) => {
      const cardX = 0.8 + idx * 4.0;
      slide.addShape(pres.ShapeType.roundRect, {
        x: cardX, y: 1.55, w: 3.7, h: 5.0,
        fill: { color: CARD_BG }, line: { color: CARD_BORDER, width: 1 }, rectRadius: 0.15
      });

      slide.addText(item.icon, { x: cardX + 0.3, y: 1.85, w: 1.0, h: 0.6, fontSize: 30 });
      slide.addText(item.title, { x: cardX + 0.3, y: 2.6, w: 3.1, h: 0.6, fontSize: 14, bold: true, color: TEXT_WHITE });
      slide.addText(item.desc, { x: cardX + 0.3, y: 3.3, w: 3.1, h: 2.8, fontSize: 11, color: TEXT_MUTED, lineSpacingMultiple: 1.3 });
    });
  }

  // -------------------------------------------------------------
  // SLIDE 3: [FLOW 1] Web Portal Landing Page
  // -------------------------------------------------------------
  {
    const slide = pres.addSlide();
    addSlideHeader(slide, 'Step 1: Web Portal – Centralized Access & Public Mission', 'User Flow: Step 1', 3);

    slide.addShape(pres.ShapeType.roundRect, {
      x: 0.8, y: 1.55, w: 6.2, h: 5.0,
      fill: { color: CARD_BG }, line: { color: CARD_BORDER, width: 1 }, rectRadius: 0.15
    });

    slide.addText('PAGE 1: PUBLIC LANDING PORTAL', {
      x: 1.1, y: 1.8, w: 5.6, h: 0.3,
      fontSize: 11, bold: true, color: ACCENT_BLUE
    });

    const bullets = [
      { text: 'High-Trust Institutional Branding: Professional public portal establishing the mission – "महिला सक्षमीकरण आणि अखंड सुरक्षिततेची खात्री".', options: { bullet: true, color: TEXT_LIGHT, fontSize: 11 } },
      { text: 'Zero Barriers to Entry: Instant "Get Started / Sign Up" buttons allowing direct student, employee, and guardian access without gatekeeping.', options: { bullet: true, color: TEXT_LIGHT, fontSize: 11 } },
      { text: 'Prominent Emergency Hotlines: One-touch emergency numbers for National Police (112) and Women Helpline (1091) prominently displayed.', options: { bullet: true, color: TEXT_LIGHT, fontSize: 11 } },
      { text: 'Dual-Role Support: Clear bifurcation between User Onboarding, Guardian Access, and Corporate/College Administrative oversight.', options: { bullet: true, color: TEXT_LIGHT, fontSize: 11 } }
    ];
    slide.addText(bullets, { x: 1.1, y: 2.2, w: 5.6, h: 4.1, lineSpacingMultiple: 1.3 });

    const web1 = path.join(imgBase, 'registration', 'sakhisuraksha.veaglespace.com_.png');
    const webAlt = path.join(imgBase, 'Web', '1.jpeg');
    const targetImg = fs.existsSync(web1) ? web1 : webAlt;
    if (fs.existsSync(targetImg)) {
      slide.addImage({ path: targetImg, x: 7.3, y: 1.55, w: 5.2, h: 5.0, sizing: { type: 'contain' } });
    }
  }

  // -------------------------------------------------------------
  // SLIDE 4: [FLOW 2] Web Registration & Emergency Profile Setup
  // -------------------------------------------------------------
  {
    const slide = pres.addSlide();
    addSlideHeader(slide, 'Step 2: Web Registration & Emergency Profile Onboarding', 'User Flow: Step 2', 4);

    slide.addShape(pres.ShapeType.roundRect, {
      x: 0.8, y: 1.55, w: 6.2, h: 5.0,
      fill: { color: CARD_BG }, line: { color: CARD_BORDER, width: 1 }, rectRadius: 0.15
    });

    slide.addText('PAGE 2 & 3: REGISTRATION & MEDICAL PROFILE', {
      x: 1.1, y: 1.8, w: 5.6, h: 0.3,
      fontSize: 11, bold: true, color: ACCENT_GREEN
    });

    const bullets = [
      { text: 'Easy Registration via Web & Poster QR: Instant QR code registration for Individuals (Women & Girls) and Institutes (Schools, Colleges, Corporates).', options: { bullet: true, color: TEXT_LIGHT, fontSize: 11 } },
      { text: 'Emergency Medical Vitals: Record Blood Group (A+, B+, O+, AB+), allergies, and trauma notes visible to emergency responders.', options: { bullet: true, color: TEXT_LIGHT, fontSize: 11 } },
      { text: 'Designating Up to 5 Guardians: Add Father, Mother, Spouse, Brother, or Local Guardians with primary contact ordering.', options: { bullet: true, color: TEXT_LIGHT, fontSize: 11 } },
      { text: 'Corporate / Institute Association: Link Employee ID, Corporate email, or Student Roll Number.', options: { bullet: true, color: TEXT_LIGHT, fontSize: 11 } },
      { text: 'Referral Partner Network: Community empowerment opportunity allowing campus ambassadors and HR to help more women stay protected.', options: { bullet: true, color: TEXT_LIGHT, fontSize: 11 } }
    ];
    slide.addText(bullets, { x: 1.1, y: 2.2, w: 5.6, h: 4.1, lineSpacingMultiple: 1.25 });

    const regImg = path.join(imgBase, 'registration', 'sakhisuraksha.veaglespace.com_auth_mode=register.png');
    if (fs.existsSync(regImg)) {
      slide.addImage({ path: regImg, x: 7.3, y: 1.55, w: 5.2, h: 5.0, sizing: { type: 'contain' } });
    }
  }

  // -------------------------------------------------------------
  // SLIDE 5: [FLOW 3] Mobile App Download & Unified Universal Login
  // -------------------------------------------------------------
  {
    const slide = pres.addSlide();
    addSlideHeader(slide, 'Step 3: Mobile App Activation & Transparent Privacy Setup', 'User Flow: Step 3', 5);

    slide.addShape(pres.ShapeType.roundRect, {
      x: 0.8, y: 1.55, w: 6.2, h: 5.0,
      fill: { color: CARD_BG }, line: { color: CARD_BORDER, width: 1 }, rectRadius: 0.15
    });

    slide.addText('PAGE 4 & 5: PERMISSIONS & TRUST GUARANTEE', {
      x: 1.1, y: 1.8, w: 5.6, h: 0.3,
      fontSize: 11, bold: true, color: ACCENT_BLUE
    });

    const bullets = [
      { text: 'Unified Universal Login: One single login screen for all 4 roles (User, Parent, Organisation, Super Admin). Credentials automatically route user to respective dashboard.', options: { bullet: true, color: TEXT_LIGHT, fontSize: 11 } },
      { text: 'Prominent Disclosure Screen: Certified by Google Play & Apple App Store. Explicitly clarifies why background location is required.', options: { bullet: true, color: TEXT_LIGHT, fontSize: 11 } },
      { text: 'Zero 24x7 Surveillance: Location is ONLY broadcasted during an active trip or SOS. Personal privacy is strictly respected outside emergencies.', options: { bullet: true, color: TEXT_LIGHT, fontSize: 11 } },
      { text: 'Battery Optimization Whitelist: Guides user to prevent aggressive OS battery cleaners (MIUI, Samsung, Vivo, Oppo) from killing the app in background.', options: { bullet: true, color: TEXT_LIGHT, fontSize: 11 } }
    ];
    slide.addText(bullets, { x: 1.1, y: 2.2, w: 5.6, h: 4.1, lineSpacingMultiple: 1.25 });

    const img1 = path.join(imgBase, 'User', '1.jpeg');
    const img2 = path.join(imgBase, 'User', '2.jpeg');
    if (fs.existsSync(img1)) {
      slide.addImage({ path: img1, x: 7.35, y: 1.55, w: 2.45, h: 5.0, sizing: { type: 'contain' } });
    }
    if (fs.existsSync(img2)) {
      slide.addImage({ path: img2, x: 10.05, y: 1.55, w: 2.45, h: 5.0, sizing: { type: 'contain' } });
    }
  }

  // -------------------------------------------------------------
  // SLIDE 6: [FLOW 4] Mobile Dashboard & Safety Readiness
  // -------------------------------------------------------------
  {
    const slide = pres.addSlide();
    addSlideHeader(slide, 'Step 4: Personal Safety Command Center & Readiness Check', 'User Flow: Step 4', 6);

    slide.addShape(pres.ShapeType.roundRect, {
      x: 0.8, y: 1.55, w: 6.2, h: 5.0,
      fill: { color: CARD_BG }, line: { color: CARD_BORDER, width: 1 }, rectRadius: 0.15
    });

    slide.addText('PAGE 6: REAL-TIME SAFETY COMMAND CENTER', {
      x: 1.1, y: 1.8, w: 5.6, h: 0.3,
      fontSize: 11, bold: true, color: ACCENT_GREEN
    });

    const bullets = [
      { text: 'Safety Readiness Score: Top header verifies GPS accuracy (±5.2m), phone battery level, and cellular signal readiness before travel starts.', options: { bullet: true, color: TEXT_LIGHT, fontSize: 11 } },
      { text: 'Master 3-Sec SOS Shield: Large central button engineered with 3-second hold to eliminate accidental pocket presses.', options: { bullet: true, color: TEXT_LIGHT, fontSize: 11 } },
      { text: '22kHz High-Decibel Acoustic Siren: On-screen toggle for ear-piercing siren to deter physical threats and attract immediate crowd support.', options: { bullet: true, color: TEXT_LIGHT, fontSize: 11 } },
      { text: 'Linked Guardians Quick Peek: Bottom sheet displays 5 linked emergency guardians, showing real-time connection status.', options: { bullet: true, color: TEXT_LIGHT, fontSize: 11 } }
    ];
    slide.addText(bullets, { x: 1.1, y: 2.2, w: 5.6, h: 4.1, lineSpacingMultiple: 1.3 });

    const img3 = path.join(imgBase, 'User', '3.jpeg');
    const img4 = path.join(imgBase, 'User', '4.jpeg');
    if (fs.existsSync(img3)) {
      slide.addImage({ path: img3, x: 7.35, y: 1.55, w: 2.45, h: 5.0, sizing: { type: 'contain' } });
    }
    if (fs.existsSync(img4)) {
      slide.addImage({ path: img4, x: 10.05, y: 1.55, w: 2.45, h: 5.0, sizing: { type: 'contain' } });
    }
  }

  // -------------------------------------------------------------
  // SLIDE 7: [FLOW 5] Safe Journey Virtual Escort
  // -------------------------------------------------------------
  {
    const slide = pres.addSlide();
    addSlideHeader(slide, 'Step 5: Safe Journey – Proactive Virtual Escort for Commutes', 'User Flow: Step 5', 7);

    slide.addShape(pres.ShapeType.roundRect, {
      x: 0.8, y: 1.55, w: 6.2, h: 5.0,
      fill: { color: CARD_BG }, line: { color: CARD_BORDER, width: 1 }, rectRadius: 0.15
    });

    slide.addText('PAGE 7 & 8: REAL-TIME TRANSIT TELEMETRY', {
      x: 1.1, y: 1.8, w: 5.6, h: 0.3,
      fontSize: 11, bold: true, color: ACCENT_BLUE
    });

    const bullets = [
      { text: 'Proactive Route Monitoring: User taps "Start Safe Journey" when boarding late-night cabs, auto-rickshaws, or unlit walkways.', options: { bullet: true, color: TEXT_LIGHT, fontSize: 11 } },
      { text: 'Live Digital Speedometer: Displays transit velocity in real time (e.g. 34 km/h) to flag unusual vehicle stops.', options: { bullet: true, color: TEXT_LIGHT, fontSize: 11 } },
      { text: '30-Second Breadcrumb Waypoints: Continuous location logging plots an auditable geographic breadcrumb trail on the map.', options: { bullet: true, color: TEXT_LIGHT, fontSize: 11 } },
      { text: 'Off-Route & Route Divergence Alert: Automatically alerts guardians if vehicle diverts significantly from expected destination.', options: { bullet: true, color: TEXT_LIGHT, fontSize: 11 } }
    ];
    slide.addText(bullets, { x: 1.1, y: 2.2, w: 5.6, h: 4.1, lineSpacingMultiple: 1.3 });

    const img5 = path.join(imgBase, 'User', '5.jpeg');
    const img6 = path.join(imgBase, 'User', '6.jpeg');
    if (fs.existsSync(img5)) {
      slide.addImage({ path: img5, x: 7.35, y: 1.55, w: 2.45, h: 5.0, sizing: { type: 'contain' } });
    }
    if (fs.existsSync(img6)) {
      slide.addImage({ path: img6, x: 10.05, y: 1.55, w: 2.45, h: 5.0, sizing: { type: 'contain' } });
    }
  }

  // -------------------------------------------------------------
  // SLIDE 8: [FLOW 6] Safety Check-In Timer & Auto-Escalation
  // -------------------------------------------------------------
  {
    const slide = pres.addSlide();
    addSlideHeader(slide, 'Step 6: Safety Check-In Timer & Automatic SOS Failsafe', 'User Flow: Step 6', 8);

    slide.addShape(pres.ShapeType.roundRect, {
      x: 0.8, y: 1.55, w: 6.2, h: 5.0,
      fill: { color: CARD_BG }, line: { color: CARD_BORDER, width: 1 }, rectRadius: 0.15
    });

    slide.addText('PAGE 9 & 10: AUTOMATED SAFETY FAILSAFE', {
      x: 1.1, y: 1.8, w: 5.6, h: 0.3,
      fontSize: 11, bold: true, color: ACCENT_RED
    });

    const bullets = [
      { text: 'Zero-Action Escalation: User sets 10m, 15m, or 30m countdown when entering an unfamiliar situation (elevator, parking lot, isolated walk).', options: { bullet: true, color: TEXT_LIGHT, fontSize: 11 } },
      { text: 'Reverse Countdown Heartbeat: Large digital timer ticks down; audio & haptic vibration alerts user 60 seconds before expiration.', options: { bullet: true, color: TEXT_LIGHT, fontSize: 11 } },
      { text: '1-Tap "I\'m Safe" Check-In: User simply taps "Check In" upon safe arrival to dismiss timer.', options: { bullet: true, color: TEXT_LIGHT, fontSize: 11 } },
      { text: 'Incapacitation SOS Trigger: If user is incapacitated or phone is knocked away, timer hitting 00:00 AUTOMATICALLY triggers full emergency SOS.', options: { bullet: true, color: TEXT_LIGHT, fontSize: 11 } }
    ];
    slide.addText(bullets, { x: 1.1, y: 2.2, w: 5.6, h: 4.1, lineSpacingMultiple: 1.3 });

    const img7 = path.join(imgBase, 'User', '7.jpeg');
    const img8 = path.join(imgBase, 'User', '8.jpeg');
    if (fs.existsSync(img7)) {
      slide.addImage({ path: img7, x: 7.35, y: 1.55, w: 2.45, h: 5.0, sizing: { type: 'contain' } });
    }
    if (fs.existsSync(img8)) {
      slide.addImage({ path: img8, x: 10.05, y: 1.55, w: 2.45, h: 5.0, sizing: { type: 'contain' } });
    }
  }

  // -------------------------------------------------------------
  // SLIDE 9: [FLOW 7] The 3-Second SOS Trigger & False-Alarm Guard
  // -------------------------------------------------------------
  {
    const slide = pres.addSlide();
    addSlideHeader(slide, 'Step 7: 3-Second Panic-Proof SOS Trigger & False-Alarm Guard', 'User Flow: Step 7', 9);

    slide.addShape(pres.ShapeType.roundRect, {
      x: 0.8, y: 1.55, w: 6.2, h: 5.0,
      fill: { color: CARD_BG }, line: { color: CARD_BORDER, width: 1 }, rectRadius: 0.15
    });

    slide.addText('PAGE 11: PANIC ACTIVATION & SAFEGUARD', {
      x: 1.1, y: 1.8, w: 5.6, h: 0.3,
      fontSize: 11, bold: true, color: ACCENT_RED
    });

    const bullets = [
      { text: 'Panic-Proof 3-Second Activation: Central shield turns crimson red; 3-2-1 countdown accompanied by distinct progressive haptic pulses.', options: { bullet: true, color: TEXT_LIGHT, fontSize: 11 } },
      { text: 'False-Alarm Guard (Cancel Button): Eliminates false alarms from accidental pocket bumps by providing an immediate on-screen CANCEL button.', options: { bullet: true, color: TEXT_LIGHT, fontSize: 11 } },
      { text: 'Zero Confusion in Crisis: Large typography, high-contrast red UI, and bold status indicators eliminate cognitive overload during fear.', options: { bullet: true, color: TEXT_LIGHT, fontSize: 11 } },
      { text: 'Hardware Trigger Readiness: Prepares immediate fallback to SIM hardware if cloud servers or Wi-Fi do not acknowledge ping within 500ms.', options: { bullet: true, color: TEXT_LIGHT, fontSize: 11 } }
    ];
    slide.addText(bullets, { x: 1.1, y: 2.2, w: 5.6, h: 4.1, lineSpacingMultiple: 1.3 });

    const img15 = path.join(imgBase, 'User', '15.jpeg');
    const img16 = path.join(imgBase, 'User', '16.jpeg');
    if (fs.existsSync(img15)) {
      slide.addImage({ path: img15, x: 7.35, y: 1.55, w: 2.45, h: 5.0, sizing: { type: 'contain' } });
    }
    if (fs.existsSync(img16)) {
      slide.addImage({ path: img16, x: 10.05, y: 1.55, w: 2.45, h: 5.0, sizing: { type: 'contain' } });
    }
  }

  // -------------------------------------------------------------
  // SLIDE 10: [FLOW 8] Zero-Internet Failover (SMS + WhatsApp)
  // -------------------------------------------------------------
  {
    const slide = pres.addSlide();
    addSlideHeader(slide, 'Step 8: Zero-Internet Failover – Direct SIM SMS & WhatsApp', 'User Flow: Step 8', 10);

    slide.addShape(pres.ShapeType.roundRect, {
      x: 0.8, y: 1.55, w: 6.2, h: 5.0,
      fill: { color: CARD_BG }, line: { color: CARD_BORDER, width: 1 }, rectRadius: 0.15
    });

    slide.addText('PAGE 12: MULTI-CHANNEL EMERGENCY DISPATCH', {
      x: 1.1, y: 1.8, w: 5.6, h: 0.3,
      fontSize: 11, bold: true, color: ACCENT_GREEN
    });

    const bullets = [
      { text: 'Zero-Internet Cellular Hardware Fallback: When mobile data / Wi-Fi is zero (dead zones, basements), app directly commands phone SIM hardware to send raw SMS.', options: { bullet: true, color: TEXT_LIGHT, fontSize: 11 } },
      { text: 'Instant Dispatch to 5 Guardians: Dispatches pre-formatted emergency text with exact Google Maps coordinates: "EMERGENCY! I need immediate help."', options: { bullet: true, color: TEXT_LIGHT, fontSize: 11 } },
      { text: 'Direct WhatsApp Emergency Card: Parallel WhatsApp notification with high-priority link sent to all registered guardians.', options: { bullet: true, color: TEXT_LIGHT, fontSize: 11 } },
      { text: 'Live Satellite Accuracy Tag: SMS includes GPS accuracy rating (e.g. ±5.0m) so search parties know exactly where to search.', options: { bullet: true, color: TEXT_LIGHT, fontSize: 11 } }
    ];
    slide.addText(bullets, { x: 1.1, y: 2.2, w: 5.6, h: 4.1, lineSpacingMultiple: 1.3 });

    const img11 = path.join(imgBase, 'User', '11.jpeg');
    const img12 = path.join(imgBase, 'User', '12.jpeg');
    if (fs.existsSync(img11)) {
      slide.addImage({ path: img11, x: 7.35, y: 1.55, w: 2.45, h: 5.0, sizing: { type: 'contain' } });
    }
    if (fs.existsSync(img12)) {
      slide.addImage({ path: img12, x: 10.05, y: 1.55, w: 2.45, h: 5.0, sizing: { type: 'contain' } });
    }
  }

  // -------------------------------------------------------------
  // SLIDE 11: [FLOW 9] Active Crisis Command Screen & 112 Helpline
  // -------------------------------------------------------------
  {
    const slide = pres.addSlide();
    addSlideHeader(slide, 'Step 9: Active Crisis Command Screen & 112 Police Helpline', 'User Flow: Step 9', 11);

    slide.addShape(pres.ShapeType.roundRect, {
      x: 0.8, y: 1.55, w: 6.2, h: 5.0,
      fill: { color: CARD_BG }, line: { color: CARD_BORDER, width: 1 }, rectRadius: 0.15
    });

    slide.addText('PAGE 11: REAL-TIME INCIDENT TELEMETRY & 112', {
      x: 1.1, y: 1.8, w: 5.6, h: 0.3,
      fontSize: 11, bold: true, color: ACCENT_RED
    });

    const bullets = [
      { text: 'Live Incident Telemetry: Shows real-time GPS accuracy (±7.0m), contacts notified status (2 Contacts Notified), and incident duration clock.', options: { bullet: true, color: TEXT_LIGHT, fontSize: 11 } },
      { text: 'Embedded Leaflet Map Stream: Real-time interactive map with Satellite and Lock Target camera follow.', options: { bullet: true, color: TEXT_LIGHT, fontSize: 11 } },
      { text: 'Pre-Configured 1-Tap 112 Helpline: Instant dialer connecting directly to National Emergency Response Support System (112) with on-screen street name.', options: { bullet: true, color: TEXT_LIGHT, fontSize: 11 } },
      { text: 'Direct Guardian WhatsApp Buttons: 1-Tap individual WhatsApp dispatch buttons ("Send to Abhijeet", "Send to Rushi").', options: { bullet: true, color: TEXT_LIGHT, fontSize: 11 } },
      { text: '"I\'M SAFE NOW" Protected Button: Safe disarm button requiring PIN to stand down alert and reassure family that crisis has passed.', options: { bullet: true, color: TEXT_LIGHT, fontSize: 11 } }
    ];
    slide.addText(bullets, { x: 1.1, y: 2.2, w: 5.6, h: 4.1, lineSpacingMultiple: 1.25 });

    const img17 = path.join(imgBase, 'User', '17.jpeg');
    const img9 = path.join(imgBase, 'User', '9.jpeg');
    if (fs.existsSync(img17)) {
      slide.addImage({ path: img17, x: 7.35, y: 1.55, w: 2.45, h: 5.0, sizing: { type: 'contain' } });
    }
    if (fs.existsSync(img9)) {
      slide.addImage({ path: img9, x: 10.05, y: 1.55, w: 2.45, h: 5.0, sizing: { type: 'contain' } });
    }
  }

  // -------------------------------------------------------------
  // SLIDE 12: [FLOW 10] Guardian Portal & Panic Alarm Alert
  // -------------------------------------------------------------
  {
    const slide = pres.addSlide();
    addSlideHeader(slide, 'Step 10: Guardian Hub – Zero-Code Auto-Link & Panic Alarm', 'Guardian Flow: Step 10', 12);

    slide.addShape(pres.ShapeType.roundRect, {
      x: 0.8, y: 1.55, w: 6.2, h: 5.0,
      fill: { color: CARD_BG }, line: { color: CARD_BORDER, width: 1 }, rectRadius: 0.15
    });

    slide.addText('PAGE 13 & 14: GUARDIAN HUB & EMERGENCY BANNER', {
      x: 1.1, y: 1.8, w: 5.6, h: 0.3,
      fontSize: 11, bold: true, color: ACCENT_GREEN
    });

    const bullets = [
      { text: 'Zero-Code Automatic Pairing: Guardian enters their phone number on Parent Portal; linked member is automatically connected without manual codes.', options: { bullet: true, color: TEXT_LIGHT, fontSize: 11 } },
      { text: 'Loud Flashing Emergency Banner: Red "EMERGENCY SOS ALERT ACTIVATED!" banner triggers loud alarm on guardian phone.', options: { bullet: true, color: TEXT_LIGHT, fontSize: 11 } },
      { text: 'Vital Information Displayed: Shows child/employee name, blood group (O+), exact coordinates, and live timestamp.', options: { bullet: true, color: TEXT_LIGHT, fontSize: 11 } },
      { text: 'Immediate Action Matrix: 1-Tap "Check-in Ping", "Call", "WhatsApp", "Live Track", and "Mute Audio".', options: { bullet: true, color: TEXT_LIGHT, fontSize: 11 } },
      { text: 'Multi-Member Family Shield: Single parent portal monitors multiple daughters/employees simultaneously.', options: { bullet: true, color: TEXT_LIGHT, fontSize: 11 } }
    ];
    slide.addText(bullets, { x: 1.1, y: 2.2, w: 5.6, h: 4.1, lineSpacingMultiple: 1.25 });

    const parent1 = path.join(imgBase, 'Parent', '1.jpeg');
    const parent2 = path.join(imgBase, 'Parent', '2.jpeg');
    if (fs.existsSync(parent1)) {
      slide.addImage({ path: parent1, x: 7.35, y: 1.55, w: 2.45, h: 5.0, sizing: { type: 'contain' } });
    }
    if (fs.existsSync(parent2)) {
      slide.addImage({ path: parent2, x: 10.05, y: 1.55, w: 2.45, h: 5.0, sizing: { type: 'contain' } });
    }
  }

  // -------------------------------------------------------------
  // SLIDE 13: [FLOW 11] Tactical 60fps Live Leaflet Map & Navigation
  // -------------------------------------------------------------
  {
    const slide = pres.addSlide();
    addSlideHeader(slide, 'Step 11: Tactical 60fps Live Leaflet Map & Turn-by-Turn GPS', 'Guardian Flow: Step 11', 13);

    slide.addShape(pres.ShapeType.roundRect, {
      x: 0.8, y: 1.55, w: 6.2, h: 5.0,
      fill: { color: CARD_BG }, line: { color: CARD_BORDER, width: 1 }, rectRadius: 0.15
    });

    slide.addText('PAGE 15 & 16: TACTICAL LIVE RESCUE MAP', {
      x: 1.1, y: 1.8, w: 5.6, h: 0.3,
      fontSize: 11, bold: true, color: ACCENT_BLUE
    });

    const bullets = [
      { text: '60fps Real-Time Coordinate Streaming: High-performance Leaflet engine smoothly moves pin as user moves (walking, running, vehicle).', options: { bullet: true, color: TEXT_LIGHT, fontSize: 11 } },
      { text: 'Lock Target Camera Follow: Map automatically recenters camera on user\'s live GPS coordinates continuously.', options: { bullet: true, color: TEXT_LIGHT, fontSize: 11 } },
      { text: 'Turn-by-Turn Google Maps Navigation: 1-Tap "Navigate" button opens driving directions directly from guardian\'s current location to victim\'s spot.', options: { bullet: true, color: TEXT_LIGHT, fontSize: 11 } },
      { text: 'Street-Level Reverse Geocoding: Displays human-readable street address (e.g. Bhosari Alandi Road) for immediate police coordination.', options: { bullet: true, color: TEXT_LIGHT, fontSize: 11 } }
    ];
    slide.addText(bullets, { x: 1.1, y: 2.2, w: 5.6, h: 4.1, lineSpacingMultiple: 1.25 });

    const parent3 = path.join(imgBase, 'Parent', '3.jpeg');
    const parent4 = path.join(imgBase, 'Parent', '4.jpeg');
    if (fs.existsSync(parent3)) {
      slide.addImage({ path: parent3, x: 7.35, y: 1.55, w: 2.45, h: 5.0, sizing: { type: 'contain' } });
    }
    if (fs.existsSync(parent4)) {
      slide.addImage({ path: parent4, x: 10.05, y: 1.55, w: 2.45, h: 5.0, sizing: { type: 'contain' } });
    }
  }

  // -------------------------------------------------------------
  // SLIDE 14: Corporate & Institutional Strategic ROI
  // -------------------------------------------------------------
  {
    const slide = pres.addSlide();
    addSlideHeader(slide, 'Universal Strategic ROI: Corporates, Campuses & Organizations', 'Enterprise & Institutional Value', 14);

    const pillars = [
      {
        title: 'POSH & Regulatory Compliance',
        icon: '⚖️',
        points: ['Fulfills statutory state night-shift transport safety guidelines.', 'Auditable digital safety trail for internal ICC committees.', 'Eliminates corporate liability during off-site transit.']
      },
      {
        title: 'NAAC / NIRF College Criteria',
        icon: '📜',
        points: ['Directly satisfies UGC/NAAC student welfare and security metrics.', 'Demonstrates verifiable technology-driven safety infrastructure.', 'Protects off-campus transit for hostel & day scholars.']
      },
      {
        title: 'Talent Retention & Family Trust',
        icon: '📈',
        points: ['Significantly reduces female workforce attrition during late shifts.', 'Provides immense peace of mind to parents and spouses.', 'Elevates corporate ESG (Environmental, Social, Governance) scores.']
      },
      {
        title: 'Zero Enterprise IT Overhead',
        icon: '☁️',
        points: ['100% turnkey cloud deployment; zero servers or hardware required.', 'Zero-maintenance architecture managed 24/7 by Veagle Space.', 'Instant deployment across 1,000+ employees or students within 48 hours.']
      }
    ];

    pillars.forEach((item, idx) => {
      const cardX = 0.8 + idx * 3.0;
      slide.addShape(pres.ShapeType.roundRect, {
        x: cardX, y: 1.55, w: 2.8, h: 5.0,
        fill: { color: CARD_BG }, line: { color: CARD_BORDER, width: 1 }, rectRadius: 0.15
      });

      slide.addText(item.icon, { x: cardX + 0.2, y: 1.8, w: 0.8, h: 0.5, fontSize: 26 });
      slide.addText(item.title, { x: cardX + 0.2, y: 2.4, w: 2.4, h: 0.7, fontSize: 13, bold: true, color: TEXT_WHITE });

      const pts = item.points.map(pt => ({ text: pt, options: { bullet: true, color: TEXT_MUTED, fontSize: 9.5 } }));
      slide.addText(pts, { x: cardX + 0.2, y: 3.2, w: 2.4, h: 3.1, lineSpacingMultiple: 1.2 });
    });
  }

  // -------------------------------------------------------------
  // SLIDE 15: Rollout Roadmap & Corporate Contact
  // -------------------------------------------------------------
  {
    const slide = pres.addSlide();
    addSlideHeader(slide, 'Turnkey Rollout Roadmap: Partnering for a Safer Tomorrow', 'Partnership & Next Steps', 15);

    slide.addShape(pres.ShapeType.roundRect, {
      x: 0.8, y: 1.55, w: 7.2, h: 5.0,
      fill: { color: CARD_BG }, line: { color: CARD_BORDER, width: 1 }, rectRadius: 0.15
    });

    slide.addText('FOUR-PHASE TURNKEY IMPLEMENTATION PLAN', {
      x: 1.1, y: 1.8, w: 6.6, h: 0.3,
      fontSize: 11, bold: true, color: ACCENT_GREEN
    });

    const steps = [
      { text: 'Phase 1: Institutional / Corporate Alignment (Week 1): MOU execution, establishing HR / Safety Committee focal point, and pilot cohort onboarding.', options: { bullet: true, color: TEXT_LIGHT, fontSize: 11 } },
      { text: 'Phase 2: Centralized Digital Onboarding (Week 2): Automated web onboarding to complete medical vitals and link 5 guardians via web portal.', options: { bullet: true, color: TEXT_LIGHT, fontSize: 11 } },
      { text: 'Phase 3: Family & Guardian Orientation (Week 3): Live orientation webinar showcasing the Guardian Portal, WhatsApp alert cards, and 60fps tracking.', options: { bullet: true, color: TEXT_LIGHT, fontSize: 11 } },
      { text: 'Phase 4: 24/7 Protection Active & Periodic Drills (Week 4): Live monitoring active, simulated emergency drills, and integrated emergency response coordination.', options: { bullet: true, color: TEXT_LIGHT, fontSize: 11 } }
    ];
    slide.addText(steps, { x: 1.1, y: 2.2, w: 6.6, h: 4.1, lineSpacingMultiple: 1.3 });

    slide.addShape(pres.ShapeType.roundRect, {
      x: 8.3, y: 1.55, w: 4.2, h: 5.0,
      fill: { color: '18243E' }, line: { color: ACCENT_BLUE, width: 1.5 }, rectRadius: 0.15
    });

    slide.addText('🛡️', { x: 8.6, y: 1.8, w: 3.6, h: 0.6, fontSize: 32, align: 'center' });
    slide.addText('VEAGLE SAFETY\n(सखी सुरक्षा)', {
      x: 8.6, y: 2.5, w: 3.6, h: 0.8,
      fontSize: 18, bold: true, color: TEXT_WHITE, align: 'center'
    });

    slide.addText('आपल्या सुरक्षेचा विश्वासू सोबती', {
      x: 8.6, y: 3.3, w: 3.6, h: 0.4,
      fontSize: 12, italic: true, color: ACCENT_RED, align: 'center'
    });

    const contactDetails = [
      { text: 'Web Portal:', options: { bold: true, color: TEXT_WHITE, fontSize: 10 } },
      { text: ' https://sakhisuraksha.veaglespace.com\n\n', options: { color: ACCENT_BLUE, fontSize: 10 } },
      { text: 'Organization:', options: { bold: true, color: TEXT_WHITE, fontSize: 10 } },
      { text: ' Veagle Space Technology Pvt. Ltd.\n\n', options: { color: TEXT_LIGHT, fontSize: 10 } },
      { text: 'Call / WhatsApp Support:', options: { bold: true, color: TEXT_WHITE, fontSize: 10 } },
      { text: ' +91 82379 99101 / +91 92252 41608\n\n', options: { color: ACCENT_GREEN, fontSize: 10 } },
      { text: 'Platforms:', options: { bold: true, color: TEXT_WHITE, fontSize: 10 } },
      { text: ' Google Play Store & Apple App Store', options: { color: TEXT_LIGHT, fontSize: 10 } }
    ];
    slide.addText(contactDetails, { x: 8.6, y: 3.8, w: 3.6, h: 2.5 });
  }

  // -------------------------------------------------------------
  // SLIDE 16: Thank You & Official Sakhi Suraksha Poster
  // -------------------------------------------------------------
  {
    const slide = pres.addSlide();
    addSlideHeader(slide, 'Thank You! Together We Can Build a Safer Tomorrow', 'Appreciation & Partnership', 16);

    // Left info card
    slide.addShape(pres.ShapeType.roundRect, {
      x: 0.8, y: 1.45, w: 7.0, h: 5.4,
      fill: { color: CARD_BG }, line: { color: CARD_BORDER, width: 1 }, rectRadius: 0.15
    });

    slide.addText('SAKHI SURAKSHA • VEAGLE SPACE TECHNOLOGY', {
      x: 1.1, y: 1.7, w: 6.4, h: 0.3,
      fontSize: 11, bold: true, color: ACCENT_RED
    });

    slide.addText('THANK YOU!', {
      x: 1.1, y: 2.05, w: 6.4, h: 0.6,
      fontSize: 28, bold: true, color: TEXT_WHITE
    });

    slide.addText('Together we can build a safer and stronger community for every woman. ♡', {
      x: 1.1, y: 2.65, w: 6.4, h: 0.4,
      fontSize: 12, italic: true, color: ACCENT_BLUE
    });

    const thankYouBullets = [
      { text: 'A Safer Tomorrow Begins with You: Sakhi Suraksha is designed to keep every woman safe, connected, and empowered across daily commutes and emergencies.', options: { bullet: true, color: TEXT_LIGHT, fontSize: 11 } },
      { text: 'Easy Registration for All: Scan the QR code on the poster for instant onboarding of Individuals (Women & Girls) and Institutes (Schools, Colleges, Corporates).', options: { bullet: true, color: TEXT_LIGHT, fontSize: 11 } },
      { text: 'Referral Partner Opportunity: Join our mission as a campus or corporate ambassador to help protect more women across the community.', options: { bullet: true, color: TEXT_LIGHT, fontSize: 11 } },
      { text: 'Comprehensive Technical Ecosystem: 3-Sec SOS Alert, 60fps Live Location Tracking, 5 Guardians Connection, and 24/7 Police 112 Helpline.', options: { bullet: true, color: TEXT_LIGHT, fontSize: 11 } }
    ];
    slide.addText(thankYouBullets, { x: 1.1, y: 3.1, w: 6.4, h: 2.2, lineSpacingMultiple: 1.25 });

    // Contact badge inside left card
    slide.addShape(pres.ShapeType.roundRect, {
      x: 1.1, y: 5.45, w: 6.4, h: 1.2,
      fill: { color: '18243E' }, line: { color: ACCENT_GREEN, width: 1 }, rectRadius: 0.1
    });

    const contactText = [
      { text: 'Need Support or Want More Services?  ', options: { bold: true, color: TEXT_WHITE, fontSize: 10 } },
      { text: 'Call / WhatsApp: ', options: { color: TEXT_MUTED, fontSize: 10 } },
      { text: '+91 82379 99101  |  +91 92252 41608\n', options: { bold: true, color: ACCENT_GREEN, fontSize: 11 } },
      { text: 'Web Portal: ', options: { color: TEXT_MUTED, fontSize: 10 } },
      { text: 'https://sakhisuraksha.veaglespace.com   ', options: { color: ACCENT_BLUE, fontSize: 10 } },
      { text: '• Organization: ', options: { color: TEXT_MUTED, fontSize: 10 } },
      { text: 'Veagle Space Technology Pvt. Ltd.', options: { color: TEXT_LIGHT, fontSize: 10 } }
    ];
    slide.addText(contactText, { x: 1.25, y: 5.55, w: 6.1, h: 1.0 });

    // Right poster image - uncropped, as it is!
    const posterImg = path.join(imgBase, 'sakhi_suraksha_poster.jpg');
    if (fs.existsSync(posterImg)) {
      slide.addImage({
        path: posterImg,
        x: 8.1,
        y: 1.45,
        w: 4.4,
        h: 5.4,
        sizing: { type: 'contain' }
      });
    }
  }

  const outputPath = path.join(__dirname, '..', 'Veagle_Safety_Master_Presentation.pptx');
  await pres.writeFile({ fileName: outputPath });
  console.log(`Master Presentation successfully generated at: ${outputPath}`);
}

createMasterDeck().catch(err => {
  console.error('Error generating master deck:', err);
  process.exit(1);
});
