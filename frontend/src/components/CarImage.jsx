import React, { useState } from 'react'

// 生成SVG占位图（不需要网络请求）
const generatePlaceholderSVG = (brand, model, width = 400, height = 300) => {
  const text = `${brand || '车辆'} ${model || ''}`.trim()
  // 使用encodeURIComponent来正确处理中文字符
  const svgContent = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />
        <stop offset="100%" style="stop-color:#764ba2;stop-opacity:1" />
      </linearGradient>
    </defs>
    <rect width="100%" height="100%" fill="url(#grad)"/>
    <g>
      <path d="M80 120 L320 120 L300 200 L100 200 Z" fill="rgba(255,255,255,0.2)" stroke="rgba(255,255,255,0.3)" stroke-width="2"/>
      <circle cx="120" cy="200" r="25" fill="rgba(255,255,255,0.2)" stroke="rgba(255,255,255,0.3)" stroke-width="2"/>
      <circle cx="280" cy="200" r="25" fill="rgba(255,255,255,0.2)" stroke="rgba(255,255,255,0.3)" stroke-width="2"/>
      <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="24" font-weight="bold" fill="white" text-anchor="middle" dominant-baseline="middle">${text}</text>
    </g>
  </svg>`
  // 使用encodeURIComponent而不是base64，这样更可靠
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgContent)}`
}

function CarImage({ 
  src, 
  alt, 
  brand, 
  model, 
  width = '100%', 
  height = '100%',
  style = {},
  className = ''
}) {
  const [imageSrc, setImageSrc] = useState(src)
  const [hasError, setHasError] = useState(false)
  
  // 如果没有提供src或者已经出错，使用SVG占位图
  const placeholder = generatePlaceholderSVG(brand || '车辆', model || '', 800, 600)
  const displaySrc = hasError || !imageSrc ? placeholder : imageSrc

  const handleError = () => {
    if (!hasError) {
      setHasError(true)
      setImageSrc(placeholder)
    }
  }

  const handleLoad = () => {
    // 图片加载成功，重置错误状态
    if (hasError) {
      setHasError(false)
    }
  }

  return (
    <img
      src={displaySrc}
      alt={alt || `${brand} ${model}`}
      onError={handleError}
      onLoad={handleLoad}
      style={{
        width,
        height,
        objectFit: 'cover',
        backgroundColor: '#e9ecef',
        ...style
      }}
      className={className}
    />
  )
}

export default CarImage

