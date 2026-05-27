import React, { useState } from 'react';
import { KNOCKOUT, formatDateSlash, MatchData } from '../constants';
import { PredictionsMap } from '../db';

interface Props {
  myPredictions: PredictionsMap;
}

export function LlaveView({ myPredictions }: Props) {
  const [round, setRound] = useState('R32');

  const navs = [
    { id: 'R32', label: '16vos' },
    { id: 'R16', label: 'Octavos' },
    { id: 'QF', label: 'Cuartos' },
    { id: 'SF', label: 'Semis' },
    { id: 'F', label: 'Final' },
  ];

  if (!KNOCKOUT.length) {
    return <div className="text-center p-10 text-[#8aa0bf]">Cargando...</div>;
  }

  type CfgKey = 'R32' | 'R16' | 'QF' | 'SF' | 'F';
  const cfg: Record<CfgKey, { curr: [number, number], next: [number, number] | null }> = {
    R32: { curr: [73, 88], next: [89, 96] },
    R16: { curr: [89, 96], next: [97, 100] },
    QF: { curr: [97, 100], next: [101, 102] },
    SF: { curr: [101, 102], next: [103, 104] },
    F: { curr: [103, 104], next: null },
  };

  const currCfg = cfg[round as CfgKey];
  const curr = KNOCKOUT.filter(m => m.id >= currCfg.curr[0] && m.id <= currCfg.curr[1]);
  const nextFilter = currCfg.next ? KNOCKOUT.filter(m => m.id >= currCfg.next[0] && m.id <= currCfg.next[1]) : [];

  const getSrc = (code: string) => {
    const numMatch = code.match(/\d+/);
    if (!numMatch) return undefined;
    const num = parseInt(numMatch[0], 10);
    return KNOCKOUT.find(k => k.id === num);
  };

  const resolveCode = (code: string) => {
    if (!code) return code;
    
    // Resolve Winner
    const w = code.match(/^W(\d+)$/);
    if (w) {
      const mid = +w[1];
      const km = KNOCKOUT.find(x => x.id === mid);
      if (!km) return code;
      const pred = myPredictions[mid];
      if (!pred || pred.l === '' || pred.v === '') return code;
      const lcode = resolveCode(km.local);
      const vcode = resolveCode(km.visitante);
      return Number(pred.l) > Number(pred.v) ? lcode : Number(pred.v) > Number(pred.l) ? vcode : lcode;
    }
    
    // Resolve Loser
    const lMatch = code.match(/^L(\d+)$/);
    if (lMatch) {
      const mid = +lMatch[1];
      const km = KNOCKOUT.find(x => x.id === mid);
      if (!km) return code;
      const pred = myPredictions[mid];
      if (!pred || pred.l === '' || pred.v === '') return code;
      const lcode = resolveCode(km.local);
      const vcode = resolveCode(km.visitante);
      return Number(pred.l) < Number(pred.v) ? lcode : Number(pred.v) < Number(pred.l) ? vcode : vcode;
    }
    
    return code;
  };

  const BracketMatch = ({ m }: { m: MatchData }) => (
    <div className="min-w-[210px] sm:min-w-[240px] flex-1">
      <div className="text-xs text-[#6b7a99] mb-1.5 flex justify-between items-center gap-2">
        <span className="font-black text-[#1a1f36] bg-[#e6ecf5] px-2 py-0.5 rounded-md text-[11px] tracking-wider shadow-sm">
          P{m.id}
        </span>
        <span className="font-semibold">{formatDateSlash(m.fecha)} - {m.hora}</span>
      </div>
      <div className="bg-white border border-[#d1d9e6] rounded-t-xl p-3 font-bold text-[#1a1f36] shadow-sm text-[15px] truncate border-b-0">
        {resolveCode(m.local)}
      </div>
      <div className="bg-white border border-[#d1d9e6] rounded-b-xl p-3 font-bold text-[#1a1f36] shadow-sm text-[15px] truncate">
        {resolveCode(m.visitante)}
      </div>
    </div>
  );

  const BracketPair = ({ m1, m2, nextMatch }: { key?: React.Key, m1: MatchData, m2: MatchData, nextMatch: MatchData }) => (
    <div className="flex items-center gap-4 sm:gap-6 mb-10 min-w-[500px]">
      <div className="flex flex-col gap-6 flex-1">
        <BracketMatch m={m1} />
        <BracketMatch m={m2} />
      </div>
      
      {/* Visual Connection line */}
      <div className="relative w-8 sm:w-12 h-[150px] shrink-0">
        <div className="absolute left-0 top-[34px] w-4 sm:w-6 h-[2px] bg-[#c1cbd9]" />
        <div className="absolute left-0 bottom-[34px] w-4 sm:w-6 h-[2px] bg-[#c1cbd9]" />
        <div className="absolute left-4 sm:left-6 top-[34px] w-[2px] h-[82px] bg-[#c1cbd9]">
          <div className="absolute left-0 top-[40px] w-4 sm:w-6 h-[2px] bg-[#c1cbd9]" />
        </div>
      </div>
      
      <div className="flex items-center flex-1">
        <BracketMatch m={nextMatch} />
      </div>
    </div>
  );

  return (
    <div className="bg-[#f5f7fa] text-[#1a1f36] rounded-[18px] overflow-hidden shadow-[0_4px_16px_rgba(0,0,0,0.25)] mt-4">
      <div className="flex bg-white border-b border-[#e5e9f2] overflow-x-auto shadow-sm relative z-10">
        {navs.map(n => (
          <button
            key={n.id}
            onClick={() => setRound(n.id)}
            className={`flex-none py-3.5 px-4 sm:px-5 font-extrabold text-[13px] sm:text-sm whitespace-nowrap border-b-4 transition-colors ${
              round === n.id ? 'text-fifa-blue border-fifa-blue bg-[#f0f7ff]' : 'text-[#5a6a85] border-transparent hover:bg-slate-50'
            }`}
          >
            {n.label}
          </button>
        ))}
      </div>
      
      <div className="p-4 sm:p-6 bg-[#f5f7fa] min-h-[320px] overflow-x-auto">
        {!currCfg.next ? (
          <div className="flex gap-6 flex-wrap justify-center max-w-lg mx-auto">
            {curr.map(m => (
              <div key={m.id} className="w-full sm:w-[260px]">
                <BracketMatch m={m} />
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-6 items-start pb-4">
            {nextFilter.map(nxt => {
              const s1 = getSrc(nxt.local);
              const s2 = getSrc(nxt.visitante);
              if (s1 && s2) {
                return <BracketPair key={nxt.id} m1={s1} m2={s2} nextMatch={nxt} />;
              }
              return null;
            })}
          </div>
        )}
      </div>
    </div>
  );
}
