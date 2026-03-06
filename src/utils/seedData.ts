import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";

type TableName = keyof Database["public"]["Tables"];

export const seedData = async () => {
  console.log("Starting seed process...");

  try {
    // 1. Clear existing data
    const tables: TableName[] = [
      "achievements",
      "advisors",
      "alumni",
      "blog_posts",
      "events",
      "media_library",
      "members",
      "projects",
      "site_settings",
      "home_sections",
      "pages",
      "contact_submissions",
      "event_registrations"
    ];

    for (const table of tables) {
      console.log(`Clearing ${table}...`);
      const { error } = await supabase.from(table).delete().neq("id", "00000000-0000-0000-0000-000000000000");
      if (error) {
        console.error(`Error clearing ${table}:`, error);
        throw error;
      }
    }

    // 2. Insert Media
    console.log("Inserting media...");
    const mediaData = [
      {
        file_name: "tech-meeting.jpg",
        file_url: "https://images.unsplash.com/photo-1531482615713-2afd69097998",
        file_type: "image/jpeg",
        alt_text: "Team meeting",
        folder: "demo"
      },
      {
        file_name: "coding-laptop.jpg",
        file_url: "https://images.unsplash.com/photo-1498050108023-c5249f4df085",
        file_type: "image/jpeg",
        alt_text: "Coding on laptop",
        folder: "demo"
      },
      {
        file_name: "conference.jpg",
        file_url: "https://images.unsplash.com/photo-1544531586-fde5298cdd40",
        file_type: "image/jpeg",
        alt_text: "Conference speaker",
        folder: "demo"
      },
      {
        file_name: "award.jpg",
        file_url: "https://images.unsplash.com/photo-1578269174936-2709b6aeb913",
        file_type: "image/jpeg",
        alt_text: "Award ceremony",
        folder: "demo"
      },
      {
        file_name: "hero-bg.jpg",
        file_url: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4",
        file_type: "image/jpeg",
        alt_text: "Hero Background",
        folder: "demo"
      },
      {
        file_name: "logo.png",
        file_url: "https://cdn-icons-png.flaticon.com/512/2083/2083256.png", // Placeholder logo
        file_type: "image/png",
        alt_text: "Site Logo",
        folder: "branding"
      },
      {
        file_name: "sample-pdf.pdf",
        file_url: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
        file_type: "application/pdf",
        alt_text: "Sample PDF Document",
        folder: "documents"
      }
    ];

    const { data: media, error: mediaError } = await supabase
      .from("media_library")
      .insert(mediaData)
      .select();

    if (mediaError) throw mediaError;

    // 3. Insert Site Settings
    console.log("Inserting site settings...");
    const siteSettingsData = [
      // General Settings
      { setting_key: "site_title", setting_value: "CUET BMES", setting_group: "general" },
      { setting_key: "site_description", setting_value: "Biomedical Engineering Society of CUET", setting_group: "general" },
      { setting_key: "logo_url", setting_value: media?.find(m => m.file_name === "logo.png")?.file_url, setting_group: "branding" },
      
      // Contact Settings
      { setting_key: "contact_email", setting_value: "bmes@cuet.ac.bd", setting_group: "contact" },
      { setting_key: "contact_phone", setting_value: "+880 1234 567890", setting_group: "contact" },
      
      // Social Settings
      { setting_key: "social_facebook", setting_value: "https://facebook.com", setting_group: "social" },
      { setting_key: "social_linkedin", setting_value: "https://linkedin.com", setting_group: "social" },

      // About Page - Hero
      { setting_key: "about_hero_title", setting_value: "About Our Department", setting_group: "about_page" },
      { setting_key: "about_hero_subtitle", setting_value: "Pioneering the future of healthcare technology through education and research.", setting_group: "about_page" },
      { setting_key: "about_hero_bg_image", setting_value: media?.find(m => m.file_name === "hero-bg.jpg")?.file_url, setting_group: "about_page" },

      // About Page - Leadership
      { setting_key: "about_hod_title", setting_value: "Message from the Head", setting_group: "about_page" },
      { setting_key: "about_hod_name", setting_value: "Dr. Sarah Mitchell", setting_group: "about_page" },
      { setting_key: "about_hod_role", setting_value: "Head of Department", setting_group: "about_page" },
      { setting_key: "about_hod_image", setting_value: media?.find(m => m.file_name === "conference.jpg")?.file_url, setting_group: "about_page" },
      { setting_key: "about_hod_message", setting_value: "Welcome to the Department of Biomedical Engineering. We are committed to excellence in teaching and research...", setting_group: "about_page" },

      { setting_key: "about_pres_title", setting_value: "President's Message", setting_group: "about_page" },
      { setting_key: "about_pres_name", setting_value: "David Chen", setting_group: "about_page" },
      { setting_key: "about_pres_role", setting_value: "President, BMES", setting_group: "about_page" },
      { setting_key: "about_pres_image", setting_value: media?.find(m => m.file_name === "tech-meeting.jpg")?.file_url, setting_group: "about_page" },
      { setting_key: "about_pres_message", setting_value: "As the president of BMES, I invite you to join our vibrant community of innovators...", setting_group: "about_page" },

      // About Page - Department Profile
      { setting_key: "about_dept_history_title", setting_value: "Our History", setting_group: "about_page" },
      { setting_key: "about_dept_history", setting_value: "Established in 2010, the department has grown to become a leader in biomedical engineering education...", setting_group: "about_page" },
      { setting_key: "about_dept_mission_title", setting_value: "Mission", setting_group: "about_page" },
      { setting_key: "about_dept_mission", setting_value: "To provide world-class education and conduct cutting-edge research...", setting_group: "about_page" },
      { setting_key: "about_dept_vision_title", setting_value: "Vision", setting_group: "about_page" },
      { setting_key: "about_dept_vision", setting_value: "To be a globally recognized center of excellence in biomedical engineering.", setting_group: "about_page" },

      // About Page - BMES Profile
      { setting_key: "about_bmes_about_title", setting_value: "About BMES", setting_group: "about_page" },
      { setting_key: "about_bmes_about", setting_value: "The Biomedical Engineering Society (BMES) is the professional society for biomedical engineering and bioengineering.", setting_group: "about_page" },
      { setting_key: "about_bmes_objectives_title", setting_value: "Objectives", setting_group: "about_page" },
      { setting_key: "about_bmes_objectives", setting_value: "Promote the profession of biomedical engineering.\nEncourage collaborative research.\nSupport student development.", setting_group: "about_page" },

      // About Page - Constitution
      { setting_key: "about_constitution_title", setting_value: "Our Constitution", setting_group: "about_page" },
      { setting_key: "about_constitution_desc", setting_value: "The constitution outlines the rules and regulations governing our society.", setting_group: "about_page" },
      { setting_key: "about_constitution_btn_text", setting_value: "Download Constitution", setting_group: "about_page" },
      { setting_key: "about_constitution_pdf_url", setting_value: media?.find(m => m.file_name === "sample-pdf.pdf")?.file_url, setting_group: "about_page" },
    ];
    const { error: settingsError } = await supabase.from("site_settings").insert(siteSettingsData);
    if (settingsError) throw settingsError;

    // 4. Insert Pages
    console.log("Inserting pages...");
    const pagesData = [
      { page_name: "Home", slug: "/", display_order: 1, is_visible: true },
      { page_name: "About", slug: "/about", display_order: 2, is_visible: true },
      { page_name: "Academics", slug: "/academics", display_order: 3, is_visible: true },
      { page_name: "People", slug: "/people", display_order: 4, is_visible: true },
      { page_name: "Research", slug: "/research", display_order: 5, is_visible: true },
      { page_name: "Activities", slug: "/activities", display_order: 6, is_visible: true },
      { page_name: "Achievements", slug: "/achievements", display_order: 7, is_visible: true },
      { page_name: "Blog", slug: "/blog", display_order: 8, is_visible: true },
      { page_name: "Portal", slug: "/portal", display_order: 9, is_visible: true },
      { page_name: "Alumni", slug: "/alumni", display_order: 10, is_visible: true },
      { page_name: "Contact", slug: "/contact", display_order: 11, is_visible: true },
    ];
    const { error: pagesError } = await supabase.from("pages").insert(pagesData);
    if (pagesError) throw pagesError;

    // 5. Insert Home Sections
    console.log("Inserting home sections...");
    const homeSectionsData = [
      {
        section_key: "hero",
        display_order: 1,
        is_visible: true,
        section_data: {
          title: "Innovating Healthcare Through Engineering",
          subtitle: "Welcome to CUET BMES",
          description: "Bridging the gap between medicine and technology to create a healthier future for all.",
          button_text: "Join Our Community",
          button_link: "/members",
          background_image: media?.find(m => m.file_name === "hero-bg.jpg")?.file_url
        }
      },
      {
        section_key: "quick_links",
        display_order: 2,
        is_visible: true,
        section_data: {
          links: [
            { label: "Research", url: "/research" },
            { label: "Events", url: "/events" },
            { label: "Gallery", url: "/activities" },
            { label: "Join Us", url: "/contact" }
          ]
        }
      },
      {
        section_key: "announcements",
        display_order: 3,
        is_visible: true,
        section_data: {
          dept_title: "Departmental Notices",
          dept_notices: [
            { title: "Fall 2024 Semester Registration", date: "Aug 15, 2024", url: "#" },
            { title: "New Lab Equipment Arrival", date: "Aug 10, 2024", url: "#" }
          ],
          club_title: "Club News",
          club_news: [
            { title: "Executive Committee Selection", date: "Aug 20, 2024", url: "#" },
            { title: "Annual Picnic Registration", date: "Aug 18, 2024", url: "#" }
          ]
        }
      },
      {
        section_key: "upcoming_events",
        display_order: 4,
        is_visible: true,
        section_data: {
          title: "Upcoming Events",
          description: "Join us for our next major gatherings and workshops."
        }
      },
      {
        section_key: "recent_achievements",
        display_order: 5,
        is_visible: true,
        section_data: {
          title: "Recent Achievements",
          description: "Celebrating our latest recognition and impact."
        }
      },
      {
        section_key: "featured_projects",
        display_order: 6,
        is_visible: true,
        section_data: {
          title: "Featured Projects",
          description: "Innovative solutions developed by our members."
        }
      },
      {
        section_key: "recent_blog",
        display_order: 7,
        is_visible: true,
        section_data: {
          title: "Latest from the Blog",
          description: "Insights, news, and stories from our community."
        }
      },
      {
        section_key: "notice",
        display_order: 8,
        is_visible: true,
        section_data: {
          title: "Important Notice",
          content: "The department will be closed on Monday for maintenance. Please plan accordingly.",
          link_text: "Read more",
          link_url: "/blog"
        }
      },
      {
        section_key: "stats",
        display_order: 9,
        is_visible: true,
        section_data: {
          items: [
            { label: "Active Members", value: "150+" },
            { label: "Research Papers", value: "45+" },
            { label: "Awards Won", value: "12" },
            { label: "Years Active", value: "10" }
          ]
        }
      },
      {
        section_key: "features",
        display_order: 10,
        is_visible: true,
        section_data: {
          badge: "Why Join Us",
          title: "Empowering Future Engineers",
          description: "We provide resources and opportunities for growth.",
          items: [
            { title: "Research Opportunities", desc: "Work on cutting-edge projects.", icon: "FlaskConical" },
            { title: "Networking", desc: "Connect with alumni and industry leaders.", icon: "Users" },
            { title: "Skill Development", desc: "Workshops on latest technologies.", icon: "BookOpen" }
          ]
        }
      },
      {
        section_key: "cta",
        display_order: 11,
        is_visible: true,
        section_data: {
          title: "Ready to Make an Impact?",
          description: "Join CUET BMES today and be part of the innovation.",
          button_text: "Contact Us",
          button_link: "/contact"
        }
      }
    ];
    const { error: homeSectionsError } = await supabase.from("home_sections").insert(homeSectionsData);
    if (homeSectionsError) throw homeSectionsError;

    // 6. Insert Achievements
    console.log("Inserting achievements...");
    const achievementsData = [
      {
        title: "National Tech Excellence Award",
        description: "Awarded for outstanding contribution to technology education and innovation.",
        date_text: "2024",
        category: "competition",
        image_url: media?.find(m => m.file_name === "award.jpg")?.file_url,
        year: "2024",
        place: "1st Place",
        outlet: "Tech Daily"
      },
      {
        title: "Best Student Chapter",
        description: "Recognized as the most active student chapter in the region.",
        date_text: "2023",
        category: "competition",
        image_url: media?.find(m => m.file_name === "conference.jpg")?.file_url,
        year: "2023",
        place: "Winner"
      },
    ];

    const { error: achievementsError } = await supabase.from("achievements").insert(achievementsData);
    if (achievementsError) throw achievementsError;

    // 7. Insert Advisors
    console.log("Inserting advisors...");
    const advisorsData = [
      {
        name: "Dr. Sarah Mitchell",
        designation: "Department Head",
        department: "Computer Science",
        bio: "Ph.D. in Artificial Intelligence with over 15 years of academic experience.",
        role_type: "faculty",
        photo: media?.find(m => m.file_name === "conference.jpg")?.file_url,
        display_order: 1,
        is_active: true,
        email: "sarah.mitchell@example.com",
        linkedin: "https://linkedin.com"
      },
      {
        name: "James Wilson",
        designation: "Senior Architect",
        department: "Tech Innovations Inc.",
        bio: "Industry veteran specializing in cloud architecture and scalable systems.",
        role_type: "industry",
        photo: media?.find(m => m.file_name === "tech-meeting.jpg")?.file_url,
        display_order: 2,
        is_active: true,
        email: "james.wilson@example.com"
      },
    ];
    
    const { error: advisorsError } = await supabase.from("advisors").insert(advisorsData);
    if (advisorsError) throw advisorsError;

    // 8. Insert Alumni
    console.log("Inserting alumni...");
    const alumniData = [
      {
        name: "Michael Chang",
        batch: "2019",
        current_position: "Product Manager",
        organization: "Microsoft",
        testimonial: "The mentorship I received here was instrumental in shaping my career path.",
        photo: media?.find(m => m.file_name === "coding-laptop.jpg")?.file_url,
        display_order: 1,
        is_featured: true,
        location: "Seattle, WA",
        linkedin: "https://linkedin.com"
      },
      {
        name: "Emily Davis",
        batch: "2021",
        current_position: "Data Scientist",
        organization: "Amazon",
        testimonial: "Great community and learning resources.",
        photo: media?.find(m => m.file_name === "tech-meeting.jpg")?.file_url,
        display_order: 2,
        is_featured: true,
        location: "Austin, TX"
      },
    ];
    const { error: alumniError } = await supabase.from("alumni").insert(alumniData);
    if (alumniError) throw alumniError;

    // 9. Insert Blog Posts
    console.log("Inserting blog posts...");
    const blogPostsData = [
      {
        title: "The Rise of Generative AI",
        slug: "rise-of-generative-ai",
        content: "Generative AI is transforming industries... (Full article content)",
        excerpt: "Exploring the impact of tools like ChatGPT and Gemini on the tech landscape.",
        featured_image: media?.find(m => m.file_name === "coding-laptop.jpg")?.file_url,
        status: "published",
        published_at: new Date().toISOString(),
        author: "Dr. Sarah Mitchell",
        category: "Technology",
        tags: ["AI", "Future", "Tech"]
      },
      {
        title: "Web Development Trends in 2024",
        slug: "web-dev-trends-2024",
        content: "From server components to edge computing... (Full article content)",
        excerpt: "What every developer needs to know about the latest web technologies.",
        featured_image: media?.find(m => m.file_name === "tech-meeting.jpg")?.file_url,
        status: "published",
        published_at: new Date(Date.now() - 86400000 * 5).toISOString(),
        author: "James Wilson",
        category: "Development",
        tags: ["Web", "Frontend", "Backend"]
      },
    ];
    const { error: blogPostsError } = await supabase.from("blog_posts").insert(blogPostsData);
    if (blogPostsError) throw blogPostsError;

    // 10. Insert Events
    console.log("Inserting events...");
    const eventsData = [
      {
        title: "Global Tech Summit 2024",
        date: new Date(Date.now() + 86400000 * 45).toISOString(),
        description: "Join us for a day of inspiring talks and networking.",
        location: "Convention Center",
        image_url: media?.find(m => m.file_name === "conference.jpg")?.file_url,
        is_upcoming: true,
        type: "conference"
      },
      {
        title: "Hackathon: Code for Good",
        date: new Date(Date.now() + 86400000 * 15).toISOString(),
        description: "48-hour hackathon to build solutions for social impact.",
        location: "Innovation Hub",
        image_url: media?.find(m => m.file_name === "coding-laptop.jpg")?.file_url,
        is_upcoming: true,
        type: "competition"
      },
      {
        title: "Past Workshop: Intro to Python",
        date: new Date(Date.now() - 86400000 * 20).toISOString(),
        description: "A beginner-friendly workshop on Python programming.",
        location: "Room 304",
        image_url: media?.find(m => m.file_name === "tech-meeting.jpg")?.file_url,
        is_upcoming: false,
        type: "workshop"
      },
    ];
    const { error: eventsError } = await supabase.from("events").insert(eventsData);
    if (eventsError) throw eventsError;

    // 11. Insert Members
    console.log("Inserting members...");
    const membersData = [
      {
        name: "David Chen",
        role: "President",
        team: "Core Committee",
        bio: "Computer Science senior passionate about community building.",
        image_url: media?.find(m => m.file_name === "tech-meeting.jpg")?.file_url,
        display_order: 1,
        is_active: true,
        email: "david.chen@example.com",
        linkedin: "https://linkedin.com"
      },
      {
        name: "Lisa Wong",
        role: "Technical Lead",
        team: "Technical Team",
        bio: "Full-stack developer and open source enthusiast.",
        image_url: media?.find(m => m.file_name === "coding-laptop.jpg")?.file_url,
        display_order: 2,
        is_active: true,
        email: "lisa.wong@example.com"
      },
    ];
    const { error: membersError } = await supabase.from("members").insert(membersData);
    if (membersError) throw membersError;

    // 12. Insert Projects
    console.log("Inserting projects...");
    const projectsData = [
      {
        title: "Campus Connect",
        description: "A centralized platform for student services and announcements.",
        status: "completed",
        progress: 100,
        image_url: media?.find(m => m.file_name === "tech-meeting.jpg")?.file_url,
        category: "Web App",
        lead: "David Chen",
        team_members: ["Lisa Wong", "John Doe"]
      },
      {
        title: "AI Research Assistant",
        description: "Developing an AI tool to help students find research papers.",
        status: "ongoing",
        progress: 45,
        image_url: media?.find(m => m.file_name === "coding-laptop.jpg")?.file_url,
        category: "AI/ML",
        lead: "Lisa Wong",
        team_members: ["Alice Smith"]
      },
    ];
    const { error: projectsError } = await supabase.from("projects").insert(projectsData);
    if (projectsError) throw projectsError;

    console.log("Seed process completed successfully!");
    return { success: true };
  } catch (error) {
    console.error("Seed process failed:", error);
    return { success: false, error };
  }
};
