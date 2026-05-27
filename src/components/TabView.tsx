import { useState, useEffect } from 'react';
import { FixtureView } from './FixtureView';
import { ProdeView } from './ProdeView';
import { TablaView } from './TablaView';
import { LlaveView } from './LlaveView';
import { AdminDialog } from './AdminDialog';
import RoleManager from './RoleManager';
import { ShieldCheck } from 'lucide-react';
import {
  PredictionsMap,
  ResultsMap,
  UserDoc,
  getUserPredictions,
  getAllPredictions,
  getAllUsers,
  subscribeToResults
} from '../db';
import { FIXTURE, KNOCKOUT } from '../constants';

export default function TabView({ user, isAdmin }: { user: any, isAdmin: boolean }) {
  const [activeTab, setActiveTab] = useState('fixture');
  const [adminOpen, setAdminOpen] = useState(false);

  // Global state we need for all views
  const [myPredictions, setMyPredictions] = useState<PredictionsMap>({});
  const [allPredictions, setAllPredictions] = useState<Record<string, PredictionsMap>>({});
  const [users, setUsers] = useState<Record<string, UserDoc>>({});
  const [results, setResults] = useState<ResultsMap>({});

  useEffect(() => {
    // Load my predictions
    getUserPredictions(user.uid).then(setMyPredictions);
    // Load all users and their predictions for the leaderboard
    getAllUsers().then(setUsers);
    getAllPredictions().then(setAllPredictions);

    // Subscribe to live results
    const unsub = subscribeToResults(setResults);
    return () => unsub();
  }, [user.uid]);

  const tabs = [
    { id: 'fixture', label: 'Fixture' },
    { id: 'prode', label: 'Mi Prode' },
    { id: 'tabla', label: 'Tabla' },
    { id: 'llave', label: 'Llave' },
  ];

  if (isAdmin) {
    tabs.push({ id: 'roles', label: 'Roles Admin' });
  }

  return (
    <>
      <nav className="flex bg-white shadow-sm border-b border-slate-200 overflow-x-auto sticky top-[64px] z-40">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`flex-1 text-center py-3 px-2 font-bold text-sm whitespace-nowrap transition-colors border-b-4 ${
              activeTab === t.id ? 'text-blue-600 border-blue-600 bg-blue-50/50' : 'text-slate-500 border-transparent hover:bg-slate-50 hover:text-slate-800'
            }`}
          >
            {t.label}
          </button>
        ))}
      </nav>

      <div className="max-w-[820px] mx-auto text-center text-slate-500 text-[13px] py-3 px-4 font-medium">
        Fixture oficial FIFA 2026 • 72 partidos de grupos + 32 de eliminatorias • Horarios hora Argentina
      </div>

      <main className="max-w-[820px] mx-auto p-2 pb-20">
        {activeTab === 'fixture' && <FixtureView results={results} />}
        {activeTab === 'prode' && (
          <ProdeView 
            user={user} 
            myPredictions={myPredictions} 
            setMyPredictions={setMyPredictions} 
            results={results}
          />
        )}
        {activeTab === 'tabla' && (
          <TablaView 
            currentUserId={user.uid}
            users={users} 
            allPredictions={allPredictions} 
            results={results} 
          />
        )}
        {activeTab === 'llave' && (
          <LlaveView myPredictions={myPredictions} />
        )}
        {activeTab === 'roles' && isAdmin && (
          <RoleManager currentUserUid={user.uid} />
        )}
      </main>

      {isAdmin && activeTab !== 'roles' && (
        <footer className="fixed bottom-0 left-0 right-0 bg-bg-dark/90 backdrop-blur-md border-t border-white/10 p-3 flex justify-center z-50">
          <button 
            onClick={() => setAdminOpen(true)}
            className="flex items-center gap-2 bg-fifa-blue text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:brightness-110 transition-all active:scale-95"
          >
            <ShieldCheck className="w-5 h-5" />
            Cargar Resultados Reales
          </button>
        </footer>
      )}

      {adminOpen && isAdmin && (
        <AdminDialog 
          results={results} 
          onClose={() => setAdminOpen(false)} 
        />
      )}
    </>
  );
}
