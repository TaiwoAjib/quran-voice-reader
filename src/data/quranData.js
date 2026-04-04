import QURAN_JSON from './quran.json';

export const ALL_SURAHS_META = QURAN_JSON.map(s => ({
  id: s.id,
  name: s.name,
  nameArabic: s.nameArabic,
  meaning: s.meaning,
  totalAyahs: s.totalAyahs,
  revelationType: s.revelationType
}));

export const SURAHS = QURAN_JSON;

export const getSurahById = (id) => SURAHS.find(s => s.id === id);
export const getSurahByName = (name) => 
  SURAHS.find(s => 
    s.name.toLowerCase().includes(name.toLowerCase()) || 
    s.nameArabic.includes(name)
  );

export const TRAINING_SENTENCES = [
  { id: 1, text: "In the name of Allah, the Most Gracious, the Most Merciful." },
  { id: 2, text: "All praise is due to Allah, Lord of all the worlds." },
  { id: 3, text: "Guide us to the straight path, the path of those You have blessed." },
  { id: 4, text: "He is Allah, the One and Only, Allah the Eternal Absolute." },
  { id: 5, text: "There is no god but Allah, and Muhammad is his messenger." },
];

export const VOICE_COMMANDS = {
  PAUSE: ['pause', 'pause recitation', 'stop reading', 'wait'],
  RESUME: ['resume', 'resume reading', 'continue', 'play', 'continue reading'],
  STOP: ['stop', 'close', 'exit', 'end'],
  NEXT: ['next', 'next ayah', 'next verse', 'forward'],
  PREVIOUS: ['previous', 'previous ayah', 'back', 'go back'],
  REPEAT: ['repeat', 'repeat ayah', 'again', 'replay'],
  NEXT_SURAH: ['next surah', 'next chapter', 'continue to next surah'],
};
