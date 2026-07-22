import React from 'react'

type BrandLogoProps = {
  className?: string
  priority?: boolean
}

const BrandLogo: React.FC<BrandLogoProps> = ({ className = 'h-14 w-14', priority = false }) => (
  <img
    src="/brand/madnir-logo.png"
    alt="Madnir — Speak, Support, Succeed"
    className={`object-contain ${className}`}
    loading={priority ? 'eager' : 'lazy'}
    decoding="async"
  />
)

export default BrandLogo
