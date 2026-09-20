import { supabase } from './src/integrations/supabase/client';

async function test() {
  const { data: events } = await supabase.from('events').select('id').limit(1);
  const eventId = events?.[0]?.id;
  if (!eventId) {
    console.log("No events found");
    return;
  }
  
  const { error } = await supabase.from("event_registrations").insert({
    event_id: eventId,
    name: 'BMES Test',
    email: 'bmes@cuet.ac.bd'
  });
  console.log("Error:", error);
}
test();
