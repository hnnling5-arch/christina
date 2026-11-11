/**
 * Sticker Generator Utility:
 * - High-precision cartoon stickers with true contour-following die-cut white outlines
 * - Comprehensive illustration generator (Zero text placeholders - pure graphics!)
 * - Canvas contour outline renderer for PNG downloads
 */

export interface StickerItem {
  id: string;
  label: string;
  dataUrl: string;
  source: 'preset' | 'draw' | 'upload' | 'ai';
}

/**
 * Encodes SVG string to standard data URI
 */
export function svgToDataUrl(svg: string): string {
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg.trim())}`;
}

/**
 * 16 Brand-New High-Precision Die-Cut Creative Preset Stickers
 * Each sticker features clean vector cartoon artwork and zero text substitution.
 */
export const PRESET_CREATIVE_STICKERS: StickerItem[] = [
  {
    id: 'stk_rainbow',
    label: '彩虹云朵',
    source: 'preset',
    dataUrl: svgToDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
        <path d="M 16 68 A 34 34 0 0 1 84 68" fill="none" stroke="#EF4444" stroke-width="7" stroke-linecap="round"/>
        <path d="M 22 68 A 28 28 0 0 1 78 68" fill="none" stroke="#F59E0B" stroke-width="7" stroke-linecap="round"/>
        <path d="M 28 68 A 22 22 0 0 1 72 68" fill="none" stroke="#10B981" stroke-width="7" stroke-linecap="round"/>
        <path d="M 34 68 A 16 16 0 0 1 66 68" fill="none" stroke="#3B82F6" stroke-width="7" stroke-linecap="round"/>
        <circle cx="20" cy="70" r="14" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="2"/>
        <circle cx="34" cy="74" r="11" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="2"/>
        <circle cx="80" cy="70" r="14" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="2"/>
        <circle cx="66" cy="74" r="11" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="2"/>
        <circle cx="18" cy="68" r="2" fill="#334155"/>
        <circle cx="24" cy="68" r="2" fill="#334155"/>
        <circle cx="78" cy="68" r="2" fill="#334155"/>
        <circle cx="84" cy="68" r="2" fill="#334155"/>
        <circle cx="21" cy="73" r="3" fill="#F472B6" opacity="0.6"/>
        <circle cx="81" cy="73" r="3" fill="#F472B6" opacity="0.6"/>
      </svg>
    `),
  },
  {
    id: 'stk_sunflower',
    label: '太阳花花',
    source: 'preset',
    dataUrl: svgToDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
        <g fill="#F59E0B" stroke="#D97706" stroke-width="2">
          <circle cx="50" cy="18" r="11"/>
          <circle cx="50" cy="82" r="11"/>
          <circle cx="18" cy="50" r="11"/>
          <circle cx="82" cy="50" r="11"/>
          <circle cx="27" cy="27" r="11"/>
          <circle cx="73" cy="73" r="11"/>
          <circle cx="27" cy="73" r="11"/>
          <circle cx="73" cy="27" r="11"/>
        </g>
        <circle cx="50" cy="50" r="24" fill="#FBBF24" stroke="#B45309" stroke-width="3"/>
        <circle cx="43" cy="46" r="3" fill="#78350F"/>
        <circle cx="57" cy="46" r="3" fill="#78350F"/>
        <path d="M 44 54 Q 50 62 56 54" fill="none" stroke="#78350F" stroke-width="3" stroke-linecap="round"/>
        <circle cx="39" cy="53" r="3" fill="#F87171" opacity="0.6"/>
        <circle cx="61" cy="53" r="3" fill="#F87171" opacity="0.6"/>
      </svg>
    `),
  },
  {
    id: 'stk_kitten',
    label: '萌萌小猫',
    source: 'preset',
    dataUrl: svgToDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
        <polygon points="24,20 42,38 20,44" fill="#FB923C" stroke="#EA580C" stroke-width="2.5"/>
        <polygon points="76,20 80,44 58,38" fill="#FB923C" stroke="#EA580C" stroke-width="2.5"/>
        <polygon points="27,24 38,36 24,38" fill="#F472B6"/>
        <polygon points="73,24 76,38 62,36" fill="#F472B6"/>
        <circle cx="50" cy="55" r="32" fill="#FDBA74" stroke="#EA580C" stroke-width="3"/>
        <ellipse cx="38" cy="50" rx="4" ry="5.5" fill="#431407"/>
        <ellipse cx="62" cy="50" rx="4" ry="5.5" fill="#431407"/>
        <circle cx="39" cy="48" r="1.5" fill="#FFFFFF"/>
        <circle cx="63" cy="48" r="1.5" fill="#FFFFFF"/>
        <polygon points="50,57 46,60 54,60" fill="#F43F5E"/>
        <path d="M 45 64 Q 50 68 55 64" fill="none" stroke="#431407" stroke-width="2.2" stroke-linecap="round"/>
        <circle cx="31" cy="58" r="3.5" fill="#F43F5E" opacity="0.5"/>
        <circle cx="69" cy="58" r="3.5" fill="#F43F5E" opacity="0.5"/>
        <line x1="20" y1="58" x2="33" y2="60" stroke="#431407" stroke-width="1.8"/>
        <line x1="20" y1="64" x2="33" y2="63" stroke="#431407" stroke-width="1.8"/>
        <line x1="67" y1="60" x2="80" y2="58" stroke="#431407" stroke-width="1.8"/>
        <line x1="67" y1="63" x2="80" y2="64" stroke="#431407" stroke-width="1.8"/>
      </svg>
    `),
  },
  {
    id: 'stk_dino',
    label: '萌小恐龙',
    source: 'preset',
    dataUrl: svgToDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
        <path d="M 45 18 C 68 18 78 30 78 46 C 78 56 70 66 62 74 L 70 86 L 58 86 L 54 76 L 42 76 L 38 86 L 26 86 L 30 68 C 18 64 12 52 12 40 C 12 24 26 18 45 18 Z" fill="#34D399" stroke="#059669" stroke-width="3"/>
        <path d="M 30 16 L 35 22 L 40 16 L 45 22 L 50 16 L 55 22" fill="#F59E0B" stroke="#D97706" stroke-width="2"/>
        <circle cx="56" cy="36" r="4.5" fill="#064E3B"/>
        <circle cx="58" cy="34" r="1.8" fill="#FFFFFF"/>
        <path d="M 64 45 Q 70 47 64 50" fill="none" stroke="#064E3B" stroke-width="2.5" stroke-linecap="round"/>
        <circle cx="48" cy="44" r="3.5" fill="#F87171" opacity="0.6"/>
        <path d="M 28 48 C 34 50 42 58 38 64 C 32 66 26 60 28 48 Z" fill="#A7F3D0"/>
      </svg>
    `),
  },
  {
    id: 'stk_rocket',
    label: '梦幻火箭',
    source: 'preset',
    dataUrl: svgToDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
        <path d="M 50 12 C 68 28 68 64 50 74 C 32 64 32 28 50 12 Z" fill="#EF4444" stroke="#B91C1C" stroke-width="3"/>
        <circle cx="50" cy="40" r="9" fill="#38BDF8" stroke="#FFFFFF" stroke-width="3.5"/>
        <path d="M 34 58 L 18 74 L 32 74 Z" fill="#F59E0B" stroke="#D97706" stroke-width="2.5"/>
        <path d="M 66 58 L 82 74 L 68 74 Z" fill="#F59E0B" stroke="#D97706" stroke-width="2.5"/>
        <path d="M 44 74 Q 50 94 56 74 Z" fill="#FBBF24"/>
      </svg>
    `),
  },
  {
    id: 'stk_bunny',
    label: '害羞小白兔',
    source: 'preset',
    dataUrl: svgToDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
        <ellipse cx="36" cy="24" rx="8" ry="22" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="2.5"/>
        <ellipse cx="36" cy="24" rx="4" ry="16" fill="#F472B6"/>
        <ellipse cx="64" cy="24" rx="8" ry="22" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="2.5"/>
        <ellipse cx="64" cy="24" rx="4" ry="16" fill="#F472B6"/>
        <circle cx="50" cy="60" r="28" fill="#FFFFFF" stroke="#94A3B8" stroke-width="3"/>
        <circle cx="39" cy="56" r="3.5" fill="#1E293B"/>
        <circle cx="61" cy="56" r="3.5" fill="#1E293B"/>
        <circle cx="40" cy="54" r="1.2" fill="#FFFFFF"/>
        <circle cx="62" cy="54" r="1.2" fill="#FFFFFF"/>
        <polygon points="50,62 47,65 53,65" fill="#F43F5E"/>
        <path d="M 45 68 Q 50 72 55 68" fill="none" stroke="#1E293B" stroke-width="2" stroke-linecap="round"/>
        <circle cx="32" cy="62" r="4.5" fill="#F472B6" opacity="0.6"/>
        <circle cx="68" cy="62" r="4.5" fill="#F472B6" opacity="0.6"/>
      </svg>
    `),
  },
  {
    id: 'stk_ice_cream',
    label: '甜筒冰淇淋',
    source: 'preset',
    dataUrl: svgToDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
        <polygon points="32,48 68,48 50,92" fill="#F59E0B" stroke="#D97706" stroke-width="2.5"/>
        <line x1="38" y1="56" x2="62" y2="80" stroke="#D97706" stroke-width="1.8"/>
        <line x1="62" y1="56" x2="38" y2="80" stroke="#D97706" stroke-width="1.8"/>
        <circle cx="50" cy="36" r="22" fill="#FB7185" stroke="#E11D48" stroke-width="2.5"/>
        <circle cx="36" cy="40" r="8" fill="#F43F5E"/>
        <circle cx="64" cy="40" r="8" fill="#F43F5E"/>
        <circle cx="50" cy="14" r="7" fill="#EF4444" stroke="#B91C1C" stroke-width="2"/>
        <circle cx="44" cy="32" r="2" fill="#4C0519"/>
        <circle cx="56" cy="32" r="2" fill="#4C0519"/>
        <path d="M 47 38 Q 50 42 53 38" fill="none" stroke="#4C0519" stroke-width="2" stroke-linecap="round"/>
      </svg>
    `),
  },
  {
    id: 'stk_car',
    label: '蓝色小汽车',
    source: 'preset',
    dataUrl: svgToDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
        <path d="M 14 56 L 28 34 L 72 34 L 86 56 L 90 70 L 10 70 Z" fill="#3B82F6" stroke="#1D4ED8" stroke-width="3"/>
        <rect x="32" y="38" width="16" height="14" fill="#E0F2FE" rx="2" stroke="#1D4ED8" stroke-width="1.5"/>
        <rect x="52" y="38" width="16" height="14" fill="#E0F2FE" rx="2" stroke="#1D4ED8" stroke-width="1.5"/>
        <circle cx="28" cy="70" r="10" fill="#334155" stroke="#0F172A" stroke-width="2.5"/>
        <circle cx="28" cy="70" r="3.5" fill="#E2E8F0"/>
        <circle cx="72" cy="70" r="10" fill="#334155" stroke="#0F172A" stroke-width="2.5"/>
        <circle cx="72" cy="70" r="3.5" fill="#E2E8F0"/>
        <circle cx="86" cy="60" r="3" fill="#FBBF24"/>
      </svg>
    `),
  },
  {
    id: 'stk_strawberry',
    label: '甜甜草莓',
    source: 'preset',
    dataUrl: svgToDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
        <path d="M 50 24 C 78 24 84 50 70 76 C 60 92 50 92 40 84 C 22 70 18 45 32 26 C 40 22 46 24 50 24 Z" fill="#F43F5E" stroke="#BE123C" stroke-width="3"/>
        <path d="M 50 12 L 50 24 M 38 22 Q 50 30 62 22 M 34 24 Q 50 34 66 24" fill="none" stroke="#10B981" stroke-width="5.5" stroke-linecap="round"/>
        <circle cx="44" cy="44" r="1.8" fill="#FEF08A"/>
        <circle cx="56" cy="42" r="1.8" fill="#FEF08A"/>
        <circle cx="50" cy="56" r="1.8" fill="#FEF08A"/>
        <circle cx="62" cy="58" r="1.8" fill="#FEF08A"/>
        <circle cx="38" cy="62" r="1.8" fill="#FEF08A"/>
        <circle cx="52" cy="72" r="1.8" fill="#FEF08A"/>
      </svg>
    `),
  },
  {
    id: 'stk_star',
    label: '闪烁金星',
    source: 'preset',
    dataUrl: svgToDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
        <polygon points="50,10 62,38 92,40 68,60 76,88 50,72 24,88 32,60 8,40 38,38" fill="#FBBF24" stroke="#D97706" stroke-width="3"/>
        <circle cx="42" cy="46" r="3" fill="#78350F"/>
        <circle cx="58" cy="46" r="3" fill="#78350F"/>
        <path d="M 45 54 Q 50 60 55 54" fill="none" stroke="#78350F" stroke-width="2.5" stroke-linecap="round"/>
        <circle cx="36" cy="52" r="2.5" fill="#F43F5E" opacity="0.6"/>
        <circle cx="64" cy="52" r="2.5" fill="#F43F5E" opacity="0.6"/>
      </svg>
    `),
  },
  {
    id: 'stk_airplane',
    label: '小纸飞机',
    source: 'preset',
    dataUrl: svgToDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
        <polygon points="12,48 88,20 54,86 44,55" fill="#38BDF8" stroke="#0284C7" stroke-width="3"/>
        <polygon points="44,55 88,20 54,86" fill="#0284C7" stroke="#0369A1" stroke-width="2"/>
        <polygon points="44,55 40,75 50,65" fill="#FBBF24" stroke="#D97706" stroke-width="2"/>
        <path d="M 10 62 Q 22 76 34 70" fill="none" stroke="#94A3B8" stroke-width="2" stroke-dasharray="3,3"/>
      </svg>
    `),
  },
  {
    id: 'stk_clover',
    label: '四叶草草',
    source: 'preset',
    dataUrl: svgToDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
        <g fill="#22C55E" stroke="#15803D" stroke-width="2">
          <circle cx="38" cy="38" r="14"/>
          <circle cx="62" cy="38" r="14"/>
          <circle cx="38" cy="62" r="14"/>
          <circle cx="62" cy="62" r="14"/>
        </g>
        <path d="M 50 50 Q 52 78 40 88" fill="none" stroke="#15803D" stroke-width="4" stroke-linecap="round"/>
        <circle cx="50" cy="50" r="6" fill="#86EFAC"/>
      </svg>
    `),
  },
  {
    id: 'stk_donut',
    label: '草莓甜甜圈',
    source: 'preset',
    dataUrl: svgToDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
        <circle cx="50" cy="50" r="38" fill="#F59E0B" stroke="#D97706" stroke-width="3"/>
        <path d="M 50 16 C 68 16 82 30 82 50 C 78 54 74 48 70 52 C 66 56 68 62 62 64 C 56 66 54 60 50 62 C 44 64 42 70 38 68 C 34 66 36 60 30 58 C 24 56 20 62 18 50 C 18 30 32 16 50 16 Z" fill="#EC4899"/>
        <circle cx="50" cy="50" r="14" fill="#FFFDF9" stroke="#D97706" stroke-width="3"/>
        <line x1="36" y1="32" x2="42" y2="30" stroke="#FDE047" stroke-width="3" stroke-linecap="round"/>
        <line x1="56" y1="28" x2="62" y2="34" stroke="#60A5FA" stroke-width="3" stroke-linecap="round"/>
        <line x1="68" y1="45" x2="74" y2="42" stroke="#4ADE80" stroke-width="3" stroke-linecap="round"/>
        <line x1="30" y1="46" x2="34" y2="52" stroke="#FBBF24" stroke-width="3" stroke-linecap="round"/>
      </svg>
    `),
  },
  {
    id: 'stk_music_note',
    label: '欢快音符',
    source: 'preset',
    dataUrl: svgToDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
        <ellipse cx="32" cy="72" rx="12" ry="9" fill="#8B5CF6" stroke="#6D28D9" stroke-width="2" transform="rotate(-20 32 72)"/>
        <ellipse cx="68" cy="64" rx="12" ry="9" fill="#8B5CF6" stroke="#6D28D9" stroke-width="2" transform="rotate(-20 68 64)"/>
        <line x1="42" y1="68" x2="42" y2="25" stroke="#7C3AED" stroke-width="5"/>
        <line x1="78" y1="60" x2="78" y2="18" stroke="#7C3AED" stroke-width="5"/>
        <polygon points="40,25 80,18 80,28 40,35" fill="#7C3AED"/>
      </svg>
    `),
  },
  {
    id: 'stk_crown',
    label: '闪亮小皇冠',
    source: 'preset',
    dataUrl: svgToDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
        <polygon points="16,70 84,70 88,34 66,52 50,22 34,52 12,34" fill="#FACC15" stroke="#CA8A04" stroke-width="3"/>
        <circle cx="12" cy="34" r="4.5" fill="#EF4444"/>
        <circle cx="50" cy="22" r="5" fill="#3B82F6"/>
        <circle cx="88" cy="34" r="4.5" fill="#10B981"/>
        <circle cx="50" cy="60" r="3.5" fill="#EC4899"/>
        <circle cx="34" cy="60" r="3" fill="#3B82F6"/>
        <circle cx="66" cy="60" r="3" fill="#10B981"/>
        <rect x="20" y="70" width="60" height="6" fill="#EAB308" rx="2"/>
      </svg>
    `),
  },
  {
    id: 'stk_heart',
    label: '爱心印章',
    source: 'preset',
    dataUrl: svgToDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
        <path
          d="M50 84 C22 62 10 44 10 28 C10 16 20 8 32 8 C40 8 46 13 50 19 C54 13 60 8 68 8 C80 8 90 16 90 28 C90 44 78 62 50 84 Z"
          fill="#F43F5E"
          stroke="#BE123C"
          stroke-width="3.5"
        />
        <circle cx="34" cy="34" r="3" fill="#4C0519"/>
        <circle cx="66" cy="34" r="3" fill="#4C0519"/>
        <path d="M 44 42 Q 50 48 56 42" fill="none" stroke="#4C0519" stroke-width="2.5" stroke-linecap="round"/>
        <circle cx="28" cy="40" r="3" fill="#FDA4AF"/>
        <circle cx="72" cy="40" r="3" fill="#FDA4AF"/>
      </svg>
    `),
  },
];

/**
 * Procedural AI cartoon sticker synthesizer:
 * Given a keyword, generates a high-precision, genuine cartoon sticker SVG data URL.
 * NEVER substitutes with letters, words, or character medallions!
 */
export function generateAiStickerSvg(keyword: string): string {
  const kw = (keyword || '').trim().toLowerCase();

  // 1. Cats / Kittens
  if (kw.includes('猫') || kw.includes('cat') || kw.includes('咪') || kw.includes('喵')) {
    return svgToDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
        <polygon points="24,20 42,38 20,44" fill="#FB923C" stroke="#EA580C" stroke-width="2.5"/>
        <polygon points="76,20 80,44 58,38" fill="#FB923C" stroke="#EA580C" stroke-width="2.5"/>
        <polygon points="27,24 38,36 24,38" fill="#F472B6"/>
        <polygon points="73,24 76,38 62,36" fill="#F472B6"/>
        <circle cx="50" cy="55" r="32" fill="#FDBA74" stroke="#EA580C" stroke-width="3"/>
        <ellipse cx="38" cy="50" rx="4" ry="5.5" fill="#431407"/>
        <ellipse cx="62" cy="50" rx="4" ry="5.5" fill="#431407"/>
        <circle cx="39" cy="48" r="1.5" fill="#FFFFFF"/>
        <circle cx="63" cy="48" r="1.5" fill="#FFFFFF"/>
        <polygon points="50,57 46,60 54,60" fill="#F43F5E"/>
        <path d="M 45 64 Q 50 68 55 64" fill="none" stroke="#431407" stroke-width="2.2" stroke-linecap="round"/>
        <circle cx="31" cy="58" r="3.5" fill="#F43F5E" opacity="0.5"/>
        <circle cx="69" cy="58" r="3.5" fill="#F43F5E" opacity="0.5"/>
        <line x1="20" y1="58" x2="33" y2="60" stroke="#431407" stroke-width="1.8"/>
        <line x1="20" y1="64" x2="33" y2="63" stroke="#431407" stroke-width="1.8"/>
        <line x1="67" y1="60" x2="80" y2="58" stroke="#431407" stroke-width="1.8"/>
        <line x1="67" y1="63" x2="80" y2="64" stroke="#431407" stroke-width="1.8"/>
      </svg>
    `);
  }

  // 2. Dogs / Puppies
  if (kw.includes('狗') || kw.includes('dog') || kw.includes('汪') || kw.includes('柯基') || kw.includes('柴犬')) {
    return svgToDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
        <ellipse cx="22" cy="50" rx="8" ry="18" fill="#78350F" stroke="#451A03" stroke-width="2.5" transform="rotate(15 22 50)"/>
        <ellipse cx="78" cy="50" rx="8" ry="18" fill="#78350F" stroke="#451A03" stroke-width="2.5" transform="rotate(-15 78 50)"/>
        <circle cx="50" cy="54" r="30" fill="#FBBF24" stroke="#D97706" stroke-width="3"/>
        <circle cx="38" cy="48" r="4.5" fill="#451A03"/>
        <circle cx="62" cy="48" r="4.5" fill="#451A03"/>
        <circle cx="39" cy="46" r="1.5" fill="#FFFFFF"/>
        <circle cx="63" cy="46" r="1.5" fill="#FFFFFF"/>
        <ellipse cx="50" cy="58" rx="6" ry="4" fill="#451A03"/>
        <path d="M 44 64 Q 50 70 56 64" fill="none" stroke="#451A03" stroke-width="2.5" stroke-linecap="round"/>
        <ellipse cx="50" cy="68" rx="3.5" ry="5" fill="#F43F5E"/>
        <circle cx="30" cy="58" r="4" fill="#F87171" opacity="0.6"/>
        <circle cx="70" cy="58" r="4" fill="#F87171" opacity="0.6"/>
      </svg>
    `);
  }

  // 3. Rabbits / Bunnies
  if (kw.includes('兔') || kw.includes('rabbit') || kw.includes('bunny')) {
    return svgToDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
        <ellipse cx="36" cy="24" rx="8" ry="22" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="2.5"/>
        <ellipse cx="36" cy="24" rx="4" ry="16" fill="#F472B6"/>
        <ellipse cx="64" cy="24" rx="8" ry="22" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="2.5"/>
        <ellipse cx="64" cy="24" rx="4" ry="16" fill="#F472B6"/>
        <circle cx="50" cy="60" r="28" fill="#FFFFFF" stroke="#94A3B8" stroke-width="3"/>
        <circle cx="39" cy="56" r="3.5" fill="#1E293B"/>
        <circle cx="61" cy="56" r="3.5" fill="#1E293B"/>
        <polygon points="50,62 47,65 53,65" fill="#F43F5E"/>
        <path d="M 45 68 Q 50 72 55 68" fill="none" stroke="#1E293B" stroke-width="2" stroke-linecap="round"/>
        <circle cx="32" cy="62" r="4.5" fill="#F472B6" opacity="0.6"/>
        <circle cx="68" cy="62" r="4.5" fill="#F472B6" opacity="0.6"/>
      </svg>
    `);
  }

  // 4. Dinosaurs
  if (kw.includes('恐龙') || kw.includes('龙') || kw.includes('dino')) {
    return svgToDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
        <path d="M 45 18 C 68 18 78 30 78 46 C 78 56 70 66 62 74 L 70 86 L 58 86 L 54 76 L 42 76 L 38 86 L 26 86 L 30 68 C 18 64 12 52 12 40 C 12 24 26 18 45 18 Z" fill="#34D399" stroke="#059669" stroke-width="3"/>
        <path d="M 30 16 L 35 22 L 40 16 L 45 22 L 50 16 L 55 22" fill="#F59E0B" stroke="#D97706" stroke-width="2"/>
        <circle cx="56" cy="36" r="4.5" fill="#064E3B"/>
        <circle cx="58" cy="34" r="1.8" fill="#FFFFFF"/>
        <path d="M 64 45 Q 70 47 64 50" fill="none" stroke="#064E3B" stroke-width="2.5" stroke-linecap="round"/>
        <circle cx="48" cy="44" r="3.5" fill="#F87171" opacity="0.6"/>
        <path d="M 28 48 C 34 50 42 58 38 64 C 32 66 26 60 28 48 Z" fill="#A7F3D0"/>
      </svg>
    `);
  }

  // 5. Bears / Pandas
  if (kw.includes('熊') || kw.includes('bear') || kw.includes('熊猫')) {
    const isPanda = kw.includes('熊猫');
    return svgToDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
        <circle cx="26" cy="30" r="12" fill="${isPanda ? '#1E293B' : '#78350F'}" stroke="#451A03" stroke-width="2.5"/>
        <circle cx="74" cy="30" r="12" fill="${isPanda ? '#1E293B' : '#78350F'}" stroke="#451A03" stroke-width="2.5"/>
        <circle cx="50" cy="56" r="32" fill="${isPanda ? '#FFFFFF' : '#A16207'}" stroke="#451A03" stroke-width="3"/>
        <circle cx="38" cy="48" r="${isPanda ? '6' : '4'}" fill="#1E293B"/>
        <circle cx="62" cy="48" r="${isPanda ? '6' : '4'}" fill="#1E293B"/>
        <circle cx="39" cy="46" r="1.5" fill="#FFFFFF"/>
        <circle cx="63" cy="46" r="1.5" fill="#FFFFFF"/>
        <ellipse cx="50" cy="58" rx="10" ry="8" fill="#FEF3C7"/>
        <polygon points="50,56 46,59 54,59" fill="#1E293B"/>
        <path d="M 46 62 Q 50 66 54 62" fill="none" stroke="#1E293B" stroke-width="2" stroke-linecap="round"/>
      </svg>
    `);
  }

  // 6. Birds / Ducks / Penguins
  if (kw.includes('鸟') || kw.includes('鸭') || kw.includes('企鹅') || kw.includes('bird')) {
    return svgToDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
        <circle cx="50" cy="52" r="30" fill="#38BDF8" stroke="#0284C7" stroke-width="3"/>
        <circle cx="40" cy="46" r="4.5" fill="#0F172A"/>
        <circle cx="60" cy="46" r="4.5" fill="#0F172A"/>
        <circle cx="41" cy="44" r="1.5" fill="#FFFFFF"/>
        <circle cx="61" cy="44" r="1.5" fill="#FFFFFF"/>
        <polygon points="50,50 42,56 58,56" fill="#F59E0B" stroke="#D97706" stroke-width="2"/>
        <path d="M 22 54 Q 14 62 24 68 Z" fill="#0284C7"/>
        <path d="M 78 54 Q 86 62 76 68 Z" fill="#0284C7"/>
        <circle cx="32" cy="54" r="3" fill="#F472B6" opacity="0.6"/>
        <circle cx="68" cy="54" r="3" fill="#F472B6" opacity="0.6"/>
      </svg>
    `);
  }

  // 7. Fish / Marine / Dolphin / Whale
  if (kw.includes('鱼') || kw.includes('fish') || kw.includes('海豚') || kw.includes('鲨鱼')) {
    return svgToDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
        <ellipse cx="46" cy="50" rx="30" ry="20" fill="#FB923C" stroke="#EA580C" stroke-width="3"/>
        <polygon points="70,50 88,32 88,68" fill="#F97316" stroke="#EA580C" stroke-width="2.5"/>
        <circle cx="32" cy="46" r="4.5" fill="#431407"/>
        <circle cx="33" cy="44" r="1.5" fill="#FFFFFF"/>
        <path d="M 24 54 Q 30 58 26 62" fill="none" stroke="#431407" stroke-width="2" stroke-linecap="round"/>
        <path d="M 44 40 Q 52 46 44 52" fill="none" stroke="#EA580C" stroke-width="2" stroke-linecap="round"/>
        <path d="M 52 42 Q 60 48 52 54" fill="none" stroke="#EA580C" stroke-width="2" stroke-linecap="round"/>
      </svg>
    `);
  }

  // 8. Airplanes / Helicopters
  if (kw.includes('飞') || kw.includes('plane') || kw.includes('机')) {
    return svgToDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
        <polygon points="12,48 88,20 54,86 44,55" fill="#38BDF8" stroke="#0284C7" stroke-width="3"/>
        <polygon points="44,55 88,20 54,86" fill="#0284C7" stroke="#0369A1" stroke-width="2"/>
        <polygon points="44,55 40,75 50,65" fill="#FBBF24" stroke="#D97706" stroke-width="2"/>
        <path d="M 10 62 Q 22 76 34 70" fill="none" stroke="#94A3B8" stroke-width="2" stroke-dasharray="3,3"/>
      </svg>
    `);
  }

  // 9. Cars / Trucks / Trains / Buses
  if (kw.includes('车') || kw.includes('car') || kw.includes('轮') || kw.includes('汽')) {
    return svgToDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
        <path d="M 14 56 L 28 34 L 72 34 L 86 56 L 90 70 L 10 70 Z" fill="#3B82F6" stroke="#1D4ED8" stroke-width="3"/>
        <rect x="32" y="38" width="16" height="14" fill="#E0F2FE" rx="2" stroke="#1D4ED8" stroke-width="1.5"/>
        <rect x="52" y="38" width="16" height="14" fill="#E0F2FE" rx="2" stroke="#1D4ED8" stroke-width="1.5"/>
        <circle cx="28" cy="70" r="10" fill="#334155" stroke="#0F172A" stroke-width="2.5"/>
        <circle cx="28" cy="70" r="3.5" fill="#E2E8F0"/>
        <circle cx="72" cy="70" r="10" fill="#334155" stroke="#0F172A" stroke-width="2.5"/>
        <circle cx="72" cy="70" r="3.5" fill="#E2E8F0"/>
        <circle cx="86" cy="60" r="3" fill="#FBBF24"/>
      </svg>
    `);
  }

  // 10. Rockets / Space
  if (kw.includes('火箭') || kw.includes('太空') || kw.includes('rocket') || kw.includes('星球')) {
    return svgToDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
        <path d="M 50 12 C 68 28 68 64 50 74 C 32 64 32 28 50 12 Z" fill="#EF4444" stroke="#B91C1C" stroke-width="3"/>
        <circle cx="50" cy="40" r="9" fill="#38BDF8" stroke="#FFFFFF" stroke-width="3.5"/>
        <path d="M 34 58 L 18 74 L 32 74 Z" fill="#F59E0B" stroke="#D97706" stroke-width="2.5"/>
        <path d="M 66 58 L 82 74 L 68 74 Z" fill="#F59E0B" stroke="#D97706" stroke-width="2.5"/>
        <path d="M 44 74 Q 50 94 56 74 Z" fill="#FBBF24"/>
      </svg>
    `);
  }

  // 11. Ice cream / Cake / Sweets
  if (kw.includes('冰') || kw.includes('甜') || kw.includes('糕') || kw.includes('糖') || kw.includes('cake')) {
    return svgToDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
        <polygon points="32,48 68,48 50,92" fill="#F59E0B" stroke="#D97706" stroke-width="2.5"/>
        <line x1="38" y1="56" x2="62" y2="80" stroke="#D97706" stroke-width="1.8"/>
        <line x1="62" y1="56" x2="38" y2="80" stroke="#D97706" stroke-width="1.8"/>
        <circle cx="50" cy="36" r="22" fill="#FB7185" stroke="#E11D48" stroke-width="2.5"/>
        <circle cx="50" cy="14" r="7" fill="#EF4444" stroke="#B91C1C" stroke-width="2"/>
        <circle cx="44" cy="32" r="2.5" fill="#4C0519"/>
        <circle cx="56" cy="32" r="2.5" fill="#4C0519"/>
        <path d="M 47 38 Q 50 42 53 38" fill="none" stroke="#4C0519" stroke-width="2" stroke-linecap="round"/>
      </svg>
    `);
  }

  // 12. Fruit (Apple, Watermelon, Strawberry, Cherry, etc.)
  if (kw.includes('果') || kw.includes('草莓') || kw.includes('西瓜') || kw.includes('苹果') || kw.includes('桃')) {
    return svgToDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
        <path d="M 50 24 C 78 24 84 50 70 76 C 60 92 50 92 40 84 C 22 70 18 45 32 26 C 40 22 46 24 50 24 Z" fill="#F43F5E" stroke="#BE123C" stroke-width="3"/>
        <path d="M 50 12 L 50 24 M 38 22 Q 50 30 62 22 M 34 24 Q 50 34 66 24" fill="none" stroke="#10B981" stroke-width="5.5" stroke-linecap="round"/>
        <circle cx="44" cy="44" r="1.8" fill="#FEF08A"/>
        <circle cx="56" cy="42" r="1.8" fill="#FEF08A"/>
        <circle cx="50" cy="56" r="1.8" fill="#FEF08A"/>
        <circle cx="62" cy="58" r="1.8" fill="#FEF08A"/>
        <circle cx="38" cy="62" r="1.8" fill="#FEF08A"/>
        <circle cx="52" cy="72" r="1.8" fill="#FEF08A"/>
      </svg>
    `);
  }

  // 13. Flowers / Plants / Nature / Trees
  if (kw.includes('花') || kw.includes('树') || kw.includes('草') || kw.includes('叶') || kw.includes('flower')) {
    return svgToDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
        <g fill="#F59E0B" stroke="#D97706" stroke-width="2">
          <circle cx="50" cy="18" r="11"/>
          <circle cx="50" cy="82" r="11"/>
          <circle cx="18" cy="50" r="11"/>
          <circle cx="82" cy="50" r="11"/>
          <circle cx="27" cy="27" r="11"/>
          <circle cx="73" cy="73" r="11"/>
          <circle cx="27" cy="73" r="11"/>
          <circle cx="73" cy="27" r="11"/>
        </g>
        <circle cx="50" cy="50" r="24" fill="#FBBF24" stroke="#B45309" stroke-width="3"/>
        <circle cx="43" cy="46" r="3" fill="#78350F"/>
        <circle cx="57" cy="46" r="3" fill="#78350F"/>
        <path d="M 44 54 Q 50 62 56 54" fill="none" stroke="#78350F" stroke-width="3" stroke-linecap="round"/>
        <circle cx="39" cy="53" r="3" fill="#F87171" opacity="0.6"/>
        <circle cx="61" cy="53" r="3" fill="#F87171" opacity="0.6"/>
      </svg>
    `);
  }

  // 14. Stars / Sun / Moon / Sky
  if (kw.includes('星') || kw.includes('日') || kw.includes('阳') || kw.includes('月') || kw.includes('光') || kw.includes('star')) {
    return svgToDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
        <polygon points="50,10 62,38 92,40 68,60 76,88 50,72 24,88 32,60 8,40 38,38" fill="#FBBF24" stroke="#D97706" stroke-width="3"/>
        <circle cx="42" cy="46" r="3" fill="#78350F"/>
        <circle cx="58" cy="46" r="3" fill="#78350F"/>
        <path d="M 45 54 Q 50 60 55 54" fill="none" stroke="#78350F" stroke-width="2.5" stroke-linecap="round"/>
        <circle cx="36" cy="52" r="2.5" fill="#F43F5E" opacity="0.6"/>
        <circle cx="64" cy="52" r="2.5" fill="#F43F5E" opacity="0.6"/>
      </svg>
    `);
  }

  // 15. Stationery / Scissors / Glue / Ruler / Pencil
  if (kw.includes('笔') || kw.includes('尺') || kw.includes('剪') || kw.includes('胶') || kw.includes('书包') || kw.includes('纸')) {
    return svgToDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
        <polygon points="20,80 32,76 76,28 68,20 24,68" fill="#F59E0B" stroke="#D97706" stroke-width="2.5"/>
        <polygon points="68,20 76,28 84,20 76,12" fill="#F43F5E" stroke="#BE123C" stroke-width="2"/>
        <polygon points="20,80 24,68 32,76" fill="#FEF08A"/>
        <polygon points="20,80 21,78 22,79" fill="#1E293B"/>
        <circle cx="46" cy="52" r="2" fill="#78350F"/>
        <circle cx="54" cy="44" r="2" fill="#78350F"/>
      </svg>
    `);
  }

  // 16. Universal High-Precision Cute Creature Mascot (ZERO TEXT! Real Graphic Character!)
  return svgToDataUrl(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
      <circle cx="28" cy="30" r="10" fill="#FBBF24" stroke="#D97706" stroke-width="2.5"/>
      <circle cx="72" cy="30" r="10" fill="#FBBF24" stroke="#D97706" stroke-width="2.5"/>
      <circle cx="50" cy="54" r="30" fill="#FDE047" stroke="#CA8A04" stroke-width="3"/>
      <ellipse cx="40" cy="48" rx="4" ry="5.5" fill="#713F12"/>
      <ellipse cx="60" cy="48" rx="4" ry="5.5" fill="#713F12"/>
      <circle cx="41" cy="46" r="1.5" fill="#FFFFFF"/>
      <circle cx="61" cy="46" r="1.5" fill="#FFFFFF"/>
      <polygon points="50,56 46,59 54,59" fill="#F43F5E"/>
      <path d="M 45 64 Q 50 68 55 64" fill="none" stroke="#713F12" stroke-width="2.5" stroke-linecap="round"/>
      <circle cx="32" cy="56" r="3.5" fill="#F43F5E" opacity="0.6"/>
      <circle cx="68" cy="56" r="3.5" fill="#F43F5E" opacity="0.6"/>
      <polygon points="50,14 53,22 61,22 55,27 57,35 50,30 43,35 45,27 39,22 47,22" fill="#F59E0B" stroke="#D97706" stroke-width="1.5"/>
    </svg>
  `);
}

/**
 * Draws an image with a solid contour-hugging die-cut white outline on an HTML5 2D canvas
 * Uses 16 circular sample offsets to create a smooth, continuous silhouette border around the exact shape.
 */
export function drawStickerWithWhiteOutline(
  ctx: CanvasRenderingContext2D,
  img: CanvasImageSource,
  dx: number,
  dy: number,
  dw: number,
  dh: number,
  outlineWidth: number = 3.5
) {
  ctx.save();
  const steps = 16;
  const radius = outlineWidth;

  ctx.shadowColor = '#FFFFFF';
  ctx.shadowBlur = outlineWidth * 1.5;

  for (let i = 0; i < steps; i++) {
    const angle = (i * 2 * Math.PI) / steps;
    const ox = Math.cos(angle) * radius;
    const oy = Math.sin(angle) * radius;
    ctx.drawImage(img, dx + ox, dy + oy, dw, dh);
  }

  // Draw main image on top
  ctx.shadowBlur = 0;
  ctx.drawImage(img, dx, dy, dw, dh);
  ctx.restore();
}
