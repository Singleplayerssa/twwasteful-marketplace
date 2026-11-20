import { createContext, useContext, useEffect, useState } from 'react';
import { api } from './api';
const AuthContext = createContext(null);
export function AuthProvider({ children }) {
  const [user,setUser] = useState(null);
  const [loading,setLoading] = useState(true);
  useEffect(() => { api('/auth/me').then(({user}) => setUser(user)).catch(() => setUser(null)).finally(() => setLoading(false)); }, []);
  async function signIn(payload) { const result = await api('/auth/login',{method:'POST',body:JSON.stringify(payload)}); setUser(result.user); return result.user; }
  async function signUp(payload) { const result = await api('/auth/register',{method:'POST',body:JSON.stringify(payload)}); setUser(result.user); return result.user; }
  async function signOut() { await api('/auth/logout',{method:'POST'}); setUser(null); }
  return <AuthContext.Provider value={{user,setUser,loading,signIn,signUp,signOut}}>{children}</AuthContext.Provider>;
}
export const useAuth = () => useContext(AuthContext);
