import React from 'react';
import { FIXTURE, KNOCKOUT, formatDate, groupByDate } from '../constants';
import { MatchCard } from './MatchCard';
import { PredictionsMap, ResultsMap, updatePrediction } from '../db';
import { Copy, Share2 } from 'lucide-react';

interface Props {
  user: any;
  myPredictions: PredictionsMap;
  setMyPredictions: React.Dispatch<React.SetStateAction<PredictionsMap>>;
  results: ResultsMap;
}

export function ProdeView({ user, myPredictions, setMyPredictions, results }: Props) {
  
  const handlePredChange = (id: number, t: 'l' | 'v', val: string) => {
    const numVal = val === '' ? '' : parseInt(val, 10);
    const newPreds = {
      ...myPredictions,
      [id]: {
        ...(myPredictions[id] || { l: '', v: '' }),
        [t]: numVal
      }
    };
    setMyPredictions(newPreds);
    if (user) {
      updatePrediction(user.uid, id, newPreds[id]);
    }
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

  const buildProdeText = () => {
    let txt = `🏆 ACHERO MUNDIAL 2026 - ${user?.displayName || 'Mi Prode'}\n\n`;
    [...FIXTURE, ...KNOCKOUT].forEach(m => {
      const pr = myPredictions[m.id];
      if (pr && pr.l !== '') {
        const loc = m.id >= 73 ? resolveCode(m.local) : m.local;
        const vis = m.id >= 73 ? resolveCode(m.visitante) : m.visitante;
        txt += `P${m.id} ${loc} ${pr.l}-${pr.v} ${vis}\n`;
      }
    });
    return txt;
  };

  const copyProde = async () => {
    await navigator.clipboard.writeText(buildProdeText());
    alert('¡Copiado!');
  };

  const shareWA = () => {
    const txt = encodeURIComponent(buildProdeText());
    window.open(`https://wa.me/?text=${txt}`, '_blank');
  };

  return (
    <>
      <div className="flex gap-2 my-4 px-1">
        <button 
          onClick={shareWA}
          className="flex-1 bg-fifa-blue text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:brightness-110 active:scale-95 transition-all shadow-md"
        >
          <Share2 className="w-4 h-4" /> WhatsApp
        </button>
        <button 
          onClick={copyProde}
          className="flex-1 bg-[#13294b] text-[#9ecbff] border border-white/10 py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-[#1a3661] active:scale-95 transition-all shadow-md"
        >
          <Copy className="w-4 h-4" /> Copiar
        </button>
      </div>

      {groupByDate(FIXTURE).map(([fecha, matches]) => (
        <div key={fecha}>
          <div className="font-extrabold text-[#9ecbff] uppercase text-base tracking-widest mt-6 mx-1 mb-2">
            {formatDate(fecha)}
          </div>
          {matches.map(m => (
            <MatchCard 
              key={m.id} 
              m={m} 
              pred={myPredictions[m.id]} 
              res={results[m.id]} 
              mode="edit" 
              onPredChange={handlePredChange} 
            />
          ))}
        </div>
      ))}

      {KNOCKOUT.length > 0 && (
        <>
          <div className="font-extrabold text-accent uppercase text-lg tracking-widest mt-10 mx-1 mb-2 text-center border-b border-white/10 pb-2">
            FASE ELIMINATORIA
          </div>
          {groupByDate(KNOCKOUT).map(([fecha, matches]) => (
            <div key={fecha}>
              <div className="font-extrabold text-[#9ecbff] uppercase text-base tracking-widest mt-6 mx-1 mb-2">
                {formatDate(fecha)}
              </div>
              {matches.map(m => {
                const resolvedM = { ...m, local: resolveCode(m.local), visitante: resolveCode(m.visitante) };
                return (
                  <MatchCard 
                    key={m.id} 
                    m={resolvedM} 
                    pred={myPredictions[m.id]} 
                    res={results[m.id]} 
                    mode="edit" 
                    onPredChange={handlePredChange}
                    isKO 
                  />
                );
              })}
            </div>
          ))}
        </>
      )}
    </>
  );
}
