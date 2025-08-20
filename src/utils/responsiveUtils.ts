// レスポンシブデザインのユーティリティ関数

/**
 * 画面サイズに基づいてクラス名を生成
 */
export const getResponsiveClasses = (
  base: string,
  sm?: string,
  md?: string,
  lg?: string,
  xl?: string
): string => {
  const classes = [base]
  
  if (sm) classes.push(`sm:${sm}`)
  if (md) classes.push(`md:${md}`)
  if (lg) classes.push(`lg:${lg}`)
  if (xl) classes.push(`xl:${xl}`)
  
  return classes.join(' ')
}

/**
 * 子供向けUIのためのレスポンシブクラス
 */
export const getChildFriendlyResponsiveClasses = () => ({
  // ボタンサイズ
  buttonSize: getResponsiveClasses(
    'px-6 py-4 text-lg',     // base: モバイル
    'px-8 py-5 text-xl',     // sm: 640px+
    'px-10 py-6 text-2xl'    // md: 768px+
  ),
  
  // テキストサイズ
  headingSize: getResponsiveClasses(
    'text-2xl',              // base: モバイル
    'text-3xl',              // sm: 640px+
    'text-4xl'               // md: 768px+
  ),
  
  // カードパディング
  cardPadding: getResponsiveClasses(
    'p-4',                   // base: モバイル
    'p-6',                   // sm: 640px+
    'p-8'                    // md: 768px+
  ),
  
  // グリッドレイアウト
  gridCols: getResponsiveClasses(
    'grid-cols-1',           // base: モバイル
    'grid-cols-2',           // sm: 640px+
    'grid-cols-3'            // md: 768px+
  )
})

/**
 * タッチフレンドリーなサイズを取得
 */
export const getTouchFriendlySize = (size: 'small' | 'medium' | 'large' | 'child') => {
  const sizes = {
    small: {
      minHeight: 'min-h-8',
      padding: 'px-3 py-2',
      text: 'text-sm'
    },
    medium: {
      minHeight: 'min-h-touch-target', // 44px
      padding: 'px-6 py-3',
      text: 'text-base'
    },
    large: {
      minHeight: 'min-h-12',
      padding: 'px-8 py-4',
      text: 'text-lg'
    },
    child: {
      minHeight: 'min-h-16', // 64px - 子供向け特大
      padding: 'px-10 py-6',
      text: 'text-child-friendly font-bold'
    }
  }
  
  return sizes[size]
}

/**
 * デバイスタイプを判定
 */
export const getDeviceType = (): 'mobile' | 'tablet' | 'desktop' => {
  if (typeof window === 'undefined') return 'desktop'
  
  const width = window.innerWidth
  
  if (width < 768) return 'mobile'
  if (width < 1024) return 'tablet'
  return 'desktop'
}

/**
 * タッチデバイスかどうかを判定
 */
export const isTouchDevice = (): boolean => {
  if (typeof window === 'undefined') return false
  
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0
}

/**
 * 子供向けUIに最適化されたブレークポイント
 */
export const CHILD_FRIENDLY_BREAKPOINTS = {
  sm: '640px',   // スマートフォン横向き
  md: '768px',   // タブレット縦向き
  lg: '1024px',  // タブレット横向き・小さなデスクトップ
  xl: '1280px'   // デスクトップ
} as const

/**
 * 子供向けUIのためのメディアクエリ
 */
export const createMediaQuery = (breakpoint: keyof typeof CHILD_FRIENDLY_BREAKPOINTS) => {
  return `(min-width: ${CHILD_FRIENDLY_BREAKPOINTS[breakpoint]})`
}

/**
 * 画面サイズに応じたグリッドカラム数を計算
 */
export const getGridColumns = (itemCount: number, maxColumns: number = 4): string => {
  const deviceType = getDeviceType()
  
  let columns: number
  
  switch (deviceType) {
    case 'mobile':
      columns = Math.min(itemCount, 1)
      break
    case 'tablet':
      columns = Math.min(itemCount, 2)
      break
    case 'desktop':
      columns = Math.min(itemCount, maxColumns)
      break
    default:
      columns = Math.min(itemCount, 2)
  }
  
  return `grid-cols-${columns}`
}

/**
 * 子供向けUIのためのアニメーション設定
 */
export const getChildFriendlyAnimations = () => ({
  // ボタンホバー効果
  buttonHover: 'transition-all duration-200 hover:scale-105 active:scale-95',
  
  // カードホバー効果
  cardHover: 'transition-all duration-300 hover:shadow-xl hover:-translate-y-1',
  
  // フェードイン
  fadeIn: 'animate-fade-in',
  
  // スライドイン
  slideIn: 'animate-slide-in-up',
  
  // バウンス効果
  bounce: 'animate-bounce-gentle'
})

/**
 * アクセシビリティを考慮したフォーカススタイル
 */
export const getFocusStyles = (variant: 'default' | 'child-friendly' = 'default') => {
  const base = 'focus:outline-none focus:ring-4 focus:ring-opacity-50'
  
  if (variant === 'child-friendly') {
    return `${base} focus:ring-blue-300 focus:ring-offset-2`
  }
  
  return `${base} focus:ring-primary-300`
}