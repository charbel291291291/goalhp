import { cn } from '../../lib/utils';
import type { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  glow?: 'blue' | 'green' | 'gold' | 'none';
}

export function Card({ children, className, onClick, glow = 'none' }: CardProps) {
  const glowClasses = {
    blue: 'glow',
    green: 'glow-neon',
    gold: 'glow-gold',
    none: '',
  };

  return (
    <div
      onClick={onClick}
      className={cn(
        'card-premium',
        glow !== 'none' && glowClasses[glow],
        onClick && 'cursor-pointer',
        className
      )}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('mb-3', className)}>{children}</div>;
}

export function CardTitle({ children, className }: { children: ReactNode; className?: string }) {
  return <h3 className={cn('text-lg font-bold text-white', className)}>{children}</h3>;
}

export function CardContent({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('text-white/80 text-sm', className)}>{children}</div>;
}
