/**
 * Polotno Presentation Template Generator
 * Converts AI-generated deck data into pixel-perfect Polotno JSON slide elements.
 */

export interface PolotnoElement {
  id: string
  type: string
  name?: string
  x: number
  y: number
  width?: number
  height?: number
  rotation?: number
  opacity?: number
  text?: string
  fontSize?: number
  fontFamily?: string
  fontStyle?: string
  fontWeight?: string | number
  fill?: string
  align?: string
  src?: string
  cornerRadius?: number
  stroke?: string
  strokeWidth?: number
  shadowColor?: string
  shadowBlur?: number
  shadowOpacity?: number
  [key: string]: any
}

export interface PolotnoPage {
  id: string
  background: string
  children: PolotnoElement[]
  elements?: PolotnoElement[]
}

/**
 * Resolves an instant, high-speed, photorealistic 16:9 Unsplash image tailored specifically
 * to the slide's unique keyword or topic, with open CORS enabled.
 */
export function resolveReliableSlideImage(query: string, index: number, customUrl?: string): string {
  if (customUrl && (customUrl.includes('images.unsplash.com') || customUrl.includes('images.pexels.com'))) {
    return customUrl
  }

  const q = (query || '').toLowerCase()

  // 1. Drones & Aerial Logistics
  if (q.includes('drone') || q.includes('aerial') || q.includes('uav') || q.includes('flight') || q.includes('fly') || q.includes('quadcopter')) {
    const photos = [
      'https://images.unsplash.com/photo-1527977966376-1c8408f9f108?auto=format&fit=crop&w=1280&h=720&q=80',
      'https://images.unsplash.com/photo-1508614589041-895b88991e3e?auto=format&fit=crop&w=1280&h=720&q=80',
      'https://images.unsplash.com/photo-1473968512647-3e447244af8f?auto=format&fit=crop&w=1280&h=720&q=80',
      'https://images.unsplash.com/photo-1524143988100-c4298bc22b40?auto=format&fit=crop&w=1280&h=720&q=80',
    ]
    return photos[(index - 1) % photos.length]
  }

  // 2. Robotics & Smart Automation
  if (q.includes('robot') || q.includes('factory') || q.includes('automation') || q.includes('assembly') || q.includes('warehouse') || q.includes('arm')) {
    const photos = [
      'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=1280&h=720&q=80',
      'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=1280&h=720&q=80',
      'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1280&h=720&q=80',
      'https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=1280&h=720&q=80',
    ]
    return photos[(index - 1) % photos.length]
  }

  // 3. AI, Neural Networks & Intelligence
  if (q.includes('ai') || q.includes('neural') || q.includes('machine learning') || q.includes('algorithm') || q.includes('deep learning') || q.includes('intelligence')) {
    const photos = [
      'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?auto=format&fit=crop&w=1280&h=720&q=80',
      'https://images.unsplash.com/photo-1677442136019-21780efad99a?auto=format&fit=crop&w=1280&h=720&q=80',
      'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1280&h=720&q=80',
      'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1280&h=720&q=80',
    ]
    return photos[(index - 1) % photos.length]
  }

  // 4. Finance, Fintech, Investment & Venture Capital
  if (q.includes('finance') || q.includes('invest') || q.includes('venture') || q.includes('capital') || q.includes('fintech') || q.includes('trading') || q.includes('money') || q.includes('market') || q.includes('banking')) {
    const photos = [
      'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?auto=format&fit=crop&w=1280&h=720&q=80',
      'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=1280&h=720&q=80',
      'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1280&h=720&q=80',
      'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?auto=format&fit=crop&w=1280&h=720&q=80',
    ]
    return photos[(index - 1) % photos.length]
  }

  // 5. Crypto, Blockchain & Web3
  if (q.includes('crypto') || q.includes('blockchain') || q.includes('bitcoin') || q.includes('web3') || q.includes('token') || q.includes('ethereum')) {
    const photos = [
      'https://images.unsplash.com/photo-1622979135225-d2ba269bc1df?auto=format&fit=crop&w=1280&h=720&q=80',
      'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?auto=format&fit=crop&w=1280&h=720&q=80',
      'https://images.unsplash.com/photo-1642543492481-44e81e3914a7?auto=format&fit=crop&w=1280&h=720&q=80',
      'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1280&h=720&q=80',
    ]
    return photos[(index - 1) % photos.length]
  }

  // 6. Climate, Solar, Wind & Renewable Energy
  if (q.includes('climate') || q.includes('green') || q.includes('solar') || q.includes('wind') || q.includes('energy') || q.includes('sustain') || q.includes('eco') || q.includes('planet')) {
    const photos = [
      'https://images.unsplash.com/photo-1509391365360-2e959784a276?auto=format&fit=crop&w=1280&h=720&q=80',
      'https://images.unsplash.com/photo-1466611653911-95081537e5b7?auto=format&fit=crop&w=1280&h=720&q=80',
      'https://images.unsplash.com/photo-1532601224476-15c79f2f7a51?auto=format&fit=crop&w=1280&h=720&q=80',
      'https://images.unsplash.com/photo-1497435334941-8c899ee9e8e9?auto=format&fit=crop&w=1280&h=720&q=80',
    ]
    return photos[(index - 1) % photos.length]
  }

  // 7. Healthcare, Biotech, DNA & Medicine
  if (q.includes('health') || q.includes('med') || q.includes('bio') || q.includes('dna') || q.includes('pharma') || q.includes('doctor') || q.includes('clinic')) {
    const photos = [
      'https://images.unsplash.com/photo-1579154204601-01588f351e67?auto=format&fit=crop&w=1280&h=720&q=80',
      'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?auto=format&fit=crop&w=1280&h=720&q=80',
      'https://images.unsplash.com/photo-1530497610245-94d3c16cda28?auto=format&fit=crop&w=1280&h=720&q=80',
      'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=1280&h=720&q=80',
    ]
    return photos[(index - 1) % photos.length]
  }

  // 8. Space Exploration, Mars, Rockets & Satellites
  if (q.includes('space') || q.includes('mars') || q.includes('rocket') || q.includes('satellite') || q.includes('astronomy') || q.includes('orbit') || q.includes('cosmos')) {
    const photos = [
      'https://images.unsplash.com/photo-1614728894747-a83421e2b9c9?auto=format&fit=crop&w=1280&h=720&q=80',
      'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?auto=format&fit=crop&w=1280&h=720&q=80',
      'https://images.unsplash.com/photo-1517976487507-5d3b32371a7c?auto=format&fit=crop&w=1280&h=720&q=80',
      'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1280&h=720&q=80',
    ]
    return photos[(index - 1) % photos.length]
  }

  // 9. Logistics, Shipping, Supply Chain & Transport
  if (q.includes('logistics') || q.includes('shipping') || q.includes('delivery') || q.includes('cargo') || q.includes('supply chain') || q.includes('transport') || q.includes('fleet')) {
    const photos = [
      'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=1280&h=720&q=80',
      'https://images.unsplash.com/photo-1494412574643-ff11b0a5c1c3?auto=format&fit=crop&w=1280&h=720&q=80',
      'https://images.unsplash.com/photo-1578575437130-527eed3abbec?auto=format&fit=crop&w=1280&h=720&q=80',
      'https://images.unsplash.com/photo-1519003722824-194d4455a60c?auto=format&fit=crop&w=1280&h=720&q=80',
    ]
    return photos[(index - 1) % photos.length]
  }

  // 10. Software, Coding, Cyber Security & Infrastructure
  if (q.includes('software') || q.includes('code') || q.includes('cyber') || q.includes('security') || q.includes('cloud') || q.includes('developer') || q.includes('server')) {
    const photos = [
      'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=1280&h=720&q=80',
      'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1280&h=720&q=80',
      'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=1280&h=720&q=80',
      'https://images.unsplash.com/photo-1504639725590-34d0984388bd?auto=format&fit=crop&w=1280&h=720&q=80',
    ]
    return photos[(index - 1) % photos.length]
  }

  // 11. Media, Creator, Cinema & Audio
  if (q.includes('creator') || q.includes('media') || q.includes('video') || q.includes('film') || q.includes('studio') || q.includes('cinema') || q.includes('audio') || q.includes('music')) {
    const photos = [
      'https://images.unsplash.com/photo-1536240478700-b869070f9279?auto=format&fit=crop&w=1280&h=720&q=80',
      'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&w=1280&h=720&q=80',
      'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1280&h=720&q=80',
      'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&w=1280&h=720&q=80',
    ]
    return photos[(index - 1) % photos.length]
  }

  // 12. Smart City, Architecture & Real Estate
  if (q.includes('architecture') || q.includes('city') || q.includes('building') || q.includes('skyline') || q.includes('real estate') || q.includes('urban')) {
    const photos = [
      'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1280&h=720&q=80',
      'https://images.unsplash.com/photo-1477959858617-67f30bc75b82?auto=format&fit=crop&w=1280&h=720&q=80',
      'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1280&h=720&q=80',
      'https://images.unsplash.com/photo-1506146332389-18140dc7b2fb?auto=format&fit=crop&w=1280&h=720&q=80',
    ]
    return photos[(index - 1) % photos.length]
  }

  // 13. Automotive, EV & Future Mobility
  if (q.includes('car') || q.includes('automotive') || q.includes('vehicle') || q.includes('ev') || q.includes('mobility')) {
    const photos = [
      'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1280&h=720&q=80',
      'https://images.unsplash.com/photo-1553440569-bcc63803a83d?auto=format&fit=crop&w=1280&h=720&q=80',
      'https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&w=1280&h=720&q=80',
      'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=1280&h=720&q=80',
    ]
    return photos[(index - 1) % photos.length]
  }

  // Fallback: Ultra-crisp high-tech studio photography
  const defaultPhotos = [
    'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1280&h=720&q=80',
    'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1280&h=720&q=80',
    'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=1280&h=720&q=80',
    'https://images.unsplash.com/photo-1508614589041-895b88991e3e?auto=format&fit=crop&w=1280&h=720&q=80',
  ]
  return defaultPhotos[(index - 1) % defaultPhotos.length]
}

/**
 * Builds a Cover Slide Page
 */
export function createCoverSlidePage(
  id: string,
  title: string,
  subtitle: string,
  theme: { bg_color: string; card_bg: string; accent: string; text_primary: string; text_secondary: string },
  imageUrl: string,
): PolotnoPage {
  const children: PolotnoElement[] = [
    // Top Accent Pill Container
    {
      id: `${id}_badge_bg`,
      type: 'figure',
      name: 'rect',
      x: 80,
      y: 74,
      width: 290,
      height: 34,
      fill: theme.card_bg,
      cornerRadius: 17,
      stroke: `${theme.accent}66`,
      strokeWidth: 1.5,
    },
    // Pill Accent Dot
    {
      id: `${id}_badge_dot`,
      type: 'figure',
      name: 'circle',
      x: 94,
      y: 86,
      width: 10,
      height: 10,
      fill: theme.accent,
    },
    // Category / Brand badge
    {
      id: `${id}_badge`,
      type: 'text',
      x: 114,
      y: 83,
      width: 250,
      text: 'VIDCRAFT AI · KEYNOTE 2026',
      fontSize: 12,
      fontFamily: 'Inter',
      fontWeight: 'bold',
      fill: theme.accent,
    },
    // Grand Headline
    {
      id: `${id}_title`,
      type: 'text',
      x: 80,
      y: 145,
      width: 580,
      text: title,
      fontSize: 50,
      fontFamily: 'Barlow Condensed',
      fontWeight: 'bold',
      fill: theme.text_primary,
    },
    // Subtitle
    {
      id: `${id}_sub`,
      type: 'text',
      x: 80,
      y: 335,
      width: 560,
      text: subtitle || 'Autonomous Multi-Agent Architecture & Synthesis',
      fontSize: 20,
      fontFamily: 'Inter',
      fill: theme.accent,
    },
    // Right-side 16:9 Hero Image Card
    {
      id: `${id}_img`,
      type: 'image',
      x: 690,
      y: 120,
      width: 510,
      height: 440,
      src: imageUrl,
      cornerRadius: 22,
      shadowColor: '#000000',
      shadowBlur: 30,
      shadowOpacity: 0.55,
      stroke: `${theme.accent}44`,
      strokeWidth: 2,
    },
    // Bottom Highlight Pillars (3 pills along bottom)
    {
      id: `${id}_pill_1`,
      type: 'figure',
      name: 'rect',
      x: 80,
      y: 590,
      width: 175,
      height: 42,
      fill: theme.card_bg,
      cornerRadius: 12,
      stroke: `${theme.accent}33`,
      strokeWidth: 1,
    },
    {
      id: `${id}_pill_text_1`,
      type: 'text',
      x: 80,
      y: 602,
      width: 175,
      text: '⚡ Autonomous Scale',
      fontSize: 13,
      fontFamily: 'Inter',
      fontWeight: 'bold',
      fill: theme.text_primary,
      align: 'center',
    },
    {
      id: `${id}_pill_2`,
      type: 'figure',
      name: 'rect',
      x: 275,
      y: 590,
      width: 175,
      height: 42,
      fill: theme.card_bg,
      cornerRadius: 12,
      stroke: `${theme.accent}33`,
      strokeWidth: 1,
    },
    {
      id: `${id}_pill_text_2`,
      type: 'text',
      x: 275,
      y: 602,
      width: 175,
      text: '✦ Grounded Context',
      fontSize: 13,
      fontFamily: 'Inter',
      fontWeight: 'bold',
      fill: theme.text_primary,
      align: 'center',
    },
    {
      id: `${id}_pill_3`,
      type: 'figure',
      name: 'rect',
      x: 470,
      y: 590,
      width: 175,
      height: 42,
      fill: theme.card_bg,
      cornerRadius: 12,
      stroke: `${theme.accent}33`,
      strokeWidth: 1,
    },
    {
      id: `${id}_pill_text_3`,
      type: 'text',
      x: 470,
      y: 602,
      width: 175,
      text: '🛡 Enterprise Verified',
      fontSize: 13,
      fontFamily: 'Inter',
      fontWeight: 'bold',
      fill: theme.text_primary,
      align: 'center',
    },
    // Bottom footer text
    {
      id: `${id}_foot`,
      type: 'text',
      x: 80,
      y: 662,
      width: 400,
      text: 'CONFIDENTIAL & PROPRIETARY · 2026',
      fontSize: 11,
      fontFamily: 'Inter',
      fill: theme.text_secondary,
    },
  ]

  return {
    id,
    background: theme.bg_color,
    children,
    elements: children,
  }
}

/**
 * Builds a Stat / Metric Callout Slide
 */
export function createStatSlidePage(
  id: string,
  title: string,
  subtitle: string,
  statNumber: string,
  statLabel: string,
  bullets: string[],
  theme: { bg_color: string; card_bg: string; accent: string; text_primary: string; text_secondary: string },
): PolotnoPage {
  const children: PolotnoElement[] = [
    // Top category badge
    {
      id: `${id}_badge`,
      type: 'text',
      x: 80,
      y: 60,
      width: 400,
      text: '📊 QUANTIFIABLE IMPACT & VELOCITY',
      fontSize: 12,
      fontFamily: 'Inter',
      fontWeight: 'bold',
      fill: theme.accent,
    },
    // Left Stat Card Background
    {
      id: `${id}_stat_card`,
      type: 'figure',
      name: 'rect',
      x: 80,
      y: 110,
      width: 450,
      height: 520,
      fill: theme.card_bg,
      cornerRadius: 24,
      stroke: theme.accent,
      strokeWidth: 2,
      shadowColor: '#000000',
      shadowBlur: 25,
      shadowOpacity: 0.45,
    },
    // Giant Stat Metric
    {
      id: `${id}_stat_num`,
      type: 'text',
      x: 100,
      y: 160,
      width: 410,
      text: statNumber || '10x',
      fontSize: 104,
      fontFamily: 'Barlow Condensed',
      fontWeight: 'bold',
      fill: theme.accent,
      align: 'center',
    },
    // Stat Label
    {
      id: `${id}_stat_lbl`,
      type: 'text',
      x: 120,
      y: 295,
      width: 370,
      text: statLabel || 'Acceleration in operational velocity achieved',
      fontSize: 20,
      fontFamily: 'Inter',
      fontWeight: 'bold',
      fill: theme.text_primary,
      align: 'center',
    },
    // Mini visual progress track
    {
      id: `${id}_stat_track`,
      type: 'figure',
      name: 'rect',
      x: 130,
      y: 410,
      width: 350,
      height: 8,
      fill: `${theme.accent}33`,
      cornerRadius: 4,
    },
    {
      id: `${id}_stat_fill`,
      type: 'figure',
      name: 'rect',
      x: 130,
      y: 410,
      width: 290,
      height: 8,
      fill: theme.accent,
      cornerRadius: 4,
    },
    // Trend indicator pill
    {
      id: `${id}_trend_pill`,
      type: 'figure',
      name: 'rect',
      x: 165,
      y: 450,
      width: 280,
      height: 38,
      fill: `${theme.accent}22`,
      cornerRadius: 19,
      stroke: `${theme.accent}55`,
      strokeWidth: 1.5,
    },
    {
      id: `${id}_trend_text`,
      type: 'text',
      x: 165,
      y: 460,
      width: 280,
      text: '▲ Production Throughput Validated',
      fontSize: 13,
      fontFamily: 'Inter',
      fontWeight: 'bold',
      fill: theme.accent,
      align: 'center',
    },
    // Right Column Headline
    {
      id: `${id}_title`,
      type: 'text',
      x: 580,
      y: 110,
      width: 620,
      text: title,
      fontSize: 42,
      fontFamily: 'Barlow Condensed',
      fontWeight: 'bold',
      fill: theme.text_primary,
    },
    // Subtitle
    {
      id: `${id}_sub`,
      type: 'text',
      x: 580,
      y: 180,
      width: 620,
      text: subtitle,
      fontSize: 18,
      fontFamily: 'Inter',
      fill: theme.accent,
    },
    // Bullet list cards
    ...(bullets && bullets.length > 0 ? bullets : [
      'Eliminated manual workflow bottlenecks through deterministic agent routing',
      'Near-zero latency across real-time generation, validation, and review',
      'Unified delivery across Interactive Web, MP4 Video, and PowerPoint PPTX',
    ]).slice(0, 3).flatMap((b, idx) => [
      {
        id: `${id}_b_card_${idx}`,
        type: 'figure',
        name: 'rect',
        x: 580,
        y: 250 + idx * 115,
        width: 620,
        height: 95,
        fill: theme.card_bg,
        cornerRadius: 16,
        stroke: `${theme.accent}33`,
        strokeWidth: 1,
      },
      {
        id: `${id}_b_dot_${idx}`,
        type: 'figure',
        name: 'circle',
        x: 605,
        y: 275 + idx * 115,
        width: 12,
        height: 12,
        fill: theme.accent,
      },
      {
        id: `${id}_b_text_${idx}`,
        type: 'text',
        x: 630,
        y: 268 + idx * 115,
        width: 545,
        text: b,
        fontSize: 16,
        fontFamily: 'Inter',
        fill: theme.text_primary,
      },
    ]),
  ]

  return {
    id,
    background: theme.bg_color,
    children,
    elements: children,
  }
}

/**
 * Builds a Three-Column Feature Bento Slide
 */
export function createThreeColumnSlidePage(
  id: string,
  title: string,
  subtitle: string,
  items: Array<{ title: string; desc: string }>,
  theme: { bg_color: string; card_bg: string; accent: string; text_primary: string; text_secondary: string },
): PolotnoPage {
  const colWidth = 346
  const gap = 40
  const startX = 80

  const colElements: PolotnoElement[] = []
  items.slice(0, 3).forEach((item, idx) => {
    const colX = startX + idx * (colWidth + gap)
    // Card background
    colElements.push({
      id: `${id}_card_${idx}`,
      type: 'figure',
      name: 'rect',
      x: colX,
      y: 200,
      width: colWidth,
      height: 450,
      fill: theme.card_bg,
      cornerRadius: 22,
      stroke: `${theme.accent}55`,
      strokeWidth: 1.5,
      shadowColor: '#000000',
      shadowBlur: 20,
      shadowOpacity: 0.35,
    })
    // Number badge rounded container
    colElements.push({
      id: `${id}_badge_bg_${idx}`,
      type: 'figure',
      name: 'rect',
      x: colX + 30,
      y: 235,
      width: 52,
      height: 40,
      fill: `${theme.accent}25`,
      cornerRadius: 10,
      stroke: `${theme.accent}66`,
      strokeWidth: 1,
    })
    // Number badge text
    colElements.push({
      id: `${id}_badge_${idx}`,
      type: 'text',
      x: colX + 30,
      y: 242,
      width: 52,
      text: `0${idx + 1}`,
      fontSize: 22,
      fontFamily: 'Barlow Condensed',
      fontWeight: 'bold',
      fill: theme.accent,
      align: 'center',
    })
    // Item Title
    colElements.push({
      id: `${id}_title_${idx}`,
      type: 'text',
      x: colX + 30,
      y: 310,
      width: colWidth - 60,
      text: item.title,
      fontSize: 24,
      fontFamily: 'Inter',
      fontWeight: 'bold',
      fill: theme.text_primary,
    })
    // Item Description
    colElements.push({
      id: `${id}_desc_${idx}`,
      type: 'text',
      x: colX + 30,
      y: 385,
      width: colWidth - 60,
      text: item.desc,
      fontSize: 16,
      fontFamily: 'Inter',
      fill: theme.text_secondary,
    })
    // Bottom accent indicator bar
    colElements.push({
      id: `${id}_bar_${idx}`,
      type: 'figure',
      name: 'rect',
      x: colX + 30,
      y: 595,
      width: 80,
      height: 3,
      fill: theme.accent,
      cornerRadius: 2,
    })
  })

  const children: PolotnoElement[] = [
    // Top category badge
    {
      id: `${id}_badge`,
      type: 'text',
      x: 80,
      y: 50,
      width: 400,
      text: '⚡ CORE ARCHITECTURAL PILLARS',
      fontSize: 12,
      fontFamily: 'Inter',
      fontWeight: 'bold',
      fill: theme.accent,
    },
    {
      id: `${id}_title`,
      type: 'text',
      x: 80,
      y: 80,
      width: 1120,
      text: title,
      fontSize: 44,
      fontFamily: 'Barlow Condensed',
      fontWeight: 'bold',
      fill: theme.text_primary,
    },
    {
      id: `${id}_sub`,
      type: 'text',
      x: 80,
      y: 145,
      width: 1120,
      text: subtitle,
      fontSize: 18,
      fontFamily: 'Inter',
      fill: theme.accent,
    },
    ...colElements,
  ]

  return {
    id,
    background: theme.bg_color,
    children,
    elements: children,
  }
}

/**
 * Builds a Split Visual Slide
 */
export function createSplitVisualSlidePage(
  id: string,
  title: string,
  subtitle: string,
  bullets: string[],
  imageUrl: string,
  theme: { bg_color: string; card_bg: string; accent: string; text_primary: string; text_secondary: string },
): PolotnoPage {
  const children: PolotnoElement[] = [
    // Top category badge
    {
      id: `${id}_badge`,
      type: 'text',
      x: 80,
      y: 50,
      width: 400,
      text: '✦ STRATEGIC DISRUPTION & CAPABILITIES',
      fontSize: 12,
      fontFamily: 'Inter',
      fontWeight: 'bold',
      fill: theme.accent,
    },
    {
      id: `${id}_title`,
      type: 'text',
      x: 80,
      y: 80,
      width: 540,
      text: title,
      fontSize: 42,
      fontFamily: 'Barlow Condensed',
      fontWeight: 'bold',
      fill: theme.text_primary,
    },
    {
      id: `${id}_sub`,
      type: 'text',
      x: 80,
      y: 155,
      width: 540,
      text: subtitle,
      fontSize: 18,
      fontFamily: 'Inter',
      fill: theme.accent,
    },
    // Bullet list cards
    ...(bullets && bullets.length > 0 ? bullets : [
      'Autonomous decision engine coordinating real-time execution loops',
      'Context-grounded reasoning without hallucination risks',
      'Universal output rendering across interactive web, video, and PPTX',
    ]).slice(0, 3).flatMap((b, idx) => [
      {
        id: `${id}_b_card_${idx}`,
        type: 'figure',
        name: 'rect',
        x: 80,
        y: 220 + idx * 125,
        width: 540,
        height: 100,
        fill: theme.card_bg,
        cornerRadius: 16,
        stroke: `${theme.accent}33`,
        strokeWidth: 1,
      },
      {
        id: `${id}_b_dot_${idx}`,
        type: 'figure',
        name: 'circle',
        x: 105,
        y: 245 + idx * 125,
        width: 10,
        height: 10,
        fill: theme.accent,
      },
      {
        id: `${id}_b_text_${idx}`,
        type: 'text',
        x: 130,
        y: 238 + idx * 125,
        width: 465,
        text: b,
        fontSize: 16,
        fontFamily: 'Inter',
        fill: theme.text_primary,
      },
    ]),
    // Right 16:9 Image
    {
      id: `${id}_img`,
      type: 'image',
      x: 660,
      y: 80,
      width: 540,
      height: 550,
      src: imageUrl,
      cornerRadius: 22,
      shadowColor: '#000000',
      shadowBlur: 25,
      shadowOpacity: 0.5,
      stroke: `${theme.accent}44`,
      strokeWidth: 2,
    },
  ]

  return {
    id,
    background: theme.bg_color,
    children,
    elements: children,
  }
}

/**
 * Builds a Phased Timeline / Roadmap Slide
 */
export function createTimelineSlidePage(
  id: string,
  title: string,
  subtitle: string,
  steps: Array<{ step: string; label: string }>,
  theme: { bg_color: string; card_bg: string; accent: string; text_primary: string; text_secondary: string },
): PolotnoPage {
  const cardWidth = 340
  const gap = 46
  const startX = 80
  const displaySteps =
    steps && steps.length >= 2
      ? steps.slice(0, 3)
      : [
          { step: 'Phase 01', label: 'Architecture & Ingestion' },
          { step: 'Phase 02', label: 'Agent Synthesis & RAG' },
          { step: 'Phase 03', label: 'Universal Scale & Rollout' },
        ]

  const stepElements: PolotnoElement[] = [
    // Connecting horizontal timeline track
    {
      id: `${id}_track`,
      type: 'figure',
      name: 'rect',
      x: 120,
      y: 250,
      width: 1040,
      height: 4,
      fill: `${theme.accent}55`,
      cornerRadius: 2,
    },
  ]

  const phaseTags = ['COMPLETE', 'IN PROGRESS', 'TARGET']

  displaySteps.forEach((st, idx) => {
    const cardX = startX + idx * (cardWidth + gap)
    // Milestone Marker Circle
    stepElements.push({
      id: `${id}_marker_${idx}`,
      type: 'figure',
      name: 'circle',
      x: cardX + 32,
      y: 238,
      width: 28,
      height: 28,
      fill: idx === 0 ? theme.accent : theme.card_bg,
      stroke: theme.accent,
      strokeWidth: 3,
    })
    // Milestone Card Container
    stepElements.push({
      id: `${id}_card_${idx}`,
      type: 'figure',
      name: 'rect',
      x: cardX,
      y: 290,
      width: cardWidth,
      height: 350,
      fill: theme.card_bg,
      cornerRadius: 20,
      stroke: `${theme.accent}55`,
      strokeWidth: 1.5,
      shadowColor: '#000000',
      shadowBlur: 20,
      shadowOpacity: 0.35,
    })
    // Phase Status Badge
    stepElements.push({
      id: `${id}_pill_${idx}`,
      type: 'figure',
      name: 'rect',
      x: cardX + 28,
      y: 318,
      width: 110,
      height: 28,
      fill: `${theme.accent}20`,
      cornerRadius: 8,
      stroke: `${theme.accent}44`,
      strokeWidth: 1,
    })
    stepElements.push({
      id: `${id}_pill_txt_${idx}`,
      type: 'text',
      x: cardX + 28,
      y: 324,
      width: 110,
      text: phaseTags[idx] || 'MILESTONE',
      fontSize: 11,
      fontFamily: 'Inter',
      fontWeight: 'bold',
      fill: theme.accent,
      align: 'center',
    })
    // Step Tag
    stepElements.push({
      id: `${id}_tag_${idx}`,
      type: 'text',
      x: cardX + 28,
      y: 360,
      width: cardWidth - 56,
      text: st.step.toUpperCase(),
      fontSize: 16,
      fontFamily: 'Barlow Condensed',
      fontWeight: 'bold',
      fill: theme.accent,
    })
    // Step Label
    stepElements.push({
      id: `${id}_label_${idx}`,
      type: 'text',
      x: cardX + 28,
      y: 400,
      width: cardWidth - 56,
      text: st.label,
      fontSize: 22,
      fontFamily: 'Inter',
      fontWeight: 'bold',
      fill: theme.text_primary,
    })
    // Subtle indicator note
    stepElements.push({
      id: `${id}_note_${idx}`,
      type: 'text',
      x: cardX + 28,
      y: 490,
      width: cardWidth - 56,
      text: `Deterministic milestone gates with real-time automated verification criteria.`,
      fontSize: 14,
      fontFamily: 'Inter',
      fill: theme.text_secondary,
    })
  })

  const children: PolotnoElement[] = [
    // Top category badge
    {
      id: `${id}_badge`,
      type: 'text',
      x: 80,
      y: 45,
      width: 400,
      text: '✦ STRATEGIC EXECUTION ROADMAP',
      fontSize: 12,
      fontFamily: 'Inter',
      fontWeight: 'bold',
      fill: theme.accent,
    },
    {
      id: `${id}_title`,
      type: 'text',
      x: 80,
      y: 75,
      width: 1120,
      text: title,
      fontSize: 44,
      fontFamily: 'Barlow Condensed',
      fontWeight: 'bold',
      fill: theme.text_primary,
    },
    {
      id: `${id}_sub`,
      type: 'text',
      x: 80,
      y: 140,
      width: 1120,
      text: subtitle,
      fontSize: 18,
      fontFamily: 'Inter',
      fill: theme.accent,
    },
    ...stepElements,
  ]

  return {
    id,
    background: theme.bg_color,
    children,
    elements: children,
  }
}

/**
 * Builds an Analytics / Trajectory Bar Chart Slide
 */
export function createChartSlidePage(
  id: string,
  title: string,
  subtitle: string,
  chartData: { title?: string; labels: string[]; values: number[]; unit?: string } | undefined,
  bullets: string[],
  theme: { bg_color: string; card_bg: string; accent: string; text_primary: string; text_secondary: string },
): PolotnoPage {
  const data = chartData || {
    title: 'Exponential Velocity & Adoption',
    labels: ['2023', '2024', '2025', '2026E'],
    values: [28, 64, 145, 380],
    unit: 'k Units',
  }

  const values = data.values && data.values.length > 0 ? data.values : [25, 55, 120, 310]
  const labels = data.labels && data.labels.length > 0 ? data.labels : ['2023', '2024', '2025', '2026E']
  const maxVal = Math.max(...values, 1)

  const chartX = 580
  const chartY = 110
  const chartWidth = 620
  const chartHeight = 530
  const barWidth = 68
  const gap = Math.max(20, (chartWidth - 100 - labels.length * barWidth) / Math.max(1, labels.length - 1))

  const chartElements: PolotnoElement[] = [
    // Chart Card Container
    {
      id: `${id}_chart_card`,
      type: 'figure',
      name: 'rect',
      x: chartX,
      y: chartY,
      width: chartWidth,
      height: chartHeight,
      fill: theme.card_bg,
      cornerRadius: 24,
      stroke: `${theme.accent}66`,
      strokeWidth: 2,
      shadowColor: '#000000',
      shadowBlur: 25,
      shadowOpacity: 0.45,
    },
    // Chart Header
    {
      id: `${id}_chart_head`,
      type: 'text',
      x: chartX + 36,
      y: chartY + 30,
      width: chartWidth - 72,
      text: (data.title || 'BENCHMARK METRICS · EXPONENTIAL TRAJECTORY').toUpperCase(),
      fontSize: 14,
      fontFamily: 'Inter',
      fontWeight: 'bold',
      fill: theme.accent,
    },
    // Unit tag
    {
      id: `${id}_chart_unit`,
      type: 'text',
      x: chartX + 36,
      y: chartY + 58,
      width: chartWidth - 72,
      text: `Measured in: ${data.unit || 'Index Units'}`,
      fontSize: 13,
      fontFamily: 'Inter',
      fill: theme.text_secondary,
    },
    // Growth badge pill in top right of card
    {
      id: `${id}_chart_badge_bg`,
      type: 'figure',
      name: 'rect',
      x: chartX + chartWidth - 170,
      y: chartY + 28,
      width: 134,
      height: 30,
      fill: `${theme.accent}25`,
      cornerRadius: 15,
      stroke: theme.accent,
      strokeWidth: 1,
    },
    {
      id: `${id}_chart_badge_txt`,
      type: 'text',
      x: chartX + chartWidth - 170,
      y: chartY + 35,
      width: 134,
      text: '▲ +380% YOY',
      fontSize: 12,
      fontFamily: 'Inter',
      fontWeight: 'bold',
      fill: theme.accent,
      align: 'center',
    },
    // Baseline horizontal line
    {
      id: `${id}_chart_baseline`,
      type: 'figure',
      name: 'rect',
      x: chartX + 36,
      y: chartY + chartHeight - 75,
      width: chartWidth - 72,
      height: 2,
      fill: `${theme.text_secondary}44`,
    },
  ]

  // Render individual bars
  values.forEach((val, idx) => {
    const barH = Math.max(32, Math.round((val / maxVal) * 280))
    const bx = chartX + 50 + idx * (barWidth + gap)
    const by = chartY + chartHeight - 75 - barH

    // Vertical Bar
    chartElements.push({
      id: `${id}_bar_${idx}`,
      type: 'figure',
      name: 'rect',
      x: bx,
      y: by,
      width: barWidth,
      height: barH,
      fill: idx === values.length - 1 ? theme.accent : `${theme.accent}88`,
      cornerRadius: 12,
      stroke: theme.accent,
      strokeWidth: idx === values.length - 1 ? 2 : 1,
    })

    // Value number above bar
    chartElements.push({
      id: `${id}_val_${idx}`,
      type: 'text',
      x: bx - 10,
      y: by - 34,
      width: barWidth + 20,
      text: `${val}`,
      fontSize: 18,
      fontFamily: 'Barlow Condensed',
      fontWeight: 'bold',
      fill: idx === values.length - 1 ? theme.accent : theme.text_primary,
      align: 'center',
    })

    // X-Axis label below baseline
    chartElements.push({
      id: `${id}_lbl_${idx}`,
      type: 'text',
      x: bx - 10,
      y: chartY + chartHeight - 60,
      width: barWidth + 20,
      text: labels[idx] || `P${idx + 1}`,
      fontSize: 14,
      fontFamily: 'Inter',
      fontWeight: 'bold',
      fill: idx === values.length - 1 ? theme.accent : theme.text_secondary,
      align: 'center',
    })
  })

  // Left column summary
  const leftElements: PolotnoElement[] = [
    // Top category badge
    {
      id: `${id}_badge`,
      type: 'text',
      x: 80,
      y: 50,
      width: 400,
      text: '📊 DATA METRICS & TRAJECTORY',
      fontSize: 12,
      fontFamily: 'Inter',
      fontWeight: 'bold',
      fill: theme.accent,
    },
    {
      id: `${id}_title`,
      type: 'text',
      x: 80,
      y: 80,
      width: 470,
      text: title,
      fontSize: 42,
      fontFamily: 'Barlow Condensed',
      fontWeight: 'bold',
      fill: theme.text_primary,
    },
    {
      id: `${id}_sub`,
      type: 'text',
      x: 80,
      y: 155,
      width: 470,
      text: subtitle,
      fontSize: 18,
      fontFamily: 'Inter',
      fill: theme.accent,
    },
    // Bullet cards on left
    ...(bullets && bullets.length > 0 ? bullets : [
      'Compound adoption accelerating quarter-over-quarter across nodes',
      'Direct unit-cost reduction exceeding 72% at production scale',
      'Predictable pipeline capacity scaling linearly with infrastructure',
    ]).slice(0, 3).flatMap((b, idx) => [
      {
        id: `${id}_left_card_${idx}`,
        type: 'figure',
        name: 'rect',
        x: 80,
        y: 225 + idx * 125,
        width: 470,
        height: 105,
        fill: theme.card_bg,
        cornerRadius: 16,
        stroke: `${theme.accent}33`,
        strokeWidth: 1,
      },
      {
        id: `${id}_left_dot_${idx}`,
        type: 'figure',
        name: 'circle',
        x: 105,
        y: 250 + idx * 125,
        width: 10,
        height: 10,
        fill: theme.accent,
      },
      {
        id: `${id}_left_txt_${idx}`,
        type: 'text',
        x: 125,
        y: 242 + idx * 125,
        width: 405,
        text: b,
        fontSize: 15,
        fontFamily: 'Inter',
        fill: theme.text_primary,
      },
    ]),
  ]

  const children = [...leftElements, ...chartElements]
  return {
    id,
    background: theme.bg_color,
    children,
    elements: children,
  }
}

/**
 * Builds an Executive Quote / Vision Slide (Fixing the user's plain box screenshot!)
 */
export function createQuoteSlidePage(
  id: string,
  title: string,
  subtitle: string,
  bullets: string[],
  theme: { bg_color: string; card_bg: string; accent: string; text_primary: string; text_secondary: string },
): PolotnoPage {
  const quoteText =
    bullets && bullets.length > 0
      ? `"${bullets[0]}"`
      : `"${title}: Empowering creators and engineers to move at the speed of thought through autonomous intelligence."`

  const children: PolotnoElement[] = [
    // Top category badge pill
    {
      id: `${id}_top_badge_bg`,
      type: 'figure',
      name: 'rect',
      x: 80,
      y: 50,
      width: 280,
      height: 32,
      fill: theme.card_bg,
      cornerRadius: 16,
      stroke: `${theme.accent}66`,
      strokeWidth: 1.5,
    },
    {
      id: `${id}_top_badge_dot`,
      type: 'figure',
      name: 'circle',
      x: 96,
      y: 61,
      width: 10,
      height: 10,
      fill: theme.accent,
    },
    {
      id: `${id}_top_badge_text`,
      type: 'text',
      x: 114,
      y: 58,
      width: 230,
      text: '✦ EXECUTIVE VISION & TAKEAWAY',
      fontSize: 12,
      fontFamily: 'Inter',
      fontWeight: 'bold',
      fill: theme.accent,
    },
    // Grand backdrop hero card
    {
      id: `${id}_backdrop`,
      type: 'figure',
      name: 'rect',
      x: 80,
      y: 100,
      width: 1120,
      height: 440,
      fill: theme.card_bg,
      cornerRadius: 24,
      stroke: `${theme.accent}66`,
      strokeWidth: 2,
      shadowColor: '#000000',
      shadowBlur: 35,
      shadowOpacity: 0.5,
    },
    // Huge decorative quotation mark
    {
      id: `${id}_quote_mark`,
      type: 'text',
      x: 130,
      y: 110,
      width: 120,
      text: '“',
      fontSize: 130,
      fontFamily: 'Georgia',
      fontWeight: 'bold',
      fill: theme.accent,
      opacity: 0.35,
    },
    // Grand quote headline
    {
      id: `${id}_quote_body`,
      type: 'text',
      x: 130,
      y: 200,
      width: 1020,
      text: quoteText,
      fontSize: 34,
      fontFamily: 'Barlow Condensed',
      fontWeight: 'bold',
      fill: theme.text_primary,
      align: 'center',
    },
    // Horizontal accent divider
    {
      id: `${id}_divider`,
      type: 'figure',
      name: 'rect',
      x: 540,
      y: 375,
      width: 200,
      height: 3,
      fill: theme.accent,
      cornerRadius: 2,
    },
    // Speaker attribution
    {
      id: `${id}_author`,
      type: 'text',
      x: 130,
      y: 405,
      width: 1020,
      text: (subtitle || title || 'The Future in Flight').toUpperCase(),
      fontSize: 20,
      fontFamily: 'Inter',
      fontWeight: 'bold',
      fill: theme.accent,
      align: 'center',
    },
    // Subtitle / context
    {
      id: `${id}_author_sub`,
      type: 'text',
      x: 130,
      y: 445,
      width: 1020,
      text: 'VIDCRAFT MULTI-AGENT MEDIA ENGINE · KEYNOTE 2026',
      fontSize: 13,
      fontFamily: 'Inter',
      fill: theme.text_secondary,
      align: 'center',
    },
    // Bottom 3 Takeaway Cards
    {
      id: `${id}_bot_card_1`,
      type: 'figure',
      name: 'rect',
      x: 80,
      y: 565,
      width: 350,
      height: 90,
      fill: theme.card_bg,
      cornerRadius: 16,
      stroke: `${theme.accent}44`,
      strokeWidth: 1,
    },
    {
      id: `${id}_bot_tag_1`,
      type: 'text',
      x: 100,
      y: 578,
      width: 310,
      text: '🚀 AUTONOMOUS DISPATCH',
      fontSize: 12,
      fontFamily: 'Inter',
      fontWeight: 'bold',
      fill: theme.accent,
    },
    {
      id: `${id}_bot_txt_1`,
      type: 'text',
      x: 100,
      y: 602,
      width: 310,
      text: bullets?.[1] || 'Real-time agent coordination across end-to-end workflows.',
      fontSize: 13,
      fontFamily: 'Inter',
      fill: theme.text_secondary,
    },
    {
      id: `${id}_bot_card_2`,
      type: 'figure',
      name: 'rect',
      x: 465,
      y: 565,
      width: 350,
      height: 90,
      fill: theme.card_bg,
      cornerRadius: 16,
      stroke: `${theme.accent}44`,
      strokeWidth: 1,
    },
    {
      id: `${id}_bot_tag_2`,
      type: 'text',
      x: 485,
      y: 578,
      width: 310,
      text: '🛡 ZERO-LATENCY FAILOVER',
      fontSize: 12,
      fontFamily: 'Inter',
      fontWeight: 'bold',
      fill: theme.accent,
    },
    {
      id: `${id}_bot_txt_2`,
      type: 'text',
      x: 485,
      y: 602,
      width: 310,
      text: bullets?.[2] || 'Deterministic self-healing loops ensuring reliable output.',
      fontSize: 13,
      fontFamily: 'Inter',
      fill: theme.text_secondary,
    },
    {
      id: `${id}_bot_card_3`,
      type: 'figure',
      name: 'rect',
      x: 850,
      y: 565,
      width: 350,
      height: 90,
      fill: theme.card_bg,
      cornerRadius: 16,
      stroke: `${theme.accent}44`,
      strokeWidth: 1,
    },
    {
      id: `${id}_bot_tag_3`,
      type: 'text',
      x: 870,
      y: 578,
      width: 310,
      text: '⚡ PRODUCTION SPEED',
      fontSize: 12,
      fontFamily: 'Inter',
      fontWeight: 'bold',
      fill: theme.accent,
    },
    {
      id: `${id}_bot_txt_3`,
      type: 'text',
      x: 870,
      y: 602,
      width: 310,
      text: 'Accelerating digital media and presentation cycles 10-fold.',
      fontSize: 13,
      fontFamily: 'Inter',
      fill: theme.text_secondary,
    },
  ]

  return {
    id,
    background: theme.bg_color,
    children,
    elements: children,
  }
}
