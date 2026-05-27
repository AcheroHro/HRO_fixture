import React, { useState, useEffect } from 'react';
import { UserDoc, getAllUsers, getAllAdmins, setUserRole } from '../db';
import { Shield, ShieldAlert, CheckCircle2, UserCog, User } from 'lucide-react';

export default function RoleManager({ currentUserUid }: { currentUserUid: string }) {
  const [users, setUsers] = useState<Record<string, UserDoc>>({});
  const [admins, setAdmins] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    const [u, a] = await Promise.all([getAllUsers(), getAllAdmins()]);
    setUsers(u);
    setAdmins(a);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const toggleAdmin = async (uid: string, currentIsAdmin: boolean) => {
    if (uid === currentUserUid && currentIsAdmin) {
      if (!window.confirm("¿Estás seguro de que quieres quitarte el rol de Administrador? Perderás acceso a estas opciones.")) {
        return;
      }
    }
    await setUserRole(uid, !currentIsAdmin);
    await loadData();
  };

  if (loading) {
    return <div className="p-10 text-center text-slate-500 font-medium">Cargando usuarios...</div>;
  }

  const entries = Object.entries(users) as [string, UserDoc][];
  
  if (entries.length === 0) {
    return <div className="p-10 text-center text-slate-500">No hay usuarios registrados aun.</div>;
  }

  // Create a sorted list: Admins first, then by name
  const sortedEntries = entries.sort(([uidA, a], [uidB, b]) => {
    const isAdminA = admins[uidA] || false;
    const isAdminB = admins[uidB] || false;
    if (isAdminA && !isAdminB) return -1;
    if (!isAdminA && isAdminB) return 1;
    return a.displayName.localeCompare(b.displayName);
  });

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden mt-4">
      <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-fifa-blue/5">
        <div>
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <UserCog className="w-5 h-5 text-fifa-blue" />
            Gestión de Roles
          </h2>
          <p className="text-sm text-slate-500 mt-1">Configura quién es Administrador y quién es Usuario.</p>
        </div>
      </div>
      
      <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto">
        {sortedEntries.map(([uid, u]) => {
          const isAppAdmin = admins[uid] || false;
          const isMe = uid === currentUserUid;

          return (
            <div key={uid} className="p-4 flex items-center justify-between hover:bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-200 shrink-0">
                  {u.photoURL ? (
                    <img src={u.photoURL} alt={u.displayName} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center font-bold text-slate-500">
                      {u.displayName.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <div className="font-bold text-slate-800 text-sm">
                      {u.displayName}
                    </div>
                    {isMe && <span className="text-[10px] bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded font-bold uppercase">Tú</span>}
                  </div>
                  <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                    {isAppAdmin ? (
                      <span className="flex items-center gap-1 text-fifa-blue font-bold">
                        <Shield className="w-3 h-3" /> Administrador
                      </span>
                    ) : (
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3" /> Usuario
                      </span>
                    )}
                  </div>
                </div>
              </div>
              
              <button
                onClick={() => toggleAdmin(uid, isAppAdmin)}
                className={`text-xs px-3 py-1.5 rounded-lg font-bold border ${cardButtonStyle(isAppAdmin)}`}
              >
                {isAppAdmin ? 'Quitar Admin' : 'Hacer Admin'}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function cardButtonStyle(isAdmin: boolean) {
  if (isAdmin) {
    return "border-red-100 text-red-600 hover:bg-red-50 bg-white";
  }
  return "border-fifa-blue text-fifa-blue hover:bg-fifa-blue/10 bg-white";
}
