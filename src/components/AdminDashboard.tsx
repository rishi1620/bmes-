import { useAppContext } from '../hooks/useAppContext';

const AdminDashboard = () => {
  const { state, updateState } = useAppContext();

  return (
    <div className="min-h-screen bg-[#E4E3E0] p-8">
      <h1 className="text-3xl font-bold mb-8 font-serif italic">Admin Dashboard</h1>
      <div className="grid grid-cols-1 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-[#141414]">
          <label className="block text-sm font-medium mb-2">Page Title</label>
          <input
            type="text"
            value={state.title}
            onChange={(e) => updateState({ title: e.target.value })}
            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black transition-all"
          />
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-[#141414]">
          <label className="block text-sm font-medium mb-2">Description</label>
          <textarea
            value={state.description}
            onChange={(e) => updateState({ description: e.target.value })}
            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black transition-all"
          />
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
