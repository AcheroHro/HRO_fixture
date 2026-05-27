import { useState } from 'react';
import { FIXTURE, KNOCKOUT } from '../constants';
import { ResultsMap, updateOfficialResults } from '../db';

interface Props {
  results: ResultsMap;
  onClose: () => void;
}

export function AdminDialog({ results, onClose }: Props) {
  const [draft, setDraft] = useState<ResultsMap>(results);

  const handleInput = (id: number, t: 'l' | 'v', val: string) => {
    const numVal = val === '' ? '' : parseInt(val, 10);
    setDraft(prev => ({
      ...prev,
      [id]: {
        ...(prev[id] || { l: '', v: '' }),
        [t]: numVal
      }
    }));
  };

  const handleSave = async () => {
    const cleanResults: ResultsMap = {};
    for (const [idStr, resRaw] of Object.entries(draft)) {
      const res = resRaw as any;
      if (res && res.l !== '' && res.v !== '') {
        cleanResults[Number(idStr)] = { l: res.l, v: res.v };
      }
    }
    await updateOfficialResults(cleanResults);
    alert('Resultados actualizados.');
    onClose();
  };

  const allMatches = [...FIXTURE, ...KNOCKOUT];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-[fadeIn_0.2s_ease]">
      <div className="bg-card text-text-dark w-full max-w-lg rounded-[18px] shadow-[0_20px_40px_rgba(0,0,0,0.4)] overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-4 bg-fifa-blue text-white font-black text-lg">
          Cargar Resultados Reales
        </div>
        
        <div className="p-4 overflow-y-auto flex-1 bg-white">
          <p className="text-sm text-muted mb-4 font-semibold pb-2 border-b border-slate-100">
            Los resultados aquí cargados afectan la tabla de posiciones de todos los usuarios.
          </p>
          {allMatches.map(m => {
            const r = draft[m.id] || { l: '', v: '' };
            return (
              <div key={m.id} className="grid grid-cols-[1fr_auto_auto_1fr] gap-3 items-center py-2.5 border-b border-[#f1f5f9] text-[13px] font-bold">
                <div className="text-right truncate">{m.local}</div>
                <input 
                  type="number" 
                  min="0" 
                  max="20"
                  className="w-12 h-10 border border-[#dbe4f0] rounded-xl text-center text-lg font-black bg-[#f8fafc] focus:outline-none focus:border-fifa-blue focus:bg-white"
                  value={r.l ?? ''}
                  onChange={(e) => handleInput(m.id, 'l', e.target.value)}
                  style={{ WebkitAppearance: 'none', MozAppearance: 'textfield' }}
                />
                <span className="text-[#a3b2c9] font-black mx-1">-</span>
                <input 
                  type="number" 
                  min="0" 
                  max="20"
                  className="w-12 h-10 border border-[#dbe4f0] rounded-xl text-center text-lg font-black bg-[#f8fafc] focus:outline-none focus:border-fifa-blue focus:bg-white"
                  value={r.v ?? ''}
                  onChange={(e) => handleInput(m.id, 'v', e.target.value)}
                  style={{ WebkitAppearance: 'none', MozAppearance: 'textfield' }}
                />
                <div className="truncate">{m.visitante}</div>
              </div>
            );
          })}
        </div>
        
        <div className="p-4 flex gap-3 justify-end border-t border-[#eef2f7] bg-[#fbfdff]">
          <button 
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl font-bold bg-[#13294b] text-[#9ecbff] hover:bg-[#1a3661] transition-colors"
          >
            Cancelar
          </button>
          <button 
            onClick={handleSave}
            className="px-5 py-2.5 rounded-xl font-bold bg-fifa-blue text-white hover:brightness-110 transition-colors shadow-sm"
          >
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
}
