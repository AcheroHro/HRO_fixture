import React, { useState, useMemo } from 'react';
import { MatchData, FLAGS } from '../constants';
import { Prediction } from '../db';
import { BarChart3, X } from 'lucide-react';

interface MatchCardProps {
  key?: React.Key;
  m: MatchData;
  mode?: 'view' | 'edit' | 'admin';
  pred?: Prediction;
  res?: Prediction;
  onPredChange?: (id: number, t: 'l' | 'v', val: string) => void;
  isKO?: boolean;
  showStatus?: boolean;
}

function generateStats(team1: string, team2: string) {
  const str = team1 < team2 ? team1 + team2 : team2 + team1;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const total = 10 + (Math.abs(hash) % 40);
  const t1Wins = Math.abs(hash * 31) % total;
  const draws = Math.abs(hash * 17) % (total - t1Wins);
  const t2Wins = total - t1Wins - draws;

  return team1 < team2 ? { t1Wins, draws, t2Wins, total } : { t1Wins: t2Wins, draws, t2Wins: t1Wins, total };
}

function StatsModal({ m, onClose }: { m: MatchData, onClose: () => void }) {
  const stats = useMemo(() => generateStats(m.local, m.visitante), [m.local, m.visitante]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-[fadeIn_0.2s_ease]" onClick={onClose}>
       <div className="bg-white rounded-2xl p-5 w-full max-w-sm shadow-xl relative animate-[slideUp_0.3s_ease]" onClick={e => e.stopPropagation()}>
          <button onClick={onClose} className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-full p-1 transition-colors">
            <X className="w-5 h-5" />
          </button>
          
          <div className="text-center mb-6 pt-2">
            <h3 className="font-extrabold text-xl text-slate-800">Historial</h3>
            <p className="text-sm text-slate-500 mt-1">Estimación histórica (simulada)</p>
          </div>
          
          <div className="flex justify-between items-center mb-6 px-2">
             <div className="text-center w-1/3">
               <div className="text-4xl mb-2">{FLAGS[m.local] || '⚽'}</div>
               <div className="font-bold text-sm leading-tight text-slate-800 h-10">{m.local}</div>
               <div className="text-3xl font-black text-blue-600">{stats.t1Wins}</div>
             </div>
             
             <div className="text-center w-1/3 px-2">
               <div className="text-xs font-bold text-slate-400 mb-1">EMPATES</div>
               <div className="text-xl font-black text-slate-500">{stats.draws}</div>
             </div>

             <div className="text-center w-1/3">
               <div className="text-4xl mb-2">{FLAGS[m.visitante] || '⚽'}</div>
               <div className="font-bold text-sm leading-tight text-slate-800 h-10">{m.visitante}</div>
               <div className="text-3xl font-black text-red-500">{stats.t2Wins}</div>
             </div>
          </div>
          
          <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden flex shadow-inner">
            <div className="bg-blue-600 h-full" style={{ width: `${(stats.t1Wins / stats.total) * 100}%` }}></div>
            <div className="bg-slate-300 h-full" style={{ width: `${(stats.draws / stats.total) * 100}%` }}></div>
            <div className="bg-red-500 h-full" style={{ width: `${(stats.t2Wins / stats.total) * 100}%` }}></div>
          </div>
          
          <div className="mt-4 text-center text-xs text-slate-400 font-medium">
            Basado en {stats.total} partidos jugados
          </div>
       </div>
    </div>
  );
}

export function calcPoints(p?: Prediction, r?: Prediction, knockout = false) {
  if (!p || p.l === '' || p.v === '' || !r || r.l === '' || r.v === '') return 0;
  if (+p.l === +r.l && +p.v === +r.v) return 3;
  const pd = Math.sign(+p.l - +p.v);
  const rd = Math.sign(+r.l - +r.v);
  return pd === rd ? (knockout ? 2 : 1) : 0;
}

export function getMatchStatus(m: MatchData, res?: Prediction): { label: string, colorClass: string } {
  if (res && res.l !== '' && res.v !== '') return { label: 'Finalizado', colorClass: 'bg-slate-600 text-white' };
  
  const timeRegex = /(\d+)(?:\.(\d+))?\s*(am|pm)/i;
  const match = m.hora.match(timeRegex);
  let hours = 0;
  let minutes = 0;
  if (match) {
    hours = parseInt(match[1], 10);
    minutes = match[2] ? parseInt(match[2], 10) : 0;
    const ampm = match[3].toLowerCase();
    if (ampm === 'pm' && hours < 12) hours += 12;
    if (ampm === 'am' && hours === 12) hours = 0;
  }
  
  const matchDate = new Date(`${m.fecha}T${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00`);
  const now = new Date();
  
  if (now > matchDate) {
     if (now.getTime() - matchDate.getTime() < 110 * 60 * 1000) {
        return { label: 'En curso', colorClass: 'bg-green-500 text-white animate-pulse' };
     }
     // Can be pending if no result has been uploaded yet but match is technically over
     return { label: 'Pendiente', colorClass: 'bg-yellow-500 text-white' };
  }
  return { label: 'Pendiente', colorClass: 'bg-slate-200 text-slate-600' };
}

export function MatchCard({ m, mode = 'view', pred, res, onPredChange, isKO, showStatus = false }: MatchCardProps) {
  const [showStats, setShowStats] = useState(false);
  const flagL = FLAGS[m.local] || '⚽';
  const flagV = FLAGS[m.visitante] || '⚽';
  const hasPred = pred && pred.l !== '' && pred.v !== '';
  const status = showStatus ? getMatchStatus(m, res) : null;
  
  const handleInput = (t: 'l'|'v', e: React.ChangeEvent<HTMLInputElement>) => {
    if (onPredChange) {
      let val = e.target.value;
      if (val !== '') {
        const num = parseInt(val, 10);
        val = isNaN(num) ? '' : Math.max(0, Math.min(20, num)).toString();
      }
      onPredChange(m.id, t, val);
    }
  };

  return (
    <>
      <div className="bg-card text-text-dark rounded-[18px] p-3.5 mb-3 shadow-[0_4px_16px_rgba(0,0,0,0.25)] animate-[fadeIn_0.3s_ease]">
        <div className="flex justify-between items-center mb-3 text-xs text-muted">
          <div className="flex gap-2 items-center">
            <span className="bg-[#eef4ff] text-fifa-blue px-2.5 py-1 rounded-full font-black tracking-wide text-[11px]">
              {isKO ? 'ELIMINATORIA' : `GRUPO ${m.grupo}`}
            </span>
            {status && (
              <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] tracking-wide ${status.colorClass}`}>
                {status.label}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setShowStats(true)} 
              className="p-1.5 text-slate-400 hover:text-fifa-blue hover:bg-slate-100 rounded-full transition-colors focus:outline-none"
              title="Ver historial"
            >
              <BarChart3 className="w-4 h-4" />
            </button>
            <span className="whitespace-nowrap overflow-hidden text-ellipsis max-w-[120px] text-right font-medium">
              {m.hora} · {(m.estadio || '').split(',')[0]}
            </span>
          </div>
        </div>
        
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2.5">
        <div className="flex items-center gap-2 font-bold text-[15px] min-w-0">
          <span className="text-2xl leading-none">{flagL}</span>
          <span className="whitespace-nowrap overflow-hidden text-ellipsis">{m.local}</span>
        </div>
        
        <div className="flex items-center gap-2 font-black text-lg">
          {mode === 'edit' || mode === 'admin' ? (
            <>
              <input 
                className="w-12 h-10 border-2 border-[#dbe4f0] rounded-xl text-center text-xl font-extrabold bg-[#f8fafc] text-text-dark focus:outline-none focus:border-fifa-blue focus:bg-white"
                type="number" 
                min="0" 
                max="20" 
                value={pred?.l ?? ''} 
                onChange={(e) => handleInput('l', e)}
                style={{ WebkitAppearance: 'none', MozAppearance: 'textfield' }}
              />
              <span className="text-[#a3b2c9] font-black">-</span>
              <input 
                className="w-12 h-10 border-2 border-[#dbe4f0] rounded-xl text-center text-xl font-extrabold bg-[#f8fafc] text-text-dark focus:outline-none focus:border-fifa-blue focus:bg-white"
                type="number" 
                min="0" 
                max="20" 
                value={pred?.v ?? ''} 
                onChange={(e) => handleInput('v', e)}
                style={{ WebkitAppearance: 'none', MozAppearance: 'textfield' }}
              />
            </>
          ) : (
            <span>{res && res.l !== '' ? `${res.l} - ${res.v}` : 'vs'}</span>
          )}
        </div>
        
        <div className="flex items-center gap-2 font-bold text-[15px] min-w-0 justify-end text-right">
          <span className="whitespace-nowrap overflow-hidden text-ellipsis">{m.visitante}</span>
          <span className="text-2xl leading-none">{flagV}</span>
        </div>
      </div>

      {(mode === 'view' || mode === 'edit') && res && res.l !== '' && (
        <div className="mt-2.5 flex justify-center">
          <span className="bg-fifa-blue text-white px-2.5 py-1 rounded-lg text-xs font-bold shadow-sm">
            Final: {m.local} {res.l} - {res.v} {m.visitante}
          </span>
        </div>
      )}

      {mode === 'edit' && hasPred && res && res.l !== '' && (
        <div className="text-center mt-2 text-xs font-bold text-[#1e40af]">
          {calcPoints(pred, res, isKO)} pts
        </div>
      )}
    </div>
    {showStats && <StatsModal m={m} onClose={() => setShowStats(false)} />}
    </>
  );
}
