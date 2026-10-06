import React from 'react';
import { NavigationTab, SoundState } from '../types';

interface HeaderProps {
  activeTab: NavigationTab;
  setActiveTab: (tab: NavigationTab) => void;
  poemTitle: string;
  wordsCount: number;
  syllablesCount: number;
  soundState: SoundState;
  onToggleSound: () => void;
  onToggleCoPilot: () => void;
  onOpenExportModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  poemTitle,
  wordsCount,
  syllablesCount,
  soundState,
  onToggleSound,
  onToggleCoPilot,
  onOpenExportModal,
}) => {
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  return (
    <header className="fixed top-0 w-full z-50 bg-[#0c0e13]/60 backdrop-blur-2xl transition-all duration-500 border-b border-white/5">
      <div className="h-16 w-full px-6 flex items-center justify-between gap-4">
        {/* Brand & Subtitle */}
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setActiveTab('canvas')}
            className="font-serif text-2xl font-normal tracking-tight text-[#f2be8c] hover:text-[#ffdcbd] transition-colors cursor-pointer text-left"
          >
            VerseScape
          </button>
          <div className="hidden md:flex items-center gap-2 pl-2">
            <span className="w-1 h-1 rounded-full bg-[#50453b]"></span>
            <span className="font-serif text-sm italic text-[#d4c4b7] tracking-wide">
              {poemTitle ? poemTitle : 'Sin título — Nocturno I'}
            </span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="hidden lg:flex items-center gap-2">
          <button
            onClick={() => setActiveTab('canvas')}
            className={`font-mono text-xs px-3 py-1.5 transition-all rounded-lg cursor-pointer ${
              activeTab === 'canvas'
                ? 'bg-[#282a2f] text-[#e2e2e9] shadow-sm font-medium'
                : 'text-[#d4c4b7] hover:text-[#e2e2e9] hover:bg-white/5'
            }`}
          >
            Sanctuary
          </button>
          <button
            onClick={() => setActiveTab('folio')}
            className={`font-mono text-xs px-3 py-1.5 transition-all rounded-lg cursor-pointer ${
              activeTab === 'folio'
                ? 'bg-[#282a2f] text-[#e2e2e9] shadow-sm font-medium'
                : 'text-[#d4c4b7] hover:text-[#e2e2e9] hover:bg-white/5'
            }`}
          >
            Archive
          </button>
          <button
            onClick={() => setActiveTab('rhythms')}
            className={`font-mono text-xs px-3 py-1.5 transition-all rounded-lg cursor-pointer ${
              activeTab === 'rhythms'
                ? 'bg-[#282a2f] text-[#e2e2e9] shadow-sm font-medium'
                : 'text-[#d4c4b7] hover:text-[#e2e2e9] hover:bg-white/5'
            }`}
          >
            Cadence
          </button>
          <button
            onClick={() => setActiveTab('resonances')}
            className={`font-mono text-xs px-3 py-1.5 transition-all rounded-lg cursor-pointer ${
              activeTab === 'resonances'
                ? 'bg-[#282a2f] text-[#e2e2e9] shadow-sm font-medium'
                : 'text-[#d4c4b7] hover:text-[#e2e2e9] hover:bg-white/5'
            }`}
          >
            Echoes
          </button>
        </nav>

        {/* HUD & Actions */}
        <div className="flex items-center gap-4">
          {/* Words & Syllables Counters */}
          <div className="hidden xl:flex items-center gap-2 bg-[#1a1b21]/70 px-3 py-1 rounded-lg border border-white/5">
            <span className="font-mono text-[10px] text-[#d4c4b7]">
              WORDS <span className="text-[#f2be8c] font-medium ml-1">{wordsCount}</span>
            </span>
            <span className="w-0.5 h-3 bg-[#50453b]/40"></span>
            <span className="font-mono text-[10px] text-[#d4c4b7]">
              SYLLABLES <span className="text-[#abcae8] font-medium ml-1">{syllablesCount}</span>
            </span>
          </div>

          {/* Sentiment Engine status */}
          <div className="hidden sm:flex items-center gap-1.5 bg-[#1a1b21]/80 px-2.5 py-1 rounded-lg border border-white/5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#d4a373] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#f2be8c]"></span>
            </span>
            <span className="font-mono text-[10px] text-[#d4c4b7] uppercase tracking-wider">
              Sentiment Engine: Active
            </span>
          </div>

          {/* Icon Toggles */}
          <div className="flex items-center gap-1">
            <button
              onClick={onToggleSound}
              className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors cursor-pointer ${
                soundState.isPlaying
                  ? 'text-[#f2be8c] bg-[#d4a373]/20 shadow-[0_0_12px_rgba(242,190,140,0.3)]'
                  : 'text-[#d4c4b7] hover:text-[#f2be8c] hover:bg-[#282a2f]'
              }`}
              title={soundState.isPlaying ? 'Pausar sonido Lo-fi' : 'Reproducir Lofi Rain & Vinyl Crackle'}
            >
              <span className="material-symbols-outlined text-[18px]">water_drop</span>
            </button>

            <button
              onClick={onToggleCoPilot}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-[#d4c4b7] hover:text-[#f2be8c] hover:bg-[#282a2f] transition-colors cursor-pointer"
              title="Muse Co-Pilot Drawer"
            >
              <span className="material-symbols-outlined text-[18px]">auto_awesome</span>
            </button>

            <button
              onClick={toggleFullscreen}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-[#d4c4b7] hover:text-[#f2be8c] hover:bg-[#282a2f] transition-colors cursor-pointer"
              title="Zen Fullscreen Mode"
            >
              <span className="material-symbols-outlined text-[18px]">fullscreen</span>
            </button>

            <button
              onClick={onOpenExportModal}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-[#d4c4b7] hover:text-[#f2be8c] hover:bg-[#282a2f] transition-colors cursor-pointer"
              title="Export Artwork / Card"
            >
              <span className="material-symbols-outlined text-[18px]">ios_share</span>
            </button>
          </div>

          {/* Profile Badge */}
          <div className="w-8 h-8 rounded-full bg-[#f2be8c] flex items-center justify-center text-[#482904] shadow-sm">
            <span className="material-symbols-outlined text-[18px]">person</span>
          </div>
        </div>
      </div>
    </header>
  );
};
