import { APP_CONFIG } from '@/constants'

export const AppLogo = ({ className }: { className?: string }) => {
  return (
    <img
      src={APP_CONFIG.LOGO.PATH}
      alt={APP_CONFIG.LOGO.ALT}
      className={`size-6 object-contain ${className}`}
    />
  )
}
