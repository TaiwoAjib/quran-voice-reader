// ── Qur'an reciters (qaris) ───────────────────────────────────────────────────
// Real, melodic verse-by-verse recitation streamed from EveryAyah.
// File scheme: https://everyayah.com/data/{folder}/{SSS}{AAA}.mp3
//   SSS = surah id zero-padded to 3, AAA = ayah number (within surah) padded to 3.
// These are murattal (measured, melodic) recitations — a true Arabian melody,
// which device text-to-speech cannot reproduce.

export const RECITERS = [
  {
    id: 'alafasy',
    name: 'Mishary Alafasy',
    nameAr: 'مشاري العفاسي',
    style: 'Warm, melodic murattal',
    folder: 'Alafasy_128kbps',
  },
  {
    id: 'abdulbasit',
    name: 'Abdul Basit',
    nameAr: 'عبد الباسط عبد الصمد',
    style: 'Classic, deeply melodic',
    folder: 'Abdul_Basit_Murattal_192kbps',
  },
  {
    id: 'husary',
    name: 'Mahmoud Al-Husary',
    nameAr: 'محمود الحصري',
    style: 'Precise, traditional tajwīd',
    folder: 'Husary_128kbps',
  },
  {
    id: 'minshawi',
    name: 'Al-Minshawi',
    nameAr: 'محمد المنشاوي',
    style: 'Gentle, heartfelt',
    folder: 'Minshawy_Murattal_128kbps',
  },
  {
    id: 'sudais',
    name: 'Abdul Rahman Al-Sudais',
    nameAr: 'عبد الرحمن السديس',
    style: 'Rich, resonant (Imam of Makkah)',
    folder: 'Abdurrahmaan_As-Sudais_192kbps',
  },
  {
    id: 'ghamadi',
    name: 'Saad Al-Ghamdi',
    nameAr: 'سعد الغامدي',
    style: 'Smooth, soothing',
    folder: 'Ghamadi_40kbps',
  },
];

export const DEFAULT_RECITER_ID = 'alafasy';

export const getReciterById = (id) =>
  RECITERS.find(r => r.id === id) || RECITERS[0];

const pad3 = (n) => String(n).padStart(3, '0');

/**
 * Build the streaming URL for a single ayah's recitation.
 * @param {string} reciterId
 * @param {number} surahId    1–114
 * @param {number} ayahNumber 1-based ayah number within the surah
 */
export const getAyahAudioUrl = (reciterId, surahId, ayahNumber) => {
  if (!surahId || !ayahNumber) return null;
  const reciter = getReciterById(reciterId);
  return `https://everyayah.com/data/${reciter.folder}/${pad3(surahId)}${pad3(ayahNumber)}.mp3`;
};

// ── English translation narration ─────────────────────────────────────────────
// A real, warmly-narrated human reading of the Sahih International translation
// (Ibrahim Walk) — matches the on-screen translation text. Far more natural than
// device text-to-speech, which is used only as an offline fallback.
export const ENGLISH_NARRATION = {
  id: 'ibrahim_walk',
  name: 'Ibrahim Walk',
  translation: 'Sahih International',
  folder: 'English/Sahih_Intnl_Ibrahim_Walk_192kbps',
};

export const getTranslationAudioUrl = (surahId, ayahNumber) => {
  if (!surahId || !ayahNumber) return null;
  return `https://everyayah.com/data/${ENGLISH_NARRATION.folder}/${pad3(surahId)}${pad3(ayahNumber)}.mp3`;
};
