import { doc, getDoc, setDoc, updateDoc, collection, getDocs, onSnapshot, deleteDoc } from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from './firebase';

export interface Prediction {
  l: number | '';
  v: number | '';
}

export interface PredictionsMap {
  [matchId: number]: Prediction;
}

export interface UserDoc {
  displayName: string;
  photoURL: string;
}

export interface ResultsMap {
  [matchId: number]: Prediction;
}

// Fetch all users
export async function getAllUsers(): Promise<Record<string, UserDoc>> {
  try {
    const snap = await getDocs(collection(db, 'users'));
    const users: Record<string, UserDoc> = {};
    snap.forEach((doc) => {
      users[doc.id] = doc.data() as UserDoc;
    });
    return users;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'users');
    return {};
  }
}

// Ensure the current user has a document and bootstrap admin if it's the first
export async function ensureUserDoc(user: any) {
  if (!user) return;
  const userRef = doc(db, 'users', user.uid);
  try {
    const d = await getDoc(userRef);
    if (!d.exists()) {
      await setDoc(userRef, {
        displayName: user.displayName || 'Anon',
        photoURL: user.photoURL || '',
      });
    }
    // Check if any admins exist, if not make this user the first admin
    const allAdmins = await getAllAdmins();
    if (Object.keys(allAdmins).length === 0) {
      await setUserRole(user.uid, true);
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, `users/${user.uid}`);
  }
}

// Get user predictions
export async function getUserPredictions(userId: string): Promise<PredictionsMap> {
  const ref = doc(db, 'predictions', userId);
  try {
    const d = await getDoc(ref);
    if (d.exists() && d.data()?.predictions) {
      return d.data().predictions;
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, `predictions/${userId}`);
  }
  return {};
}

// Get all user predictions (for Leaderboard)
export async function getAllPredictions(): Promise<Record<string, PredictionsMap>> {
  try {
    const snap = await getDocs(collection(db, 'predictions'));
    const preds: Record<string, PredictionsMap> = {};
    snap.forEach((doc) => {
      preds[doc.id] = doc.data().predictions || {};
    });
    return preds;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'predictions');
    return {};
  }
}

// Upsert a specific prediction
export async function updatePrediction(userId: string, matchId: number, pred: Prediction) {
  const ref = doc(db, 'predictions', userId);
  try {
    const d = await getDoc(ref);
    if (d.exists()) {
      const existing = d.data().predictions || {};
      existing[matchId] = pred;
      await updateDoc(ref, { predictions: existing });
    } else {
      await setDoc(ref, { predictions: { [matchId]: pred } });
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `predictions/${userId}`);
  }
}

// Subscribe to official results
export function subscribeToResults(callback: (results: ResultsMap) => void) {
  const ref = doc(db, 'results', 'official');
  return onSnapshot(ref, (snap) => {
    if (snap.exists() && snap.data()?.results) {
      callback(snap.data().results);
    } else {
      callback({});
    }
  }, (err) => {
    handleFirestoreError(err, OperationType.GET, 'results/official');
  });
}

// Update official results (Admin only)
export async function updateOfficialResults(newResults: ResultsMap) {
  const ref = doc(db, 'results', 'official');
  try {
    const d = await getDoc(ref);
    if (d.exists()) {
      await updateDoc(ref, { results: newResults });
    } else {
      await setDoc(ref, { results: newResults });
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, 'results/official');
  }
}

// Check admin status
export async function checkIsAdmin(userId: string): Promise<boolean> {
  const ref = doc(db, 'admins', userId);
  try {
    const d = await getDoc(ref);
    return d.exists();
  } catch (err) {
    console.error("Admin check failed", err);
  }
  return false;
}

// Get all admins
export async function getAllAdmins(): Promise<Record<string, boolean>> {
  try {
    const snap = await getDocs(collection(db, 'admins'));
    const admins: Record<string, boolean> = {};
    snap.forEach((doc) => {
      admins[doc.id] = true;
    });
    return admins;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'admins');
    return {};
  }
}

// Set user role
export async function setUserRole(userId: string, isAdmin: boolean) {
  const ref = doc(db, 'admins', userId);
  try {
    if (isAdmin) {
      await setDoc(ref, { createdAt: new Date().toISOString() });
    } else {
      await deleteDoc(ref);
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, 'admins/' + userId);
  }
}
