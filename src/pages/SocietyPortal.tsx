import React, { useEffect, useState } from 'react';
import { auth } from '@/firebase';
import { signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';
import { eventsService, announcementsService, SocietyEvent, Announcement } from '@/integrations/firebase/societyService';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Bell, Users, LogIn, LogOut } from 'lucide-react';

const SocietyPortal = () => {
  const [user, setUser] = useState(auth.currentUser);
  const [events, setEvents] = useState<SocietyEvent[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
      setUser(user);
      setLoading(false);
    });

    const unsubscribeEvents = eventsService.subscribe(setEvents);
    const unsubscribeAnnouncements = announcementsService.subscribe(setAnnouncements);

    return () => {
      unsubscribeAuth();
      unsubscribeEvents();
      unsubscribeAnnouncements();
    };
  }, []);

  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Login failed", error);
    }
  };

  const handleLogout = () => signOut(auth);

  if (loading) return <div className="flex h-screen items-center justify-center">Loading...</div>;

  return (
    <div className="container mx-auto p-6 space-y-8">
      <header className="flex justify-between items-center border-b pb-6">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Society Portal</h1>
          <p className="text-muted-foreground">Manage events, members, and announcements via Firebase.</p>
        </div>
        <div>
          {user ? (
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium">{user.displayName}</span>
              <Button variant="outline" onClick={handleLogout} size="sm">
                <LogOut className="mr-2 h-4 w-4" /> Logout
              </Button>
            </div>
          ) : (
            <Button onClick={handleLogin}>
              <LogIn className="mr-2 h-4 w-4" /> Login with Google
            </Button>
          )}
        </div>
      </header>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Events Section */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Calendar className="h-6 w-6 text-primary" />
            <h2 className="text-2xl font-semibold">Upcoming Events</h2>
          </div>
          <div className="grid gap-4">
            {events.length === 0 ? (
              <p className="text-muted-foreground italic">No events scheduled yet.</p>
            ) : (
              events.map(event => (
                <Card key={event.id}>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">{event.title}</CardTitle>
                      <Badge variant="secondary">{event.type}</Badge>
                    </div>
                    <CardDescription>{event.date}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">{event.description}</p>
                    {event.location && (
                      <p className="text-xs text-muted-foreground mt-2">📍 {event.location}</p>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </section>

        {/* Announcements Section */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Bell className="h-6 w-6 text-primary" />
            <h2 className="text-2xl font-semibold">Announcements</h2>
          </div>
          <div className="grid gap-4">
            {announcements.length === 0 ? (
              <p className="text-muted-foreground italic">No announcements yet.</p>
            ) : (
              announcements.map(ann => (
                <Card key={ann.id} className={ann.priority === 'high' ? 'border-red-200 bg-red-50/30' : ''}>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">{ann.title}</CardTitle>
                      <Badge variant={ann.priority === 'high' ? 'destructive' : 'outline'}>
                        {ann.priority}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">{ann.content}</p>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </section>
      </div>

      {!user && (
        <div className="bg-muted p-8 rounded-xl text-center">
          <Users className="h-12 w-12 mx-auto mb-4 opacity-20" />
          <h3 className="text-xl font-medium mb-2">Join the Society</h3>
          <p className="text-muted-foreground mb-6">Login to see more details and participate in events.</p>
          <Button onClick={handleLogin} size="lg">Get Started</Button>
        </div>
      )}
    </div>
  );
};

export default SocietyPortal;
