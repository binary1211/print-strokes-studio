import type { Address, Product, ProductTypeSummary, User } from "@/types";

export interface MockCategory {
  id: number;
  name: string;
  slug: string;
  description: string;
  productCount: number;
}

export const MOCK_CATEGORIES: MockCategory[] = [
  {
    id: 1,
    name: "Acrylic Cutouts & Frames",
    slug: "acrylic-cutouts",
    description: "Ultra HD print on 3mm/5mm crystal-clear acrylic with wall mount support.",
    productCount: 2,
  },
  {
    id: 2,
    name: "Custom Phone Cases",
    slug: "phone-cases",
    description: "Shockproof slim & tough cases customized with your photos and graphics.",
    productCount: 1,
  },
  {
    id: 3,
    name: "Personalized Mugs & Drinkware",
    slug: "mugs-drinkware",
    description: "High-grade ceramic coffee mugs, magic color changing mugs and travel tumblers.",
    productCount: 1,
  },
  {
    id: 4,
    name: "Custom Clocks & Home Decor",
    slug: "clocks-decor",
    description: "Statement acrylic wall clocks and custom canvas art for modern living spaces.",
    productCount: 3,
  },
  {
    id: 5,
    name: "Personalized Keychains & Accessories",
    slug: "keychains-accessories",
    description: "Double-sided acrylic keyrings, metal engraved tags and Spotify code keychains.",
    productCount: 1,
  },
  {
    id: 6,
    name: "Custom Nameplates & Stationery",
    slug: "nameplates-desk",
    description: "Premium wooden and acrylic desk plaques, name badges and kids pencil sets.",
    productCount: 2,
  },
];

// ponytail: generate crisp inline SVG data URIs for clock Number Style variant previews & live dial overlay
function createClockStyleSvg(style: string, transparent = false): string {
  const cx = 100;
  const cy = 100;
  const r = 68;
  const roman = ["XII", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI"];

  const isRoman = style === "Roman Numerals";
  const isQuarter = style === "Quarter Numbers";
  const isLines = style === "Minimalist Lines";
  const isModern = style === "Modern Bold";

  const bgStart = isRoman ? "#fffbeb" : isQuarter ? "#1e1b4b" : isLines ? "#18181b" : isModern ? "#134e4a" : "#1e293b";
  const bgEnd = isRoman ? "#fef3c7" : isQuarter ? "#0f172a" : isLines ? "#09090b" : isModern ? "#042f2e" : "#0f172a";
  const accent = isRoman ? "#b45309" : isQuarter ? "#38bdf8" : isLines ? "#f59e0b" : isModern ? "#fde047" : "#fbbf24";
  const textColor = isRoman ? "#1c1917" : "#f8fafc";
  const overlayStroke = transparent ? "rgba(0,0,0,0.55)" : "none";

  const markers: string[] = [];

  // Subtle 60 minute ticks
  for (let m = 0; m < 60; m++) {
    if (m % 5 === 0) continue;
    const rad = ((m * 6 - 90) * Math.PI) / 180;
    const x1 = (cx + 84 * Math.cos(rad)).toFixed(1);
    const y1 = (cy + 84 * Math.sin(rad)).toFixed(1);
    const x2 = (cx + 87 * Math.cos(rad)).toFixed(1);
    const y2 = (cy + 87 * Math.sin(rad)).toFixed(1);
    markers.push(
      `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${isRoman && !transparent ? "#78350f" : "#ffffff"}" stroke-opacity="0.3" stroke-width="1" />`
    );
  }

  for (let h = 1; h <= 12; h++) {
    const rad = ((h * 30 - 90) * Math.PI) / 180;
    const x = (cx + r * Math.cos(rad)).toFixed(1);
    const y = (cy + r * Math.sin(rad)).toFixed(1);
    const isCard = h % 3 === 0;

    if (isLines) {
      const innerR = isCard ? 62 : 68;
      const outerR = 84;
      const x1 = (cx + innerR * Math.cos(rad)).toFixed(1);
      const y1 = (cy + innerR * Math.sin(rad)).toFixed(1);
      const x2 = (cx + outerR * Math.cos(rad)).toFixed(1);
      const y2 = (cy + outerR * Math.sin(rad)).toFixed(1);
      markers.push(
        `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${isCard ? accent : "#ffffff"}" stroke-width="${isCard ? 3.5 : 2}" stroke-linecap="round" />`
      );
    } else if (isQuarter) {
      if (isCard) {
        markers.push(
          `<text x="${x}" y="${y}" fill="${transparent ? "#ffffff" : accent}" stroke="${overlayStroke}" stroke-width="${transparent ? 2.5 : 0}" paint-order="stroke" font-family="system-ui, sans-serif" font-size="22" font-weight="900" text-anchor="middle" dominant-baseline="central">${h}</text>`
        );
      } else {
        const x1 = (cx + 68 * Math.cos(rad)).toFixed(1);
        const y1 = (cy + 68 * Math.sin(rad)).toFixed(1);
        const x2 = (cx + 80 * Math.cos(rad)).toFixed(1);
        const y2 = (cy + 80 * Math.sin(rad)).toFixed(1);
        markers.push(
          `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#ffffff" stroke-opacity="0.85" stroke-width="2.5" stroke-linecap="round" />`
        );
      }
    } else if (isModern) {
      if (h % 2 === 0) {
        markers.push(
          `<text x="${x}" y="${y}" fill="${transparent ? "#fde047" : accent}" stroke="${overlayStroke}" stroke-width="${transparent ? 2.5 : 0}" paint-order="stroke" font-family="Impact, system-ui, sans-serif" font-size="20" font-weight="900" text-anchor="middle" dominant-baseline="central">${h}</text>`
        );
      } else {
        markers.push(
          `<circle cx="${x}" cy="${y}" r="3.5" fill="#ffffff" stroke="${overlayStroke}" stroke-width="${transparent ? 1.5 : 0}" />`
        );
      }
    } else if (isRoman) {
      const label = roman[h % 12];
      markers.push(
        `<text x="${x}" y="${y}" fill="${transparent ? "#ffffff" : textColor}" stroke="${overlayStroke}" stroke-width="${transparent ? 2.5 : 0}" paint-order="stroke" font-family="Georgia, 'Times New Roman', serif" font-size="${isCard ? 16 : 13}" font-weight="700" text-anchor="middle" dominant-baseline="central">${label}</text>`
      );
    } else {
      // Classic Arabic
      markers.push(
        `<text x="${x}" y="${y}" fill="${transparent ? "#ffffff" : isCard ? accent : textColor}" stroke="${overlayStroke}" stroke-width="${transparent ? 2.5 : 0}" paint-order="stroke" font-family="system-ui, sans-serif" font-size="${isCard ? 18 : 15}" font-weight="800" text-anchor="middle" dominant-baseline="central">${h}</text>`
      );
    }
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">
    <defs>
      <radialGradient id="dialBg" cx="35%" cy="30%" r="70%">
        <stop offset="0%" stop-color="${bgStart}" />
        <stop offset="100%" stop-color="${bgEnd}" />
      </radialGradient>
    </defs>
    ${
      transparent
        ? `<circle cx="100" cy="100" r="92" fill="rgba(15,23,42,0.18)" stroke="rgba(255,255,255,0.65)" stroke-width="2" />`
        : `<circle cx="100" cy="100" r="95" fill="url(#dialBg)" stroke="${accent}" stroke-width="4" />
           <circle cx="100" cy="100" r="89" fill="none" stroke="${accent}" stroke-opacity="0.35" stroke-width="1" />`
    }
    ${markers.join("")}
    <!-- Hour Hand (pointing ~10:10) -->
    <line x1="100" y1="100" x2="72" y2="78" stroke="${transparent ? "#ffffff" : isRoman ? "#1c1917" : "#ffffff"}" stroke-width="4.5" stroke-linecap="round" />
    <!-- Minute Hand -->
    <line x1="100" y1="100" x2="136" y2="68" stroke="${accent}" stroke-width="3" stroke-linecap="round" />
    <!-- Second Hand -->
    <line x1="100" y1="112" x2="100" y2="42" stroke="#ef4444" stroke-width="1.5" stroke-linecap="round" />
    <!-- Center Cap -->
    <circle cx="100" cy="100" r="5.5" fill="${accent}" stroke="#0f172a" stroke-width="1.5" />
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export const CLOCK_NUMBER_STYLES = [
  "Classic Arabic",
  "Roman Numerals",
  "Quarter Numbers",
  "Minimalist Lines",
  "Modern Bold",
] as const;

export const CLOCK_NUMBER_STYLE_IMAGES: Record<string, string> = Object.fromEntries(
  CLOCK_NUMBER_STYLES.map((style) => [style, createClockStyleSvg(style, false)])
);

export const CLOCK_NUMBER_STYLE_OVERLAYS: Record<string, string> = Object.fromEntries(
  CLOCK_NUMBER_STYLES.map((style) => [style, createClockStyleSvg(style, true)])
);

function buildClockVariants(productId: string, basePrice: number) {
  const sizes = [
    { label: "12x12 inch", dims: "12x12", delta: 0, width: 300, height: 300 },
    { label: "16x16 inch", dims: "16x16", delta: 400, width: 400, height: 400 },
    { label: "20x20 inch", dims: "20x20", delta: 900, width: 500, height: 500 },
  ];
  const thicknesses = [
    { label: "3mm", delta: 0 },
    { label: "5mm", delta: 250 },
    { label: "8mm", delta: 550 },
  ];
  const styles = [
    { label: "Classic Arabic", delta: 0 },
    { label: "Roman Numerals", delta: 100 },
    { label: "Quarter Numbers", delta: 0 },
    { label: "Minimalist Lines", delta: 0 },
    { label: "Modern Bold", delta: 150 },
  ];

  const variants = [];
  for (const s of sizes) {
    for (const t of thicknesses) {
      for (const ns of styles) {
        const slugStyle = ns.label.toLowerCase().replace(/\s+/g, "-");
        variants.push({
          id: `${productId}-${s.dims}-${t.label}-${slugStyle}`,
          name: `${s.label} • ${t.label} • ${ns.label}`,
          dimensions: `${s.label} (${t.label} Thick • ${ns.label})`,
          price: basePrice + s.delta + t.delta + ns.delta,
          width: s.width,
          height: s.height,
          optionValues: {
            Size: s.label,
            Thickness: t.label,
            "Number Style": ns.label,
          },
        });
      }
    }
  }
  return variants;
}

const CLOCK_OPTION_GROUPS = [
  {
    optionName: "Size",
    optionValues: ["12x12 inch", "16x16 inch", "20x20 inch"],
  },
  {
    optionName: "Thickness",
    optionValues: ["3mm", "5mm", "8mm"],
  },
  {
    optionName: "Number Style",
    optionValues: [...CLOCK_NUMBER_STYLES],
    optionImages: CLOCK_NUMBER_STYLE_IMAGES,
  },
];

export const MOCK_HOMEPAGE_PRESETS: ProductTypeSummary[] = [
  {
    id: 1,
    name: "Acrylic Photo Cutouts",
    slug: "acrylic-cutouts",
    shortDescription: "Wall-mount frameless 3mm HD acrylic cutouts customized with your favorite memory.",
    imageUrl: "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=600&auto=format&fit=crop&q=80",
    showOnHomepage: true,
    sortOrder: 1,
    backgroundRemovalRequired: false,
  },
  {
    id: 2,
    name: "Custom Acrylic Wall Clocks",
    slug: "acrylic-clocks",
    shortDescription: "Silent quartz movement clocks printed with custom family photos and numbers.",
    imageUrl: "https://images.unsplash.com/photo-1563861826100-9cb868fdbe1c?w=600&auto=format&fit=crop&q=80",
    showOnHomepage: true,
    sortOrder: 2,
    backgroundRemovalRequired: false,
  },
  {
    id: 3,
    name: "Personalized Mobile Cases",
    slug: "custom-mobile-cases",
    shortDescription: "Tough cases for iPhone, Samsung, OnePlus with custom edge-to-edge print.",
    imageUrl: "https://images.unsplash.com/photo-1586105251261-72a756497a11?w=600&auto=format&fit=crop&q=80",
    showOnHomepage: true,
    sortOrder: 3,
    backgroundRemovalRequired: false,
  },
  {
    id: 4,
    name: "Magic Color Changing Mugs",
    slug: "photo-mugs",
    shortDescription: "Heat-sensitive ceramic mugs that reveal your photo when hot beverage is poured.",
    imageUrl: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600&auto=format&fit=crop&q=80",
    showOnHomepage: true,
    sortOrder: 4,
    backgroundRemovalRequired: false,
  },
];

export const MOCK_PRODUCTS: Product[] = [
  {
    id: "1",
    title: "Custom Acrylic Photo Cutout (Wall Mount)",
    slug: "acrylic-cutouts",
    category: "Acrylic Cutouts & Frames",
    categoryId: 1,
    basePrice: 699,
    description:
      "Transform your cherished memories into modern frameless wall art with our 3mm crystal-clear acrylic photo cutouts. High-definition UV printing directly on acrylic backing gives stunning depth and vibrant color clarity.",
    featured: true,
    stock: "in-stock",
    materials: ["Premium Acrylic", "High-Gloss UV Print", "Industrial Wall Mounting Tape"],
    images: [
      "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1582555172866-f73bb12a2ab3?w=800&auto=format&fit=crop&q=80",
    ],
    variantOptionGroups: [
      {
        optionName: "Size",
        optionValues: ["12x12 inch", "16x16 inch", "20x20 inch", "24x24 inch"],
      },
    ],
    variants: [
      { id: "1-12x12", name: "12x12 inch", dimensions: "12x12", price: 699, width: 300, height: 300, optionValues: { Size: "12x12 inch" } },
      { id: "1-16x16", name: "16x16 inch", dimensions: "16x16", price: 999, width: 400, height: 400, optionValues: { Size: "16x16 inch" } },
      { id: "1-20x20", name: "20x20 inch", dimensions: "20x20", price: 1499, width: 500, height: 500, optionValues: { Size: "20x20 inch" } },
      { id: "1-24x24", name: "24x24 inch", dimensions: "24x24", price: 2199, width: 600, height: 600, optionValues: { Size: "24x24 inch" } },
    ],
    tags: ["acrylic", "cutout", "wall-decor", "custom-photo"],
    personalizationOptions: ["photo"],
    isCustomizable: true,
    customizationType: "SIMPLE_IMAGE",
    backgroundRemovalRequired: false,
    personalization: {
      supportsImage: true,
      supportsText: false,
      maxFileSizeMB: 10,
      recommendedDPI: 300,
    },
    productType: {
      id: 1,
      name: "Acrylic Photo Cutouts",
      slug: "acrylic-cutouts",
    },
  },
  {
    id: "2",
    title: "Minimalist Custom Acrylic Wall Clock",
    slug: "acrylic-wall-clock",
    category: "Custom Clocks & Home Decor",
    categoryId: 4,
    basePrice: 899,
    description:
      "A contemporary silent wall clock crafted from polished cast acrylic. Choose your preferred size, acrylic thickness (3mm, 5mm, or 8mm), and dial number style to create a timeless centerpiece.",
    featured: true,
    stock: "in-stock",
    materials: ["Cast Optical Acrylic", "Silent Sweep Quartz Movement", "Metallic Aluminum Hands"],
    images: [
      "https://images.unsplash.com/photo-1563861826100-9cb868fdbe1c?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1508057198894-247b23fe5ade?w=800&auto=format&fit=crop&q=80",
    ],
    variantOptionGroups: CLOCK_OPTION_GROUPS,
    variants: buildClockVariants("2", 899),
    tags: ["clock", "acrylic", "decor", "gift"],
    personalizationOptions: ["photo"],
    isCustomizable: true,
    customizationType: "SIMPLE_IMAGE",
    backgroundRemovalRequired: false,
    personalization: {
      supportsImage: true,
      supportsText: false,
      maxFileSizeMB: 10,
      recommendedDPI: 300,
    },
    productType: {
      id: 2,
      name: "Custom Acrylic Wall Clocks",
      slug: "acrylic-clocks",
    },
  },
  {
    id: "3",
    title: "Personalized Tough Mobile Phone Case",
    slug: "custom-mobile-case",
    category: "Custom Phone Cases",
    categoryId: 2,
    basePrice: 399,
    description:
      "Dual-layer shockproof protection with glossy edge-to-edge photo printing. Impact resistant TPU core paired with a hardened polycarbonate exterior.",
    featured: true,
    stock: "in-stock",
    materials: ["Polycarbonate Hard Shell", "Shock-Absorbing TPU Liner", "UV Resistant Print"],
    images: [
      "https://images.unsplash.com/photo-1586105251261-72a756497a11?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?w=800&auto=format&fit=crop&q=80",
    ],
    variants: [
      { id: "3-iphone15", name: "iPhone 15 / 15 Pro", dimensions: "Standard", price: 399 },
      { id: "3-iphone14", name: "iPhone 14 / 14 Pro", dimensions: "Standard", price: 399 },
      { id: "3-s24", name: "Samsung Galaxy S24 Ultra", dimensions: "Standard", price: 449 },
      { id: "3-oneplus12", name: "OnePlus 12", dimensions: "Standard", price: 399 },
    ],
    tags: ["mobile-case", "iphone", "samsung", "phone-cover"],
    personalizationOptions: ["photo"],
    isCustomizable: true,
    customizationType: "SIMPLE_IMAGE",
    backgroundRemovalRequired: false,
    personalization: {
      supportsImage: true,
      supportsText: false,
      maxFileSizeMB: 10,
      recommendedDPI: 300,
    },
    productType: {
      id: 3,
      name: "Personalized Mobile Cases",
      slug: "custom-mobile-cases",
    },
  },
  {
    id: "4",
    title: "Custom Heat-Sensitive Magic Photo Mug",
    slug: "magic-photo-mug",
    category: "Personalized Mugs & Drinkware",
    categoryId: 3,
    basePrice: 349,
    description:
      "Watch your memory appear like magic! Black ceramic exterior becomes transparent when hot liquid is poured, revealing your favorite photo and custom message.",
    featured: true,
    stock: "in-stock",
    materials: ["Grade-A Ceramic", "Thermosensitive Coating", "Microwave Safe"],
    images: [
      "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1517256064527-09c73fc73e38?w=800&auto=format&fit=crop&q=80",
    ],
    variants: [
      { id: "4-325ml", name: "Standard 325ml Mug", dimensions: "Standard", price: 349 },
      { id: "4-450ml", name: "Large 450ml Mug", dimensions: "Large", price: 449 },
    ],
    tags: ["magic-mug", "photo-mug", "coffee-mug", "gifts"],
    personalizationOptions: ["photo"],
    isCustomizable: true,
    customizationType: "SIMPLE_IMAGE",
    backgroundRemovalRequired: false,
    personalization: {
      supportsImage: true,
      supportsText: false,
      maxFileSizeMB: 10,
      recommendedDPI: 300,
    },
    productType: {
      id: 4,
      name: "Magic Color Changing Mugs",
      slug: "photo-mugs",
    },
  },
  {
    id: "5",
    title: "Custom Name Engraved Acrylic Keychain",
    slug: "custom-name-keychain",
    category: "Personalized Keychains & Accessories",
    categoryId: 5,
    basePrice: 199,
    description:
      "Laser-cut crystal acrylic keychain custom printed with any name or Spotify music code. Includes stainless steel keyring and protective pouch.",
    featured: false,
    stock: "in-stock",
    materials: ["5mm Clear Acrylic", "Laser Engraving", "Stainless Steel Keyring"],
    images: [
      "https://images.unsplash.com/photo-1614252369475-531eba835eb1?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1607344645866-009c320c5ab8?w=800&auto=format&fit=crop&q=80",
    ],
    variants: [
      { id: "5-single", name: "Single Keychain", dimensions: "2.5x1 inch", price: 199 },
      { id: "5-pair", name: "Couple Pack (2 pcs)", dimensions: "2.5x1 inch", price: 349 },
    ],
    tags: ["keychain", "acrylic", "spotify", "engraved"],
    personalizationOptions: ["text"],
    isCustomizable: true,
    customizationType: "TEXT_ONLY",
    backgroundRemovalRequired: false,
    personalization: {
      supportsImage: false,
      supportsText: true,
      maxFileSizeMB: 5,
      recommendedDPI: 300,
    },
  },
  {
    id: "6",
    title: "Personalized Wooden Desk Nameplate",
    slug: "desk-nameplate",
    category: "Custom Nameplates & Stationery",
    categoryId: 6,
    basePrice: 599,
    description:
      "Handcrafted natural pine wood desk block with golden mirror acrylic lettering. Perfect for office workstations, doctor clinics, and executive gifts.",
    featured: false,
    stock: "in-stock",
    materials: ["Natural Pine Wood", "Mirror Acrylic Gold", "Matte Protective Seal"],
    images: [
      "https://images.unsplash.com/photo-1544816155-12df9643f363?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&auto=format&fit=crop&q=80",
    ],
    variants: [
      { id: "6-standard", name: "8x2.5 inch Standard", dimensions: "8x2.5", price: 599 },
      { id: "6-large", name: "10x3 inch Executive", dimensions: "10x3", price: 799 },
    ],
    tags: ["nameplate", "office", "desk", "wooden"],
    personalizationOptions: ["text"],
    isCustomizable: true,
    customizationType: "TEXT_ONLY",
    backgroundRemovalRequired: false,
    personalization: {
      supportsImage: false,
      supportsText: true,
      maxFileSizeMB: 5,
      recommendedDPI: 300,
    },
  },
  {
    id: "7",
    title: "LED Ambient Backlit Acrylic Photo Frame",
    slug: "led-acrylic-frame",
    category: "Acrylic Cutouts & Frames",
    categoryId: 1,
    basePrice: 1199,
    description:
      "Warm ambient LED wooden base with crystal-clear engraved acrylic display. Connects via USB to create an enchanting night light of your special photo.",
    featured: true,
    stock: "in-stock",
    materials: ["Cast Acrylic 4mm", "Solid Beech Wood Base", "Warm White USB LEDs"],
    images: [
      "https://images.unsplash.com/photo-1543857778-c4a1a3e0b2eb?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=800&auto=format&fit=crop&q=80",
    ],
    variants: [
      { id: "7-6x8", name: "6x8 inch Vertical", dimensions: "6x8", price: 1199, width: 250, height: 350 },
      { id: "7-8x10", name: "8x10 inch Vertical", dimensions: "8x10", price: 1599, width: 350, height: 450 },
    ],
    tags: ["led", "night-lamp", "photo-lamp", "acrylic"],
    personalizationOptions: ["photo"],
    isCustomizable: true,
    customizationType: "SIMPLE_IMAGE",
    backgroundRemovalRequired: false,
    personalization: {
      supportsImage: true,
      supportsText: false,
      maxFileSizeMB: 10,
      recommendedDPI: 300,
    },
    productType: {
      id: 1,
      name: "Acrylic Photo Cutouts",
      slug: "acrylic-cutouts",
    },
  },
  {
    id: "8",
    title: "Personalized Name Pencils Set (Pack of 10)",
    slug: "name-pencils",
    category: "Custom Nameplates & Stationery",
    categoryId: 6,
    basePrice: 249,
    description:
      "High quality dark HB pencils customized with child's name in crisp gold foil stamping. Ideal for school stationery, return gifts, and birthday favors.",
    featured: false,
    stock: "in-stock",
    materials: ["Natural Cedar Wood", "2B Dark Graphite", "Gold Foil Print"],
    images: [
      "https://images.unsplash.com/photo-1585776245991-cf89dd7fc73a?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?w=800&auto=format&fit=crop&q=80",
    ],
    variants: [
      { id: "8-pack10", name: "Pack of 10 Pencils", dimensions: "Standard", price: 249 },
      { id: "8-pack20", name: "Pack of 20 Pencils", dimensions: "Standard", price: 449 },
    ],
    tags: ["pencils", "stationery", "school", "kids"],
    personalizationOptions: ["text"],
    isCustomizable: true,
    customizationType: "TEXT_ONLY",
    backgroundRemovalRequired: false,
    personalization: {
      supportsImage: false,
      supportsText: true,
      maxFileSizeMB: 5,
      recommendedDPI: 300,
    },
  },
  {
    id: "9",
    title: "Luxury Gold-Rim Custom Photo Wall Clock",
    slug: "luxury-gold-rim-clock",
    category: "Custom Clocks & Home Decor",
    categoryId: 4,
    basePrice: 1199,
    description:
      "Statement round acrylic wall clock featuring a brushed metallic gold floating rim and silent sweep hands. Customize with your family portrait, thickness, size, and signature dial number style.",
    featured: true,
    stock: "in-stock",
    materials: ["High-Gloss Cast Acrylic", "Brushed Gold Bezel", "Silent Sweep Quartz Movement"],
    images: [
      "https://images.unsplash.com/photo-1508057198894-247b23fe5ade?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1563861826100-9cb868fdbe1c?w=800&auto=format&fit=crop&q=80",
    ],
    variantOptionGroups: CLOCK_OPTION_GROUPS,
    variants: buildClockVariants("9", 1199),
    tags: ["clock", "gold-rim", "acrylic", "decor", "luxury"],
    personalizationOptions: ["photo"],
    isCustomizable: true,
    customizationType: "SIMPLE_IMAGE",
    backgroundRemovalRequired: false,
    personalization: {
      supportsImage: true,
      supportsText: false,
      maxFileSizeMB: 10,
      recommendedDPI: 300,
    },
    productType: {
      id: 2,
      name: "Custom Acrylic Wall Clocks",
      slug: "acrylic-clocks",
    },
  },
  {
    id: "10",
    title: "Modern Rounded-Square Acrylic Photo Clock",
    slug: "modern-square-acrylic-clock",
    category: "Custom Clocks & Home Decor",
    categoryId: 4,
    basePrice: 999,
    description:
      "Contemporary squircle-cut optical acrylic wall clock with edge-to-edge UV photo printing. Select your preferred size, acrylic sheet thickness, and custom number dial layout.",
    featured: false,
    stock: "in-stock",
    materials: ["Diamond-Polished Acrylic", "UV Archival Ink", "Heavy-Duty Wall Hook"],
    images: [
      "https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1563861826100-9cb868fdbe1c?w=800&auto=format&fit=crop&q=80",
    ],
    variantOptionGroups: CLOCK_OPTION_GROUPS,
    variants: buildClockVariants("10", 999),
    tags: ["clock", "square-clock", "acrylic", "wall-decor"],
    personalizationOptions: ["photo"],
    isCustomizable: true,
    customizationType: "SIMPLE_IMAGE",
    backgroundRemovalRequired: false,
    personalization: {
      supportsImage: true,
      supportsText: false,
      maxFileSizeMB: 10,
      recommendedDPI: 300,
    },
    productType: {
      id: 2,
      name: "Custom Acrylic Wall Clocks",
      slug: "acrylic-clocks",
    },
  },
];

export const MOCK_DEFAULT_USER: User = {
  id: "usr_mock_101",
  name: "Keval Sharma",
  email: "keval@printstrokes.com",
  phone: "9876543210",
  roles: ["CUSTOMER"],
};

export const MOCK_DEFAULT_ADDRESSES: Address[] = [
  {
    id: 1,
    name: "Keval Sharma",
    phone: "9876543210",
    addressLine1: "Flat 402, Royal Residency, Opp City Mall",
    addressLine2: "Near Green Garden, Sector 14",
    city: "Ahmedabad",
    state: "Gujarat",
    country: "India",
    pincode: "380015",
    isDefault: true,
  },
  {
    id: 2,
    name: "Keval Sharma (Office)",
    phone: "9876543210",
    addressLine1: "Tech Park Phase 2, Tower B, 5th Floor",
    addressLine2: "S.G. Highway",
    city: "Ahmedabad",
    state: "Gujarat",
    country: "India",
    pincode: "380054",
    isDefault: false,
  },
];
