import type { ButtonHTMLAttributes } from 'react'
import { Icon, type IconName } from './Icon'

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'outline' | 'soft'
  icon?: IconName
}

export function Button({ variant = 'primary', icon, children, className = '', ...rest }: Props) {
  return (
    <button type="button" className={`btn btn--${variant} ${className}`} {...rest}>
      {icon && <Icon name={icon} />}
      {children}
    </button>
  )
}
