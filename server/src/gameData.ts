import { Artifact, ArtifactBundle } from './types';
import { v4 as uuidv4 } from 'uuid';

const ARTIFACT_POOL: Omit<Artifact, 'id'>[] = [
  // Ancient Study theme
  { name: '宋代青瓷花瓶', theme: 'ancient_study', rarity: 'rare', trueValue: 1200, valueMin: 900, valueMax: 1500, imageUrl: '/artifacts/celadon_vase.png', silhouetteUrl: '/artifacts/silhouette_vase.png' },
  { name: '明代紫砂茶壶', theme: 'ancient_study', rarity: 'fine', trueValue: 600, valueMin: 400, valueMax: 800, imageUrl: '/artifacts/zisha_teapot.png', silhouetteUrl: '/artifacts/silhouette_teapot.png' },
  { name: '清代象牙印章', theme: 'ancient_study', rarity: 'legendary', trueValue: 2500, valueMin: 1800, valueMax: 3200, imageUrl: '/artifacts/ivory_seal.png', silhouetteUrl: '/artifacts/silhouette_seal.png' },
  { name: '汉代铜镜', theme: 'ancient_study', rarity: 'rare', trueValue: 980, valueMin: 700, valueMax: 1300, imageUrl: '/artifacts/bronze_mirror.png', silhouetteUrl: '/artifacts/silhouette_mirror.png' },
  { name: '唐代三彩马', theme: 'ancient_study', rarity: 'legendary', trueValue: 3200, valueMin: 2500, valueMax: 4000, imageUrl: '/artifacts/tang_horse.png', silhouetteUrl: '/artifacts/silhouette_horse.png' },
  // Pirate Treasure theme
  { name: '西班牙金币', theme: 'pirate_treasure', rarity: 'common', trueValue: 300, valueMin: 200, valueMax: 450, imageUrl: '/artifacts/gold_coin.png', silhouetteUrl: '/artifacts/silhouette_coin.png' },
  { name: '海盗望远镜', theme: 'pirate_treasure', rarity: 'fine', trueValue: 550, valueMin: 350, valueMax: 750, imageUrl: '/artifacts/telescope.png', silhouetteUrl: '/artifacts/silhouette_telescope.png' },
  { name: '宝藏地图', theme: 'pirate_treasure', rarity: 'rare', trueValue: 1100, valueMin: 800, valueMax: 1400, imageUrl: '/artifacts/treasure_map.png', silhouetteUrl: '/artifacts/silhouette_map.png' },
  { name: '船长指南针', theme: 'pirate_treasure', rarity: 'fine', trueValue: 480, valueMin: 300, valueMax: 650, imageUrl: '/artifacts/compass.png', silhouetteUrl: '/artifacts/silhouette_compass.png' },
  { name: '黑珍珠项链', theme: 'pirate_treasure', rarity: 'legendary', trueValue: 2800, valueMin: 2000, valueMax: 3600, imageUrl: '/artifacts/black_pearl.png', silhouetteUrl: '/artifacts/silhouette_pearl.png' },
  // Royal Palace theme
  { name: '皇家权杖', theme: 'royal_palace', rarity: 'legendary', trueValue: 3500, valueMin: 2800, valueMax: 4500, imageUrl: '/artifacts/royal_scepter.png', silhouetteUrl: '/artifacts/silhouette_scepter.png' },
  { name: '贵族徽章', theme: 'royal_palace', rarity: 'rare', trueValue: 900, valueMin: 650, valueMax: 1200, imageUrl: '/artifacts/noble_badge.png', silhouetteUrl: '/artifacts/silhouette_badge.png' },
  { name: '宫廷油画', theme: 'royal_palace', rarity: 'rare', trueValue: 1050, valueMin: 750, valueMax: 1350, imageUrl: '/artifacts/court_painting.png', silhouetteUrl: '/artifacts/silhouette_painting.png' },
  { name: '水晶烛台', theme: 'royal_palace', rarity: 'fine', trueValue: 520, valueMin: 350, valueMax: 700, imageUrl: '/artifacts/crystal_candle.png', silhouetteUrl: '/artifacts/silhouette_candle.png' },
  { name: '镶钻王冠', theme: 'royal_palace', rarity: 'legendary', trueValue: 4200, valueMin: 3200, valueMax: 5500, imageUrl: '/artifacts/diamond_crown.png', silhouetteUrl: '/artifacts/silhouette_crown.png' },
  // Mystic Forest theme
  { name: '精灵水晶球', theme: 'mystic_forest', rarity: 'rare', trueValue: 1150, valueMin: 850, valueMax: 1500, imageUrl: '/artifacts/crystal_ball.png', silhouetteUrl: '/artifacts/silhouette_ball.png' },
  { name: '古树精华', theme: 'mystic_forest', rarity: 'common', trueValue: 280, valueMin: 180, valueMax: 400, imageUrl: '/artifacts/tree_essence.png', silhouetteUrl: '/artifacts/silhouette_essence.png' },
  { name: '月光宝石', theme: 'mystic_forest', rarity: 'legendary', trueValue: 2900, valueMin: 2200, valueMax: 3800, imageUrl: '/artifacts/moonstone.png', silhouetteUrl: '/artifacts/silhouette_moonstone.png' },
  { name: '精灵弓箭', theme: 'mystic_forest', rarity: 'fine', trueValue: 620, valueMin: 420, valueMax: 820, imageUrl: '/artifacts/elf_bow.png', silhouetteUrl: '/artifacts/silhouette_bow.png' },
  { name: '魔法卷轴', theme: 'mystic_forest', rarity: 'rare', trueValue: 1050, valueMin: 750, valueMax: 1350, imageUrl: '/artifacts/magic_scroll.png', silhouetteUrl: '/artifacts/silhouette_scroll.png' },
];

export function generateBundles(count: number): ArtifactBundle[] {
  const themes = ['ancient_study', 'pirate_treasure', 'royal_palace', 'mystic_forest'];
  const bundles: ArtifactBundle[] = [];

  for (let i = 0; i < count; i++) {
    const theme = themes[i % themes.length];
    const themeArtifacts = ARTIFACT_POOL.filter(a => a.theme === theme);
    
    // Pick 3-4 artifacts from the theme
    const count3or4 = Math.random() > 0.5 ? 4 : 3;
    const shuffled = [...themeArtifacts].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, count3or4);
    
    const artifacts: Artifact[] = selected.map(a => ({
      ...a,
      id: uuidv4(),
      // Add some randomness to values
      trueValue: Math.round(a.trueValue * (0.85 + Math.random() * 0.3)),
    }));

    const totalValue = artifacts.reduce((sum, a) => sum + a.trueValue, 0);
    const startingPrice = Math.round(totalValue * 0.3);

    bundles.push({
      id: uuidv4(),
      theme,
      artifacts,
      startingPrice,
      setBonus: [
        { count: 3, multiplier: 1.2 },
        { count: 5, multiplier: 1.5 },
      ],
    });
  }

  return bundles;
}

export const THEME_NAMES: Record<string, string> = {
  ancient_study: '古典书房',
  pirate_treasure: '海盗宝藏',
  royal_palace: '皇家宫廷',
  mystic_forest: '神秘森林',
};

export const RARITY_NAMES: Record<string, string> = {
  common: '普通',
  fine: '精良',
  rare: '稀有',
  legendary: '传说',
};
