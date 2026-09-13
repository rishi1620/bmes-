import { useAppContext } from '../context/AppContext';

const PublicPage = () => {
  const { state } = useAppContext();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="p-8 border-b border-border">
        <h1 className="text-4xl font-bold">{state.title}</h1>
      </header>
      <main className="p-8">
        <img
          src={state.heroImage}
          alt="Hero"
          className="w-full h-64 object-cover rounded-xl mb-8"
          referrerPolicy="no-referrer"
        />
        <p className="text-lg text-muted-foreground">{state.description}</p>
      </main>
    </div>
  );
};

export default PublicPage;
