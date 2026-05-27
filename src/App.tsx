import { useEffect, useState } from 'react';
import {
  browserLocalPersistence,
  getRedirectResult,
  GoogleAuthProvider,
  setPersistence,
  signInWithRedirect,
  signOut,
} from 'firebase/auth';
import { auth } from './firebase';
import { ensureUserDoc, checkIsAdmin } from './db';
import { LogIn, LogOut, ShieldAlert } from 'lucide-react';
import TabView from './components/TabView';

const provider = new GoogleAuthProvider();

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState('');

  useEffect(() => {
    let unsub = () => {};
    let active = true;

    const handleUser = async (currentUser: any) => {
      if (!active) return;

      try {
        setUser(currentUser);
        if (currentUser) {
          await ensureUserDoc(currentUser);
          const adminStatus = await checkIsAdmin(currentUser.uid);
          setIsAdmin(adminStatus);
        } else {
          setIsAdmin(false);
        }
      } catch (error) {
        console.error('Auth state handling failed', error);
        setAuthError(`Ingresaste con Google, pero no se pudo cargar tu usuario. ${errorMessage(error)}`);
      } finally {
        if (active) setLoading(false);
      }
    };

    const initAuth = async () => {
      try {
        await setPersistence(auth, browserLocalPersistence);
        await getRedirectResult(auth);
      } catch (error) {
        console.error('Google redirect sign-in failed', error);
        if (active) {
          setAuthError(`No se pudo completar el ingreso con Google. ${errorMessage(error)}`);
        }
      }

      if (!active) return;

      unsub = auth.onAuthStateChanged(handleUser, (error) => {
        console.error('Auth subscription failed', error);
        setAuthError(`No se pudo validar la sesion. ${errorMessage(error)}`);
        setLoading(false);
      });
    };

    initAuth();

    return () => {
      active = false;
      unsub();
    };
  }, []);

  const login = async () => {
    setAuthError('');
    try {
      await setPersistence(auth, browserLocalPersistence);
      await signInWithRedirect(auth, provider);
    } catch (error) {
      console.error('Google sign-in failed', error);
      setAuthError(`No se pudo iniciar sesion con Google. ${errorMessage(error)}`);
    }
  };
  const logout = () => signOut(auth);

  if (loading) return <div className="p-8 text-center text-fifa-blue-dark font-bold bg-white m-4 rounded-xl">Loading...</div>;

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-50 bg-white border-b border-slate-200 text-slate-800">
        <div className="flex items-center gap-4 py-3 px-8">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-lg overflow-hidden shrink-0 bg-blue-500 text-white shadow-sm">
            {user && user.photoURL ? <img src={user.photoURL} alt="Avatar" className="w-full h-full object-cover" /> : 'A'}
          </div>
          <div className="font-semibold tracking-tight text-xl flex-1 leading-tight">
            MUNDIAL 2026
          </div>
          {user ? (
            <button onClick={logout} className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg flex gap-2 items-center text-sm font-medium shadow-sm transition-all" aria-label="Cerrar sesión">
              <LogOut className="w-4 h-4" />
            </button>
          ) : (
            <button onClick={login} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex gap-2 items-center text-sm font-medium shadow-sm transition-all">
              <LogIn className="w-4 h-4" /> Entrar
            </button>
          )}
        </div>
      </header>

      {user ? (
        <TabView user={user} isAdmin={isAdmin} />
      ) : (
        <div className="max-w-md mx-auto mt-10 p-6 bg-card text-text-dark rounded-xl shadow-lg text-center mx-4">
          <p className="mb-6 font-bold">Inicia sesión con Google para armar tu prode del Mundial 2026.</p>
          {authError && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-left text-sm font-semibold text-red-700">
              {authError}
            </div>
          )}
          <button onClick={login} className="w-full bg-fifa-blue text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2">
             Entrar con Google
          </button>
        </div>
      )}
    </div>
  );
}
