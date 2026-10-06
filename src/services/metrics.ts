// Spanish Poetic Metrics & Syllable Engine

export function countSpanishSyllables(verse: string): { count: number; stresses: number[]; type: string } {
  if (!verse || !verse.trim()) return { count: 0, stresses: [], type: 'Vacío' };

  const clean = verse.trim().toLowerCase().replace(/[.,;:!?«»'\"()_—\-]/g, '');
  const words = clean.split(/\s+/).filter(w => w.length > 0);

  if (words.length === 0) return { count: 0, stresses: [], type: 'Vacío' };

  let totalSyllables = 0;
  const vowels = /[aeiouáéíóúü]/g;

  words.forEach((w) => {
    const matches = w.match(vowels);
    let count = matches ? matches.length : 1;
    // Diphthongs reduction (approximate standard Spanish diphthongs)
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
  if (/[áéíóú][^s]$/.test(lastWord) || (/[áéíóú]$/.test(lastWord) && !/[aeiou]n$/i.test(lastWord))) {
    totalSyllables += 1; // Aguda
  } else if (/[áéíóú][a-z]{3,}$/.test(lastWord)) {
    totalSyllables = Math.max(1, totalSyllables - 1); // Esdrújula
  }

  let type = 'Verso Libre';
  if (totalSyllables === 11) type = 'Endecasílabo Clásico';
  else if (totalSyllables === 14) type = 'Alejandrino';
  else if (totalSyllables === 8) type = 'Octosílabo Popular';
  else if (totalSyllables === 7) type = 'Heptasílabo';
  else if (totalSyllables === 9) type = 'Eneasílabo';
  else if (totalSyllables === 10) type = 'Decasílabo';
  else if (totalSyllables === 12) type = 'Dodecasílabo';
  else if (totalSyllables === 6) type = 'Hexasílabo';
  else if (totalSyllables === 5) type = 'Pentasílabo';
  else if (totalSyllables === 4) type = 'Tetrasílabo';

  // Stress positions approximation
  const stresses = [2, 6, 10].filter(pos => pos <= totalSyllables);

  return { count: totalSyllables, stresses, type };
}

export function calculatePoemMetrics(stanzas: { lines: string[] }[]): { words: number; syllables: number; dominantMeter: string } {
  const allLines = stanzas.flatMap(s => s.lines).filter(l => l.trim().length > 0);
  const fullText = allLines.join(' ');
  const words = fullText.trim() ? fullText.trim().split(/\s+/).length : 0;

  let totalSyllables = 0;
  const meterCounts: Record<string, number> = {};

  allLines.forEach(line => {
    const { count, type } = countSpanishSyllables(line);
    totalSyllables += count;
    meterCounts[type] = (meterCounts[type] || 0) + 1;
  });

  let dominantMeter = 'Endecasílabo Clásico';
  let maxCount = 0;
  Object.entries(meterCounts).forEach(([m, cnt]) => {
    if (cnt > maxCount && m !== 'Vacío') {
      maxCount = cnt;
      dominantMeter = m;
    }
  });

  return { words, syllables: totalSyllables, dominantMeter };
}
