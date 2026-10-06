import React, { useState } from 'react';
import { CoPilotMessage, Poem } from '../types';

interface CoPilotDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  messages: CoPilotMessage[];
  onSendMessage: (text: string) => void;
  onInsertVerses: (verses: string[]) => void;
  poemContext: Poem;
}

export const CoPilotDrawer: React.FC<CoPilotDrawerProps> = ({
  isOpen,
  onClose,
  messages,
  onSendMessage,
  onInsertVerses,
  poemContext,
}) => {
  const [inputText, setInputText] = useState('');
  const [selectedTone, setSelectedTone] = useState<string>('Melancólico');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    const msg = inputText.trim();
    setInputText('');
    setIsSubmitting(true);
    await onSendMessage(msg);
    setIsSubmitting(false);
  };

  const handleToneClick = (tone: string) => {
    setSelectedTone(tone);
    onSendMessage(`Ajusta el tono de la respuesta a un estilo ${tone.toLowerCase()}.`);
  };

  return (
    <aside
      className={`fixed top-16 right-0 h-[calc(100vh-4rem)] w-full sm:w-[420px] bg-[#0c0e13]/95 backdrop-blur-2xl z-50 shadow-2xl flex flex-col transition-transform duration-500 ease-out border-l border-white/10 ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      }`}
      id="copilot-drawer"
    >
      {/* Header of Drawer */}
      <div className="p-4 bg-[#1a1b21]/80 flex items-center justify-between border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#d4a373]/20 flex items-center justify-center text-[#f2be8c] shadow-sm border border-[#f2be8c]/20">
            <span className="material-symbols-outlined text-[18px]">auto_awesome</span>
          </div>
          <div>
            <div className="font-serif text-lg font-medium text-[#e2e2e9] leading-tight">
              Co-Piloto Poético
            </div>
            <div className="font-mono text-[10px] text-[#9c8e82] tracking-wider uppercase">
              Gemini 3.8 Flash • Modo Lírico
            </div>
          </div>
        </div>
        <button
          onClick={onClose}
          type="button"
          className="w-8 h-8 rounded-lg flex items-center justify-center text-[#d4c4b7] hover:text-[#e2e2e9] hover:bg-[#282a2f] transition-colors cursor-pointer"
        >
          <span className="material-symbols-outlined text-[18px]">close</span>
        </button>
      </div>

      {/* Tone Preset Selectors */}
      <div className="px-4 py-2 bg-[#111318] border-b border-white/5 flex items-center gap-2 overflow-x-auto">
        <span className="font-mono text-[10px] text-[#9c8e82] whitespace-nowrap">Tono:</span>
        {['Melancólico', 'Místico', 'Épico', 'Minimalista', 'Romántico'].map((t) => (
          <button
            key={t}
            onClick={() => handleToneClick(t)}
            className={`font-mono text-[10px] px-2.5 py-0.5 rounded transition-all cursor-pointer whitespace-nowrap ${
              selectedTone === t
                ? 'bg-[#f2be8c]/20 text-[#f2be8c] border border-[#f2be8c]/30 font-medium'
                : 'text-[#9c8e82] hover:bg-white/5'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Conversation Dialogue Feed */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 font-serif text-sm">
        {/* Timestamp divider */}
        <div className="text-center my-2">
          <span className="font-mono text-[10px] text-[#50453b] uppercase tracking-widest bg-[#282a2f] px-2.5 py-0.5 rounded border border-white/5">
            Hoy • 21:42 Nocturno
          </span>
        </div>

        {messages.map((msg) => (
          <div key={msg.id}>
            {msg.sender === 'user' ? (
              /* User Query Bubble */
              <div className="flex flex-col items-end mb-3">
                <div className="max-w-[85%] bg-[#282a2f] text-[#e2e2e9] rounded-xl rounded-tr-none px-4 py-2.5 shadow-sm font-serif text-sm leading-relaxed border border-white/5">
                  {msg.content}
                </div>
                <span className="font-mono text-[9px] text-[#50453b] mt-1 mr-1">
                  Tú • Selección activa
                </span>
              </div>
            ) : (
              /* AI Response Card */
              <div className="flex flex-col items-start mb-3 w-full">
                <div className="w-full bg-[#1a1b21]/90 rounded-xl rounded-tl-none p-4 shadow-lg space-y-3 border border-[#f2be8c]/15">
                  <div className="flex items-center gap-1.5 text-[#f2be8c]">
                    <span className="material-symbols-outlined text-[16px]">psychology</span>
                    <span className="font-mono text-[11px] font-medium tracking-wide">
                      Cadencia &amp; Vacío Lírico
                    </span>
                  </div>

                  <p className="text-[#d4c4b7] font-serif leading-relaxed">
                    {msg.content}
                  </p>

                  {/* Stanza Block Proposal */}
                  {msg.suggestedVerses && msg.suggestedVerses.length > 0 && (
                    <div className="p-3 bg-[#0c0e13]/80 rounded-lg shadow-inner border-l-2 border-[#f2be8c] font-serif text-base text-[#ffdcbd] italic space-y-1 my-2">
                      {msg.suggestedVerses.map((verse, idx) => (
                        <p key={idx}>«{verse}»</p>
                      ))}
                    </div>
                  )}

                  <p className="text-[#d4c4b7] text-xs pt-0.5">
                    ¿Deseas insertar esta estrofa o modular su resonancia fonética?
                  </p>

                  {/* Action Buttons Deck */}
                  {msg.suggestedVerses && msg.suggestedVerses.length > 0 && (
                    <div className="pt-1 flex flex-wrap items-center gap-2">
                      <button
                        onClick={() => onInsertVerses(msg.suggestedVerses!)}
                        type="button"
                        className="px-3 py-1.5 bg-[#f2be8c] text-[#482904] font-mono text-[11px] rounded-lg hover:bg-[#ffdcbd] transition-all flex items-center gap-1 shadow-sm font-medium cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[14px]">add_circle</span>
                        <span>Insertar al lienzo</span>
                      </button>

                      <button
                        onClick={() => onSendMessage('Regenera la sugerencia con una rima asonante más tenue.')}
                        type="button"
                        className="px-3 py-1.5 bg-[#1e2025] hover:bg-[#282a2f] text-[#d4c4b7] hover:text-[#e2e2e9] font-mono text-[11px] rounded-lg transition-all flex items-center gap-1 border border-white/5 cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[14px]">autorenew</span>
                        <span>Regenerar</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => alert(`Métrica: ${msg.metricInfo || 'Endecasílabo armónico en 2ª, 6ª y 10ª sílaba'}`)}
                        className="px-2.5 py-1.5 bg-[#1e2025] hover:bg-[#282a2f] text-[#9c8e82] hover:text-[#abcae8] font-mono text-[11px] rounded-lg transition-all border border-white/5 cursor-pointer"
                        title="Ver análisis silábico"
                      >
                        <span>Métrica</span>
                      </button>
                    </div>
                  )}
                </div>

                <span className="font-mono text-[9px] text-[#50453b] mt-1 ml-1">
                  Gemini 3.8 Flash • 142ms
                </span>
              </div>
            )}
          </div>
        ))}

        {isSubmitting && (
          <div className="flex items-center gap-2 p-3 bg-[#1a1b21]/70 rounded-xl border border-[#f2be8c]/20 text-[#f2be8c] font-mono text-xs animate-pulse">
            <span className="material-symbols-outlined text-[18px] animate-spin">auto_awesome</span>
            <span>El Co-Piloto Poético está creando resonancias...</span>
          </div>
        )}

        {/* Harmonic Resonance Metric Snapshot */}
        <div className="p-3 bg-[#1e2025]/50 rounded-xl border border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-[#abcae8] text-[18px]">waves</span>
            <div>
              <div className="font-mono text-[11px] text-[#e2e2e9] font-medium">Afinidad Tonal</div>
              <div className="font-mono text-[10px] text-[#9c8e82]">Similitud con Neruda &amp; Cernuda</div>
            </div>
          </div>
          <div className="font-mono text-[12px] text-[#abcae8] font-bold">92.4%</div>
        </div>
      </div>

      {/* Prompt Query Input in Slideout */}
      <form onSubmit={handleSubmit} className="p-4 bg-[#1a1b21]/90 border-t border-white/5">
        <div className="relative flex items-center">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            aria-label="Mensaje para el Co-Piloto"
            placeholder="Pide una metáfora, rima o inflexión..."
            className="w-full bg-[#0c0e13]/90 text-[#e2e2e9] font-serif text-sm px-3.5 py-2.5 rounded-lg outline-none placeholder:text-[#50453b] focus:border-[#f2be8c]/40 transition-all pr-10 border border-white/10 shadow-inner"
          />
          <button
            type="submit"
            disabled={isSubmitting}
            className="absolute right-2 text-[#f2be8c] hover:text-[#ffdcbd] p-1 transition-colors cursor-pointer disabled:opacity-50"
            title="Enviar prompt"
          >
            <span className="material-symbols-outlined text-[18px]">send</span>
          </button>
        </div>
        <div className="flex items-center justify-between mt-2 font-mono text-[10px] text-[#9c8e82]">
          <span>Comando rápido: <kbd className="bg-[#1e2025] px-1 py-0.5 rounded border border-white/10">⌘ + K</kbd></span>
          <span>Tono: {selectedTone}</span>
        </div>
      </form>
    </aside>
  );
};
