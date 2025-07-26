import axios from 'axios';

// URLs externas
const runesURL =
   'https://ddragon.leagueoflegends.com/cdn/15.8.1/data/en_US/runesReforged.json';
const spellsURL =
   'https://ddragon.leagueoflegends.com/cdn/15.8.1/data/en_US/summoner.json';
const itemDataURL =
   'https://ddragon.leagueoflegends.com/cdn/15.8.1/data/en_US/item.json';
const augmentsURL =
   'https://raw.communitydragon.org/latest/cdragon/arena/en_us.json';

// Caches
let runesData: any[] = [];
let spellsData: Record<string, any> = {};
let itemsData: Record<string, any> = {};
let augmentsData: any[] = [];

export async function loadExternalData() {
   try {
      const [runes, spells, items, augments] = await Promise.all([
         axios.get<any[]>(runesURL),
         axios.get<{ data: Record<string, any> }>(spellsURL),
         axios.get<{ data: Record<string, any> }>(itemDataURL),
         axios.get<{ augments: any[] }>(augmentsURL),
      ]);

      runesData = runes.data;
      spellsData = spells.data.data;
      itemsData = items.data.data;
      augmentsData = augments.data.augments;

      console.log('Dados externos carregados com sucesso.');
   } catch (err) {
      console.error('Erro ao carregar dados externos:', err);
   }
}

// definir a role do jogador para definir os status que serão mostrados na Carta (devido teamPosition, role, individualPosition conflitarem as vezes)
export function defineRole(
   gameMode: string,
   teamPosition: string,
   role: string,
): string {
   if (gameMode === 'CLASSIC') {
      switch (teamPosition) {
         case 'TOP':
            return 'top';
         case 'MIDDLE':
            return 'mid';
         case 'JUNGLE':
            return 'jungle';
         case 'BOTTOM':
            return 'adc';
         case 'UTILITY':
            return role === 'SUPPORT' || role === 'SOLO' ? 'sup' : 'sup';
         default:
            return role === 'SUPPORT' ? 'sup' : 'sup';
      }
   }
   return 'adc'; // fallback
}

// borda da frente da carta
export function defineCorDaBordaFrontal(
   k: number,
   d: number,
   a: number,
): string {
   const kda = (k + a) / Math.max(d, 1);
   if (kda < 2.0) return '#633B1B';
   if (kda < 4.0) return '#929292';
   return '#6A0DAD';
}

// toda a parte de trás da carta
export function defineCorVerso(k: number, d: number, a: number): string {
   const kda = (k + a) / Math.max(d, 1);
   if (kda < 2.0)
      return 'linear-gradient(45deg, #633B1B, #965F32, #BB8947, #A0652E)';
   if (kda < 4.0)
      return 'linear-gradient(45deg, #929292, #D1D1D1, #EBEBEB, #B1B1B1)';
   return 'linear-gradient(45deg, #1A002B, #3D0066, #6A0DAD, #39114D)';
}

// shards icons - as 3 runas inferiores: atk, def e utilidade
export function getShardIcon(id: number): string | null {
   const mapping: Record<number, string> = {
      5001: 'statmodshealthplus',
      5005: 'statmodsattackspeed',
      5007: 'statmodscdrscaling',
      5008: 'statmodsadaptiveforce',
      5010: 'statmodsmovementspeed',
      5011: 'statmodshealthscaling',
      5013: 'statmodstenacity',
   };
   const file = mapping[id];
   return file
      ? `https://raw.communitydragon.org/latest/game/assets/perks/statmods/${file}icon.png`
      : null;
}

// runas
export function getRuneIconUrl(runeId: number): string | null {
   for (const style of runesData) {
      for (const slot of style.slots) {
         const rune = slot.runes.find((r: any) => r.id === runeId);
         if (rune) {
            return `https://ddragon.leagueoflegends.com/cdn/img/${rune.icon}`;
         }
      }
   }
   return null;
}

// spells
export function getSummonerSpellIcon(spellId: number): string | null {
   for (const key in spellsData) {
      if (spellsData[key].key === spellId.toString()) {
         return `https://ddragon.leagueoflegends.com/cdn/15.8.1/img/spell/${spellsData[key].id}.png`;
      }
   }
   return null;
}

// itens
export function getItemIcon(itemId: number): string | null {
   if (!itemId || itemId === 0) return null;
   return itemsData[itemId]
      ? `https://ddragon.leagueoflegends.com/cdn/15.8.1/img/item/${itemId}.png`
      : null;
}

// augments icons (arena)
export function getAugmentIconUrl(augmentId: number): string | null {
   const augment = augmentsData.find(
      (a) => Number(a.id) === augmentId && a.iconSmall,
   );
   return augment
      ? `https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/${augment.iconSmall}`
      : null;
}
