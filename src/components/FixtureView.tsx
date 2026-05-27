import React, { useMemo, useState } from 'react';
import { FIXTURE, KNOCKOUT, formatDate, groupByDate, MatchData } from '../constants';
import { MatchCard } from './MatchCard';
import { ResultsMap } from '../db';
import { Filter } from 'lucide-react';

export function FixtureView({ results }: { results: ResultsMap }) {
  const [selectedGroup, setSelectedGroup] = useState<string>('Todos');

  const groups = useMemo(() => {
    const gSet = new Set<string>();
    FIXTURE.forEach(m => {
      if (m.grupo) gSet.add(m.grupo);
    });
    return Array.from(gSet).filter(Boolean).sort();
  }, []);

  if (!FIXTURE.length) return <div className="text-center p-10 text-slate-500">Cargando fixture...</div>;

  let filteredFixture = FIXTURE;
  if (selectedGroup !== 'Todos') {
    filteredFixture = FIXTURE.filter(m => m.grupo === selectedGroup);
  }

  const groupedFixture = groupByDate(filteredFixture);

  return (
    <div className="pb-6">
      {/* Filter Bar */}
      <div className="sticky top-[108px] z-30 bg-bg-dark/95 backdrop-blur py-3 px-2 border-b border-slate-200 shadow-sm flex items-center gap-3 overflow-x-auto">
        <div className="flex items-center gap-2 text-slate-500 font-semibold text-sm pl-2">
          <Filter className="w-4 h-4" /> Grupo:
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setSelectedGroup('Todos')}
            className={`px-4 py-1.5 rounded-full text-sm font-bold whitespace-nowrap transition-colors ${
              selectedGroup === 'Todos'
                ? 'bg-fifa-blue text-white shadow-sm'
                : 'bg-white border text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            Todos
          </button>
          
          {groups.map(g => (
            <button
              key={g}
              onClick={() => setSelectedGroup(g)}
              className={`px-4 py-1.5 rounded-full text-sm font-bold whitespace-nowrap transition-colors ${
                selectedGroup === g
                  ? 'bg-fifa-blue text-white shadow-sm'
                  : 'bg-white border text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              Grupo {g}
            </button>
          ))}
        </div>
      </div>

      <div className="px-2">
        {groupedFixture.length === 0 ? (
          <div className="text-center p-10 text-slate-500">No hay partidos para el grupo seleccionado.</div>
        ) : (
          groupedFixture.map(([fecha, matches]) => (
            <div key={fecha}>
              <div className="font-extrabold text-slate-500 uppercase text-xs tracking-widest mt-6 mx-2 mb-3">
                {formatDate(fecha)}
              </div>
              {matches.map((m: MatchData) => (
                <MatchCard key={m.id} m={m} res={results[m.id]} mode="view" showStatus={true} />
              ))}
            </div>
          ))
        )}

        {KNOCKOUT.length > 0 && selectedGroup === 'Todos' && (
          <>
            <div className="font-extrabold text-fifa-blue uppercase text-lg tracking-widest mt-10 mx-2 mb-3 text-center border-b border-slate-200 pb-3">
              FASE ELIMINATORIA
            </div>
            {groupByDate(KNOCKOUT).map(([fecha, matches]) => (
              <div key={fecha}>
                <div className="font-extrabold text-slate-500 uppercase text-xs tracking-widest mt-6 mx-2 mb-3">
                  {formatDate(fecha)}
                </div>
                {matches.map((m: MatchData) => (
                  <MatchCard key={m.id} m={m} res={results[m.id]} mode="view" isKO showStatus={true} />
                ))}
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
