// Ilustración vectorial moderna y minimalista de un Switch de red frontal con puertos RJ45 y conexiones

export function SwitchIllustration({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 460 210"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ width: '100%', height: 'auto', maxHeight: '190px' }}
    >
      <defs>
        {/* Gradientes */}
        <linearGradient id="swChassisGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#1e293b" />
          <stop offset="50%" stopColor="#0f172a" />
          <stop offset="100%" stopColor="#1e1b4b" />
        </linearGradient>

        <linearGradient id="swBezelGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#6366f1" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.4" />
        </linearGradient>

        <linearGradient id="lineGrad1" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#38bdf8" />
          <stop offset="100%" stopColor="#818cf8" />
        </linearGradient>

        <linearGradient id="lineGrad2" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#818cf8" />
          <stop offset="100%" stopColor="#c084fc" />
        </linearGradient>

        <filter id="swGlow" x="-10%" y="-10%" width="120%" height="120%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>

        <filter id="nodeGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#8b5cf6" floodOpacity="0.35" />
        </filter>
      </defs>

      {/* ── 1. CHASSIS PRINCIPAL DEL SWITCH (Rackmount 1U) ── */}
      <g id="switch-chassis">
        {/* Sombra de la bahía */}
        <rect x="25" y="30" width="410" height="74" rx="10" fill="#000000" opacity="0.35" />
        {/* Cuerpo del Switch */}
        <rect
          x="20"
          y="24"
          width="420"
          height="74"
          rx="10"
          fill="url(#swChassisGrad)"
          stroke="url(#swBezelGrad)"
          strokeWidth="1.5"
        />

        {/* Orejas de montaje de rack (laterales) */}
        <rect x="20" y="24" width="14" height="74" rx="3" fill="#334155" opacity="0.8" />
        <circle cx="27" cy="40" r="3" fill="#0f172a" stroke="#64748b" strokeWidth="1" />
        <circle cx="27" cy="82" r="3" fill="#0f172a" stroke="#64748b" strokeWidth="1" />

        <rect x="426" y="24" width="14" height="74" rx="3" fill="#334155" opacity="0.8" />
        <circle cx="433" cy="40" r="3" fill="#0f172a" stroke="#64748b" strokeWidth="1" />
        <circle cx="433" cy="82" r="3" fill="#0f172a" stroke="#64748b" strokeWidth="1" />

        {/* Logo y Nombre del equipo */}
        <text x="44" y="52" fill="#94a3b8" fontSize="10" fontWeight="700" fontFamily="sans-serif" letterSpacing="0.08em">
          SafeLink <tspan fill="#38bdf8">SW-01</tspan>
        </text>
        <text x="44" y="65" fill="#64748b" fontSize="7.5" fontFamily="sans-serif">
          GIGABIT PoE+ 24P
        </text>

        {/* LED de encendido y estado */}
        <circle cx="44" cy="78" r="2.5" fill="#22c55e" filter="url(#swGlow)" />
        <circle cx="53" cy="78" r="2.5" fill="#38bdf8" filter="url(#swGlow)" />
        <circle cx="62" cy="78" r="2.5" fill="#a855f7" />

        {/* ── MATRIZ DE BOCAS RJ45 (Frontal) ── */}
        {/* Grupo 1: Puertos 01 - 08 */}
        <g transform="translate(155, 36)">
          <rect x="-6" y="-4" width="108" height="52" rx="5" fill="#090d16" stroke="#334155" strokeWidth="1" />
          {/* Fila Superior (Impares) */}
          {[0, 1, 2, 3].map((idx) => {
            const portNum = (idx * 2 + 1).toString().padStart(2, '0');
            const x = idx * 24;
            return (
              <g key={`port-top-${idx}`} transform={`translate(${x}, 0)`}>
                {/* Carcasa RJ45 */}
                <rect x="0" y="0" width="18" height="18" rx="2.5" fill="#1e293b" stroke="#475569" strokeWidth="1" />
                {/* Muesca del conector RJ45 */}
                <path d="M 4 2 L 14 2 L 14 11 L 11 11 L 11 15 L 7 15 L 7 11 L 4 11 Z" fill="#0f172a" />
                {/* Pines dorados */}
                <line x1="6" y1="4" x2="12" y2="4" stroke="#fbbf24" strokeWidth="1" strokeDasharray="1 1" />
                {/* LED de actividad */}
                <circle cx="9" cy="20" r="1.5" fill={idx === 1 ? '#22c55e' : idx === 3 ? '#38bdf8' : '#22c55e'} />
                <text x="9" y="-2" fill="#64748b" fontSize="6" fontWeight="bold" textAnchor="middle">{portNum}</text>
              </g>
            );
          })}

          {/* Fila Inferior (Pares) */}
          {[0, 1, 2, 3].map((idx) => {
            const portNum = (idx * 2 + 2).toString().padStart(2, '0');
            const x = idx * 24;
            return (
              <g key={`port-bot-${idx}`} transform={`translate(${x}, 24)`}>
                <rect x="0" y="0" width="18" height="18" rx="2.5" fill="#1e293b" stroke="#475569" strokeWidth="1" />
                <path d="M 4 16 L 14 16 L 14 7 L 11 7 L 11 3 L 7 3 L 7 7 L 4 7 Z" fill="#0f172a" />
                <line x1="6" y1="14" x2="12" y2="14" stroke="#fbbf24" strokeWidth="1" strokeDasharray="1 1" />
                <circle cx="9" cy="-2" r="1.5" fill={idx === 0 ? '#38bdf8' : '#22c55e'} />
                <text x="9" y="24" fill="#64748b" fontSize="6" fontWeight="bold" textAnchor="middle">{portNum}</text>
              </g>
            );
          })}
        </g>

        {/* Grupo 2: Puertos 09 - 16 (Conectados) */}
        <g transform="translate(275, 36)">
          <rect x="-6" y="-4" width="108" height="52" rx="5" fill="#090d16" stroke="#334155" strokeWidth="1" />
          {[0, 1, 2, 3].map((idx) => {
            const portNum = (idx * 2 + 9).toString().padStart(2, '0');
            const x = idx * 24;
            const isConnected = idx === 0 || idx === 1; // 09 y 11 activos
            return (
              <g key={`port-top-2-${idx}`} transform={`translate(${x}, 0)`}>
                <rect
                  x="0"
                  y="0"
                  width="18"
                  height="18"
                  rx="2.5"
                  fill={isConnected ? '#0f2847' : '#1e293b'}
                  stroke={isConnected ? '#38bdf8' : '#475569'}
                  strokeWidth="1.2"
                />
                <path d="M 4 2 L 14 2 L 14 11 L 11 11 L 11 15 L 7 15 L 7 11 L 4 11 Z" fill="#090d16" />
                <line x1="6" y1="4" x2="12" y2="4" stroke="#38bdf8" strokeWidth="1" />
                <circle cx="9" cy="20" r="1.8" fill="#38bdf8" filter={isConnected ? "url(#swGlow)" : undefined} />
                <text x="9" y="-2" fill={isConnected ? "#38bdf8" : "#64748b"} fontSize="6" fontWeight="bold" textAnchor="middle">{portNum}</text>
              </g>
            );
          })}

          {[0, 1, 2, 3].map((idx) => {
            const portNum = (idx * 2 + 10).toString().padStart(2, '0');
            const x = idx * 24;
            const isConnected = idx === 1; // 12 activo
            return (
              <g key={`port-bot-2-${idx}`} transform={`translate(${x}, 24)`}>
                <rect
                  x="0"
                  y="0"
                  width="18"
                  height="18"
                  rx="2.5"
                  fill={isConnected ? '#251247' : '#1e293b'}
                  stroke={isConnected ? '#c084fc' : '#475569'}
                  strokeWidth="1.2"
                />
                <path d="M 4 16 L 14 16 L 14 7 L 11 7 L 11 3 L 7 3 L 7 7 L 4 7 Z" fill="#090d16" />
                <line x1="6" y1="14" x2="12" y2="14" stroke="#c084fc" strokeWidth="1" />
                <circle cx="9" cy="-2" r="1.8" fill="#c084fc" filter={isConnected ? "url(#swGlow)" : undefined} />
                <text x="9" y="24" fill={isConnected ? "#c084fc" : "#64748b"} fontSize="6" fontWeight="bold" textAnchor="middle">{portNum}</text>
              </g>
            );
          })}
        </g>

        {/* 2 Puertos SFP Fibra Óptica (Derecha) */}
        <g transform="translate(395, 42)">
          <rect x="0" y="0" width="12" height="38" rx="2" fill="#0284c7" opacity="0.3" stroke="#38bdf8" strokeWidth="1" />
          <rect x="2" y="4" width="8" height="12" rx="1" fill="#090d16" />
          <rect x="2" y="20" width="8" height="12" rx="1" fill="#090d16" />
          <circle cx="6" cy="10" r="1.2" fill="#22c55e" />
          <circle cx="6" cy="26" r="1.2" fill="#22c55e" />
          <text x="6" y="44" fill="#38bdf8" fontSize="5" fontWeight="bold" textAnchor="middle">SFP</text>
        </g>
      </g>

      {/* ── 2. LÍNEAS DE CONEXIÓN VECTORIALES DESCENDENTES ── */}
      <g id="connection-lines">
        {/* Conexión 1: Puerto 09 -> Puesto P2-09 */}
        <path
          d="M 284 98 C 284 125, 95 125, 95 148"
          stroke="url(#lineGrad1)"
          strokeWidth="2"
          fill="none"
          strokeDasharray="4 3"
        />
        <circle cx="284" cy="98" r="3" fill="#38bdf8" />

        {/* Conexión 2: Puerto 11 -> Puesto P1-04 */}
        <path
          d="M 308 98 C 308 128, 230 128, 230 148"
          stroke="url(#lineGrad1)"
          strokeWidth="2"
          fill="none"
        />
        <circle cx="308" cy="98" r="3" fill="#38bdf8" />

        {/* Conexión 3: Puerto 12 -> Access Point */}
        <path
          d="M 320 98 C 320 125, 365 125, 365 148"
          stroke="url(#lineGrad2)"
          strokeWidth="2"
          fill="none"
          strokeDasharray="4 3"
        />
        <circle cx="320" cy="98" r="3" fill="#c084fc" />
      </g>

      {/* ── 3. NODOS TÉCNICOS FINALES (Puestos y AP) ── */}
      <g id="connected-nodes" filter="url(#nodeGlow)">
        {/* Nodo 1: Puesto P2-09 */}
        <g transform="translate(45, 148)">
          <rect x="0" y="0" width="100" height="46" rx="8" fill="#ffffff" stroke="#e2e8f0" strokeWidth="1.5" />
          <rect x="6" y="8" width="30" height="30" rx="6" fill="#f0f9ff" stroke="#bae6fd" strokeWidth="1" />
          {/* Icono de Boca RJ45 */}
          <path d="M 16 17 L 26 17 L 26 27 L 23 27 L 23 30 L 19 30 L 19 27 L 16 27 Z" fill="#0284c7" />
          <text x="42" y="22" fill="#0f172a" fontSize="10" fontWeight="bold" fontFamily="sans-serif">P2-09</text>
          <text x="42" y="34" fill="#64748b" fontSize="8" fontFamily="sans-serif">Puesto 2° Piso</text>
          <circle cx="90" cy="23" r="3" fill="#22c55e" />
        </g>

        {/* Nodo 2: Puesto P1-04 */}
        <g transform="translate(180, 148)">
          <rect x="0" y="0" width="100" height="46" rx="8" fill="#ffffff" stroke="#e2e8f0" strokeWidth="1.5" />
          <rect x="6" y="8" width="30" height="30" rx="6" fill="#f0fdf4" stroke="#bbf7d0" strokeWidth="1" />
          <path d="M 16 17 L 26 17 L 26 27 L 23 27 L 23 30 L 19 30 L 19 27 L 16 27 Z" fill="#16a34a" />
          <text x="42" y="22" fill="#0f172a" fontSize="10" fontWeight="bold" fontFamily="sans-serif">P1-04</text>
          <text x="42" y="34" fill="#64748b" fontSize="8" fontFamily="sans-serif">Recepción PB</text>
          <circle cx="90" cy="23" r="3" fill="#22c55e" />
        </g>

        {/* Nodo 3: Access Point AP-01 */}
        <g transform="translate(315, 148)">
          <rect x="0" y="0" width="100" height="46" rx="8" fill="#ffffff" stroke="#e2e8f0" strokeWidth="1.5" />
          <rect x="6" y="8" width="30" height="30" rx="6" fill="#faf5ff" stroke="#e9d5ff" strokeWidth="1" />
          {/* Icono de Access Point / WiFi */}
          <path d="M 21 28 A 3 3 0 0 1 21 22 M 17 31 A 8 8 0 0 1 17 19 M 13 34 A 13 13 0 0 1 13 16" stroke="#9333ea" strokeWidth="1.8" strokeLinecap="round" fill="none" />
          <circle cx="21" cy="25" r="2" fill="#9333ea" />
          <text x="42" y="22" fill="#0f172a" fontSize="10" fontWeight="bold" fontFamily="sans-serif">AP-01</text>
          <text x="42" y="34" fill="#64748b" fontSize="8" fontFamily="sans-serif">UniFi WiFi 6</text>
          <circle cx="90" cy="23" r="3" fill="#38bdf8" />
        </g>
      </g>
    </svg>
  );
}
