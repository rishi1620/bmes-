const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const url = import.meta.env.VITE_SUPABASE_URL + '/rest/v1/event_registrations?limit=1';

fetch(url, {
  method: 'GET',
  headers: {
    'apikey': key,
    'Authorization': `Bearer ${key}`
  }
})
.then(res => {
  if (!res.ok) return res.text().then(err => { throw new Error(err); });
  return res.json();
})
.then(data => console.log("Success! Data:", data))
.catch(err => console.error(err));
