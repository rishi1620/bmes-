const url = import.meta.env.VITE_SUPABASE_URL + '/rest/v1/event_registrations';
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

fetch(import.meta.env.VITE_SUPABASE_URL + '/rest/v1/events?select=id&limit=1', {
  headers: { 'apikey': key, 'Authorization': `Bearer ${key}` }
})
.then(res => res.json())
.then(events => {
  if (!events.length) {
    console.log("No events"); return;
  }
  const eventId = events[0].id;
  return fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': key,
      'Authorization': `Bearer ${key}`,
      'Prefer': 'return=minimal'
    },
    body: JSON.stringify({
      event_id: eventId,
      name: 'Test',
      email: 'test@test.com'
    })
  });
})
.then(res => {
  if (!res.ok) return res.text().then(err => { throw new Error(err); });
  console.log("Success!");
})
.catch(err => console.error(err));
