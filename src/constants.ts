export const FLAGS: Record<string, string> = {
  "México":"🇲🇽","Sudáfrica":"🇿🇦","Corea del Sur":"🇰🇷","República Checa":"🇨🇿",
  "Canadá":"🇨🇦","Bosnia y Herzegovina":"🇧🇦","Qatar":"🇶🇦","Suiza":"🇨🇭",
  "Brasil":"🇧🇷","Marruecos":"🇲🇦","Haití":"🇭🇹","Escocia":"🏴󠁧󠁢󠁳󠁣󠁴󠁿",
  "Estados Unidos":"🇺🇸","Paraguay":"🇵🇾","Australia":"🇦🇺","Turquía":"🇹🇷",
  "Alemania":"🇩🇪","Curazao":"🇨🇼","Costa de Marfil":"🇨🇮","Ecuador":"🇪🇨",
  "Países Bajos":"🇳🇱","Japón":"🇯🇵","Suecia":"🇸🇪","Túnez":"🇹🇳",
  "Bélgica":"🇧🇪","Egipto":"🇪🇬","Irán":"🇮🇷","Nueva Zelanda":"🇳🇿",
  "España":"🇪🇸","Cabo Verde":"🇨🇻","Arabia Saudita":"🇸🇦","Uruguay":"🇺🇾",
  "Francia":"🇫🇷","Senegal":"🇸🇳","Irak":"🇮🇶","Noruega":"🇳🇴",
  "Argentina":"🇦🇷","Argelia":"🇩🇿","Austria":"🇦🇹","Jordania":"🇯🇴",
  "Portugal":"🇵🇹","RD Congo":"🇨🇩","Uzbekistán":"🇺🇿","Colombia":"🇨🇴",
  "Inglaterra":"🏴󠁧󠁢󠁥󠁮󠁧󠁿","Croacia":"🇭🇷","Ghana":"🇬🇭","Panamá":"🇵🇦",
  "UEFA A":"🇪🇺","UEFA B":"🇪🇺","UEFA C":"🇪🇺","UEFA D":"🇪🇺","FIFA 1":"🏆","FIFA 2":"🏆","IC Path 1":"🌎","IC Path 2":"🌎"
};

export interface MatchData {
  id: number;
  fecha: string;
  hora: string;
  local: string;
  visitante: string;
  grupo?: string;
  estadio: string;
  fase?: string;
  p?: string;
}

const dateFmt = new Intl.DateTimeFormat('es-AR', { weekday: 'long', day: 'numeric', month: 'long' });

export function formatDate(d: string) {
  if (!d) return '';
  const [y, m, day] = d.split('-');
  const dt = new Date(+y, +m - 1, +day);
  let s = dateFmt.format(dt);
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function formatDateSlash(d: string) {
  if (!d) return '';
  const [y, m, day] = d.split('-');
  return `${day}/${m}/${y}`;
}

export function groupByDate(arr: MatchData[]) {
  const map: Record<string, MatchData[]> = {};
  arr.forEach(m => {
    if (!map[m.fecha]) map[m.fecha] = [];
    map[m.fecha].push(m);
  });
  return Object.entries(map).sort((a, b) => a[0].localeCompare(b[0]));
}

import fixtureJson from './fixture.json';
import knockoutJson from './knockout.json';

export const FIXTURE: MatchData[] = fixtureJson as MatchData[];
export const KNOCKOUT: MatchData[] = knockoutJson as MatchData[];
