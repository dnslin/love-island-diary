export default function CoverDecorations() {
  return (
    <>
      <style>{`
        @keyframes cloud-drift {
          0%, 100% { transform: translateX(0); }
          50% { transform: translateX(5px); }
        }
        @keyframes flower-sway {
          0%, 100% { transform: rotate(0deg); }
          50% { transform: rotate(5deg); }
        }
        @keyframes heart-pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.02); }
        }
        @keyframes star-pulse {
          0%, 100% { transform: scale(1) rotate(5deg); }
          50% { transform: scale(0.98) rotate(5deg); }
        }
        @media (prefers-reduced-motion: reduce) {
          .cloud-anim,
          .flower-anim,
          .heart-anim,
          .star-anim {
            animation: none !important;
          }
        }
      `}</style>

      {/* 岛屿线稿 — 静态 */}
      <svg
        className="absolute top-[280px] left-5 w-[220px] h-[140px] opacity-40 pointer-events-none"
        viewBox="0 0 220 140"
        fill="none"
        stroke="#E8AEB7"
        strokeWidth="1.5"
        strokeLinecap="round"
      >
        <path d="M20 115 Q45 70 90 65 Q115 35 150 58 Q185 45 205 115 Z" />
        <circle cx="65" cy="88" r="3.5" fill="#F7C8D0" stroke="none" />
        <circle cx="165" cy="82" r="3" fill="#F7C8D0" stroke="none" />
        <path d="M100 52 Q105 40 110 52 Q115 40 120 52" stroke="#B8DDA8" strokeWidth="1" />
        <path d="M140 62 Q145 50 150 62 Q155 50 160 62" stroke="#AFC9F7" strokeWidth="1" />
      </svg>

      {/* 云朵 1 */}
      <svg
        className="cloud-anim absolute top-[260px] right-5 w-[80px] h-[40px] opacity-35 pointer-events-none"
        viewBox="0 0 80 40"
        fill="none"
        stroke="#8A7C78"
        strokeWidth="1"
        strokeLinecap="round"
        style={{ animation: 'cloud-drift 12s ease-in-out infinite' }}
      >
        <path d="M10 30 Q10 15 25 15 Q30 5 45 10 Q55 5 65 15 Q75 15 75 30 Z" />
      </svg>

      {/* 云朵 2 */}
      <svg
        className="cloud-anim absolute top-[460px] left-10 w-[60px] h-[30px] opacity-45 pointer-events-none"
        viewBox="0 0 60 30"
        fill="none"
        stroke="#8A7C78"
        strokeWidth="1"
        strokeLinecap="round"
        style={{ animation: 'cloud-drift 10s ease-in-out infinite' }}
      >
        <path d="M8 22 Q8 12 18 12 Q22 5 32 8 Q40 5 48 12 Q55 12 55 22 Z" />
      </svg>

      {/* 小花 1 */}
      <svg
        className="flower-anim absolute top-[250px] left-[140px] w-7 h-7 opacity-45 pointer-events-none"
        viewBox="0 0 28 28"
        fill="none"
        stroke="#F7C8D0"
        strokeWidth="1.5"
        strokeLinecap="round"
        style={{ animation: 'flower-sway 6s ease-in-out infinite', transformOrigin: 'center' }}
      >
        <circle cx="14" cy="14" r="3.5" fill="#F7C8D0" fillOpacity="0.3" />
        <path d="M14 5 Q14 0 10 4 Q6 0 8 5 Q2 5 6 9 Q0 12 6 12 Q2 16 8 16 Q6 21 10 17 Q14 21 14 16 Q18 21 20 17 Q22 21 20 16 Q26 16 22 12 Q28 9 20 9 Q24 5 18 5 Q14 0 14 5Z" />
      </svg>

      {/* 心形 1 */}
      <svg
        className="heart-anim absolute top-[420px] right-16 w-6 h-6 opacity-45 pointer-events-none"
        viewBox="0 0 24 24"
        fill="#E8AEB7"
        style={{ animation: 'heart-pulse 4s ease-in-out infinite', transformOrigin: 'center' }}
      >
        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
      </svg>

      {/* 星星 1 */}
      <svg
        className="star-anim absolute top-[480px] left-24 w-5 h-5 opacity-40 pointer-events-none"
        viewBox="0 0 20 20"
        fill="#B8DDA8"
        style={{ animation: 'star-pulse 4s ease-in-out infinite', transformOrigin: 'center' }}
      >
        <path d="M10 1 L12 7 L18 7 L13 11 L15 17 L10 13 L5 17 L7 11 L2 7 L8 7Z" />
      </svg>

      {/* 心形 2（小） */}
      <svg
        className="heart-anim absolute top-[320px] right-10 w-[18px] h-[18px] opacity-40 pointer-events-none"
        viewBox="0 0 24 24"
        fill="#E8AEB7"
        style={{ animation: 'heart-pulse 4s ease-in-out infinite 1s', transformOrigin: 'center' }}
      >
        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
      </svg>

      {/* 小花 2（小） */}
      <svg
        className="flower-anim absolute top-[300px] left-24 w-[22px] h-[22px] opacity-35 pointer-events-none"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#AFC9F7"
        strokeWidth="1.5"
        strokeLinecap="round"
        style={{ animation: 'flower-sway 6s ease-in-out infinite 0.5s', transformOrigin: 'center' }}
      >
        <circle cx="12" cy="12" r="3" fill="#AFC9F7" fillOpacity="0.3" />
        <path d="M12 4 Q12 0 9 3 Q5 0 7 4 Q1 4 5 8 Q0 11 5 11 Q0 15 7 15 Q5 20 9 16 Q12 20 12 15 Q15 20 17 16 Q19 20 17 15 Q23 15 19 11 Q24 8 17 8 Q21 4 15 4 Q12 0 12 4Z" />
      </svg>
    </>
  )
}
