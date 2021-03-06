import React, { createContext, useCallback, useState, useContext } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';

interface User {
  id: string;
  name: string;
  email: string;
}

interface AuthState {
  token: string;
  user: User;
}

interface SignInCredentials {
  email: string;
  password: string;
}

interface AuthContextData {
  user: User;
  signIn(credentials: SignInCredentials): Promise<void>;
  signOut(): void;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

const AuthProvider: React.FC = ({ children }) => {
  const [data, setData] = useState<AuthState>(() => {
    const token = localStorage.getItem('@sapeka:token');
    const user = localStorage.getItem('@sapeka:user');

    if (token && user) {
      api.defaults.headers.authorization = `Bearer ${token}`;
      return { user: JSON.parse(user), token };
    }
    return {} as AuthState;
  });

  const signIn = useCallback(async ({ email, password }: SignInCredentials) => {
    try {
      const response = await api.post('sessions', {
        email,
        password,
      });
      const { token, user } = response.data;
      api.defaults.headers.authorization = `Bearer ${token}`;

      localStorage.setItem('@sapeka:token', token);
      localStorage.setItem('@sapeka:user', JSON.stringify(user));

      setData({ user, token });
    } catch (err) {
      toast.error(`${err.response.data.message}`);
    }
  }, []);

  const signOut = useCallback(() => {
    localStorage.removeItem('@sapeka:token');
    localStorage.removeItem('@sapeka:user');

    setData({} as AuthState);
  }, []);

  return (
    <AuthContext.Provider value={{ signIn, signOut, user: data.user }}>
      {children}
    </AuthContext.Provider>
  );
};

function useAuth(): AuthContextData {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
}

export { useAuth, AuthProvider };
