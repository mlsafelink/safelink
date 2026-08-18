// Ilustración vectorial moderna y minimalista de un DVR/NVR frontal con canales y conexiones de cámaras

export function DVRIllustration({ className }: { className?: string }) {
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
        <linearGradient id="dvrChassisGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#1e1b4b" />
          <stop offset="50%" stopColor="#0f172a" />
          <stop offset="100%" stopColor="#2e1065" />
        </linearGradient>

        <linearGradient id="dvrBezelGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#a855f7" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#6366f1" stopOpacity="0.4" />
        </linearGradient>

        <linearGradient id="camLineGrad1" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#c084fc" />
          <stop offset="100%" stopColor="#a855f7" />
        </linearGradient>

        <linearGradient id="camLineGrad2" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#818cf8" />
          <stop offset="100%" stopColor="#6366f1" />
        </linearGradient>

        <filter id="dvrGlow" x="-10%" y="-10%" width="120%" height="120%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>

        <filter id="camNodeGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#7c3aed" floodOpacity="0.35" />
        </filter>
      </defs>

      {/* ── 1. CHASSIS PRINCIPAL DEL DVR / NVR (Rackmount 1.5U) ── */}
      <g id="dvr-chassis">
        {/* Sombra */}
        <rect x="25" y="30" width="410" height="74" rx="10" fill="#000000" opacity="0.35" />
        {/* Cuerpo del DVR */}
        <rect
          x="20"
          y="24"
          width="420"
          height="74"
          rx="10"
          fill="url(#dvrChassisGrad)"
          stroke="url(#dvrBezelGrad)"
          strokeWidth="1.5"
        />

        {/* Orejas de rack */}
        <rect x="20" y="24" width="14" height="74" rx="3" fill="#334155" opacity="0.8" />
        <circle cx="27" cy="40" r="3" fill="#0f172a" stroke="#64748b" strokeWidth="1" />
        <circle cx="27" cy="82" r="3" fill="#0f172a" stroke="#64748b" strokeWidth="1" />

        <rect x="426" y="24" width="14" height="74" rx="3" fill="#334155" opacity="0.8" />
        <circle cx="433" cy="40" r="3" fill="#0f172a" stroke="#64748b" strokeWidth="1" />
        <circle cx="433" cy="82" r="3" fill="#0f172a" stroke="#64748b" strokeWidth="1" />

        {/* Logo e información del equipo */}
        <text x="44" y="52" fill="#e2e8f0" fontSize="10" fontWeight="700" fontFamily="sans-serif" letterSpacing="0.08em">
          SafeLink <tspan fill="#c084fc">DVR-01</tspan>
        </text>
        <text x="44" y="65" fill="#94a3b8" fontSize="7.5" fontFamily="sans-serif">
          NVR 16-CH 4K / H.265+
        </text>

        {/* LEDs de estado: POWER, HDD, NET, ALARM */}
        <circle cx="44" cy="78" r="2.5" fill="#22c55e" filter="url(#dvrGlow)" />
        <circle cx="53" cy="78" r="2.5" fill="#ef4444" filter="url(#dvrGlow)" />
        <circle cx="62" cy="78" r="2.5" fill="#38bdf8" />
        <circle cx="71" cy="78" r="2.5" fill="#eab308" />

        {/* ── CANALES BNC / RJ45 DE VIDEO (Frontal / Panel de Canales) ── */}
        {/* Grupo 1: Canales CH01 - CH08 */}
        <g transform="translate(155, 36)">
          <rect x="-6" y="-4" width="128" height="52" rx="5" fill="#090d16" stroke="#475569" strokeWidth="1" />
          {/* Fila Superior: CH01, CH02, CH03, CH04 */}
          {[0, 1, 2, 3].map((idx) => {
            const chNum = `CH${(idx + 1).toString().padStart(2, '0')}`;
            const x = idx * 30;
            const isConnected = idx === 0 || idx === 1; // CH01 y CH02 conectados
            return (
              <g key={`ch-top-${idx}`} transform={`translate(${x}, 0)`}>
                {/* Conector BNC / Canal */}
                <circle
                  cx="11"
                  cy="9"
                  r="8"
                  fill={isConnected ? '#2e1065' : '#1e293b'}
                  stroke={isConnected ? '#c084fc' : '#64748b'}
                  strokeWidth="1.2"
                />
                <circle cx="11" cy="9" r="4.5" fill="#090d16" stroke={isConnected ? '#a855f7' : '#475569'} strokeWidth="1" />
                <circle cx="11" cy="9" r="1.5" fill={isConnected ? '#fbbf24' : '#64748b'} />
                {/* LED de grabación */}
                <circle cx="23" cy="9" r="1.5" fill={isConnected ? '#22c55e' : '#64748b'} />
                <text x="11" y="-1" fill={isConnected ? '#c084fc' : '#64748b'} fontSize="6" fontWeight="bold" textAnchor="middle">{chNum}</text>
              </g>
            );
          })}

          {/* Fila Inferior: CH05, CH06, CH07, CH08 */}
          {[0, 1, 2, 3].map((idx) => {
            const chNum = `CH${(idx + 5).toString().padStart(2, '0')}`;
            const x = idx * 30;
            const isConnected = idx === 2; // CH07 conectado
            return (
              <g key={`ch-bot-${idx}`} transform={`translate(${x}, 24)`}>
                <circle
                  cx="11"
                  cy="9"
                  r="8"
                  fill={isConnected ? '#1e1b4b' : '#1e293b'}
                  stroke={isConnected ? '#818cf8' : '#64748b'}
                  strokeWidth="1.2"
                />
                <circle cx="11" cy="9" r="4.5" fill="#090d16" stroke={isConnected ? '#6366f1' : '#475569'} strokeWidth="1" />
                <circle cx="11" cy="9" r="1.5" fill={isConnected ? '#fbbf24' : '#64748b'} />
                <circle cx="23" cy="9" r="1.5" fill={isConnected ? '#22c55e' : '#64748b'} />
                <text x="11" y="24" fill={isConnected ? '#818cf8' : '#64748b'} fontSize="6" fontWeight="bold" textAnchor="middle">{chNum}</text>
              </g>
            );
          })}
        </g>

        {/* Bahía de Discos HDD y Monitor HDMI */}
        <g transform="translate(295, 36)">
          <rect x="0" y="-4" width="128" height="52" rx="5" fill="#090d16" stroke="#334155" strokeWidth="1" />
          {/* HDD Tray 1 & 2 */}
          <rect x="6" y="2" width="54" height="40" rx="3" fill="#1e293b" stroke="#475569" strokeWidth="1" />
          <line x1="12" y1="12" x2="50" y2="12" stroke="#64748b" strokeWidth="1.5" />
          <line x1="12" y1="20" x2="50" y2="20" stroke="#64748b" strokeWidth="1.5" />
          <text x="30" y="34" fill="#94a3b8" fontSize="6.5" fontWeight="bold" textAnchor="middle">HDD 4TB</text>

          <rect x="66" y="2" width="54" height="40" rx="3" fill="#1e293b" stroke="#475569" strokeWidth="1" />
          <line x1="72" y1="12" x2="110" y2="12" stroke="#64748b" strokeWidth="1.5" />
          <line x1="72" y1="20" x2="110" y2="20" stroke="#64748b" strokeWidth="1.5" />
          <text x="93" y="34" fill="#94a3b8" fontSize="6.5" fontWeight="bold" textAnchor="middle">HDD 4TB</text>
        </g>
      </g>

      {/* ── 2. LÍNEAS DE CONEXIÓN VECTORIALES DESCENDENTES ── */}
      <g id="cam-connection-lines">
        {/* Conexión 1: CH01 -> Cámara CAM-01 */}
        <path
          d="M 166 98 C 166 125, 95 125, 95 148"
          stroke="url(#camLineGrad1)"
          strokeWidth="2"
          fill="none"
          strokeDasharray="4 3"
        />
        <circle cx="166" cy="98" r="3" fill="#c084fc" />

        {/* Conexión 2: CH02 -> Cámara CAM-02 */}
        <path
          d="M 196 98 C 196 128, 230 128, 230 148"
          stroke="url(#camLineGrad1)"
          strokeWidth="2"
          fill="none"
        />
        <circle cx="196" cy="98" r="3" fill="#c084fc" />

        {/* Conexión 3: CH07 -> Cámara CAM-03 */}
        <path
          d="M 226 98 C 226 125, 365 125, 365 148"
          stroke="url(#camLineGrad2)"
          strokeWidth="2"
          fill="none"
          strokeDasharray="4 3"
        />
        <circle cx="226" cy="98" r="3" fill="#818cf8" />
      </g>

      {/* ── 3. NODOS TÉCNICOS FINALES (Cámaras Domo, Bullet, etc.) ── */}
      <g id="camera-nodes" filter="url(#camNodeGlow)">
        {/* Nodo 1: CAM-01 (Hall Principal) */}
        <g transform="translate(45, 148)">
          <rect x="0" y="0" width="100" height="46" rx="8" fill="#ffffff" stroke="#e2e8f0" strokeWidth="1.5" />
          <rect x="6" y="8" width="30" height="30" rx="6" fill="#faf5ff" stroke="#e9d5ff" strokeWidth="1" />
          {/* Icono Domo */}
          <path d="M 14 26 C 14 18, 28 18, 28 26 Z" fill="#9333ea" />
          <circle cx="21" cy="23" r="3" fill="#ffffff" />
          <circle cx="21" cy="23" r="1.5" fill="#7e22ce" />
          <text x="42" y="22" fill="#0f172a" fontSize="10" fontWeight="bold" fontFamily="sans-serif">CAM-01</text>
          <text x="42" y="34" fill="#64748b" fontSize="8" fontFamily="sans-serif">Hall Principal</text>
          <circle cx="90" cy="23" r="3" fill="#22c55e" />
        </g>

        {/* Nodo 2: CAM-02 (Cocheras) */}
        <g transform="translate(180, 148)">
          <rect x="0" y="0" width="100" height="46" rx="8" fill="#ffffff" stroke="#e2e8f0" strokeWidth="1.5" />
          <rect x="6" y="8" width="30" height="30" rx="6" fill="#f5f3ff" stroke="#ddd6fe" strokeWidth="1" />
          {/* Icono Bullet */}
          <path d="M 12 18 L 24 20 L 24 26 L 12 28 Z" fill="#7c3aed" />
          <polygon points="24,20 28,17 28,29 24,26" fill="#6d28d9" />
          <text x="42" y="22" fill="#0f172a" fontSize="10" fontWeight="bold" fontFamily="sans-serif">CAM-02</text>
          <text x="42" y="34" fill="#64748b" fontSize="8" fontFamily="sans-serif">Cocheras PB</text>
          <circle cx="90" cy="23" r="3" fill="#22c55e" />
        </g>

        {/* Nodo 3: CAM-03 (Ascensores) */}
        <g transform="translate(315, 148)">
          <rect x="0" y="0" width="100" height="46" rx="8" fill="#ffffff" stroke="#e2e8f0" strokeWidth="1.5" />
          <rect x="6" y="8" width="30" height="30" rx="6" fill="#eef2ff" stroke="#c7d2fe" strokeWidth="1" />
          {/* Icono Domo 2 */}
          <path d="M 14 26 C 14 18, 28 18, 28 26 Z" fill="#4f46e5" />
          <circle cx="21" cy="23" r="3" fill="#ffffff" />
          <circle cx="21" cy="23" r="1.5" fill="#3730a3" />
          <text x="42" y="22" fill="#0f172a" fontSize="10" fontWeight="bold" fontFamily="sans-serif">CAM-03</text>
          <text x="42" y="34" fill="#64748b" fontSize="8" fontFamily="sans-serif">Ascensores</text>
          <circle cx="90" cy="23" r="3" fill="#22c55e" />
        </g>
      </g>
    </svg>
  );
}
