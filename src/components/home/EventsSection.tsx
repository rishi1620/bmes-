import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin } from "lucide-react";
import { format } from "date-fns";
import { Tables } from "@/integrations/supabase/types";

interface EventsSectionProps {
  events: Tables<"events">[];
  title: string;
  description: string;
}

const EventsSection = ({ events, title, description }: EventsSectionProps) => {
  return (
    <section className="container py-16">
      <div className="flex flex-col md:flex-row justify-between items-end mb-12">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">{title}</h2>
          <p className="text-muted-foreground mt-2">{description}</p>
        </div>
        <Button asChild variant="outline" className="mt-4 md:mt-0">
          <Link to="/events">See All Events</Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {events.map((event, index) => (
          <motion.div
            key={event.id}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            viewport={{ once: true }}
            className="group rounded-xl border border-border bg-card overflow-hidden hover:shadow-lg transition-all"
          >
            <div className="h-48 overflow-hidden">
              <img
                src={event.poster_url || "/placeholder.svg"}
                alt={event.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="p-6">
              <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {format(new Date(event.date), "MMM d, yyyy")}
                </div>
                <div className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {event.location}
                </div>
              </div>
              <h3 className="text-xl font-semibold mb-2">{event.title}</h3>
              <p className="text-muted-foreground text-sm line-clamp-3 mb-4">
                {event.description}
              </p>
              <Button asChild variant="secondary" className="w-full">
                <Link to={`/events/${event.id}`}>View Details</Link>
              </Button>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
};

export default EventsSection;
