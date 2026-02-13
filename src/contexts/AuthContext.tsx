import { createContext, useContext, useState, type ReactNode } from 'react';

interface User {
  email: string;
  role: 'citizen' | 'admin';
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string, role: 'citizen' | 'admin') => boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);

  const login = (email: string, _password: string, role: 'citizen' | 'admin') => {
    if (email && _password) {
      setUser({ email, role });
      return true;
    }
    return false;
  };

  const logout = () => setUser(null);

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
