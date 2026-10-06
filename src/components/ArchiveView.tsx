import React, { useState } from 'react';
import { Poem, MoodAtmosphere } from '../types';

interface ArchiveViewProps {
  currentPoemId: string;
  onSelectPoem: (poem: Poem) => void;
  onCreateNewPoem: () => void;
}

const INITIAL_ARCHIVE: Poem[] = [
  {
    id: 'poem-1',
    notebook: 'CUADERNO DE PENUMBRAS',
    volume: 'Tomo IV: Elegías de Otoño',
    title: 'Las cenizas del crepúsculo',
    subtitle: 'Fragmento Lírico — Endecasílabo Clásico',
    wordsCount: 342,
    syllablesCount: 518,
    mood: 'Atardecer Ámbar',
    updatedAt: 'Hoy, 21:40',
    sentiment: { calidez: 0.78, melancolia: 0.64, penumbra: 0.32, quietud: 0.88 },
    stanzas: [
      {
        id: 's1',
        lines: [
          'La tarde se deshace en los cristales,',
          'un rumor de ceniza y sombra tibia;',
          'el tiempo calla lo que no se alivia...'
        ]
      },
      {
        id: 's2',
        lines: [
          'y en la penumbra lenta de los sauces...'
        ]
      }
    ]
  },
  {
    id: 'poem-2',
    notebook: 'CUADERNO DE PENUMBRAS',
    volume: 'Tomo III: Nocturnos de Solitud',
    title: 'Nocturno I: La quietud del agua',
    subtitle: 'Alejandrino Meditativo',
    wordsCount: 215,
    syllablesCount: 320,
    mood: 'Noche Índigo',
    updatedAt: 'Ayer, 23:15',
    sentiment: { calidez: 0.22, melancolia: 0.85, penumbra: 0.74, quietud: 0.92 },
    stanzas: [
      {
        id: 's1',
        lines: [
          'El agua en la penumbra detiene su murmullo,',
          'la noche abre sus alas sobre el silencio antiguo,',
          'se apaga la memoria bajo el manto nocturno.'
        ]
      }
    ]
  },
  {
    id: 'poem-3',
    notebook: 'LIBRO DE LAS RESONANCIAS',
    volume: 'Tomo I: Niebla & Sepia',
    title: 'Canto a la piedra dormida',
    subtitle: 'Octosílabo Tradicional',
    wordsCount: 180,
    syllablesCount: 270,
    mood: 'Niebla Sepia',
    updatedAt: '28 Sep 2026',
    sentiment: { calidez: 0.45, melancolia: 0.50, penumbra: 0.60, quietud: 0.75 },
    stanzas: [
      {
        id: 's1',
        lines: [
          'En el musgo de la roca',
          'guarda el viento su secreto,',
          'la palabra calla y sueña',
          'bajo el polvo de los siglos.'
        ]
      }
    ]
  }
];

export const ArchiveView: React.FC<ArchiveViewProps> = ({
  currentPoemId,
  onSelectPoem,
  onCreateNewPoem,
}) => {
  const [poems, setPoems] = useState<Poem[]>(INITIAL_ARCHIVE);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMoodFilter, setSelectedMoodFilter] = useState<string>('all');

  const filteredPoems = poems.filter(p => {
    const matchesSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.notebook.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.stanzas.some(s => s.lines.some(l => l.toLowerCase().includes(searchQuery.toLowerCase())));
    const matchesMood = selectedMoodFilter === 'all' || p.mood === selectedMoodFilter;
    return matchesSearch && matchesMood;
  });

  const handleDeletePoem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('¿Deseas guardar este manuscrito en el olvido?')) {
      setPoems(prev => prev.filter(p => p.id !== id));
    }
  };

  const handleDuplicatePoem = (poem: Poem, e: React.MouseEvent) => {
    e.stopPropagation();
    const dup: Poem = {
      ...poem,
      id: `poem-${Date.now()}`,
      title: `${poem.title} (Copia)`,
      updatedAt: 'Ahora',
    };
    setPoems(prev => [dup, ...prev]);
  };

  return (
    <div className="relative z-10 w-full max-w-6xl mx-auto px-6 py-10 min-h-[calc(100vh-4rem)]">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-8 border-b border-white/5">
        <div>
          <div className="font-mono text-[11px] text-[#f2be8c] tracking-widest uppercase mb-1">
            Archivo de Manuscritos &amp; Folios
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl text-[#e2e2e9]">
            Sanctuarium • Registro de Poemas
          </h1>
          <p className="font-serif text-[#d4c4b7] text-sm mt-1">
            Colección privada de obras, elegías y borradores resonantes.
          </p>
        </div>

        <button
          onClick={onCreateNewPoem}
          className="px-4 py-2 bg-[#f2be8c] text-[#482904] font-mono text-xs rounded-lg hover:bg-[#ffdcbd] transition-all flex items-center gap-2 shadow-lg font-medium cursor-pointer self-start md:self-auto"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          <span>Nuevo Manuscrito</span>
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 my-6">
        {/* Search Field */}
        <div className="relative w-full sm:w-80">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por verso, título o libreta..."
            className="w-full bg-[#1a1b21]/80 text-[#e2e2e9] font-serif text-sm px-3.5 py-2 rounded-lg outline-none placeholder:text-[#50453b] focus:border-[#f2be8c]/30 border border-white/10"
          />
          <span className="material-symbols-outlined absolute right-2.5 top-2.5 text-[#9c8e82] text-[18px]">
            search
          </span>
        </div>

        {/* Mood Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0">
          <button
            onClick={() => setSelectedMoodFilter('all')}
            className={`font-mono text-xs px-3 py-1 rounded-lg transition-all cursor-pointer ${
              selectedMoodFilter === 'all'
                ? 'bg-[#282a2f] text-[#f2be8c] font-medium border border-[#f2be8c]/20'
                : 'text-[#d4c4b7] hover:bg-white/5'
            }`}
          >
            Todos ({poems.length})
          </button>
          {['Atardecer Ámbar', 'Noche Índigo', 'Niebla Sepia', 'Alba Pálida'].map(m => (
            <button
              key={m}
              onClick={() => setSelectedMoodFilter(m)}
              className={`font-mono text-xs px-3 py-1 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                selectedMoodFilter === m
                  ? 'bg-[#f2be8c]/15 text-[#f2be8c] border border-[#f2be8c]/30'
                  : 'text-[#d4c4b7] hover:bg-white/5'
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      {/* Manuscripts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPoems.map((p) => {
          const isActive = p.id === currentPoemId;
          const firstLine = p.stanzas[0]?.lines[0] || 'Sin versos...';

          return (
            <div
              key={p.id}
              onClick={() => onSelectPoem(p)}
              className={`p-5 rounded-2xl transition-all cursor-pointer flex flex-col justify-between group relative border ${
                isActive
                  ? 'bg-[#1a1b21] border-[#f2be8c]/40 shadow-[0_0_24px_rgba(242,190,140,0.15)]'
                  : 'bg-[#0c0e13]/80 hover:bg-[#1a1b21]/70 border-white/5 hover:border-white/10'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="font-mono text-[10px] text-[#9c8e82] uppercase tracking-wider">
                    {p.notebook}
                  </span>
                  <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-[#282a2f] text-[#abcae8]">
                    {p.mood}
                  </span>
                </div>

                <h3 className="font-serif text-xl font-medium text-[#e2e2e9] group-hover:text-[#ffdcbd] transition-colors mb-1">
                  {p.title}
                </h3>
                <p className="font-mono text-[11px] text-[#9c8e82] mb-4">
                  {p.subtitle}
                </p>

                {/* Preview Quote */}
                <div className="p-3 bg-[#111318]/90 rounded-xl border border-white/5 font-serif text-sm italic text-[#d4c4b7] line-clamp-3 mb-4">
                  «{firstLine}»
                </div>
              </div>

              {/* Bottom Meta & Actions */}
              <div className="flex items-center justify-between pt-3 border-t border-white/5 text-[#9c8e82] font-mono text-[10px]">
                <div className="flex items-center gap-2">
                  <span>{p.wordsCount} palabras</span>
                  <span>•</span>
                  <span>{p.updatedAt}</span>
                </div>

                <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => handleDuplicatePoem(p, e)}
                    className="p-1 hover:text-[#f2be8c] transition-colors cursor-pointer"
                    title="Duplicar manuscrito"
                  >
                    <span className="material-symbols-outlined text-[16px]">content_copy</span>
                  </button>
                  <button
                    onClick={(e) => handleDeletePoem(p.id, e)}
                    className="p-1 hover:text-[#ffb4ab] transition-colors cursor-pointer"
                    title="Eliminar"
                  >
                    <span className="material-symbols-outlined text-[16px]">delete</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
