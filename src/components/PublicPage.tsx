import { useAppContext } from '../context/AppContext';

const PublicPage = () => {
  const { state } = useAppContext();

  return (
    <div className="min-h-screen bg-white">
      <header className="p-8 border-b border-gray-200">
        <h1 className="text-4xl font-bold">{state.title}</h1>
      </header>
      <main className="p-8">
        <img
          src={state.heroImage}
          alt="Hero"
          className="w-full h-64 object-cover rounded-xl mb-8"
          referrerPolicy="no-referrer"
        />
        <p className="text-lg text-gray-700">{state.description}</p>
      </main>
    </div>
  );
};

export default PublicPage;
