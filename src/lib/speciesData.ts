// Comprehensive Database of Native Assam and Indian Tree Species

export interface SpeciesItem {
  id: string;
  name: string;
  assameseName?: string;
  hindiName?: string;
  scientific: string;
  co2: string;
  co2KgPerYear: number;
  icon: string;
  badge?: string;
  category: 'state_symbol' | 'indigenous_assam' | 'medicinal' | 'timber' | 'canopy' | 'fast_growing' | 'other';
  description: string;
  nativeRegions: string;
  rewardPoints: number;
  isCustom?: boolean;
}

export const COMPREHENSIVE_SPECIES_LIST: SpeciesItem[] = [
  {
    id: 'hollong',
    name: 'Hollong',
    assameseName: 'হোলোং (Hollong)',
    scientific: 'Dipterocarpus macrocarpus',
    co2: '42 kg/yr',
    co2KgPerYear: 42,
    icon: '🌲',
    badge: '👑 State Tree of Assam',
    category: 'state_symbol',
    description: 'The majestic State Tree of Assam. Forms the towering emergent canopy of upper Assam rainforests (Joypur & Dehing Patkai).',
    nativeRegions: 'Upper Assam (Dibrugarh, Tinsukia, Charaideo), Arunachal',
    rewardPoints: 20
  },
  {
    id: 'nahor',
    name: 'Nahor (Ceylon Ironwood)',
    assameseName: 'নাহৰ (Nahor)',
    hindiName: 'नागकेसर (Nagkesar)',
    scientific: 'Mesua ferrea',
    co2: '30 kg/yr',
    co2KgPerYear: 30,
    icon: '🌸',
    badge: '🌺 State Flower Tree of Assam',
    category: 'state_symbol',
    description: 'Extremely dense hardwood tree celebrated in Assamese literature with fragrant white-and-gold blossoms.',
    nativeRegions: 'Assam Valleys, Western Ghats, Eastern Himalayas',
    rewardPoints: 20
  },
  {
    id: 'agarwood',
    name: 'Agarwood (Xasi Tree)',
    assameseName: 'সাঁচি গছ (Xasi Gos)',
    scientific: 'Aquilaria malaccensis',
    co2: '34 kg/yr',
    co2KgPerYear: 34,
    icon: '🪵',
    badge: '✨ High-Value Indigenous Asset',
    category: 'indigenous_assam',
    description: 'Precious aromatic tree native to Assam hills; historically used for royal Sanchi manuscripts and sacred Oud oil.',
    nativeRegions: 'Hojai, Golaghat, Sivasagar, Karbi Anglong, Cachar',
    rewardPoints: 20
  },
  {
    id: 'gamari',
    name: 'Gamari (White Teak)',
    assameseName: 'গমাৰী (Gamari)',
    hindiName: 'गम्हार (Gamhar)',
    scientific: 'Gmelina arborea',
    co2: '32 kg/yr',
    co2KgPerYear: 32,
    icon: '🌱',
    badge: '⚡ Fast Growing Bio-Mass',
    category: 'timber',
    description: 'Rapidly growing native timber tree with high carbon accumulation and soil revitalization properties.',
    nativeRegions: 'Brahmaputra Valley, Barak Valley, Central India',
    rewardPoints: 20
  },
  {
    id: 'bhaluka_bamboo',
    name: 'Bhaluka Bamboo',
    assameseName: 'ভালুকা বাঁহ (Bhaluka Baah)',
    scientific: 'Bambusa balcooa',
    co2: '52 kg/yr',
    co2KgPerYear: 52,
    icon: '🎋',
    badge: '🌿 Highest Carbon Sequestration',
    category: 'fast_growing',
    description: 'Thick-walled giant clumping bamboo native to Assam. Extraordinary soil erosion prevention along riverbanks.',
    nativeRegions: 'All 35 Districts of Assam, North-East India',
    rewardPoints: 20
  },
  {
    id: 'neem',
    name: 'Neem (Maha-Neem)',
    assameseName: 'মহানীম (Maha-Neem)',
    hindiName: 'नीम (Neem)',
    scientific: 'Azadirachta indica',
    co2: '24 kg/yr',
    co2KgPerYear: 24,
    icon: '🌿',
    badge: '🛡️ Natural Bio-Pesticide',
    category: 'medicinal',
    description: 'Universal purifier that emits high oxygen levels and possesses powerful antibacterial and air filtering attributes.',
    nativeRegions: 'Widespread across Assam & Pan-India',
    rewardPoints: 20
  },
  {
    id: 'banyan',
    name: 'Banyan (Bor Tree)',
    assameseName: 'বৰ গছ (Bor Gos)',
    hindiName: 'बरगद (Bargad)',
    scientific: 'Ficus benghalensis',
    co2: '48 kg/yr',
    co2KgPerYear: 48,
    icon: '🌳',
    badge: '🏛️ National Heritage Keystone',
    category: 'canopy',
    description: 'Long-lived keystone giant with aerial prop roots that houses hundreds of bird and pollinator species.',
    nativeRegions: 'Pan-India, Brahmaputra Floodplains',
    rewardPoints: 20
  },
  {
    id: 'peepal',
    name: 'Peepal (Ahot Tree)',
    assameseName: 'আঁহত গছ (Ahot Gos)',
    hindiName: 'पीपल (Peepal)',
    scientific: 'Ficus religiosa',
    co2: '40 kg/yr',
    co2KgPerYear: 40,
    icon: '🍃',
    badge: '🌬️ 24-Hour Oxygen Emitter',
    category: 'canopy',
    description: 'Sacred fig tree known to release continuous oxygen through Crassulacean acid metabolism (CAM).',
    nativeRegions: 'Pan-India, Assam Rural Groves',
    rewardPoints: 20
  },
  {
    id: 'jackfruit',
    name: 'Jackfruit (Kathal)',
    assameseName: 'কঁঠাল (Kothal)',
    hindiName: 'कटहल (Kathal)',
    scientific: 'Artocarpus heterophyllus',
    co2: '28 kg/yr',
    co2KgPerYear: 28,
    icon: '🍈',
    badge: '🍲 Food & Carbon Security',
    category: 'indigenous_assam',
    description: 'Prolific fruit-bearing tree with deep root penetration and high drought tolerance.',
    nativeRegions: 'Assam Homesteads (Bari), Western Ghats',
    rewardPoints: 20
  },
  {
    id: 'mango',
    name: 'Mango (Aam)',
    assameseName: 'আম (Aam)',
    hindiName: 'आम (Aam)',
    scientific: 'Mangifera indica',
    co2: '26 kg/yr',
    co2KgPerYear: 26,
    icon: '🥭',
    badge: '☀️ Heavy Canopy Cover',
    category: 'canopy',
    description: 'Evergreen dense canopy offering natural urban shade cooling and community fruit yields.',
    nativeRegions: 'All Indian agro-climatic zones',
    rewardPoints: 20
  },
  {
    id: 'amla',
    name: 'Amla (Amlakhi)',
    assameseName: 'আমলখি (Amlakhi)',
    hindiName: 'आंवला (Aonla)',
    scientific: 'Phyllanthus emblica',
    co2: '22 kg/yr',
    co2KgPerYear: 22,
    icon: '🍏',
    badge: '💊 Ayurvedic Super-Tree',
    category: 'medicinal',
    description: 'Rich in Vitamin C and medicinal tannins; highly resilient and enhances local soil microbial health.',
    nativeRegions: 'Assam Sub-Himalayan belt, Deciduous Forests',
    rewardPoints: 20
  },
  {
    id: 'sal',
    name: 'Sal (Sakhua)',
    assameseName: 'শাল গছ (Xal Gos)',
    hindiName: 'साल (Sal)',
    scientific: 'Shorea robusta',
    co2: '38 kg/yr',
    co2KgPerYear: 38,
    icon: '🌲',
    badge: '🪵 Prime Forest Hardwood',
    category: 'timber',
    description: 'Pillar species of North-East and Central Indian deciduous forests with immense longevity.',
    nativeRegions: 'Lower Assam (Goalpara, Kamrup, Kokrajhar)',
    rewardPoints: 20
  },
  {
    id: 'simolu',
    name: 'Simolu (Red Silk Cotton)',
    assameseName: 'শিমলু (Ximolu)',
    hindiName: 'सेमल (Semal)',
    scientific: 'Bombax ceiba',
    co2: '36 kg/yr',
    co2KgPerYear: 36,
    icon: '🌺',
    badge: '🦜 Avian Pollinator Sanctuary',
    category: 'canopy',
    description: 'Towering deciduous tree with brilliant crimson flowers that attracts dozens of migratory bird species in Spring.',
    nativeRegions: 'Kaziranga & Manas Buffer Zones, Assam',
    rewardPoints: 20
  },
  {
    id: 'arjun',
    name: 'Arjun',
    assameseName: 'অৰ্জুন (Arjun)',
    hindiName: 'अर्जुन (Arjuna)',
    scientific: 'Terminalia arjuna',
    co2: '31 kg/yr',
    co2KgPerYear: 31,
    icon: '🌿',
    badge: '🌊 Riverbank Soil Binder',
    category: 'medicinal',
    description: 'Extensive buttressed root system that stabilizes embankments along the Brahmaputra and tributary river banks.',
    nativeRegions: 'Riparian zones across Assam and India',
    rewardPoints: 20
  },
  {
    id: 'teak',
    name: 'Teak (Segun)',
    assameseName: 'চেগুন (Xegun)',
    hindiName: 'सागवान (Sagwan)',
    scientific: 'Tectona grandis',
    co2: '34 kg/yr',
    co2KgPerYear: 34,
    icon: '🪵',
    badge: '💎 High-Density Hardwood',
    category: 'timber',
    description: 'High-value hardwood with high longevity and structural carbon storage capability.',
    nativeRegions: 'Assam agroforestry plantations, Western Ghats',
    rewardPoints: 20
  },
  {
    id: 'other',
    name: 'Other Species (Custom)',
    assameseName: 'অন্যান্য প্ৰজাতি (Custom)',
    hindiName: 'अन्य प्रजाति (Custom)',
    scientific: 'Custom Botanical Specimen',
    co2: '25 kg/yr',
    co2KgPerYear: 25,
    icon: '🌱',
    badge: '✏️ Custom / Unlisted Species',
    category: 'other',
    description: 'Planting a tree species not listed above? Select this option to specify your tree name, local name, and botanical details.',
    nativeRegions: 'Local Agroforestry / Native / Homestead Bari',
    rewardPoints: 20,
    isCustom: true
  }
];
