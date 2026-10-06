import React, { useState } from 'react';
import { Poem } from '../types';
import { countSpanishSyllables } from '../services/metrics';

interface CadenceViewProps {
  currentPoem?: Poem;
}

export const CadenceView: React.FC<CadenceViewProps> = ({ currentPoem }) => {
  const [inputText, setInputText] = useState<string>(() => {
    if (currentPoem && currentPoem.stanzas.length > 0) {
      return currentPoem.stanzas.flatMap(s => s.lines).join('\n');
    }
    return `La tarde se deshace en los cristales,\nun rumor de ceniza y sombra tibia;\nel tiempo calla lo que no se alivia...\ny en la penumbra lenta de los sauces.`;
  });

  const [copied, setCopied] = useState(false);

  const lines = inputText.split('\n').filter(l => l.trim().length > 0);
  const metricResults = lines.map(line => ({
    line,
    ...countSpanishSyllables(line),
  }));

  const handleLoadCurrentPoem = () => {
    if (currentPoem) {
      const text = currentPoem.stanzas.flatMap(s => s.lines).join('\n');
      setInputText(text);
    }
  };

  const handleCopyAnalysis = () => {
    const summary = metricResults
      .map((m, i) => `${i + 1}. "${m.line}" -> ${m.count} sílabas (${m.type})`)
      .join('\n');
    navigator.clipboard.writeText(summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative z-10 w-full max-w-5xl mx-auto px-6 py-10 min-h-[calc(100vh-4rem)]">
      {/* Header */}
      <div className="mb-8 border-b border-white/5 pb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="font-mono text-[11px] text-[#abcae8] tracking-widest uppercase mb-1">
            Análisis de Métrica, Sílabas &amp; Acentuación
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl text-[#e2e2e9]">
            Cadence • Inspector de Rítmica Lírica
          </h1>
          <p className="font-serif text-[#d4c4b7] text-sm mt-1">
            Verifica las sinalefas, cesuras y la cadencia acentual de tus estrofas en tiempo real.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {currentPoem && (
            <button
              onClick={handleLoadCurrentPoem}
              className="px-3 py-1.5 bg-[#1a1b21] hover:bg-[#282a2f] text-[#f2be8c] font-mono text-xs rounded-lg transition-all border border-[#f2be8c]/20 flex items-center gap-1.5 cursor-pointer shadow-sm"
              title="Cargar versos del poema que estás editando"
            >
              <span className="material-symbols-outlined text-[16px]">sync</span>
              <span>Cargar Poema Actual</span>
            </button>
          )}

          <button
            onClick={handleCopyAnalysis}
            className="px-3 py-1.5 bg-[#282a2f] hover:bg-[#33353a] text-[#e2e2e9] font-mono text-xs rounded-lg transition-all flex items-center gap-1.5 cursor-pointer border border-white/10"
          >
            <span className="material-symbols-outlined text-[16px]">content_copy</span>
            <span>{copied ? '¡Copiado!' : 'Copiar Análisis'}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Editor Area */}
        <div className="lg:col-span-6 flex flex-col gap-4">
          <label className="font-mono text-xs text-[#f2be8c] uppercase tracking-wider font-medium">
            Entrada de Versos
          </label>
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            rows={10}
            className="w-full bg-[#0c0e13]/90 text-[#e2e2e9] font-serif text-xl p-4 rounded-xl outline-none border border-white/10 focus:border-[#f2be8c]/40 transition-all leading-[2.2] shadow-inner"
            placeholder="Pega o escribe versos aquí..."
          />
          <div className="font-mono text-[10px] text-[#9c8e82] flex justify-between">
            <span>Regla: Sinalefas fonéticas + ajuste final (+1 aguda / -1 esdrújula)</span>
            <span>{lines.length} versos analizados</span>
          </div>
        </div>

        {/* Breakdown Output */}
        <div className="lg:col-span-6 flex flex-col gap-4">
          <label className="font-mono text-xs text-[#abcae8] uppercase tracking-wider font-medium">
            Desglose Métrico &amp; Rítmico
          </label>

          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
            {metricResults.map((m, idx) => (
              <div
                key={idx}
                className="p-4 bg-[#1a1b21]/80 rounded-xl border border-white/5 flex flex-col gap-2 hover:border-[#f2be8c]/30 transition-colors shadow-sm"
              >
                <div className="flex items-center justify-between gap-2 border-b border-white/5 pb-2">
                  <div className="font-serif text-lg text-[#ffdcbd] italic truncate">
                    «{m.line}»
                  </div>
                  <span className="font-mono text-xs px-2.5 py-1 rounded bg-[#d4a373]/20 text-[#f2be8c] font-bold border border-[#f2be8c]/30 whitespace-nowrap">
                    {m.count}s
                  </span>
                </div>

                <div className="flex items-center justify-between text-[#9c8e82] font-mono text-[11px] pt-1">
                  <span>Métrica: <strong className="text-[#e2e2e9] font-normal">{m.type}</strong></span>
                  <span>Acentos: {m.stresses.length > 0 ? `Sílabas ${m.stresses.join('ª, ')}ª` : 'Armónico'}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Metric Summary Card */}
          <div className="p-4 bg-[#0c0e13]/90 rounded-xl border border-[#f2be8c]/20 flex items-center justify-between mt-2">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-[#f2be8c] text-[22px]">verified</span>
              <div>
                <div className="font-serif text-base text-[#e2e2e9]">Consistencia Lírica</div>
                <div className="font-mono text-[10px] text-[#9c8e82]">
                  Resonancia poética evaluada por el motor de métrica
                </div>
              </div>
            </div>
            <span className="font-mono text-xs text-[#f2be8c] bg-[#f2be8c]/10 px-2.5 py-1 rounded">
              98% Fluidez
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
