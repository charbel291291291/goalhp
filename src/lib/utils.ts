import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPoints(points: number): string {
  if (points >= 1000) {
    return (points / 1000).toFixed(1) + 'k';
  }
  return points.toLocaleString();
}

export function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function generateCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export function getShareText(teamName: string, link: string, lang: string): string {
  if (lang === 'ar') {
    return `أنا عم بلعب QuizGoal 2026 وعم مثّل ${teamName}. تحدّاني من هون: ${link}`;
  }
  return `I'm playing QuizGoal 2026 and representing ${teamName}. Challenge me here: ${link}`;
}

export function getTeamPointsChange(current: number, target: number): number {
  return Math.max(0, target - current);
}

export function getLevelFromXP(xp: number): number {
  return Math.floor(Math.sqrt(xp / 100)) + 1;
}

export function getXPForLevel(level: number): number {
  return (level - 1) * (level - 1) * 100;
}
