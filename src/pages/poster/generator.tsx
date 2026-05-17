import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '../../components/common/Button';
import { allTeams, posterStyles } from '../../lib/teams';
import { downloadCanvas, shareOnWhatsApp, getPosterShareText } from '../../lib/shareUtils';

function navigate(path: string) {
  window.history.pushState({}, '', path);
  window.dispatchEvent(new PopStateEvent('popstate'));
}

export default function PosterGenerator() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language as 'en' | 'ar';
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [step, setStep] = useState(1);
  const [selectedTeam, setSelectedTeam] = useState<any>(null);
  const setSelectedStyle = useState<any>(null)[1];
  const [slogan, setSlogan] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [format, setFormat] = useState('1:1');

  const formats: Record<string, { w: number; h: number }> = { '1:1': { w: 500, h: 500 }, '9:16': { w: 360, h: 640 }, '4:5': { w: 400, h: 500 } };

  const renderCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas || !selectedTeam) return;
    const { w, h } = formats[format];
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Background gradient
    const grad = ctx.createLinearGradient(0, 0, w, h);
    grad.addColorStop(0, selectedTeam.primary_color);
    grad.addColorStop(1, selectedTeam.secondary_color);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Background image overlay
    if (image) {
      const img = new Image();
      img.onload = () => {
        ctx.globalAlpha = 0.3;
        ctx.drawImage(img, 0, 0, w, h);
        ctx.globalAlpha = 1;
        drawContent(ctx, w, h);
      };
      img.src = image;
    } else {
      drawContent(ctx, w, h);
    }
  };

  const drawContent = (ctx: CanvasRenderingContext2D, w: number, h: number) => {
    // Overlay gradient
    const overlay = ctx.createLinearGradient(0, 0, 0, h);
    overlay.addColorStop(0, 'rgba(0,0,0,0.1)');
    overlay.addColorStop(0.6, 'rgba(0,0,0,0.4)');
    ctx.fillStyle = overlay;
    ctx.fillRect(0, 0, w, h);

    // Flag emoji
    ctx.font = `${Math.floor(w * 0.3)}px Arial`;
    ctx.textAlign = 'center';
    ctx.fillText(selectedTeam.flag_emoji, w / 2, h * 0.35);

    // Team name
    ctx.font = `bold ${Math.floor(w * 0.08)}px Arial`;
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.fillText(lang === 'ar' ? selectedTeam.name_ar : selectedTeam.name_en, w / 2, h * 0.55);

    // Slogan
    if (slogan) {
      ctx.font = `${Math.floor(w * 0.045)}px Arial`;
      ctx.fillStyle = 'rgba(255,255,255,0.9)';
      ctx.textAlign = 'center';
      const lines = wrapText(ctx, slogan, w * 0.85);
      lines.forEach((line, i) => {
        ctx.fillText(line, w / 2, h * 0.68 + i * (w * 0.055));
      });
    }

    // Watermark
    ctx.font = `${Math.floor(w * 0.025)}px Arial`;
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.textAlign = 'center';
    ctx.fillText('QuizGoal 2026 by eyedeaz', w / 2, h - 15);
  };

  function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
    const lines: string[] = [];
    let line = '';
    for (const word of text.split(' ')) {
      const test = line ? `${line} ${word}` : word;
      if (ctx.measureText(test).width > maxWidth && line) {
        lines.push(line);
        line = word;
      } else {
        line = test;
      }
    }
    if (line) lines.push(line);
    return lines.length ? lines : [text];
  }

  useEffect(() => { if (selectedTeam && step === 4) renderCanvas(); }, [selectedTeam, slogan, format, image, step]);

  const handleDownload = () => {
    if (canvasRef.current) downloadCanvas(canvasRef.current, `${selectedTeam?.fifa_code || 'poster'}-quizgoal.png`);
  };

  const handleShare = () => {
    const text = getPosterShareText(selectedTeam?.name_en || '', lang);
    shareOnWhatsApp(text, window.location.href);
  };

  if (step === 1) {
    return (
      <div className="space-y-4">
        <button onClick={() => navigate('/poster')} className="btn-ghost text-sm">← {t('common.back')}</button>
        <h2 className="text-xl font-bold">{t('poster.selectTeam')}</h2>
        <div className="grid grid-cols-4 gap-2 max-h-96 overflow-y-auto">
          {allTeams.map((team) => (
            <button key={team.fifa_code} onClick={() => { setSelectedTeam(team); setStep(2); }}
              className="p-2 rounded-xl text-center bg-white/5 hover:bg-white/10 transition-all">
              <div className="text-2xl mb-1">{team.flag_emoji}</div>
              <div className="text-[10px] leading-tight">{lang === 'ar' ? team.name_ar : team.name_en}</div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (step === 2) {
    return (
      <div className="space-y-4">
        <button onClick={() => setStep(1)} className="btn-ghost text-sm">← {t('common.back')}</button>
        <h2 className="text-xl font-bold">{t('poster.selectStyle')}</h2>
        <div className="grid grid-cols-2 gap-3">
          {posterStyles.map((style) => (
            <button key={style.id} onClick={() => { setSelectedStyle(style); setStep(3); }}
              className="p-4 rounded-xl bg-gradient-to-br from-electric/10 to-neon/10 border border-white/10 text-center hover:scale-[1.02] transition-all">
              <div className="text-sm font-medium">{lang === 'ar' ? style.name_ar : style.name_en}</div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (step === 3) {
    return (
      <div className="space-y-4">
        <button onClick={() => setStep(2)} className="btn-ghost text-sm">← {t('common.back')}</button>
        <h2 className="text-xl font-bold">{t('poster.slogan')}</h2>
        <input type="text" value={slogan} onChange={(e) => setSlogan(e.target.value)}
          placeholder={lang === 'ar' ? 'اكتب شعارك التشجيعي' : 'Write your fan slogan'}
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-electric" />
        <div>
          <label className="text-sm text-white/50 mb-2 block">{t('poster.upload')}</label>
          <input type="file" accept="image/*" onChange={(e) => {
            const f = e.target.files?.[0]; if (f) { const r = new FileReader(); r.onload = () => setImage(r.result as string); r.readAsDataURL(f); }
          }} className="w-full text-sm text-white/50 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:bg-electric file:text-white" />
        </div>
        <div>
          <label className="text-sm text-white/50 mb-2 block">{lang === 'ar' ? 'الصيغة' : 'Format'}</label>
          <div className="flex gap-2">
            {[{ id: '1:1', en: 'Square', ar: 'مربع' }, { id: '9:16', en: 'Story', ar: 'ستوري' }, { id: '4:5', en: 'Post', ar: 'منشور' }].map(f => (
              <button key={f.id} onClick={() => setFormat(f.id)}
                className={`px-4 py-2 rounded-xl text-sm transition-all ${format === f.id ? 'bg-electric text-white' : 'bg-white/5 text-white/60'}`}>
                {lang === 'ar' ? f.ar : f.en}
              </button>
            ))}
          </div>
        </div>
        <Button variant="neon" className="w-full" onClick={() => setStep(4)}>
          {t('poster.generate')} 🎨
        </Button>
      </div>
    );
  }

  const { w, h } = formats[format];
  const aspectRatio = `${w}/${h}`;

  return (
    <div className="space-y-4">
      <button onClick={() => setStep(3)} className="btn-ghost text-sm">← {t('common.back')}</button>
      <h2 className="text-xl font-bold">{lang === 'ar' ? 'البوستر النهائي' : 'Final Poster'}</h2>

      <div className="flex justify-center">
        <div className="rounded-xl overflow-hidden border border-white/10 shadow-2xl" style={{ aspectRatio, maxWidth: '300px', width: '100%' }}>
          <canvas ref={canvasRef} className="w-full h-full" />
        </div>
      </div>

      <div className="flex gap-3">
        <Button variant="neon" className="flex-1" onClick={handleShare}>
          📤 {t('poster.share')}
        </Button>
        <Button variant="primary" className="flex-1" onClick={handleDownload}>
          ⬇️ {t('poster.download')}
        </Button>
      </div>

      <Button variant="ghost" className="w-full" onClick={() => { setStep(1); }}>
        {lang === 'ar' ? 'إنشاء بوستر جديد' : 'Create New Poster'}
      </Button>
    </div>
  );
}
