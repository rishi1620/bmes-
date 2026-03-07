import { useState } from 'react';
import { AppProvider } from './context/AppProvider';
import AdminDashboard from './components/AdminDashboard';
import PublicPage from './components/PublicPage';

function App() {
  const [view, setView] = useState<'admin' | 'public'>('admin');

  return (
    <AppProvider>
      <div className="min-h-screen">
        <nav className="bg-black text-white p-4 flex gap-4">
          <button onClick={() => setView('admin')} className="hover:text-gray-300">Admin</button>
          <button onClick={() => setView('public')} className="hover:text-gray-300">Public</button>
        </nav>
        {view === 'admin' ? <AdminDashboard /> : <PublicPage />}
      </div>
    </AppProvider>
  );
}

export default App;
