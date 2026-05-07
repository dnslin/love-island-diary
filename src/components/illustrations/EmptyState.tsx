import type { ReactNode } from 'react'

interface EmptyStateProps {
  message?: string
  children?: ReactNode
}

export function EmptyState({
  message = '还没有日记呢，翻开第一页吧',
  children,
}: EmptyStateProps) {
  return (
    <>
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }
        @media (prefers-reduced-motion: reduce) {
          .float-anim {
            animation: none !important;
          }
        }
      `}</style>
      <div
        className="flex flex-col items-center justify-center py-12 float-anim"
        style={{ animation: 'float 4s ease-in-out infinite' }}
      >
        {/* 空白日记本 + 铅笔 */}
        <svg
          width="120"
          height="100"
          viewBox="0 0 120 100"
          fill="none"
          stroke="#8A7C78"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          role="img"
          aria-label="空白日记本"
        >
          {/* 日记本左页 */}
          <path d="M10 20 Q10 12 18 12 L58 12 Q62 12 62 16 L62 84 Q62 88 58 88 L18 88 Q10 88 10 80 Z" />
          {/* 日记本右页 */}
          <path d="M62 16 Q62 12 66 12 L106 12 Q114 12 114 20 L114 80 Q114 88 106 88 L66 88 Q62 88 62 84 Z" />
          {/* 书脊 */}
          <line x1="62" y1="12" x2="62" y2="88" />
          {/* 左页横线 */}
          <line x1="18" y1="28" x2="54" y2="28" strokeWidth="1" opacity="0.5" />
          <line x1="18" y1="40" x2="50" y2="40" strokeWidth="1" opacity="0.5" />
          <line x1="18" y1="52" x2="54" y2="52" strokeWidth="1" opacity="0.5" />
          {/* 右页横线 */}
          <line x1="70" y1="28" x2="106" y2="28" strokeWidth="1" opacity="0.5" />
          <line x1="74" y1="40" x2="106" y2="40" strokeWidth="1" opacity="0.5" />
          <line x1="70" y1="52" x2="106" y2="52" strokeWidth="1" opacity="0.5" />
          {/* 铅笔 */}
          <path d="M88 55 L100 43 L106 49 L94 61 Z" />
          <path d="M88 55 L84 67 L96 63 Z" />
          <line x1="92" y1="51" x2="102" y2="41" strokeWidth="1" />
        </svg>
        <p className="mt-4 text-sm text-text-sub text-center">{message}</p>
        {children}
      </div>
    </>
  )
}
