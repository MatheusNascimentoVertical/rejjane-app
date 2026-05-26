import { useState, useEffect } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '../lib/firebase';

const DEMO = import.meta.env.VITE_DEMO === 'true';

export function useAuth() {
  const [user, setUser]       = useState<User | null>(DEMO ? ({ uid: 'demo' } as User) : null);
  const [loading, setLoading] = useState(!DEMO);

  useEffect(() => {
    if (DEMO) return;
    return onAuthStateChanged(auth, u => { setUser(u); setLoading(false); });
  }, []);

  return { user, loading };
}
