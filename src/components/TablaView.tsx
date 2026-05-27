import React, { useState } from 'react';
import { PredictionsMap, ResultsMap, UserDoc } from '../db';
import { calcPoints } from './MatchCard';
import { FIXTURE, FLAGS, KNOCKOUT, MatchData, formatDate, groupByDate } from '../constants';
import { Trophy, Search, BarChart3, GitCompare, X } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface Props {
  currentUserId: string;
  users: Record<string, UserDoc>;
  allPredictions: Record<string, PredictionsMap>;
  results: ResultsMap;
}

function formatPrediction(pred?: { l: number | ''; v: number | '' }) {
  if (!pred || pred.l === '' || pred.v === '') return '-';
  return `${pred.l} - ${pred.v}`;
}

function resolveCode(code: string, predictions: PredictionsMap): string {
  if (!code) return code;

  const winner = code.match(/^W(\d+)$/);
  if (winner) {
    const match = KNOCKOUT.find((m) => m.id === Number(winner[1]));
    const pred = predictions[Number(winner[1])];
    if (!match || !pred || pred.l === '' || pred.v === '') return code;
    const local = resolveCode(match.local, predictions);
    const visitante = resolveCode(match.visitante, predictions);
    return Number(pred.l) >= Number(pred.v) ? local : visitante;
  }

  const loser = code.match(/^L(\d+)$/);
  if (loser) {
    const match = KNOCKOUT.find((m) => m.id === Number(loser[1]));
    const pred = predictions[Number(loser[1])];
    if (!match || !pred || pred.l === '' || pred.v === '') return code;
    const local = resolveCode(match.local, predictions);
    const visitante = resolveCode(match.visitante, predictions);
    return Number(pred.l) < Number(pred.v) ? local : visitante;
  }

  return code;
}

function resolveMatchForUser(match: MatchData, predictions: PredictionsMap): MatchData {
  if (match.id < 73) return match;
  return {
    ...match,
    local: resolveCode(match.local, predictions),
    visitante: resolveCode(match.visitante, predictions),
  };
}

function PredictionCell({
  label,
  match,
  predictions,
  result,
}: {
  label: string;
  match: MatchData;
  predictions: PredictionsMap;
  result?: { l: number | ''; v: number | '' };
}) {
  const prediction = predictions[match.id];
  const points = calcPoints(prediction, result, match.id >= 73);
  const resolved = resolveMatchForUser(match, predictions);

  return (
    <div className="min-w-0 rounded-lg bg-slate-50 p-2 text-left">
      <div className="truncate text-[11px] font-black uppercase tracking-wide text-slate-400">{label}</div>
      <div className="mt-1 grid grid-cols-[1fr_auto_1fr] items-center gap-2 text-xs font-bold text-slate-700">
        <span className="truncate">
          <span className="mr-1">{FLAGS[resolved.local] || ''}</span>
          {resolved.local}
        </span>
        <span className={`rounded-md px-2 py-1 text-sm font-black ${prediction ? 'bg-white text-fifa-blue-dark shadow-sm' : 'bg-slate-100 text-slate-400'}`}>
          {formatPrediction(prediction)}
        </span>
        <span className="truncate text-right">
          {resolved.visitante}
          <span className="ml-1">{FLAGS[resolved.visitante] || ''}</span>
        </span>
      </div>
      {result && result.l !== '' && result.v !== '' && (
        <div className="mt-1 text-right text-[11px] font-black text-fifa-blue">{points} pts</div>
      )}
    </div>
  );
}

export function TablaView({ currentUserId, users, allPredictions, results }: Props) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  
  const userIds = Object.keys(users);
  
  const hasResults = Object.keys(results).length > 0;
  const selectedUser = selectedUserId ? users[selectedUserId] : null;
  const currentUser = users[currentUserId];
  const selectedPredictions = selectedUserId ? allPredictions[selectedUserId] || {} : {};
  const currentPredictions = allPredictions[currentUserId] || {};
  const comparisonMatches = [...FIXTURE, ...KNOCKOUT].filter((match) => {
    const mine = currentPredictions[match.id];
    const theirs = selectedPredictions[match.id];
    return Boolean(mine || theirs || results[match.id]);
  });

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

    return { uid, name: user.displayName || 'Anon', photoURL: user.photoURL, pts, exact, acert };
  }).sort((a, b) => b.pts - a.pts || b.exact - a.exact)
    .map((row, index) => ({ ...row, rank: index + 1 }));

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
              {filteredData.length > 0 ? filteredData.map((r) => (
                <tr
                  key={r.uid}
                  onClick={() => setSelectedUserId(r.uid)}
                  className={`cursor-pointer border-b border-[#f1f5f9] last:border-0 transition-colors hover:bg-blue-50/60 ${selectedUserId === r.uid ? 'bg-blue-50' : ''}`}
                  title="Comparar pronosticos"
                >
                  <td className="py-2.5 px-2 text-center font-black text-fifa-blue">{r.rank}</td>
                  <td className="py-2.5 px-2 font-bold">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-fifa-blue text-white flex items-center justify-center font-black text-[11px] overflow-hidden shrink-0 shadow-sm border border-[#e5ecf5]">
                        {r.photoURL ? <img src={r.photoURL} alt="Avatar" className="w-full h-full object-cover" /> : r.name.slice(0, 2).toUpperCase()}
                      </div>
                      <span className="truncate max-w-[120px]">{r.name}</span>
                      {r.uid !== currentUserId && <GitCompare className="h-3.5 w-3.5 shrink-0 text-slate-300" />}
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

      {selectedUserId && selectedUser && (
        <div className="mt-4 overflow-hidden rounded-[18px] bg-card text-text-dark shadow-[0_4px_16px_rgba(0,0,0,0.25)]">
          <div className="flex items-center justify-between gap-3 border-b border-[#e5ecf5] bg-[#f6f9ff] p-4 text-left">
            <div className="min-w-0">
              <div className="flex items-center gap-2 font-extrabold text-fifa-blue">
                <GitCompare className="h-5 w-5" />
                Comparacion de prodes
              </div>
              <div className="mt-1 text-sm font-semibold text-slate-500">
                {currentUser?.displayName || 'Tu prode'} vs {selectedUser.displayName || 'Anon'}
              </div>
            </div>
            <button
              onClick={() => setSelectedUserId(null)}
              className="rounded-full bg-white p-2 text-slate-500 shadow-sm transition-colors hover:bg-slate-100 hover:text-slate-800"
              aria-label="Cerrar comparacion"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="grid grid-cols-[1fr_1fr] gap-2 border-b border-slate-100 bg-white px-3 py-2 text-xs font-black uppercase tracking-wide text-slate-400">
            <div className="truncate">{currentUser?.displayName || 'Tu prode'}</div>
            <div className="truncate text-right">{selectedUser.displayName || 'Anon'}</div>
          </div>

          {comparisonMatches.length > 0 ? (
            <div className="max-h-[70vh] overflow-y-auto p-3">
              {groupByDate(comparisonMatches).map(([fecha, matches]) => (
                <div key={fecha}>
                  <div className="mx-1 mb-2 mt-4 text-left text-xs font-black uppercase tracking-wide text-slate-400 first:mt-0">
                    {formatDate(fecha)}
                  </div>
                  <div className="space-y-2">
                    {matches.map((match) => (
                      <div key={match.id} className="rounded-xl border border-slate-100 bg-white p-2 shadow-sm">
                        <div className="mb-2 flex items-center justify-between gap-2 text-[11px] font-black text-slate-400">
                          <span>{match.id >= 73 ? match.fase || 'Eliminatoria' : `Grupo ${match.grupo}`}</span>
                          {results[match.id] && results[match.id].l !== '' && (
                            <span>Final {formatPrediction(results[match.id])}</span>
                          )}
                        </div>
                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                          <PredictionCell
                            label="Mi pronostico"
                            match={match}
                            predictions={currentPredictions}
                            result={results[match.id]}
                          />
                          <PredictionCell
                            label={selectedUser.displayName || 'Rival'}
                            match={match}
                            predictions={selectedPredictions}
                            result={results[match.id]}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-sm font-semibold text-slate-400">
              Todavia no hay pronosticos cargados para comparar.
            </div>
          )}
        </div>
      )}

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
