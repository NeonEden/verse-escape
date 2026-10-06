import React, { useState, useEffect, useRef } from 'react';
import { Poem, MoodAtmosphere, SentimentVector, SoundState } from '../types';

interface SanctuaryViewProps {
  poem: Poem;
  setPoem: React.Dispatch<React.SetStateAction<Poem>>;
  mood: MoodAtmosphere;
  setMood: (mood: MoodAtmosphere) => void;
  onOpenCoPilotWithPrompt: (prompt: string, selectedText?: string) => void;
  soundState: SoundState;
}

export const SanctuaryView: React.FC<SanctuaryViewProps> = ({
  poem,
  setPoem,
  mood,
  setMood,
  onOpenCoPilotWithPrompt,
  soundState,
}) => {
  const [selectedText, setSelectedText] = useState<string>('sombra tibia');
  const [activeSelectionPos, setActiveSelectionPos] = useState<{ top: number; left: number } | null>(null);
  const [activeStanzaIdx, setActiveStanzaIdx] = useState<number>(0);
  const [activeLineIdx, setActiveLineIdx] = useState<number>(1);
  const [showMetaphorPopover, setShowMetaphorPopover] = useState(false);
  const [showRhymePopover, setShowRhymePopover] = useState(false);
  const [metaphorList, setMetaphorList] = useState<string[]>(['velo de cobre', 'rescoldo fugaz', 'marea dormida', 'penumbra tibia']);
  const [rhymeList, setRhymeList] = useState<string[]>(['lascivia', 'alivia', 'anfibia', 'alivia']);
  const [ghostText, setGhostText] = useState<string>('...despierta un río que olvidó su cauce');
  const [isGeneratingGhost, setIsGeneratingGhost] = useState(false);
  const [lastSaved, setLastSaved] = useState<string>('hace unos segundos');

  const editorRef = useRef<HTMLDivElement | null>(null);
  const sentimentTimeout = useRef<NodeJS.Timeout | null>(null);

  // Handle title change
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value;
    setPoem(prev => ({ ...prev, title: newTitle }));
  };

  // Handle line change
  const handleLineChange = (sIdx: number, lIdx: number, newText: string) => {
    setPoem(prev => {
      const updatedStanzas = [...prev.stanzas];
      updatedStanzas[sIdx].lines[lIdx] = newText;

      const fullText = updatedStanzas.flatMap(s => s.lines).join(' ');
      const words = fullText.trim() ? fullText.trim().split(/\s+/).length : 0;
      const syllables = Math.round(words * 1.51);

      return {
        ...prev,
        stanzas: updatedStanzas,
        wordsCount: words,
        syllablesCount: syllables,
      };
    });

    setLastSaved('hace unos segundos');

    // Debounced sentiment update
    if (sentimentTimeout.current) clearTimeout(sentimentTimeout.current);
    sentimentTimeout.current = setTimeout(() => {
      updateSentimentLive();
    }, 1200);
  };

  // Update sentiment dynamically via backend API
  const updateSentimentLive = async () => {
    const fullText = poem.stanzas.flatMap(s => s.lines).join('\n');
    try {
      const res = await fetch('/api/sentiment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ poemText: fullText }),
      });
      const data = await res.json();
      if (data.calidez !== undefined) {
        setPoem(prev => ({
          ...prev,
          sentiment: {
            calidez: data.calidez,
            melancolia: data.melancolia,
            penumbra: data.penumbra,
            quietud: data.quietud,
            moodName: data.moodName || mood,
            debounce: 'Live Realtime',
          },
        }));
      }
    } catch {
      // Keep state
    }
  };

  // Add line to stanza
  const handleAddLineToStanza = (sIdx: number) => {
    setPoem(prev => {
      const updated = [...prev.stanzas];
      updated[sIdx].lines.push('Escribe un nuevo verso aquí...');
      return { ...prev, stanzas: updated };
    });
  };

  // Delete line from stanza
  const handleDeleteLine = (sIdx: number, lIdx: number) => {
    setPoem(prev => {
      const updated = [...prev.stanzas];
      updated[sIdx].lines.splice(lIdx, 1);
      if (updated[sIdx].lines.length === 0) {
        updated.splice(sIdx, 1);
      }
      return { ...prev, stanzas: updated };
    });
  };

  // Add new stanza
  const handleAddNewStanza = () => {
    setPoem(prev => ({
      ...prev,
      stanzas: [
        ...prev.stanzas,
        {
          id: `s-${Date.now()}`,
          lines: ['Y en el silencio de la nueva estrofa...'],
        },
      ],
    }));
  };

  // Generate Ghost Text via Gemini API
  const handleGenerateGhostText = async () => {
    setIsGeneratingGhost(true);
    const fullText = poem.stanzas.flatMap(s => s.lines).join('\n');
    try {
      const res = await fetch('/api/continuation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ poemText: fullText }),
      });
      const data = await res.json();
      if (data.ghostText) {
        setGhostText(data.ghostText);
      }
    } catch {
      setGhostText('...despierta un río que olvidó su cauce');
    } finally {
      setIsGeneratingGhost(false);
    }
  };

  // Accept Ghost Text
  const handleAcceptGhostText = () => {
    if (!ghostText) return;
    const cleanGhost = ghostText.replace(/^\.\.\./, '').trim();
    setPoem(prev => {
      const updatedStanzas = [...prev.stanzas];
      if (updatedStanzas.length > 0) {
        updatedStanzas[updatedStanzas.length - 1].lines.push(cleanGhost);
      } else {
        updatedStanzas.push({ id: `s-${Date.now()}`, lines: [cleanGhost] });
      }
      return { ...prev, stanzas: updatedStanzas };
    });
    setGhostText('');
  };

  // Handle Selection
  const handleTextSelection = () => {
    const selection = window.getSelection();
    if (selection && selection.toString().trim().length > 0) {
      const text = selection.toString().trim();
      setSelectedText(text);

      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      if (rect) {
        setActiveSelectionPos({
          top: rect.top - 50,
          left: Math.max(20, rect.left - 40),
        });
      }

      fetchMetaphors(text);
      fetchRhymes(text);
    }
  };

  const fetchMetaphors = async (text: string) => {
    try {
      const res = await fetch('/api/metaphors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ word: text, context: poem.stanzas[0]?.lines.join(' ') }),
      });
      const data = await res.json();
      if (data.suggestions) setMetaphorList(data.suggestions);
    } catch {
      // Keep defaults
    }
  };

  const fetchRhymes = async (text: string) => {
    try {
      const lastWord = text.trim().split(/\s+/).pop() || text;
      const res = await fetch('/api/rhymes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ word: lastWord }),
      });
      const data = await res.json();
      if (data.rhymes) setRhymeList(data.rhymes);
    } catch {
      // Keep defaults
    }
  };

  // Replace text
  const handleReplaceSelectedText = (newPhrase: string) => {
    const currentLine = poem.stanzas[activeStanzaIdx]?.lines[activeLineIdx] || '';
    if (selectedText && currentLine.includes(selectedText)) {
      const updatedLine = currentLine.replace(selectedText, newPhrase);
      handleLineChange(activeStanzaIdx, activeLineIdx, updatedLine);
    } else {
      // Replace in active line or append
      const line = poem.stanzas[0]?.lines[1] || '';
      if (line.includes('sombra tibia')) {
        handleLineChange(0, 1, line.replace('sombra tibia', newPhrase));
      }
    }
    setSelectedText(newPhrase);
    setShowMetaphorPopover(false);
    setShowRhymePopover(false);
  };

  // Keydown for Tab
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab' && ghostText) {
        e.preventDefault();
        handleAcceptGhostText();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [ghostText]);

  return (
    <div className="relative z-10 w-full max-w-7xl mx-auto px-6 flex-1 flex flex-col justify-between pt-6 pb-12 min-h-[calc(100vh-4rem)]">
      {/* Top Micro HUD / Zen Bar */}
      <div className="w-full flex items-center justify-between py-1 text-[#d4c4b7]">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[11px] tracking-widest text-[#f2be8c]/80 uppercase font-medium">
            {poem.notebook}
          </span>
          <span className="text-[#50453b] font-mono text-[11px]">/</span>
          <span className="font-mono text-[11px] text-[#d4c4b7]/70">
            {poem.volume}
          </span>
          <span className="w-1.5 h-1.5 rounded-full bg-[#f2be8c]/50 animate-pulse ml-1"></span>
        </div>

        <div className="flex items-center gap-4">
          {/* Quick Mood Atmosphere Toggles */}
          <div className="hidden md:flex items-center p-1 bg-[#0c0e13]/80 backdrop-blur-md rounded-lg shadow-sm border border-white/5">
            {(['Atardecer Ámbar', 'Noche Índigo', 'Niebla Sepia', 'Alba Pálida'] as MoodAtmosphere[]).map(m => (
              <button
                key={m}
                onClick={() => setMood(m)}
                className={`font-mono text-[11px] px-3 py-1 rounded transition-all duration-300 cursor-pointer ${
                  mood === m
                    ? 'bg-[#f2be8c]/15 text-[#f2be8c] font-medium'
                    : 'text-[#d4c4b7] hover:text-[#e2e2e9]'
                }`}
              >
                {m}
              </button>
            ))}
          </div>

          {/* Co-Pilot Drawer Toggle Trigger */}
          <button
            onClick={() => onOpenCoPilotWithPrompt('¿Cómo podemos mejorar la sonoridad y el ritmo de esta estrofa?')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1a1b21]/90 hover:bg-[#282a2f] backdrop-blur-lg rounded-lg text-[#f2be8c] transition-all duration-200 border border-[#f2be8c]/20 cursor-pointer shadow-sm"
          >
            <span className="material-symbols-outlined text-[16px]">auto_awesome</span>
            <span className="font-mono text-[11px] uppercase tracking-wider hidden sm:inline font-medium">
              Co-Piloto
            </span>
          </button>
        </div>
      </div>

      {/* Centered Editorial Writing Well */}
      <div
        ref={editorRef}
        className="w-full max-w-[720px] mx-auto my-auto relative pt-8 pb-12"
        onMouseUp={handleTextSelection}
      >
        {/* Document Meta & Title Input */}
        <div className="mb-8 text-left group">
          <div className="font-mono text-[11px] text-[#9c8e82] tracking-widest uppercase mb-1 flex items-center gap-2">
            <span>Fragmento Lírico</span>
            <span className="w-4 h-[1px] bg-[#50453b]/60 inline-block"></span>
            <span>Endecasílabo Clásico</span>
          </div>
          <input
            type="text"
            value={poem.title}
            onChange={handleTitleChange}
            aria-label="Título del poema"
            className="w-full bg-transparent font-serif text-3xl sm:text-4xl text-[#ffdcbd] tracking-tight outline-none placeholder:text-[#50453b]/40 transition-colors selection:bg-[#d4a373]/30"
          />
          <div className="w-12 h-[1px] bg-[#f2be8c]/30 mt-2 transition-all duration-500 group-hover:w-28 group-focus-within:w-28 group-focus-within:bg-[#f2be8c]"></div>
        </div>

        {/* Live Stanzas List */}
        <div className="relative font-serif text-xl sm:text-2xl text-[#e2e2e9] leading-[2.2] space-y-8">
          {poem.stanzas.map((stanza, sIdx) => (
            <div key={stanza.id || sIdx} className="relative group/stanza">
              <div className="space-y-1">
                {stanza.lines.map((lineText, lIdx) => (
                  <div key={lIdx} className="relative flex items-center group/line">
                    <input
                      type="text"
                      value={lineText}
                      onFocus={() => {
                        setActiveStanzaIdx(sIdx);
                        setActiveLineIdx(lIdx);
                      }}
                      onChange={(e) => handleLineChange(sIdx, lIdx, e.target.value)}
                      className="w-full bg-transparent outline-none font-serif text-xl sm:text-2xl text-[#e2e2e9] tracking-wide focus:text-[#ffdcbd] transition-colors"
                    />

                    {/* Quick Line Delete Button */}
                    <button
                      onClick={() => handleDeleteLine(sIdx, lIdx)}
                      className="opacity-0 group-hover/line:opacity-100 text-[#50453b] hover:text-[#ffb4ab] transition-opacity p-1 ml-2 cursor-pointer"
                      title="Eliminar verso"
                    >
                      <span className="material-symbols-outlined text-[16px]">close</span>
                    </button>
                  </div>
                ))}
              </div>

              {/* Add Line to Stanza Button */}
              <button
                onClick={() => handleAddLineToStanza(sIdx)}
                className="opacity-0 group-hover/stanza:opacity-100 font-mono text-[10px] text-[#9c8e82] hover:text-[#f2be8c] mt-1 transition-opacity flex items-center gap-1 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[14px]">add</span>
                <span>Agregar verso a esta estrofa</span>
              </button>
            </div>
          ))}

          {/* Stanza 2 Ghost Continuation Block */}
          <div className="relative pt-2">
            {/* Pulsing Caret */}
            <span className="inline-block w-[2px] h-6 bg-[#f2be8c] align-middle ml-1 animate-pulse shadow-[0_0_8px_rgba(242,190,140,0.8)]"></span>

            {/* IA Ghost Text Continuation */}
            {ghostText && (
              <span
                onClick={handleAcceptGhostText}
                className="inline text-[#9c8e82]/80 italic font-serif ml-2 select-none cursor-pointer hover:text-[#ffdcbd]/90 transition-colors"
                title="Haz clic o presiona Tab para insertar este verso"
              >
                {ghostText}
              </span>
            )}

            {/* Tab Badge & Regenerate Button */}
            <div className="inline-flex items-center gap-2 ml-3 align-middle">
              {ghostText && (
                <button
                  onClick={handleAcceptGhostText}
                  className="inline-flex items-center px-2 py-0.5 rounded bg-[#282a2f]/90 text-[#f2be8c] font-mono text-[11px] shadow-sm hover:scale-105 transition-transform border border-[#f2be8c]/20 cursor-pointer"
                >
                  <span className="tracking-normal font-sans text-[10px] mr-1">⇥</span> Tab para aceptar
                </button>
              )}

              <button
                onClick={handleGenerateGhostText}
                disabled={isGeneratingGhost}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#1e2025] hover:bg-[#282a2f] text-[#abcae8] font-mono text-[10px] border border-white/5 cursor-pointer transition-colors"
                title="Generar nueva continuación con Gemini"
              >
                <span className={`material-symbols-outlined text-[13px] ${isGeneratingGhost ? 'animate-spin' : ''}`}>
                  autorenew
                </span>
                <span>{isGeneratingGhost ? 'Generando...' : 'Regenerar borrador IA'}</span>
              </button>
            </div>
          </div>

          {/* Add New Stanza Action */}
          <div className="pt-4 flex items-center gap-3">
            <button
              onClick={handleAddNewStanza}
              className="px-3 py-1.5 bg-[#1a1b21] hover:bg-[#282a2f] text-[#f2be8c] font-mono text-xs rounded-lg transition-all border border-[#f2be8c]/20 flex items-center gap-1.5 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">post_add</span>
              <span>Nueva Estrofa</span>
            </button>
          </div>
        </div>

        {/* FLOATING AI MENU */}
        <div
          className="absolute top-12 left-28 z-40 bg-[#33353a]/95 backdrop-blur-2xl rounded-xl p-1.5 shadow-2xl flex items-center gap-1.5 transition-all duration-300 border border-white/10"
          id="ai-floating-menu"
        >
          <div className="absolute -bottom-1.5 left-10 w-3 h-3 bg-[#33353a]/95 rotate-45 transform pointer-events-none border-r border-b border-white/10"></div>

          {/* Metáfora Alt Button */}
          <div className="relative">
            <button
              onClick={() => {
                setShowMetaphorPopover(!showMetaphorPopover);
                setShowRhymePopover(false);
              }}
              type="button"
              className="px-2.5 py-1 rounded-lg bg-[#1e2025] hover:bg-[#f2be8c]/20 flex items-center gap-1.5 text-[#e2e2e9] hover:text-[#f2be8c] transition-all text-left cursor-pointer"
              title="Explorar metáforas alternativas"
            >
              <span className="material-symbols-outlined text-[15px] text-[#f2be8c]">auto_fix_high</span>
              <span className="font-mono text-[11px]">Metáfora alt.</span>
            </button>

            {showMetaphorPopover && (
              <div className="absolute bottom-full mb-2 left-0 flex flex-col bg-[#0c0e13]/95 backdrop-blur-xl p-2.5 rounded-lg shadow-2xl border border-[#f2be8c]/30 w-48 z-50 animate-in fade-in zoom-in-95 duration-150">
                <span className="font-mono text-[10px] text-[#f2be8c] mb-1.5 uppercase tracking-wider font-semibold">
                  Sugerencias de Metáfora:
                </span>
                {metaphorList.map((m, i) => (
                  <button
                    key={i}
                    onClick={() => handleReplaceSelectedText(m)}
                    className="font-serif text-sm italic text-[#d4c4b7] hover:text-[#f2be8c] hover:bg-white/5 p-1 rounded text-left transition-colors cursor-pointer"
                  >
                    "{m}"
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Rima Button */}
          <div className="relative">
            <button
              onClick={() => {
                setShowRhymePopover(!showRhymePopover);
                setShowMetaphorPopover(false);
              }}
              type="button"
              className="px-2.5 py-1 rounded-lg hover:bg-[#1e2025] flex items-center gap-1.5 text-[#d4c4b7] hover:text-[#abcae8] transition-all cursor-pointer"
              title="Buscar rimas para esta terminación"
            >
              <span className="material-symbols-outlined text-[15px]">music_note</span>
              <span className="font-mono text-[11px]">Rima (-ibia)</span>
            </button>

            {showRhymePopover && (
              <div className="absolute bottom-full mb-2 left-0 flex flex-col bg-[#0c0e13]/95 backdrop-blur-xl p-2.5 rounded-lg shadow-2xl border border-[#abcae8]/30 w-44 z-50 animate-in fade-in zoom-in-95 duration-150">
                <span className="font-mono text-[10px] text-[#abcae8] mb-1.5 uppercase tracking-wider font-semibold">
                  Rimas Disponibles:
                </span>
                {rhymeList.map((r, i) => (
                  <button
                    key={i}
                    onClick={() => handleReplaceSelectedText(r)}
                    className="font-serif text-sm italic text-[#d4c4b7] hover:text-[#abcae8] hover:bg-white/5 p-1 rounded text-left transition-colors cursor-pointer"
                  >
                    "{r}"
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="px-2 py-1 rounded-lg hover:bg-[#1e2025] text-[#d4c4b7] font-mono text-[11px]">
            11s
          </div>

          <div className="w-[1px] h-4 bg-[#50453b]/40 my-auto"></div>

          <button
            onClick={() => onOpenCoPilotWithPrompt(`¿Cómo resuena la expresión "${selectedText}" en esta estrofa? Sugiere variaciones tonales.`, selectedText)}
            type="button"
            className="px-2.5 py-1 rounded-lg hover:bg-[#f2be8c]/10 text-[#f2be8c] flex items-center gap-1 transition-all cursor-pointer font-medium"
          >
            <span className="material-symbols-outlined text-[15px]">spark</span>
            <span className="font-mono text-[11px]">Co-Piloto</span>
          </button>
        </div>
      </div>

      {/* Bottom Stage Bar: Sentiment Vector Spectrum & Metrics */}
      <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-4 items-end pt-6">
        {/* Sentiment Vector Engine HUD (Bottom-Left Pill) */}
        <div className="lg:col-span-7 flex flex-col gap-1">
          <div className="bg-[#0c0e13]/85 backdrop-blur-xl rounded-xl p-3 shadow-xl border border-white/5 max-w-xl">
            <div className="flex items-center justify-between pb-2 border-b border-white/5 mb-2">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#f2be8c] opacity-60"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#f2be8c] shadow-[0_0_10px_#f2be8c]"></span>
                </span>
                <span className="font-mono text-[11px] text-[#e2e2e9] tracking-wider uppercase font-medium">
                  Sentiment Vector Engine
                </span>
              </div>
              <span className="font-mono text-[10px] text-[#50453b]">
                {poem.sentiment.debounce || '1.5s Debounce'}
              </span>
            </div>

            {/* Live Sentiment Channels */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
              {/* Calidez / Warmth */}
              <div className="flex flex-col gap-1">
                <div className="flex justify-between items-center font-mono text-[11px]">
                  <span className="text-[#d4c4b7]">Calidez</span>
                  <span className="text-[#f2be8c] font-medium">{poem.sentiment.calidez.toFixed(2)}</span>
                </div>
                <div className="w-full bg-[#33353a]/60 rounded-full h-1 overflow-hidden">
                  <div
                    className="bg-[#f2be8c] h-full rounded-full transition-all duration-500 shadow-[0_0_8px_rgba(242,190,140,0.8)]"
                    style={{ width: `${poem.sentiment.calidez * 100}%` }}
                  ></div>
                </div>
                <span className="font-mono text-[9px] text-[#9c8e82] truncate">Ámbar Atardecer</span>
              </div>

              {/* Melancolía */}
              <div className="flex flex-col gap-1">
                <div className="flex justify-between items-center font-mono text-[11px]">
                  <span className="text-[#d4c4b7]">Melancolía</span>
                  <span className="text-[#abcae8] font-medium">{poem.sentiment.melancolia.toFixed(2)}</span>
                </div>
                <div className="w-full bg-[#33353a]/60 rounded-full h-1 overflow-hidden">
                  <div
                    className="bg-[#abcae8] h-full rounded-full transition-all duration-500 shadow-[0_0_8px_rgba(171,202,232,0.8)]"
                    style={{ width: `${poem.sentiment.melancolia * 100}%` }}
                  ></div>
                </div>
                <span className="font-mono text-[9px] text-[#9c8e82] truncate">Profundo / Lofi</span>
              </div>

              {/* Penumbra */}
              <div className="flex flex-col gap-1">
                <div className="flex justify-between items-center font-mono text-[11px]">
                  <span className="text-[#d4c4b7]">Penumbra</span>
                  <span className="text-[#e2e2e9] font-medium">{poem.sentiment.penumbra.toFixed(2)}</span>
                </div>
                <div className="w-full bg-[#33353a]/60 rounded-full h-1 overflow-hidden">
                  <div
                    className="bg-[#9c8e82] h-full rounded-full transition-all duration-500"
                    style={{ width: `${poem.sentiment.penumbra * 100}%` }}
                  ></div>
                </div>
                <span className="font-mono text-[9px] text-[#9c8e82] truncate">Dusk Lumens</span>
              </div>

              {/* Quietud */}
              <div className="flex flex-col gap-1">
                <div className="flex justify-between items-center font-mono text-[11px]">
                  <span className="text-[#d4c4b7]">Quietud</span>
                  <span className="text-[#d4a373] font-medium">{poem.sentiment.quietud.toFixed(2)}</span>
                </div>
                <div className="w-full bg-[#33353a]/60 rounded-full h-1 overflow-hidden">
                  <div
                    className="bg-[#d4a373] h-full rounded-full transition-all duration-500"
                    style={{ width: `${poem.sentiment.quietud * 100}%` }}
                  ></div>
                </div>
                <span className="font-mono text-[9px] text-[#9c8e82] truncate">Calma Zen</span>
              </div>
            </div>
          </div>
        </div>

        {/* Telemetry Stats & Audio Status (Bottom-Right Pill) */}
        <div className="lg:col-span-5 flex flex-col items-end gap-2">
          <div className="bg-[#0c0e13]/80 backdrop-blur-xl px-4 py-2.5 rounded-xl shadow-xl border border-white/5 flex flex-wrap items-center justify-end gap-4 text-[#d4c4b7]">
            <div className="flex items-center gap-1.5 font-mono text-[11px]">
              <span className="material-symbols-outlined text-[15px] text-[#abcae8]">graphic_eq</span>
              <span>Lofi Rain &amp; Vinyl:</span>
              <span className="text-[#e2e2e9] font-medium">{soundState.isPlaying ? 'Activo (40%)' : 'En pausa'}</span>
              <span className={`w-1.5 h-1.5 rounded-full ${soundState.isPlaying ? 'bg-[#abcae8] animate-pulse' : 'bg-[#50453b]'}`}></span>
            </div>

            <div className="hidden sm:flex items-center gap-1.5 font-mono text-[11px]">
              <span className="material-symbols-outlined text-[15px] text-[#9c8e82]">cloud_done</span>
              <span>Guardado: <span className="text-[#e2e2e9]">{lastSaved}</span></span>
            </div>

            <div className="flex items-center font-mono text-[11px]">
              <span className="px-2 py-0.5 rounded bg-[#282a2f] text-[#f2be8c] font-medium border border-[#f2be8c]/20">
                11s Endecasílabos
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
