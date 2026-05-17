import { cn } from '../../lib/utils';
import type { ReactNode, ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'neon' | 'gold' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  children: ReactNode;
}

export function Button({ variant = 'primary', size = 'md', children, className, ...props }: ButtonProps) {
  const variants = {
    primary: 'btn-primary',
    neon: 'btn-neon',
    gold: 'btn-gold',
    ghost: 'btn-ghost',
    danger: 'bg-red-500 hover:bg-red-600 text-white font-semibold rounded-xl transition-all duration-300 active:scale-95',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-5 py-2.5 text-sm',
    lg: 'px-6 py-3 text-base',
  };

  return (
    <button
      className={cn(variants[variant], sizes[size], 'inline-flex items-center justify-center gap-2 font-semibold', className)}
      {...props}
    >
      {children}
    </button>
  );
}
