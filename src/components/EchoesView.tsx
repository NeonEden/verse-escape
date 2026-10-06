import React, { useState } from 'react';
import { Poem, SoundState } from '../types';
import { soundSynth } from '../services/audioSynthesizer';

interface EchoesViewProps {
  poem: Poem;
  soundState: SoundState;
  setSoundState: React.Dispatch<React.SetStateAction<SoundState>>;
  onOpenExportModal: () => void;
}

export const EchoesView: React.FC<EchoesViewProps> = ({
  poem,
  soundState,
  setSoundState,
  onOpenExportModal,
}) => {
  const [rainVol, setRainVol] = useState<number>(soundState.rainVolume);
  const [crackleVol, setCrackleVol] = useState<number>(soundState.crackleVolume);

  const handleToggleAudio = () => {
    const isNowPlaying = soundSynth.toggle(rainVol, crackleVol);
    setSoundState(prev => ({ ...prev, isPlaying: isNowPlaying }));
  };

  const handleRainVolChange = (v: number) => {
    setRainVol(v);
    setSoundState(prev => ({ ...prev, rainVolume: v }));
    if (soundState.isPlaying) {
      soundSynth.setVolumes(v, crackleVol);
    }
  };

  const handleCrackleVolChange = (v: number) => {
    setCrackleVol(v);
    setSoundState(prev => ({ ...prev, crackleVolume: v }));
    if (soundState.isPlaying) {
      soundSynth.setVolumes(rainVol, v);
    }
  };

  return (
    <div className="relative z-10 w-full max-w-5xl mx-auto px-6 py-10 min-h-[calc(100vh-4rem)]">
      {/* Header */}
      <div className="mb-8 border-b border-white/5 pb-6">
        <div className="font-mono text-[11px] text-[#f2be8c] tracking-widest uppercase mb-1">
          Resonancias &amp; Paisaje Sonoro
        </div>
        <h1 className="font-serif text-3xl sm:text-4xl text-[#e2e2e9]">
          Echoes • Mezclador de Ambiente &amp; Sentimiento
        </h1>
        <p className="font-serif text-[#d4c4b7] text-sm mt-1">
          Ajusta la atmósfera acusmática de lluvia lofi, chasquido analógico y proyección emocional.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Audio Ambience Mixer */}
        <div className="lg:col-span-6 bg-[#0c0e13]/85 backdrop-blur-xl p-6 rounded-2xl border border-white/10 flex flex-col justify-between space-y-6">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-white/5 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#abcae8]/20 flex items-center justify-center text-[#abcae8]">
                  <span className="material-symbols-outlined text-[20px]">equalizer</span>
                </div>
                <div>
                  <h3 className="font-serif text-lg text-[#e2e2e9] font-medium">
                    Sintetizador Lofi &amp; Lluvia
                  </h3>
                  <p className="font-mono text-[10px] text-[#9c8e82]">Generado vía Web Audio API</p>
                </div>
              </div>

              <button
                onClick={handleToggleAudio}
                className={`px-4 py-2 rounded-xl font-mono text-xs transition-all cursor-pointer flex items-center gap-2 font-medium ${
                  soundState.isPlaying
                    ? 'bg-[#f2be8c] text-[#482904] shadow-[0_0_16px_rgba(242,190,140,0.4)]'
                    : 'bg-[#282a2f] text-[#e2e2e9] hover:bg-[#33353a]'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">
                  {soundState.isPlaying ? 'pause' : 'play_arrow'}
                </span>
                <span>{soundState.isPlaying ? 'Detener Sonido' : 'Iniciar Lofi Rain'}</span>
              </button>
            </div>

            {/* Controls sliders */}
            <div className="space-y-6">
              {/* Rain Slider */}
              <div className="space-y-2">
                <div className="flex justify-between font-mono text-xs text-[#d4c4b7]">
                  <span className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[16px] text-[#abcae8]">water_drop</span>
                    Lluvia Orgánica (Pink Noise)
                  </span>
                  <span className="text-[#abcae8] font-bold">{rainVol}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={rainVol}
                  onChange={(e) => handleRainVolChange(Number(e.target.value))}
                  className="w-full accent-[#abcae8] bg-[#1a1b21] h-1.5 rounded-lg cursor-pointer"
                />
              </div>

              {/* Vinyl Crackle Slider */}
              <div className="space-y-2">
                <div className="flex justify-between font-mono text-xs text-[#d4c4b7]">
                  <span className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[16px] text-[#f2be8c]">graphic_eq</span>
                    Chasquido de Vinilo Analógico
                  </span>
                  <span className="text-[#f2be8c] font-bold">{crackleVol}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={crackleVol}
                  onChange={(e) => handleCrackleVolChange(Number(e.target.value))}
                  className="w-full accent-[#f2be8c] bg-[#1a1b21] h-1.5 rounded-lg cursor-pointer"
                />
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-white/5 flex items-center justify-between font-mono text-[11px] text-[#9c8e82]">
            <span>Estado: {soundState.isPlaying ? 'Sintetizando en tiempo real' : 'En reposo'}</span>
            <span className="text-[#f2be8c]">Frecuencia: 24kHz / Stereo</span>
          </div>
        </div>

        {/* Sentiment Spectrum Visualizer */}
        <div className="lg:col-span-6 bg-[#0c0e13]/85 backdrop-blur-xl p-6 rounded-2xl border border-white/10 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-white/5 mb-6">
              <h3 className="font-serif text-lg text-[#e2e2e9] font-medium">
                Mapa Emocional del Poema
              </h3>
              <span className="font-mono text-[10px] text-[#f2be8c] bg-[#f2be8c]/10 px-2.5 py-1 rounded">
                Vector Actual: {poem.mood}
              </span>
            </div>

            {/* Sentiment Graph Bars */}
            <div className="space-y-5">
              <div>
                <div className="flex justify-between font-mono text-xs mb-1">
                  <span className="text-[#d4c4b7]">Calidez (Amber Sun)</span>
                  <span className="text-[#f2be8c]">{(poem.sentiment.calidez * 100).toFixed(0)}%</span>
                </div>
                <div className="w-full bg-[#1a1b21] h-2 rounded-full overflow-hidden">
                  <div className="bg-[#f2be8c] h-full transition-all duration-700" style={{ width: `${poem.sentiment.calidez * 100}%` }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between font-mono text-xs mb-1">
                  <span className="text-[#d4c4b7]">Melancolía (Twilight Blue)</span>
                  <span className="text-[#abcae8]">{(poem.sentiment.melancolia * 100).toFixed(0)}%</span>
                </div>
                <div className="w-full bg-[#1a1b21] h-2 rounded-full overflow-hidden">
                  <div className="bg-[#abcae8] h-full transition-all duration-700" style={{ width: `${poem.sentiment.melancolia * 100}%` }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between font-mono text-xs mb-1">
                  <span className="text-[#d4c4b7]">Penumbra (Dusk Lumens)</span>
                  <span className="text-[#e2e2e9]">{(poem.sentiment.penumbra * 100).toFixed(0)}%</span>
                </div>
                <div className="w-full bg-[#1a1b21] h-2 rounded-full overflow-hidden">
                  <div className="bg-[#9c8e82] h-full transition-all duration-700" style={{ width: `${poem.sentiment.penumbra * 100}%` }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between font-mono text-xs mb-1">
                  <span className="text-[#d4c4b7]">Quietud (Zen Calm)</span>
                  <span className="text-[#d4a373]">{(poem.sentiment.quietud * 100).toFixed(0)}%</span>
                </div>
                <div className="w-full bg-[#1a1b21] h-2 rounded-full overflow-hidden">
                  <div className="bg-[#d4a373] h-full transition-all duration-700" style={{ width: `${poem.sentiment.quietud * 100}%` }}></div>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-6">
            <button
              onClick={onOpenExportModal}
              className="w-full py-3 bg-[#1e2025] hover:bg-[#282a2f] text-[#f2be8c] font-mono text-xs rounded-xl transition-all border border-[#f2be8c]/30 flex items-center justify-center gap-2 cursor-pointer font-medium"
            >
              <span className="material-symbols-outlined text-[18px]">photo_camera</span>
              <span>Generar Tarjeta de Arte &amp; Exportar</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
