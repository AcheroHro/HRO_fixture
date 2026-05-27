import React, { useState } from 'react';
import { PredictionsMap, ResultsMap, UserDoc } from '../db';
import { calcPoints } from './MatchCard';
import { Trophy, Search, BarChart3 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface Props {
  users: Record<string, UserDoc>;
  allPredictions: Record<string, PredictionsMap>;
  results: ResultsMap;
}

export function TablaView({ users, allPredictions, results }: Props) {
  const [searchTerm, setSearchTerm] = useState('');
  
  const userIds = Object.keys(users);
  
  const hasResults = Object.keys(results).length > 0;

  const rowData = userIds.map(uid => {
    const user = users[uid];
    const preds = allPredictions[uid] || {};
    let pts = 0, exact = 0, acert = 0;

    Object.entries(results).forEach(([midStr, r]) => {
      const mid = Number(midStr);
      const p = preds[mid];
      if (!p || p.l === '' || p.v === '') return;
      const isKO = mid >= 73;
      const pt = calcPoints(p, r, isKO);
      pts += pt;
      if (pt === 3) exact++;
      if (pt > 0) acert++;
    });

    return { name: user.displayName || 'Anon', photoURL: user.photoURL, pts, exact, acert };
  }).sort((a, b) => b.pts - a.pts || b.exact - a.exact);

  const filteredData = rowData.filter(r => 
    r.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <div className="bg-card text-text-dark rounded-[18px] overflow-hidden shadow-[0_4px_16px_rgba(0,0,0,0.25)] mt-4">
        <div className="p-4 bg-[#f6f9ff] border-b border-[#e5ecf5] font-extrabold text-fifa-blue flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-500" /> Ranking Mundial 2026
          </div>
          
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="Buscar amigo..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-3 py-1.5 text-sm font-medium border border-slate-200 rounded-full focus:outline-none focus:border-fifa-blue focus:ring-1 focus:ring-fifa-blue w-[180px] sm:w-[220px]"
            />
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="bg-[#fbfdff] border-b border-[#eef2f7] text-muted">
                <th className="py-3 px-2 font-bold w-10 text-center">#</th>
                <th className="py-3 px-2 font-bold min-w-[140px]">Jugador</th>
                <th className="py-3 px-2 font-bold w-20 text-center">Exactos</th>
                <th className="py-3 px-2 font-bold w-20 text-center">Aciertos</th>
                <th className="py-3 px-2 font-bold w-16 text-center">Pts</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.length > 0 ? filteredData.map((r, i) => (
                <tr key={i} className="border-b border-[#f1f5f9] last:border-0 hover:bg-slate-50 transition-colors">
                  <td className="py-2.5 px-2 text-center font-black text-fifa-blue">{i + 1}</td>
                  <td className="py-2.5 px-2 font-bold">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-fifa-blue text-white flex items-center justify-center font-black text-[11px] overflow-hidden shrink-0 shadow-sm border border-[#e5ecf5]">
                        {r.photoURL ? <img src={r.photoURL} alt="Avatar" className="w-full h-full object-cover" /> : r.name.slice(0, 2).toUpperCase()}
                      </div>
                      <span className="truncate max-w-[120px]">{r.name}</span>
                    </div>
                  </td>
                  <td className="py-2.5 px-2 text-center font-semibold text-muted">{r.exact}</td>
                  <td className="py-2.5 px-2 text-center font-semibold text-muted">{r.acert}</td>
                  <td className="py-2.5 px-2 text-center font-black text-fifa-blue-dark text-base">{r.pts}</td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={5} className="text-center py-10 text-[#8aa0bf] font-medium">
                    {searchTerm ? "No se encontraron amigos con ese nombre" : "Agregá amigos y cargá tu prode"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {rowData.length > 0 && (
        <div className="bg-card text-text-dark rounded-[18px] overflow-hidden shadow-[0_4px_16px_rgba(0,0,0,0.25)] mt-4 p-5">
          <div className="font-extrabold text-fifa-blue flex items-center gap-2 mb-4">
            <BarChart3 className="w-5 h-5 text-fifa-blue" />
            Top 5 - Puntajes
          </div>
          <div className="h-52 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={rowData.slice(0, 5)} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip 
                  cursor={{ fill: '#f1f5f9' }}
                  contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  itemStyle={{ color: '#1e40af', fontWeight: 'bold' }}
                />
                <Bar dataKey="pts" radius={[6, 6, 0, 0]} barSize={40}>
                  {rowData.slice(0, 5).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === 0 ? '#1e40af' : '#3b82f6'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      <p className="text-center text-xs text-[#7a8dad] mt-4 max-w-sm mx-auto">
        Grupos: 3 pts exacto • 1 pt ganador/empate <br/> 
        Eliminatorias: 3 pts exacto • 2 pts ganador
      </p>

      {!hasResults && (
        <div className="text-center py-10 px-5 text-[#8aa0bf] font-medium mt-4 bg-white/5 rounded-xl border border-dashed border-white/10">
          Sin resultados cargados todavía.<br/>
          Usá el botón "Cargar Resultados" (si eres Admin) para actualizarlos.
        </div>
      )}
    </>
  );
}
