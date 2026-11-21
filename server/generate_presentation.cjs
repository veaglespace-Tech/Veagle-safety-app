const pptxgen = require('pptxgenjs');
const path = require('path');
const fs = require('fs');

async function createDeck() {
  const pres = new pptxgen();
  
  // Explicitly define 16:9 Widescreen layout (13.333 x 7.500 inches)
  pres.defineLayout({ name: 'WIDE_16x9', width: 13.333, height: 7.5 });
  pres.layout = 'WIDE_16x9';

  // Base Colors
  const BG_DARK = '0A0F1D';
  const CARD_BG = '131B2E';
  const CARD_BORDER = '23304A';
  const ACCENT_RED = 'EF4444';
  const ACCENT_BLUE = '3B82F6';
  const ACCENT_GREEN = '10B981';
  const ACCENT_PURPLE = '8B5CF6';
  const TEXT_WHITE = 'FFFFFF';
  const TEXT_MUTED = '94A3B8';
  const TEXT_LIGHT = 'E2E8F0';

  const imgBase = path.join(__dirname, '..', 'Images');

  // Helper for Slide Background & Header
  function addSlideHeader(slide, title, category, slideNum, totalSlides = 14) {
    slide.background = { color: BG_DARK };

    // Top Category / Tag
    slide.addText(category.toUpperCase(), {
      x: 0.8,
      y: 0.45,
      w: 7.5,
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
    slide.addText('🛡️ VEAGLE SAFETY', {
      x: 10.0,
      y: 0.45,
      w: 2.5,
      h: 0.3,
      fontSize: 11,
      bold: true,
      color: ACCENT_RED,
      align: 'right',
    });

    // Bottom Footer
    slide.addText('Veagle Safety (सखी सुरक्षा) • Campus & Women Safety Presentation', {
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
  // SLIDE 1: Title & Hero
  // -------------------------------------------------------------
  {
    const slide = pres.addSlide();
    slide.background = { color: BG_DARK };

    // Brand Badge
    slide.addShape(pres.ShapeType.roundRect, {
      x: 0.8, y: 0.8, w: 2.8, h: 0.42,
      fill: { color: '201625' }, line: { color: ACCENT_RED, width: 1.5 }, rectRadius: 0.2
    });
    slide.addText('CAMPUS SAFETY ECOSYSTEM', {
      x: 0.8, y: 0.8, w: 2.8, h: 0.42,
      fontSize: 10, bold: true, color: ACCENT_RED, align: 'center'
    });

    // Title
    slide.addText('VEAGLE SAFETY\n(सखी सुरक्षा)', {
      x: 0.8, y: 1.35, w: 6.2, h: 1.5,
      fontSize: 32, bold: true, color: TEXT_WHITE, lineSpacingMultiple: 1.1
    });

    // Subtitle
    slide.addText('Smart, Connected & Proactive Women Safety Infrastructure Designed for Colleges, Universities & Educational Campuses.', {
      x: 0.8, y: 2.95, w: 6.2, h: 0.9,
      fontSize: 12, color: TEXT_MUTED, lineSpacingMultiple: 1.2
    });

    // Highlights Card
    slide.addShape(pres.ShapeType.roundRect, {
      x: 0.8, y: 3.95, w: 6.2, h: 2.7,
      fill: { color: CARD_BG }, line: { color: CARD_BORDER, width: 1 }, rectRadius: 0.15
    });

    slide.addText('KEY INSTITUTIONAL HIGHLIGHTS:', {
      x: 1.0, y: 4.15, w: 5.8, h: 0.3,
      fontSize: 10, bold: true, color: ACCENT_GREEN
    });

    const bullets = [
      { text: 'Complete Web Portal for centralized student & guardian onboarding', options: { bullet: true, color: TEXT_LIGHT, fontSize: 11 } },
      { text: 'Fail-safe Mobile SOS working with or without active mobile data (Direct SIM SMS)', options: { bullet: true, color: TEXT_LIGHT, fontSize: 11 } },
      { text: 'Safe Journey virtual escort for late-night transit between campus, hostel & home', options: { bullet: true, color: TEXT_LIGHT, fontSize: 11 } },
      { text: 'Instant real-time 60fps tracking & emergency alerting for parents', options: { bullet: true, color: TEXT_LIGHT, fontSize: 11 } },
    ];
    slide.addText(bullets, { x: 1.0, y: 4.5, w: 5.8, h: 2.0, lineSpacingMultiple: 1.2 });

    // Right Side: Web Screenshot
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
  // SLIDE 2: Institutional Challenge & The Need
  // -------------------------------------------------------------
  {
    const slide = pres.addSlide();
    addSlideHeader(slide, 'The Safety Challenge: Protecting Students Beyond the Campus Gate', 'Institutional Context', 2);

    const cards = [
      {
        title: 'Commute Vulnerability',
        icon: '🚌',
        desc: 'Female students face heightened security risks during early morning coaching and late-night returns from campus libraries and labs.',
        stat: '78% of incidents occur off-campus'
      },
      {
        title: 'Network Deadzones',
        icon: '📵',
        desc: 'Traditional emergency apps fail entirely when cellular data is poor, exhausted, or in basement transit hubs and rural corridors.',
        stat: 'Zero data = Zero protection in standard apps'
      },
      {
        title: 'Parental Anxiety & Retention',
        icon: '👨‍👩‍👧',
        desc: 'Parents hold institutions accountable for their daughters safety. Fear of unsafe transit directly impacts hostel admissions.',
        stat: '100% of parents demand live safety visibility'
      },
      {
        title: 'Institutional Compliance',
        icon: '🏛️',
        desc: 'UGC, NAAC, and NIRF guidelines require robust, documented internal and external women safety mechanisms on campus.',
        stat: 'Mandatory NAAC student welfare criteria'
      }
    ];

    cards.forEach((c, idx) => {
      const x = 0.8 + idx * 3.0;
      slide.addShape(pres.ShapeType.roundRect, {
        x: x, y: 1.55, w: 2.7, h: 5.0,
        fill: { color: CARD_BG }, line: { color: CARD_BORDER, width: 1 }, rectRadius: 0.15
      });

      slide.addText(c.icon, { x: x + 0.2, y: 1.8, w: 2.3, h: 0.5, fontSize: 26 });
      slide.addText(c.title, { x: x + 0.2, y: 2.4, w: 2.3, h: 0.6, fontSize: 13, bold: true, color: TEXT_WHITE });
      slide.addText(c.desc, { x: x + 0.2, y: 3.1, w: 2.3, h: 2.3, fontSize: 10.5, color: TEXT_MUTED, lineSpacingMultiple: 1.15 });

      slide.addShape(pres.ShapeType.roundRect, {
        x: x + 0.15, y: 5.7, w: 2.4, h: 0.65,
        fill: { color: '18243E' }, line: { color: ACCENT_BLUE, width: 1 }, rectRadius: 0.1
      });
      slide.addText(c.stat, {
        x: x + 0.15, y: 5.7, w: 2.4, h: 0.65,
        fontSize: 9, bold: true, color: ACCENT_BLUE, align: 'center'
      });
    });
  }

  // -------------------------------------------------------------
  // SLIDE 3: Web Portal Registration
  // -------------------------------------------------------------
  {
    const slide = pres.addSlide();
    addSlideHeader(slide, 'Step 1: Frictionless Web Portal Registration & Profile Setup', 'Member Onboarding', 3);

    slide.addShape(pres.ShapeType.roundRect, {
      x: 0.8, y: 1.55, w: 6.2, h: 5.0,
      fill: { color: CARD_BG }, line: { color: CARD_BORDER, width: 1 }, rectRadius: 0.15
    });

    slide.addText('CENTRALIZED WEB REGISTRATION', {
      x: 1.1, y: 1.8, w: 5.6, h: 0.3,
      fontSize: 11, bold: true, color: ACCENT_GREEN
    });

    const bullets = [
      { text: 'Fast Signup on Web Portal (sakhisuraksha.veaglespace.com): Students complete registration conveniently on laptops or mobile browsers.', options: { bullet: true, color: TEXT_LIGHT, fontSize: 11 } },
      { text: 'Emergency Medical Vitals: Blood Group (A+, B+, O+, AB+), critical allergies, and emergency notes recorded once and synced everywhere.', options: { bullet: true, color: TEXT_LIGHT, fontSize: 11 } },
      { text: 'Designating Up to 5 Trusted Guardians: Students link Father, Mother, Brother, Spouse, or local relatives with priority ordering.', options: { bullet: true, color: TEXT_LIGHT, fontSize: 11 } },
      { text: 'Institutional Integration: Ability to associate college enrollment number and campus department.', options: { bullet: true, color: TEXT_LIGHT, fontSize: 11 } },
      { text: 'Instant QR Code Handoff: Immediate dynamic QR code displayed upon completion to auto-login to the native mobile app.', options: { bullet: true, color: TEXT_LIGHT, fontSize: 11 } }
    ];
    slide.addText(bullets, { x: 1.1, y: 2.2, w: 5.6, h: 4.1, lineSpacingMultiple: 1.25 });

    const regImg = path.join(imgBase, 'registration', 'sakhisuraksha.veaglespace.com_auth_mode=register.png');
    if (fs.existsSync(regImg)) {
      slide.addImage({
        path: regImg,
        x: 7.3, y: 1.55, w: 5.2, h: 5.0,
        sizing: { type: 'contain' }
      });
    }
  }

  // -------------------------------------------------------------
  // SLIDE 4: Mobile App Transition & Transparent Privacy
  // -------------------------------------------------------------
  {
    const slide = pres.addSlide();
    addSlideHeader(slide, 'Step 2: Transparent Permissions & Student Privacy Guarantee', 'Mobile App Trust & Compliance', 4);

    slide.addShape(pres.ShapeType.roundRect, {
      x: 0.8, y: 1.55, w: 6.2, h: 5.0,
      fill: { color: CARD_BG }, line: { color: CARD_BORDER, width: 1 }, rectRadius: 0.15
    });

    slide.addText('HIGH-TRUST PRIVACY FRAMEWORK', {
      x: 1.1, y: 1.8, w: 5.6, h: 0.3,
      fontSize: 11, bold: true, color: ACCENT_BLUE
    });

    const bullets = [
      { text: 'Google Play & Apple Store Compliant: Full prominent disclosure dialog explains why background location access is required.', options: { bullet: true, color: TEXT_LIGHT, fontSize: 11 } },
      { text: 'Zero Unwanted Surveillance: Background GPS is strictly activated only when the student initiates an SOS or Safe Journey trip. It is NEVER tracked 24x7 without consent.', options: { bullet: true, color: TEXT_LIGHT, fontSize: 11 } },
      { text: 'Dual Access Portal: Unified native login supporting both Student Member Login and dedicated Parent Portal in one single app.', options: { bullet: true, color: TEXT_LIGHT, fontSize: 11 } },
      { text: 'End-to-End Encryption: All location telemetry and emergency coordinates are encrypted in transit.', options: { bullet: true, color: TEXT_LIGHT, fontSize: 11 } }
    ];
    slide.addText(bullets, { x: 1.1, y: 2.2, w: 5.6, h: 4.1, lineSpacingMultiple: 1.3 });

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
  // SLIDE 5: Student Command Center (Member Dashboard)
  // -------------------------------------------------------------
  {
    const slide = pres.addSlide();
    addSlideHeader(slide, 'The Student Safety Command Center (Mobile App Dashboard)', 'Member Experience', 5);

    slide.addShape(pres.ShapeType.roundRect, {
      x: 0.8, y: 1.55, w: 6.2, h: 5.0,
      fill: { color: CARD_BG }, line: { color: CARD_BORDER, width: 1 }, rectRadius: 0.15
    });

    slide.addText('INTUITIVE, STRESS-PROOF DASHBOARD', {
      x: 1.1, y: 1.8, w: 5.6, h: 0.3,
      fontSize: 11, bold: true, color: ACCENT_GREEN
    });

    const bullets = [
      { text: 'Prominent 3D SOS Button: High-visibility 180px tactile hero button accessible immediately upon opening the app.', options: { bullet: true, color: TEXT_LIGHT, fontSize: 11 } },
      { text: 'Safety Readiness Gauge (85% Ready): Automated pre-flight check validates GPS accuracy, SMS permissions, and guardian count before student leaves campus.', options: { bullet: true, color: TEXT_LIGHT, fontSize: 11 } },
      { text: 'Emergency Guardians Quick List: Displays active guardians (e.g. Abhijeet, Rushi) with one-touch phone dialers.', options: { bullet: true, color: TEXT_LIGHT, fontSize: 11 } },
      { text: 'Silent Mode vs Loud Siren Switch: Instantly configure whether SOS triggers the 22kHz piercing public alarm or stealth silent tracking.', options: { bullet: true, color: TEXT_LIGHT, fontSize: 11 } },
      { text: 'Quick Tool Shortcuts: Instant access to Track Journey, Check On Me, Guardians, and National Helplines (112 & 1091).', options: { bullet: true, color: TEXT_LIGHT, fontSize: 11 } }
    ];
    slide.addText(bullets, { x: 1.1, y: 2.2, w: 5.6, h: 4.1, lineSpacingMultiple: 1.25 });

    const img3 = path.join(imgBase, 'User', '3.jpeg');
    const img16 = path.join(imgBase, 'User', '16.jpeg');
    if (fs.existsSync(img3)) {
      slide.addImage({ path: img3, x: 7.35, y: 1.55, w: 2.45, h: 5.0, sizing: { type: 'contain' } });
    }
    if (fs.existsSync(img16)) {
      slide.addImage({ path: img16, x: 10.05, y: 1.55, w: 2.45, h: 5.0, sizing: { type: 'contain' } });
    }
  }

  // -------------------------------------------------------------
  // SLIDE 6: 1-Tap 3D SOS & False-Alarm Guard
  // -------------------------------------------------------------
  {
    const slide = pres.addSlide();
    addSlideHeader(slide, '3-Second Panic-Proof SOS Trigger & False-Alarm Prevention', 'Emergency Activation', 6);

    slide.addShape(pres.ShapeType.roundRect, {
      x: 0.8, y: 1.55, w: 6.2, h: 5.0,
      fill: { color: CARD_BG }, line: { color: CARD_BORDER, width: 1 }, rectRadius: 0.15
    });

    slide.addText('ENGINEERED FOR EXTREME PANIC SCENARIOS', {
      x: 1.1, y: 1.8, w: 5.6, h: 0.3,
      fontSize: 11, bold: true, color: ACCENT_RED
    });

    const bullets = [
      { text: '3-Second Animated Countdown ("2s DISPATCHING..."): Circular animated progress ring with escalating haptic vibration pulses at 1s, 2s, and 3s.', options: { bullet: true, color: TEXT_LIGHT, fontSize: 11 } },
      { text: 'Zero False Alarms: If pressed accidentally in a backpack or purse, releasing before 3 seconds aborts cleanly without disturbing parents or security.', options: { bullet: true, color: TEXT_LIGHT, fontSize: 11 } },
      { text: 'Loud 22kHz Siren Override: Piercing siren automatically overrides phone silent / DND settings, disorienting attackers and summoning nearby crowd/guards.', options: { bullet: true, color: TEXT_LIGHT, fontSize: 11 } },
      { text: 'Stealth / Silent SOS Mode: In stalking or unauthorized vehicle confinement, screen stays dark while silently dispatching GPS coordinates.', options: { bullet: true, color: TEXT_LIGHT, fontSize: 11 } },
      { text: 'PIN-Protected Deactivation: Attackers cannot force cancellation by tapping; requires secure 4-digit PIN to resolve.', options: { bullet: true, color: TEXT_LIGHT, fontSize: 11 } }
    ];
    slide.addText(bullets, { x: 1.1, y: 2.2, w: 5.6, h: 4.1, lineSpacingMultiple: 1.25 });

    const img7 = path.join(imgBase, 'User', '7.jpeg');
    const img10 = path.join(imgBase, 'User', '10.jpeg');
    if (fs.existsSync(img7)) {
      slide.addImage({ path: img7, x: 7.35, y: 1.55, w: 2.45, h: 5.0, sizing: { type: 'contain' } });
    }
    if (fs.existsSync(img10)) {
      slide.addImage({ path: img10, x: 10.05, y: 1.55, w: 2.45, h: 5.0, sizing: { type: 'contain' } });
    }
  }

  // -------------------------------------------------------------
  // SLIDE 7: Zero-Internet Multi-Channel Dispatch (SMS + WhatsApp)
  // -------------------------------------------------------------
  {
    const slide = pres.addSlide();
    addSlideHeader(slide, 'Zero-Internet Failover: Direct SIM SMS & WhatsApp Dispatch', 'Unbreakable Connectivity', 7);

    slide.addShape(pres.ShapeType.roundRect, {
      x: 0.8, y: 1.55, w: 6.2, h: 5.0,
      fill: { color: CARD_BG }, line: { color: CARD_BORDER, width: 1 }, rectRadius: 0.15
    });

    slide.addText('MULTI-CHANNEL EMERGENCY BROADCAST', {
      x: 1.1, y: 1.8, w: 5.6, h: 0.3,
      fontSize: 11, bold: true, color: ACCENT_GREEN
    });

    const bullets = [
      { text: 'Native Telephony Hardware SMS: When mobile 4G/5G data drops, the app uses Android native DirectSmsModule to dispatch direct SIM SMS to all guardians.', options: { bullet: true, color: TEXT_LIGHT, fontSize: 11 } },
      { text: 'Exact Coordinates & Clickable Links: Guardians receive SMS with real GPS latitude/longitude and instant clickable Google Maps & Web live track links.', options: { bullet: true, color: TEXT_LIGHT, fontSize: 11 } },
      { text: 'High-Priority Cloud WhatsApp Dispatch: Dispatches structured alert cards directly to parents WhatsApp chats and family groups within 3 seconds.', options: { bullet: true, color: TEXT_LIGHT, fontSize: 11 } },
      { text: 'Dual Carrier Reliability: Ensures emergency transmission even in university basements, remote highway stretches, or metro corridors.', options: { bullet: true, color: TEXT_LIGHT, fontSize: 11 } }
    ];
    slide.addText(bullets, { x: 1.1, y: 2.2, w: 5.6, h: 4.1, lineSpacingMultiple: 1.3 });

    const img11 = path.join(imgBase, 'User', '11.jpeg');
    const img8 = path.join(imgBase, 'User', '8.jpeg');
    if (fs.existsSync(img11)) {
      slide.addImage({ path: img11, x: 7.35, y: 1.55, w: 2.45, h: 5.0, sizing: { type: 'contain' } });
    }
    if (fs.existsSync(img8)) {
      slide.addImage({ path: img8, x: 10.05, y: 1.55, w: 2.45, h: 5.0, sizing: { type: 'contain' } });
    }
  }

  // -------------------------------------------------------------
  // SLIDE 8: Safe Journey Virtual Escort
  // -------------------------------------------------------------
  {
    const slide = pres.addSlide();
    addSlideHeader(slide, 'Safe Journey: Proactive Virtual Escort for Commuting Students', 'Proactive Transit Protection', 8);

    slide.addShape(pres.ShapeType.roundRect, {
      x: 0.8, y: 1.55, w: 6.2, h: 5.0,
      fill: { color: CARD_BG }, line: { color: CARD_BORDER, width: 1 }, rectRadius: 0.15
    });

    slide.addText('SAFETY BEFORE DANGER OCCURS', {
      x: 1.1, y: 1.8, w: 5.6, h: 0.3,
      fontSize: 11, bold: true, color: ACCENT_BLUE
    });

    const bullets = [
      { text: 'Designed for Student Commutes: Late returns from college events, sports practice, library study sessions, and hostel travel.', options: { bullet: true, color: TEXT_LIGHT, fontSize: 11 } },
      { text: 'Trip Duration & Destination (15m, 30m, 45m, 1h): Student enters destination (e.g. Hostel) and selects expected transit duration.', options: { bullet: true, color: TEXT_LIGHT, fontSize: 11 } },
      { text: 'Continuous 30-Second GPS Pings: Trusted guardians receive a shared live route tracking link updating every 30 seconds.', options: { bullet: true, color: TEXT_LIGHT, fontSize: 11 } },
      { text: 'Automated Check-In Prompt: "Are you safely on your route?" appears as the timer progresses.', options: { bullet: true, color: TEXT_LIGHT, fontSize: 11 } },
      { text: 'Automatic SOS Escalation: If a student does NOT confirm safety or enter her PIN within 3 minutes of timer expiry, SOS triggers automatically!', options: { bullet: true, color: TEXT_LIGHT, fontSize: 11 } }
    ];
    slide.addText(bullets, { x: 1.1, y: 2.2, w: 5.6, h: 4.1, lineSpacingMultiple: 1.25 });

    const img13 = path.join(imgBase, 'User', '13.jpeg');
    const img14 = path.join(imgBase, 'User', '14.jpeg');
    if (fs.existsSync(img13)) {
      slide.addImage({ path: img13, x: 7.35, y: 1.55, w: 2.45, h: 5.0, sizing: { type: 'contain' } });
    }
    if (fs.existsSync(img14)) {
      slide.addImage({ path: img14, x: 10.05, y: 1.55, w: 2.45, h: 5.0, sizing: { type: 'contain' } });
    }
  }

  // -------------------------------------------------------------
  // SLIDE 9: Tactical Deterrence & Police Helpline
  // -------------------------------------------------------------
  {
    const slide = pres.addSlide();
    addSlideHeader(slide, 'Tactical Deterrence: Fake Calls, Alarms & 112 Police Integration', 'Incident Prevention Tools', 9);

    slide.addShape(pres.ShapeType.roundRect, {
      x: 0.8, y: 1.55, w: 6.2, h: 5.0,
      fill: { color: CARD_BG }, line: { color: CARD_BORDER, width: 1 }, rectRadius: 0.15
    });

    slide.addText('DISCREET & LOUD TOOLS TO DETER THREATS', {
      x: 1.1, y: 1.8, w: 5.6, h: 0.3,
      fontSize: 11, bold: true, color: ACCENT_PURPLE
    });

    const bullets = [
      { text: 'Fake Phone Call Simulator: Generates an authentic incoming phone call simulation to allow female students to safely excuse themselves from uncomfortable situations.', options: { bullet: true, color: TEXT_LIGHT, fontSize: 11 } },
      { text: 'Loud Alarm Standby: Emits an intense flashing screen and vibrating high-frequency alarm in public spaces to summon campus security guards.', options: { bullet: true, color: TEXT_LIGHT, fontSize: 11 } },
      { text: 'Instant National Helpline (112): Pre-configured 1-tap dialer connecting directly to the National Emergency Response Support System.', options: { bullet: true, color: TEXT_LIGHT, fontSize: 11 } },
      { text: 'Dedicated Women Helpline (1091): One-touch dialer for quick access to official women safety authorities.', options: { bullet: true, color: TEXT_LIGHT, fontSize: 11 } },
      { text: 'On-Screen Street Address: Displays real-time street name so student can read out exact location to police operators.', options: { bullet: true, color: TEXT_LIGHT, fontSize: 11 } }
    ];
    slide.addText(bullets, { x: 1.1, y: 2.2, w: 5.6, h: 4.1, lineSpacingMultiple: 1.25 });

    const img15 = path.join(imgBase, 'User', '15.jpeg');
    const img9 = path.join(imgBase, 'User', '9.jpeg');
    if (fs.existsSync(img15)) {
      slide.addImage({ path: img15, x: 7.35, y: 1.55, w: 2.45, h: 5.0, sizing: { type: 'contain' } });
    }
    if (fs.existsSync(img9)) {
      slide.addImage({ path: img9, x: 10.05, y: 1.55, w: 2.45, h: 5.0, sizing: { type: 'contain' } });
    }
  }

  // -------------------------------------------------------------
  // SLIDE 10: Active SOS Command Screen
  // -------------------------------------------------------------
  {
    const slide = pres.addSlide();
    addSlideHeader(slide, 'Active Emergency Command Screen (Student In-Trip View)', 'Active Incident Management', 10);

    slide.addShape(pres.ShapeType.roundRect, {
      x: 0.8, y: 1.55, w: 7.0, h: 5.0,
      fill: { color: CARD_BG }, line: { color: CARD_BORDER, width: 1 }, rectRadius: 0.15
    });

    slide.addText('FULL TACTICAL INCIDENT CONTROL', {
      x: 1.1, y: 1.8, w: 6.4, h: 0.3,
      fontSize: 11, bold: true, color: ACCENT_RED
    });

    const bullets = [
      { text: 'Live Incident Telemetry: Shows real-time GPS accuracy (±7.0m), number of contacts notified (2 Contacts Notified), and elapsed incident duration.', options: { bullet: true, color: TEXT_LIGHT, fontSize: 11 } },
      { text: 'Embedded Leaflet GPS Stream: Integrated interactive map showing street coordinates (e.g. Wadgaon Budruk - Narhe) with Lock Target and Satellite toggle.', options: { bullet: true, color: TEXT_LIGHT, fontSize: 11 } },
      { text: 'Direct WhatsApp to Individual Guardians: 1-Tap individual buttons ("Send to Abhijeet", "Send to Rushi") for instant follow-up.', options: { bullet: true, color: TEXT_LIGHT, fontSize: 11 } },
      { text: 'Quick Emergency Police & Helpline Dialers: Instant buttons for Call 112 (National Emergency) and Call 1091 (Women Helpline).', options: { bullet: true, color: TEXT_LIGHT, fontSize: 11 } },
      { text: 'Resolution & Standdown: Protected "I\'M SAFE NOW" button to safely disarm the alert and notify parents that the emergency has ended.', options: { bullet: true, color: TEXT_LIGHT, fontSize: 11 } }
    ];
    slide.addText(bullets, { x: 1.1, y: 2.2, w: 6.4, h: 4.1, lineSpacingMultiple: 1.3 });

    const img17 = path.join(imgBase, 'User', '17.jpeg');
    if (fs.existsSync(img17)) {
      slide.addImage({ path: img17, x: 8.4, y: 1.55, w: 3.5, h: 5.0, sizing: { type: 'contain' } });
    }
  }

  // -------------------------------------------------------------
  // SLIDE 11: Parent & Guardian Portal Experience
  // -------------------------------------------------------------
  {
    const slide = pres.addSlide();
    addSlideHeader(slide, 'Parent & Guardian Portal: Zero-Friction Family Reassurance', 'Guardian Experience', 11);

    slide.addShape(pres.ShapeType.roundRect, {
      x: 0.8, y: 1.55, w: 6.2, h: 5.0,
      fill: { color: CARD_BG }, line: { color: CARD_BORDER, width: 1 }, rectRadius: 0.15
    });

    slide.addText('DESIGNED FOR ZERO PARENTAL CONFUSION', {
      x: 1.1, y: 1.8, w: 5.6, h: 0.3,
      fontSize: 11, bold: true, color: ACCENT_GREEN
    });

    const bullets = [
      { text: 'Automatic Linkage: No pairing codes required. When daughter adds parent phone number on Web, parent account is automatically linked.', options: { bullet: true, color: TEXT_LIGHT, fontSize: 11 } },
      { text: 'Flashing Emergency Banner: Red "EMERGENCY SOS ALERT ACTIVATED!" banner triggers loud siren sound on parent phone.', options: { bullet: true, color: TEXT_LIGHT, fontSize: 11 } },
      { text: 'Real-Time Emergency GPS: Shows exact coordinates (Lat: 18.4664, Lng: 73.8239), blood group (O+), and relationship.', options: { bullet: true, color: TEXT_LIGHT, fontSize: 11 } },
      { text: 'Instant Action Buttons: "Check-in Ping", "Call", "WhatsApp", "Live Track", and "Mute".', options: { bullet: true, color: TEXT_LIGHT, fontSize: 11 } },
      { text: 'Multi-Child Family Support: One parent can effortlessly monitor two daughters studying at different schools/colleges from a single screen.', options: { bullet: true, color: TEXT_LIGHT, fontSize: 11 } }
    ];
    slide.addText(bullets, { x: 1.1, y: 2.2, w: 5.6, h: 4.1, lineSpacingMultiple: 1.25 });

    const p1 = path.join(imgBase, 'Parent', '1.jpeg');
    const p2 = path.join(imgBase, 'Parent', '2.jpeg');
    if (fs.existsSync(p1)) {
      slide.addImage({ path: p1, x: 7.35, y: 1.55, w: 2.45, h: 5.0, sizing: { type: 'contain' } });
    }
    if (fs.existsSync(p2)) {
      slide.addImage({ path: p2, x: 10.05, y: 1.55, w: 2.45, h: 5.0, sizing: { type: 'contain' } });
    }
  }

  // -------------------------------------------------------------
  // SLIDE 12: Tactical 60fps Live Leaflet Map (Parent View)
  // -------------------------------------------------------------
  {
    const slide = pres.addSlide();
    addSlideHeader(slide, 'Tactical 60fps Live Leaflet Map & Complete Alert History', 'Real-Time Interventions', 12);

    slide.addShape(pres.ShapeType.roundRect, {
      x: 0.8, y: 1.55, w: 6.2, h: 5.0,
      fill: { color: CARD_BG }, line: { color: CARD_BORDER, width: 1 }, rectRadius: 0.15
    });

    slide.addText('TACTICAL MAP & INCIDENT AUDIT TRAIL', {
      x: 1.1, y: 1.8, w: 5.6, h: 0.3,
      fontSize: 11, bold: true, color: ACCENT_BLUE
    });

    const bullets = [
      { text: '60fps Hardware-Accelerated Leaflet Map: Real-time GPS stream with sub-10m accuracy circle and smooth marker animations.', options: { bullet: true, color: TEXT_LIGHT, fontSize: 11 } },
      { text: 'Satellite & Street Views: Parent can switch between satellite imagery and road maps to pinpoint specific buildings, alleys, or landmarks.', options: { bullet: true, color: TEXT_LIGHT, fontSize: 11 } },
      { text: 'Turn-by-Turn Navigation ("OPEN MAPS"): One click opens Google Maps with direct driving directions to daughter\'s live location.', options: { bullet: true, color: TEXT_LIGHT, fontSize: 11 } },
      { text: 'Lock-Target Mode: Camera automatically centers and tracks the moving student in real time.', options: { bullet: true, color: TEXT_LIGHT, fontSize: 11 } },
      { text: 'Transparent Incident History: Complete audit log of all previous SOS alerts with timestamps, duration, and resolved statuses.', options: { bullet: true, color: TEXT_LIGHT, fontSize: 11 } }
    ];
    slide.addText(bullets, { x: 1.1, y: 2.2, w: 5.6, h: 4.1, lineSpacingMultiple: 1.25 });

    const p5 = path.join(imgBase, 'Parent', '5.jpeg');
    const p4 = path.join(imgBase, 'Parent', '4.jpeg');
    if (fs.existsSync(p5)) {
      slide.addImage({ path: p5, x: 7.35, y: 1.55, w: 2.45, h: 5.0, sizing: { type: 'contain' } });
    }
    if (fs.existsSync(p4)) {
      slide.addImage({ path: p4, x: 10.05, y: 1.55, w: 2.45, h: 5.0, sizing: { type: 'contain' } });
    }
  }

  // -------------------------------------------------------------
  // SLIDE 13: Institutional Value Proposition for Colleges
  // -------------------------------------------------------------
  {
    const slide = pres.addSlide();
    addSlideHeader(slide, 'Institutional Value: Why Colleges & Universities Choose Veagle', 'Institutional Benefits & ROI', 13);

    const pillars = [
      {
        title: 'NAAC & UGC Safety Compliance',
        icon: '📜',
        points: ['Fulfills mandatory criterion for student welfare & safety documentation.', 'Measurable proactive safety metrics for accreditation audits.', 'Demonstrates modern technological leadership to inspection committees.']
      },
      {
        title: 'Zero Institutional Burden',
        icon: '🛡️',
        points: ['Zero server or hardware infrastructure needed on campus.', 'Fully managed cloud, native Android/iOS apps, and web portal.', 'Automatic regular security and OS compatibility updates.']
      },
      {
        title: 'Unmatched Parent Trust',
        icon: '🤝',
        points: ['Parents feel confident sending their daughters to campus & hostels.', 'Dramatically reduces distress calls and panic during late college events.', 'Strengthens parent-institution goodwill and positive word-of-mouth.']
      },
      {
        title: 'Mass Student Enrollment Plans',
        icon: '💳',
        points: ['Subsidized campus-wide pricing tiers for bulk student onboarding.', 'Transparent checkout and annual renewal integration.', 'Immediate protection coverage across all faculties & student years.']
      }
    ];

    pillars.forEach((p, idx) => {
      const x = 0.8 + idx * 3.0;
      slide.addShape(pres.ShapeType.roundRect, {
        x: x, y: 1.55, w: 2.7, h: 5.0,
        fill: { color: CARD_BG }, line: { color: CARD_BORDER, width: 1 }, rectRadius: 0.15
      });

      slide.addText(p.icon, { x: x + 0.2, y: 1.8, w: 2.3, h: 0.5, fontSize: 26 });
      slide.addText(p.title, { x: x + 0.2, y: 2.4, w: 2.3, h: 0.6, fontSize: 13, bold: true, color: TEXT_WHITE });

      const pBullets = p.points.map(pt => ({ text: pt, options: { bullet: true, color: TEXT_MUTED, fontSize: 10 } }));
      slide.addText(pBullets, { x: x + 0.2, y: 3.1, w: 2.3, h: 3.1, lineSpacingMultiple: 1.2 });
    });
  }

  // -------------------------------------------------------------
  // SLIDE 14: Conclusion & Institutional Rollout
  // -------------------------------------------------------------
  {
    const slide = pres.addSlide();
    addSlideHeader(slide, 'Institutional Rollout Roadmap: Partnering for a Safer Tomorrow', 'Partnership & Next Steps', 14);

    slide.addShape(pres.ShapeType.roundRect, {
      x: 0.8, y: 1.55, w: 7.2, h: 5.0,
      fill: { color: CARD_BG }, line: { color: CARD_BORDER, width: 1 }, rectRadius: 0.15
    });

    slide.addText('FOUR-PHASE CAMPUS IMPLEMENTATION PLAN', {
      x: 1.1, y: 1.8, w: 6.6, h: 0.3,
      fontSize: 11, bold: true, color: ACCENT_GREEN
    });

    const steps = [
      { text: 'Phase 1: Institutional MOU & Pilot Cohort (Week 1): Onboard Women Development Cell, hostel wardens, and a pilot batch of 200 students.', options: { bullet: true, color: TEXT_LIGHT, fontSize: 11 } },
      { text: 'Phase 2: Digital Web Onboarding Workshop (Week 2): Automated orientation for students to complete medical profiles and link 5 guardians via sakhisuraksha.veaglespace.com.', options: { bullet: true, color: TEXT_LIGHT, fontSize: 11 } },
      { text: 'Phase 3: Parent Awareness & Linking Session (Week 3): Live demo webinar for parents showcasing the Parent Dashboard, WhatsApp alerts, and 60fps tracking.', options: { bullet: true, color: TEXT_LIGHT, fontSize: 11 } },
      { text: 'Phase 4: 24/7 Protection Active & Safety Drills (Week 4): Routine campus safety check-in drills and integrated emergency response coordination with local authorities.', options: { bullet: true, color: TEXT_LIGHT, fontSize: 11 } }
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
      { text: 'Developer:', options: { bold: true, color: TEXT_WHITE, fontSize: 10 } },
      { text: ' Veagle Space Technology Pvt. Ltd.\n\n', options: { color: TEXT_LIGHT, fontSize: 10 } },
      { text: 'Helpline:', options: { bold: true, color: TEXT_WHITE, fontSize: 10 } },
      { text: ' +91 92252 41608\n\n', options: { color: ACCENT_GREEN, fontSize: 10 } },
      { text: 'Availability:', options: { bold: true, color: TEXT_WHITE, fontSize: 10 } },
      { text: ' Google Play Store & Apple App Store', options: { color: TEXT_LIGHT, fontSize: 10 } }
    ];
    slide.addText(contactDetails, { x: 8.6, y: 3.8, w: 3.6, h: 2.5 });
  }

  // Save the presentation - Try original name first, fallback to _Fixed if locked
  const targetPath = path.join(__dirname, '..', 'Veagle_Safety_College_Presentation.pptx');
  const fixedPath = path.join(__dirname, '..', 'Veagle_Safety_College_Presentation_Fixed.pptx');

  try {
    await pres.writeFile({ fileName: targetPath });
    console.log(`Successfully updated: ${targetPath}`);
  } catch (err) {
    console.warn(`File locked by PowerPoint (${err.message}). Saving to Fixed filename...`);
    await pres.writeFile({ fileName: fixedPath });
    console.log(`Successfully created: ${fixedPath}`);
  }
}

createDeck().catch(err => {
  console.error('Error generating presentation:', err);
  process.exit(1);
});
