/* Flat, gradient-free illustrations in the brand palette. Original artwork:
   "Towie", the Edu Tower mascot, is a friendly little tower. */

const G = "#58cc02", GD = "#46a302", LIME = "#a5ed6e", BLUE = "#1cb0f6", NAVY = "#042c60", BEE = "#ffc800", PINK = "#ff86d0", SKIN = "#f5c99b", SKIN2 = "#8d5a3b";

export function Towie({ size = 120, wave = false }: { size?: number; wave?: boolean }) {
  return (
    <svg width={size} height={size * 1.15} viewBox="0 0 120 138" role="img" aria-label="Towie, the Edu Tower mascot">
      <rect x="44" y="2" width="8" height="22" rx="4" fill={GD} />
      <path d="M52 4h22l-6 7 6 7H52z" fill={BEE} />
      <rect x="18" y="22" width="84" height="104" rx="22" fill={G} />
      <rect x="18" y="104" width="84" height="22" rx="11" fill={GD} />
      <rect x="28" y="30" width="12" height="10" rx="4" fill={LIME} />
      <rect x="54" y="30" width="12" height="10" rx="4" fill={LIME} />
      <rect x="80" y="30" width="12" height="10" rx="4" fill={LIME} />
      <circle cx="44" cy="64" r="15" fill="#fff" />
      <circle cx="76" cy="64" r="15" fill="#fff" />
      <circle cx="47" cy="66" r="7" fill={NAVY} />
      <circle cx="79" cy="66" r="7" fill={NAVY} />
      <circle cx="49" cy="63" r="2.4" fill="#fff" />
      <circle cx="81" cy="63" r="2.4" fill="#fff" />
      <path d="M50 88q10 10 20 0" stroke={NAVY} strokeWidth="5" fill="none" strokeLinecap="round" />
      <rect x="50" y="108" width="20" height="18" rx="6" fill={NAVY} />
      {wave ? <path d="M102 70q14-8 12-26" stroke={GD} strokeWidth="10" strokeLinecap="round" fill="none" /> : <path d="M102 84q10 6 8 18" stroke={GD} strokeWidth="10" strokeLinecap="round" fill="none" />}
      <path d="M18 84q-10 6-8 18" stroke={GD} strokeWidth="10" strokeLinecap="round" fill="none" />
    </svg>
  );
}

export function HeroScene() {
  return (
    <svg viewBox="0 0 480 380" role="img" aria-label="Students learning with Towie">
      <circle cx="240" cy="200" r="160" fill="#ddf4ff" />
      <rect x="70" y="290" width="340" height="18" rx="9" fill="#e5e5e5" />
      {/* student with laptop */}
      <rect x="92" y="196" width="88" height="96" rx="26" fill={BLUE} />
      <circle cx="136" cy="160" r="34" fill={SKIN} />
      <path d="M102 152q4-38 40-36q30 2 30 34q-14-14-36-12q-20 2-34 14z" fill={NAVY} />
      <circle cx="124" cy="162" r="4" fill={NAVY} /><circle cx="148" cy="162" r="4" fill={NAVY} />
      <path d="M128 176q8 6 16 0" stroke={NAVY} strokeWidth="4" fill="none" strokeLinecap="round" />
      <rect x="110" y="236" width="96" height="58" rx="10" fill={NAVY} />
      <rect x="118" y="244" width="80" height="40" rx="6" fill={LIME} />
      <path d="M134 266l10 8 18-18" stroke={GD} strokeWidth="6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      {/* student with headphones */}
      <rect x="300" y="200" width="86" height="92" rx="26" fill={PINK} />
      <circle cx="343" cy="164" r="34" fill={SKIN2} />
      <path d="M309 160q2-40 34-40q34 0 34 40" stroke={NAVY} strokeWidth="9" fill="none" />
      <rect x="300" y="152" width="16" height="26" rx="8" fill={BLUE} /><rect x="370" y="152" width="16" height="26" rx="8" fill={BLUE} />
      <circle cx="332" cy="166" r="4" fill="#fff" /><circle cx="354" cy="166" r="4" fill="#fff" />
      <path d="M335 180q8 6 16 0" stroke="#fff" strokeWidth="4" fill="none" strokeLinecap="round" />
      {/* floating cards */}
      <g transform="translate(206 40)"><rect width="74" height="58" rx="12" fill="#fff" stroke={LIME} strokeWidth="4" /><text x="37" y="38" textAnchor="middle" fontFamily="Nunito, sans-serif" fontWeight="900" fontSize="24" fill={GD}>7.0</text></g>
      <g transform="translate(60 70)"><rect width="64" height="48" rx="12" fill={BEE} /><path d="M18 24h28M18 32h18" stroke={NAVY} strokeWidth="5" strokeLinecap="round" /></g>
      <g transform="translate(380 70)"><circle r="26" cx="26" cy="26" fill={G} /><path d="M14 27l8 8 16-17" stroke="#fff" strokeWidth="6" fill="none" strokeLinecap="round" strokeLinejoin="round" /></g>
      <g transform="translate(196 150)"><Towie size={88} wave /></g>
    </svg>
  );
}

export function ChartScene() {
  return (
    <svg viewBox="0 0 400 300" role="img" aria-label="Band score rising week by week">
      <rect x="40" y="40" width="320" height="220" rx="20" fill="#fff" stroke="#e5e5e5" strokeWidth="4" />
      {[5.5, 6, 6, 6.5, 7].map((b, i) => (
        <rect key={i} x={74 + i * 56} y={240 - (b - 4) * 50} width="36" height={(b - 4) * 50} rx="8" fill={i === 4 ? G : i === 3 ? LIME : "#ddf4ff"} />
      ))}
      <path d="M92 150L148 125L204 125L260 100L316 75" stroke={BLUE} strokeWidth="6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="316" cy="75" r="10" fill={BEE} stroke={NAVY} strokeWidth="4" />
      <rect x="250" y="12" width="110" height="40" rx="12" fill={NAVY} />
      <text x="305" y="39" textAnchor="middle" fontFamily="Nunito, sans-serif" fontWeight="900" fontSize="18" fill="#fff">Target 7</text>
    </svg>
  );
}

export function ChatScene() {
  return (
    <svg viewBox="0 0 400 300" role="img" aria-label="Asking the helper a question">
      <rect x="40" y="40" width="230" height="64" rx="16" fill="#fff" stroke={BLUE} strokeWidth="4" />
      <path d="M64 64h150M64 82h100" stroke={BLUE} strokeWidth="8" strokeLinecap="round" />
      <rect x="130" y="124" width="230" height="84" rx="16" fill={G} />
      <path d="M154 150h170M154 168h130M154 186h80" stroke="#fff" strokeWidth="8" strokeLinecap="round" />
      <rect x="40" y="226" width="150" height="52" rx="16" fill="#fff" stroke={LIME} strokeWidth="4" />
      <circle cx="70" cy="252" r="12" fill={G} /><path d="M92 252h76" stroke={GD} strokeWidth="8" strokeLinecap="round" />
      <g transform="translate(290 210)"><Towie size={64} /></g>
    </svg>
  );
}

export function MicScene() {
  return (
    <svg viewBox="0 0 400 300" role="img" aria-label="Speaking practice with a microphone">
      <circle cx="200" cy="150" r="120" fill={"#d7ffb8"} />
      <rect x="168" y="70" width="64" height="110" rx="32" fill={NAVY} />
      <path d="M140 140q0 60 60 60t60-60" stroke={NAVY} strokeWidth="10" fill="none" strokeLinecap="round" />
      <rect x="194" y="200" width="12" height="40" fill={NAVY} /><rect x="160" y="236" width="80" height="14" rx="7" fill={NAVY} />
      {[0, 1, 2].map((i) => <path key={i} d={`M${282 + i * 18} ${118 - i * 6}q14 32 0 64`} stroke={BLUE} strokeWidth="8" fill="none" strokeLinecap="round" />)}
      {[0, 1, 2].map((i) => <path key={i} d={`M${118 - i * 18} ${118 - i * 6}q-14 32 0 64`} stroke={G} strokeWidth="8" fill="none" strokeLinecap="round" />)}
    </svg>
  );
}
