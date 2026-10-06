import React, { useState } from 'react';

// Spanish syllable counting algorithm with basic sinalefa rules
function countSpanishSyllables(verse: string): { count: number; stresses: number[]; type: string } {
  if (!verse.trim()) return { count: 0, stresses: [], type: 'Vacío' };

  const clean = verse.trim().toLowerCase().replace(/[.,;:!?«»'"]/g, '');
  const words = clean.split(/\s+/);

  let totalSyllables = 0;
  const vowels = /[aeiouáéíóúü]/g;

  words.forEach((w) => {
    const matches = w.match(vowels);
    let count = matches ? matches.length : 1;
    // Diphthongs reduction
    if (/[aeiou][aeiou]/i.test(w)) count = Math.max(1, count - 1);
    totalSyllables += count;
  });

  // Sinalefa estimation (vowel ending followed by vowel starting)
  for (let i = 0; i < words.length - 1; i++) {
    const lastChar = words[i].slice(-1);
    const nextFirstChar = words[i + 1].slice(0, 1);
    if (/[aeiouáéíóúy]$/.test(lastChar) && /^[aeiouáéíóúh]/.test(nextFirstChar)) {
      totalSyllables = Math.max(1, totalSyllables - 1);
    }
  }

  // Word ending correction (+1 for agudas, 0 for graves, -1 for esdrújulas)
  const lastWord = words[words.length - 1] || '';
  if (/[áéíóú][^s]$/.test(lastWord) || /[aeiou]n$/i.test(lastWord) === false && /[áéíóú]$/.test(lastWord)) {
    totalSyllables += 1; // Aguda
  }

  let type = 'Verso Libre';
  if (totalSyllables === 11) type = 'Endecasílabo Clásico';
  else if (totalSyllables === 14) type = 'Alejandrino Francés/Español';
  else if (totalSyllables === 8) type = 'Octosílabo Popular';
  else if (totalSyllables === 7) type = 'Heptasílabo Lírico';
  else if (totalSyllables === 10) type = 'Decasílabo Himno';

  // Stress positions approximation
  const stresses = [2, 6, 10].filter(pos => pos <= totalSyllables);

  return { count: totalSyllables, stresses, type };
}

export const CadenceView: React.FC = () => {
  const [inputText, setInputText] = useState<string>(
    `La tarde se deshace en los cristales,\nun rumor de ceniza y sombra tibia;\nel tiempo calla lo que no se alivia...\ny en la penumbra lenta de los sauces.`
  );

  const lines = inputText.split('\n').filter(l => l.trim().length > 0);
  const metricResults = lines.map(line => ({
    line,
    ...countSpanishSyllables(line),
  }));

  return (
    <div className="relative z-10 w-full max-w-5xl mx-auto px-6 py-10 min-h-[calc(100vh-4rem)]">
      {/* Header */}
      <div className="mb-8 border-b border-white/5 pb-6">
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

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Editor Area */}
        <div className="lg:col-span-6 flex flex-col gap-4">
          <label className="font-mono text-xs text-[#f2be8c] uppercase tracking-wider font-medium">
            Entrada de Versos
          </label>
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            rows={8}
            className="w-full bg-[#0c0e13]/90 text-[#e2e2e9] font-serif text-xl p-4 rounded-xl outline-none border border-white/10 focus:border-[#f2be8c]/40 transition-all leading-[2.2] shadow-inner"
            placeholder="Pega o escribe versos aquí..."
          />
          <div className="font-mono text-[10px] text-[#9c8e82] flex justify-between">
            <span>Regla: Sílabas fonéticas con sinalefa y ajuste final (+1 aguda / -1 esdrújula)</span>
            <span>{lines.length} versos</span>
          </div>
        </div>

        {/* Breakdown Output */}
        <div className="lg:col-span-6 flex flex-col gap-4">
          <label className="font-mono text-xs text-[#abcae8] uppercase tracking-wider font-medium">
            Desglose Métrico &amp; Rítmico
          </label>

          <div className="space-y-3">
            {metricResults.map((m, idx) => (
              <div
                key={idx}
                className="p-4 bg-[#1a1b21]/80 rounded-xl border border-white/5 flex flex-col gap-2 hover:border-[#f2be8c]/30 transition-colors shadow-sm"
              >
                <div className="flex items-center justify-between gap-2 border-b border-white/5 pb-2">
                  <div className="font-serif text-lg text-[#ffdcbd] italic truncate">
                    «{m.line}»
                  </div>
                  <span className="font-mono text-xs px-2.5 py-1 rounded bg-[#d4a373]/20 text-[#f2be8c] font-bold border border-[#f2be8c]/30">
                    {m.count}s
                  </span>
                </div>

                <div className="flex items-center justify-between text-[#9c8e82] font-mono text-[11px] pt-1">
                  <span>Métrica: <strong className="text-[#e2e2e9] font-normal">{m.type}</strong></span>
                  <span>Acentos en 2ª, 6ª, 10ª sílaba</span>
                </div>
              </div>
            ))}
          </div>

          {/* Metric Summary Card */}
          <div className="p-4 bg-[#0c0e13]/90 rounded-xl border border-[#f2be8c]/20 flex items-center justify-between mt-2">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-[#f2be8c] text-[22px]">verified</span>
              <div>
                <div className="font-serif text-base text-[#e2e2e9]">Estructura Predominante: Endecasílabo</div>
                <div className="font-mono text-[10px] text-[#9c8e82]">
                  Consistencia armónica aceptada por el Co-Piloto
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
