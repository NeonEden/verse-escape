import React, { useState, useEffect } from 'react';
import { NavigationTab, MoodAtmosphere, Poem, CoPilotMessage, SoundState } from './types';
import { ShaderCanvas } from './components/ShaderCanvas';
import { Header } from './components/Header';
import { SanctuaryView } from './components/SanctuaryView';
import { CoPilotDrawer } from './components/CoPilotDrawer';
import { ArchiveView } from './components/ArchiveView';
import { CadenceView } from './components/CadenceView';
import { EchoesView } from './components/EchoesView';
import { ExportModal } from './components/ExportModal';
import { soundSynth } from './services/audioSynthesizer';
import { calculatePoemMetrics } from './services/metrics';

const INITIAL_POEM: Poem = {
  id: 'poem-main',
  notebook: 'CUADERNO DE PENUMBRAS',
  volume: 'Tomo IV: Elegías de Otoño',
  title: 'Las cenizas del crepúsculo',
  subtitle: 'Fragmento Lírico — Endecasílabo Clásico',
  wordsCount: 24,
  syllablesCount: 36,
  mood: 'Atardecer Ámbar',
  updatedAt: 'Hoy, 21:42 Nocturno',
  sentiment: {
    calidez: 0.78,
    melancolia: 0.64,
    penumbra: 0.32,
    quietud: 0.88,
    moodName: 'Ámbar Atardecer',
    debounce: '1.5s Debounce',
  },
  stanzas: [
    {
      id: 's1',
      lines: [
        'La tarde se deshace en los cristales,',
        'un rumor de ceniza y sombra tibia;',
        'el tiempo calla lo que no se alivia...',
      ],
    },
    {
      id: 's2',
      lines: [
        'y en la penumbra lenta de los sauces...',
      ],
    },
  ],
};

const INITIAL_COPILOT_MESSAGES: CoPilotMessage[] = [
  {
    id: 'msg-1',
    sender: 'user',
    timestamp: '21:42 Nocturno',
    content: 'Haz que la transición hacia la tercera estrofa evoque la marea nocturna y el desapego budista.',
  },
  {
    id: 'msg-2',
    sender: 'assistant',
    timestamp: '21:42 Nocturno',
    content: 'Sugiero romper la rima continua con un verso quebrado para generar vacío lírico:',
    suggestedVerses: [
      'El mar desaprende su nombre',
      'frente a la piedra que no espera nada.',
    ],
    metricInfo: 'Endecasílabo con cesura (11 sílabas)',
    tonalAffinity: {
      score: '92.4%',
      poets: 'Neruda & Cernuda',
    },
  },
];

export default function App() {
  const [activeTab, setActiveTab] = useState<NavigationTab>('canvas');
  const [mood, setMood] = useState<MoodAtmosphere>('Atardecer Ámbar');
  const [poem, setPoem] = useState<Poem>(() => {
    const { words, syllables } = calculatePoemMetrics(INITIAL_POEM.stanzas);
    return {
      ...INITIAL_POEM,
      wordsCount: words || 24,
      syllablesCount: syllables || 36,
    };
  });
  const [coPilotOpen, setCoPilotOpen] = useState<boolean>(true);
  const [coPilotMessages, setCoPilotMessages] = useState<CoPilotMessage[]>(INITIAL_COPILOT_MESSAGES);
  const [exportModalOpen, setExportModalOpen] = useState<boolean>(false);
  const [soundState, setSoundState] = useState<SoundState>({
    isPlaying: false,
    rainVolume: 40,
    crackleVolume: 20,
    windVolume: 0,
    activePreset: 'Lo-fi Rain',
  });

  // Global Keyboard Shortcut (⌘ + K or Ctrl + K) for CoPilot
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCoPilotOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  // Sound toggle
  const handleToggleSound = () => {
    const isPlayingNow = soundSynth.toggle(soundState.rainVolume, soundState.crackleVolume);
    setSoundState(prev => ({ ...prev, isPlaying: isPlayingNow }));
  };

  // CoPilot message send with real API call
  const handleSendMessageToCoPilot = async (promptText: string) => {
    const userMsg: CoPilotMessage = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      timestamp: 'Ahora',
      content: promptText,
    };

    setCoPilotMessages(prev => [...prev, userMsg]);

    try {
      const response = await fetch('/api/copilot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: promptText,
          poemContext: poem.stanzas.flatMap(s => s.lines).join('\n'),
          tone: mood,
        }),
      });

      const data = await response.json();

      const aiMsg: CoPilotMessage = {
        id: `ai-${Date.now()}`,
        sender: 'assistant',
        timestamp: 'Ahora',
        content: data.reply || 'Aquí tienes una propuesta lírica adaptada a la métrica de tu obra:',
        suggestedVerses: data.suggestedVerses || [
          'El mar desaprende su nombre',
          'frente a la piedra que no espera nada.'
        ],
        metricInfo: data.metricInfo || 'Endecasílabo armónico en 2ª, 6ª y 10ª',
        tonalAffinity: data.tonalAffinity || { score: '94.0%', poets: 'Lorca & Cernuda' },
      };

      setCoPilotMessages(prev => [...prev, aiMsg]);
    } catch {
      const fallbackMsg: CoPilotMessage = {
        id: `ai-fb-${Date.now()}`,
        sender: 'assistant',
        timestamp: 'Ahora',
        content: 'Sugiero profundizar la cadencia con estos versos:',
        suggestedVerses: [
          'El mar desaprende su nombre',
          'frente a la piedra que no espera nada.'
        ],
        metricInfo: 'Endecasílabo con cesura',
        tonalAffinity: { score: '92.4%', poets: 'Neruda & Cernuda' },
      };
      setCoPilotMessages(prev => [...prev, fallbackMsg]);
    }
  };

  // Insert suggested verses into poem
  const handleInsertVerses = (verses: string[]) => {
    setPoem(prev => {
      const updatedStanzas = [...prev.stanzas];
      updatedStanzas.push({
        id: `stanza-${Date.now()}`,
        lines: [...verses],
      });

      const { words, syllables } = calculatePoemMetrics(updatedStanzas);

      return {
        ...prev,
        stanzas: updatedStanzas,
        wordsCount: words,
        syllablesCount: syllables,
      };
    });

    // Ensure we are on canvas view to see the inserted verses
    setActiveTab('canvas');
  };

  // Create new poem in Archive
  const handleCreateNewPoem = () => {
    const newStanzas = [
      {
        id: `s-${Date.now()}`,
        lines: ['Abre la noche su puerta de sombra...', 'guarda el silencio lo que el alma nombra.'],
      },
    ];
    const { words, syllables } = calculatePoemMetrics(newStanzas);

    const newPoem: Poem = {
      id: `poem-${Date.now()}`,
      notebook: 'CUADERNO DE PENUMBRAS',
      volume: 'Nuevo Tomo',
      title: 'Verso en la Penumbra',
      subtitle: 'Fragmento Lírico — Endecasílabo Clásico',
      wordsCount: words,
      syllablesCount: syllables,
      mood: mood,
      updatedAt: 'Ahora',
      sentiment: { calidez: 0.65, melancolia: 0.70, penumbra: 0.40, quietud: 0.85 },
      stanzas: newStanzas,
    };
    setPoem(newPoem);
    setActiveTab('canvas');
  };

  const handleMoodChange = (newMood: MoodAtmosphere) => {
    setMood(newMood);
    setPoem(prev => ({
      ...prev,
      mood: newMood,
    }));
  };

  return (
    <div className="relative min-h-screen bg-[#111318] text-[#e2e2e9] overflow-x-hidden font-serif selection:bg-[#d4a373]/30 selection:text-[#ffdcbd]">
      {/* Procedural WebGL Shader Ambient Background */}
      <ShaderCanvas mood={mood} />

      {/* Main Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        poemTitle={poem.title}
        wordsCount={poem.wordsCount}
        syllablesCount={poem.syllablesCount}
        soundState={soundState}
        onToggleSound={handleToggleSound}
        onToggleCoPilot={() => setCoPilotOpen(!coPilotOpen)}
        onOpenExportModal={() => setExportModalOpen(true)}
      />

      {/* Main Stage View depending on Active Navigation Tab */}
      <main className="relative z-10 w-full pt-16 min-h-[calc(100vh-4rem)]">
        {activeTab === 'canvas' && (
          <SanctuaryView
            poem={poem}
            setPoem={setPoem}
            mood={mood}
            setMood={handleMoodChange}
            onOpenCoPilotWithPrompt={(prompt, text) => {
              setCoPilotOpen(true);
              if (prompt) handleSendMessageToCoPilot(prompt);
            }}
            soundState={soundState}
          />
        )}

        {activeTab === 'folio' && (
          <ArchiveView
            currentPoemId={poem.id}
            onSelectPoem={(selected) => {
              const { words, syllables } = calculatePoemMetrics(selected.stanzas);
              setPoem({
                ...selected,
                wordsCount: words,
                syllablesCount: syllables,
              });
              setMood(selected.mood);
              setActiveTab('canvas');
            }}
            onCreateNewPoem={handleCreateNewPoem}
          />
        )}

        {activeTab === 'rhythms' && (
          <CadenceView currentPoem={poem} />
        )}

        {activeTab === 'resonances' && (
          <EchoesView
            poem={poem}
            soundState={soundState}
            setSoundState={setSoundState}
            onOpenExportModal={() => setExportModalOpen(true)}
          />
        )}
      </main>

      {/* Co-Pilot Drawer Slideout */}
      <CoPilotDrawer
        isOpen={coPilotOpen}
        onClose={() => setCoPilotOpen(false)}
        messages={coPilotMessages}
        onSendMessage={handleSendMessageToCoPilot}
        onInsertVerses={handleInsertVerses}
        poemContext={poem}
      />

      {/* Export Modal */}
      <ExportModal
        isOpen={exportModalOpen}
        onClose={() => setExportModalOpen(false)}
        poem={poem}
      />

      {/* Footer */}
      <footer className="relative z-10 w-full bg-[#0c0e13]/80 backdrop-blur-xl py-6 border-t border-white/5 transition-colors mt-8">
        <div className="w-full px-6 max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-serif text-xl text-[#f2be8c]">VerseScape</span>
            <span className="font-mono text-xs text-[#d4c4b7]">v2.4 Nocturne</span>
          </div>

          <div className="font-mono text-xs text-[#9c8e82] text-center">
            © 2025 VerseScape Studio. Bound to silence and rhythm.
          </div>

          <div className="flex items-center gap-4">
            <span className="font-mono text-xs text-[#d4c4b7] tracking-wider uppercase">
              CIRCADIAN DUSK (3800K)
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
