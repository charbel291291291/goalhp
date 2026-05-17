import toast from 'react-hot-toast';

export function shareOnWhatsApp(text: string, url?: string) {
  const fullText = url ? `${text}\n${url}` : text;
  const encoded = encodeURIComponent(fullText);
  window.open(`https://wa.me/?text=${encoded}`, '_blank');
}

export function shareOnFacebook(url: string) {
  window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank');
}

export async function shareNative(text: string, url?: string) {
  const shareData: ShareData = { title: 'QuizGoal 2026', text };
  if (url) shareData.url = url;
  if (navigator.share) {
    try { await navigator.share(shareData); } catch { /* user cancelled */ }
  } else {
    const toCopy = url || text;
    await navigator.clipboard.writeText(toCopy);
    toast.success('Link copied!');
  }
}

export function downloadCanvas(canvas: HTMLCanvasElement, filename = 'quizgoal-poster.png') {
  const link = document.createElement('a');
  link.download = filename;
  link.href = canvas.toDataURL('image/png');
  link.click();
}

export function getPosterShareText(teamName: string, lang: string): string {
  return lang === 'ar'
    ? `أنا مشجع ${teamName} في كأس العالم 2026! 🏆 العب معي على QuizGoal 2026`
    : `I'm a ${teamName} fan in the 2026 World Cup! 🏆 Play with me on QuizGoal 2026`;
}

export function getBattleShareText(score: number, lang: string): string {
  return lang === 'ar'
    ? `حصلت على ${score} نقطة في QuizGoal 2026! 🏆 تحدّاني إذا تقدر`
    : `I scored ${score} points on QuizGoal 2026! 🏆 Can you beat me?`;
}
