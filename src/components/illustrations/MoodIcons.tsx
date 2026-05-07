interface MoodIconsProps {
  mood: 'sweet' | 'happy' | 'miss' | 'calm' | 'sad'
  size?: number
  className?: string
}

const moodLabels: Record<MoodIconsProps['mood'], string> = {
  sweet: '甜甜的',
  happy: '开心',
  miss: '想念',
  calm: '平静',
  sad: '小难过',
}

export function MoodIcon({ mood, size = 20, className = '' }: MoodIconsProps) {
  const label = moodLabels[mood]
  const s = size
  const half = s / 2

  return (
    <svg
      role="img"
      aria-label={label}
      width={s}
      height={s}
      viewBox={`0 0 ${s} ${s}`}
      className={className}
    >
      {/* 圆轮廓 */}
      <circle
        cx={half}
        cy={half}
        r={half - 1}
        fill="none"
        stroke="#8A7C78"
        strokeWidth={1.2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {mood === 'sweet' && (
        <g stroke="#F7C8D0" fill="#F7C8D0">
          {/* 左眼 */}
          <circle cx={half - 4} cy={half - 2} r={1.2} fill="none" strokeWidth={1} />
          {/* 右眼 */}
          <circle cx={half + 4} cy={half - 2} r={1.2} fill="none" strokeWidth={1} />
          {/* 微笑嘴 */}
          <path d={`M${half - 4} ${half + 3} Q${half} ${half + 6} ${half + 4} ${half + 3}`} fill="none" strokeWidth={1} />
          {/* 左腮红 */}
          <circle cx={half - 5.5} cy={half + 1} r={1.5} stroke="none" opacity={0.5} />
          {/* 右腮红 */}
          <circle cx={half + 5.5} cy={half + 1} r={1.5} stroke="none" opacity={0.5} />
        </g>
      )}

      {mood === 'happy' && (
        <g stroke="#B8DDA8" fill="#B8DDA8">
          {/* 弯眼左 */}
          <path d={`M${half - 5.5} ${half - 2} Q${half - 3.5} ${half - 4} ${half - 1.5} ${half - 2}`} fill="none" strokeWidth={1.2} />
          {/* 弯眼右 */}
          <path d={`M${half + 1.5} ${half - 2} Q${half + 3.5} ${half - 4} ${half + 5.5} ${half - 2}`} fill="none" strokeWidth={1.2} />
          {/* 大笑嘴 */}
          <path d={`M${half - 4} ${half + 1} Q${half} ${half + 7} ${half + 4} ${half + 1} Z`} strokeWidth={1} />
        </g>
      )}

      {mood === 'miss' && (
        <g stroke="#AFC9F7" fill="#AFC9F7">
          {/* 弯眼左 */}
          <path d={`M${half - 5.5} ${half - 2} Q${half - 3.5} ${half - 4} ${half - 1.5} ${half - 2}`} fill="none" strokeWidth={1.2} />
          {/* 弯眼右 */}
          <path d={`M${half + 1.5} ${half - 2} Q${half + 3.5} ${half - 4} ${half + 5.5} ${half - 2}`} fill="none" strokeWidth={1.2} />
          {/* 微笑嘴 */}
          <path d={`M${half - 3} ${half + 3} Q${half} ${half + 5} ${half + 3} ${half + 3}`} fill="none" strokeWidth={1} />
          {/* 小爱心 */}
          <path
            d={`M${half + 5} ${half - 5.5} l-.6-.55 C${half + 3.2} ${half - 7.5} ${half + 2} ${half - 6.8} ${half + 2} ${half - 6} c0 .6 ${half + 3 - (half + 2)} 1.1 ${half + 5 - (half + 2)} 1.9`}
            stroke="none"
            opacity={0.8}
            transform={`scale(0.55) translate(${half * 0.9}, ${half * 0.2})`}
          />
          <path
            d={`M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z`}
            stroke="none"
            opacity={0.6}
            transform={`scale(0.28) translate(${half * 2.2}, ${half * -3.5})`}
          />
        </g>
      )}

      {mood === 'calm' && (
        <g stroke="#D8C7E8" fill="#D8C7E8">
          {/* 横线眼左 */}
          <line x1={half - 5} y1={half - 2} x2={half - 2} y2={half - 2} strokeWidth={1.2} />
          {/* 横线眼右 */}
          <line x1={half + 2} y1={half - 2} x2={half + 5} y2={half - 2} strokeWidth={1.2} />
          {/* 横线嘴 */}
          <line x1={half - 2.5} y1={half + 3} x2={half + 2.5} y2={half + 3} strokeWidth={1} />
        </g>
      )}

      {mood === 'sad' && (
        <g stroke="#E8C4A0" fill="#E8C4A0">
          {/* 小眉毛左 */}
          <line x1={half - 5.5} y1={half - 5} x2={half - 2} y2={half - 3.5} strokeWidth={1} />
          {/* 小眉毛右 */}
          <line x1={half + 2} y1={half - 3.5} x2={half + 5.5} y2={half - 5} strokeWidth={1} />
          {/* 圆眼左 */}
          <circle cx={half - 3.5} cy={half - 1.5} r={1.2} fill="none" strokeWidth={1} />
          {/* 圆眼右 */}
          <circle cx={half + 3.5} cy={half - 1.5} r={1.2} fill="none" strokeWidth={1} />
          {/* 下弯嘴 */}
          <path d={`M${half - 3} ${half + 4} Q${half} ${half + 1.5} ${half + 3} ${half + 4}`} fill="none" strokeWidth={1} />
        </g>
      )}
    </svg>
  )
}
