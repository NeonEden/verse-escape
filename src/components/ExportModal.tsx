import React, { useRef, useState } from 'react';
import { Poem, MoodAtmosphere } from '../types';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  poem: Poem;
}

export const ExportModal: React.FC<ExportModalProps> = ({ isOpen, onClose, poem }) => {
  const [cardMood, setCardMood] = useState<MoodAtmosphere>(poem.mood || 'Atardecer Ámbar');
  const [copied, setCopied] = useState(false);
  const cardRef = useRef<HTMLDivElement | null>(null);

  if (!isOpen) return null;

  const fullText = `${poem.title}\n${poem.subtitle}\n\n${poem.stanzas.flatMap(s => s.lines).join('\n')}\n\n— VerseScape Studio`;

  const handleCopyText = () => {
    navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadImage = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 1200;
    canvas.height = 1400;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Background Gradient based on card mood
    let bgGradient = ctx.createLinearGradient(0, 0, 0, 1400);
    if (cardMood === 'Noche Índigo') {
      bgGradient.addColorStop(0, '#0c1424');
      bgGradient.addColorStop(1, '#060a12');
    } else if (cardMood === 'Niebla Sepia') {
      bgGradient.addColorStop(0, '#1c1612');
      bgGradient.addColorStop(1, '#0f0c0a');
    } else if (cardMood === 'Alba Pálida') {
      bgGradient.addColorStop(0, '#241a18');
      bgGradient.addColorStop(1, '#120d0c');
    } else {
      bgGradient.addColorStop(0, '#1c130c');
      bgGradient.addColorStop(1, '#0e0906');
    }

    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, 1200, 1400);

    // Border line
    ctx.strokeStyle = 'rgba(242, 190, 140, 0.2)';
    ctx.lineWidth = 2;
    ctx.strokeRect(60, 60, 1080, 1280);

    // Header
    ctx.fillStyle = '#f2be8c';
    ctx.font = '32px "JetBrains Mono", monospace';
    ctx.fillText('VERSESCAPE • SANCTUARIUM', 100, 140);

    // Title
    ctx.fillStyle = '#ffdcbd';
    ctx.font = '54px "EB Garamond", serif';
    ctx.fillText(poem.title, 100, 240);

    // Subtitle
    ctx.fillStyle = '#9c8e82';
    ctx.font = '24px "JetBrains Mono", monospace';
    ctx.fillText(poem.subtitle.toUpperCase(), 100, 290);

    // Divider
    ctx.strokeStyle = 'rgba(242, 190, 140, 0.3)';
    ctx.beginPath();
    ctx.moveTo(100, 330);
    ctx.lineTo(300, 330);
    ctx.stroke();

    // Stanzas
    ctx.fillStyle = '#e2e2e9';
    ctx.font = '34px "EB Garamond", serif';
    let yPos = 420;

    poem.stanzas.forEach((s) => {
      s.lines.forEach((l) => {
        ctx.fillText(l, 100, yPos);
        yPos += 60;
      });
      yPos += 40;
    });

    // Footer
    ctx.fillStyle = '#9c8e82';
    ctx.font = '22px "JetBrains Mono", monospace';
    ctx.fillText(`WORDS: ${poem.wordsCount}  |  SYLLABLES: ${poem.syllablesCount}  |  MOOD: ${cardMood.toUpperCase()}`, 100, 1280);
    ctx.fillText('© 2025 VerseScape Studio. Bound to silence and rhythm.', 100, 1320);

    // Trigger download
    const link = document.createElement('a');
    link.download = `${poem.title.replace(/\s+/g, '_')}_VerseScape.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#111318] border border-white/10 rounded-2xl max-w-2xl w-full p-6 shadow-2xl relative flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/5">
          <div>
            <h2 className="font-serif text-2xl text-[#e2e2e9]">Exportar Tarjeta de Arte</h2>
            <p className="font-mono text-xs text-[#9c8e82]">Formato tipográfico para impresión o publicación</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-[#d4c4b7] hover:bg-[#282a2f] cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* Card Style Toggles */}
        <div className="flex items-center gap-2 my-4">
          <span className="font-mono text-xs text-[#d4c4b7]">Atmósfera:</span>
          {(['Atardecer Ámbar', 'Noche Índigo', 'Niebla Sepia', 'Alba Pálida'] as MoodAtmosphere[]).map((m) => (
            <button
              key={m}
              onClick={() => setCardMood(m)}
              className={`font-mono text-xs px-2.5 py-1 rounded transition-all cursor-pointer ${
                cardMood === m
                  ? 'bg-[#f2be8c]/20 text-[#f2be8c] font-medium border border-[#f2be8c]/40'
                  : 'text-[#9c8e82] hover:bg-white/5'
              }`}
            >
              {m}
            </button>
          ))}
        </div>

        {/* Card Preview Container */}
        <div className="flex-1 overflow-y-auto my-2 p-2">
          <div
            ref={cardRef}
            className={`p-8 rounded-2xl border border-white/10 shadow-2xl space-y-6 font-serif relative overflow-hidden transition-all duration-500 ${
              cardMood === 'Noche Índigo'
                ? 'bg-gradient-to-b from-[#0c1424] to-[#060a12] text-[#e2e2e9]'
                : cardMood === 'Niebla Sepia'
                ? 'bg-gradient-to-b from-[#1c1612] to-[#0f0c0a] text-[#e2e2e9]'
                : cardMood === 'Alba Pálida'
                ? 'bg-gradient-to-b from-[#241a18] to-[#120d0c] text-[#e2e2e9]'
                : 'bg-gradient-to-b from-[#1c130c] to-[#0e0906] text-[#e2e2e9]'
            }`}
          >
            <div className="flex items-center justify-between font-mono text-[10px] text-[#f2be8c] uppercase tracking-widest border-b border-white/10 pb-3">
              <span>VerseScape Studio</span>
              <span>{poem.notebook}</span>
            </div>

            <div>
              <h3 className="font-serif text-3xl text-[#ffdcbd] mb-1">{poem.title}</h3>
              <p className="font-mono text-xs text-[#9c8e82]">{poem.subtitle}</p>
            </div>

            <div className="text-xl leading-[2.2] space-y-6 text-[#e2e2e9]">
              {poem.stanzas.map((stanza) => (
                <div key={stanza.id}>
                  {stanza.lines.map((line, lIdx) => (
                    <p key={lIdx}>«{line}»</p>
                  ))}
                </div>
              ))}
            </div>

            <div className="pt-6 border-t border-white/10 flex items-center justify-between font-mono text-[10px] text-[#9c8e82]">
              <span>WORDS: {poem.wordsCount} | SYLLABLES: {poem.syllablesCount}</span>
              <span>© 2025 VerseScape</span>
            </div>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-white/5 mt-2">
          <button
            onClick={handleCopyText}
            className="px-4 py-2 bg-[#1e2025] hover:bg-[#282a2f] text-[#d4c4b7] font-mono text-xs rounded-xl transition-all border border-white/10 flex items-center gap-2 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">content_copy</span>
            <span>{copied ? '¡Copiado!' : 'Copiar Texto'}</span>
          </button>

          <button
            onClick={handleDownloadImage}
            className="px-5 py-2 bg-[#f2be8c] hover:bg-[#ffdcbd] text-[#482904] font-mono text-xs rounded-xl transition-all shadow-lg flex items-center gap-2 font-medium cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">download</span>
            <span>Descargar Imagen (PNG)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
