import React, { useState } from 'react';
import Login from './Login';
import Register from './Register';
import AccountPage from './AccountPage';
import AdminDashboard from './AdminDashboard';

const AppRouter: React.FC = () => {
  const [token, setToken] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [page, setPage] = useState<'login' | 'register' | 'account' | 'admin'>('login');

  const handleLogin = (t: string, admin: boolean) => {
    setToken(t);
    setIsAdmin(admin);
    setPage(admin ? 'admin' : 'account');
  };

  if (!token) {
    return (
      <div style={{ textAlign: 'center', marginTop: 40 }}>
        <h1>Welcome</h1>
        {page === 'register' ? (
          <>
            <Register />
            <button onClick={() => setPage('login')}>Go to Login</button>
          </>
        ) : (
          <>
            <Login onLogin={handleLogin} />
            <button onClick={() => setPage('register')}>Go to Register</button>
          </>
        )}
      </div>
    );
  }
  if (isAdmin) return <AdminDashboard token={token} />;
  return <AccountPage token={token} />;
};

export default AppRouter;
