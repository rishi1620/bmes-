import { Database, Tables } from "./types";

export type TableName = keyof Database["public"]["Tables"];

const INITIAL_SITE_SETTINGS: Record<string, string> = {
  site_title: "BMES CUET",
  site_name: "CUET BMES",
  site_tagline: "Biomedical Engineering Society",
  meta_description: "Biomedical Engineering Society - Chittagong University of Engineering & Technology Student Chapter",
  logo_url: "",
  favicon_url: "",
  primary_color: "#0d9488",
  secondary_color: "#0284c7",
  footer_text: "© BMES CUET Student Chapter. All rights reserved.",
  contact_email: "bmes@cuet.ac.bd",
  contact_phone: "+880 1700-000000",
  contact_address: "Department of Biomedical Engineering, CUET, Chattogram-4349, Bangladesh",
  facebook_url: "https://facebook.com/cuetbmes",
  instagram_url: "https://instagram.com/cuetbmes",
  linkedin_url: "https://linkedin.com/company/cuetbmes",
  twitter_url: "https://twitter.com/cuetbmes",
  youtube_url: "https://youtube.com/@cuetbmes",
  home_hero_title: "Biomedical Engineering Society",
  portal_notices_json: JSON.stringify([
    {
      id: "1",
      title: "BMES Executive Committee Recruitment 2026",
      category: "club",
      date: "2026-05-15",
      content: "Applications are open for sub-executive and committee positions for the 2026-2027 term. Enrolled BME students can submit applications via the portal."
    },
    {
      id: "2",
      title: "Biomedical Innovation & Design Hackathon 2026",
      category: "club",
      date: "2026-06-10",
      content: "Annual 48-hour health-tech hackathon focusing on AI-assisted diagnostics and accessible rehabilitation robotics."
    },
    {
      id: "3",
      title: "Departmental Research Colloquium & Seminar Series",
      category: "departmental",
      date: "2026-05-20",
      content: "Monthly research presentation by undergraduate and postgraduate researchers in Department Seminar Hall."
    }
  ])
};

const INITIAL_HOME_SECTIONS: Tables<"home_sections">[] = [
  {
    id: "sec-hero-1",
    section_key: "hero",
    section_data: {
      title: "Biomedical Engineering Society",
      subtitle: "Chittagong University of Engineering & Technology",
      description: "Bridging engineering and medicine — advancing healthcare innovation through research, collaboration, and community since our founding at CUET.",
      button_text: "Join BMES",
      button_link: "/portal",
      button2_text: "Explore Projects",
      button2_link: "/projects",
      background_image: ""
    },
    is_visible: true,
    display_order: 1,
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z"
  },
  {
    id: "sec-stats-2",
    section_key: "stats",
    section_data: {
      items: [
        { value: "250+", label: "Active Members" },
        { value: "80+", label: "Alumni Worldwide" },
        { value: "35+", label: "Innovative Projects" },
        { value: "45+", label: "Workshops & Events" }
      ]
    },
    is_visible: true,
    display_order: 2,
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z"
  },
  {
    id: "sec-features-3",
    section_key: "features",
    section_data: {
      badge: "What We Do",
      title: "Empowering Future Biomedical Engineers",
      description: "From hands-on research to industry mentorship, BMES provides the tools and community to help you excel.",
      items: [
        {
          icon: "FlaskConical",
          title: "Research Projects",
          desc: "Collaborative research in biomedical signal processing, biomechanics, prosthetics, and medical imaging."
        },
        {
          icon: "Users",
          title: "Mentorship & Community",
          desc: "Connect with faculty and alumni mentors working in top healthcare, medical device, and research institutions."
        },
        {
          icon: "Calendar",
          title: "Events & Workshops",
          desc: "Hands-on workshops in MATLAB, Python for Biosignals, PCB design for medical hardware, and hackathons."
        },
        {
          icon: "BookOpen",
          title: "Publications",
          desc: "Guidance and platform to publish undergraduate research papers in indexed journals and IEEE conferences."
        },
        {
          icon: "Award",
          title: "Achievements & Awards",
          desc: "Celebrating national and international competition wins, innovation grants, and academic excellence."
        },
        {
          icon: "Microscope",
          title: "Lab & Development Access",
          desc: "Access to society equipment, sensor kits, microcontroller modules, and collaborative design tools."
        }
      ]
    },
    is_visible: true,
    display_order: 3,
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z"
  },
  {
    id: "sec-cta-4",
    section_key: "cta",
    section_data: {
      title: "Ready to Make an Impact in Healthcare Engineering?",
      description: "Join CUET BMES and be part of the next generation of biomedical innovators shaping patient care.",
      button_text: "Get in Touch",
      button_link: "/contact"
    },
    is_visible: true,
    display_order: 4,
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z"
  }
];

const INITIAL_PAGES: Tables<"pages">[] = [
  { id: "page-1", page_name: "Home", slug: "/", display_order: 1, is_visible: true, created_at: "2026-01-01T00:00:00Z", updated_at: "2026-01-01T00:00:00Z" },
  { id: "page-2", page_name: "About", slug: "/about", display_order: 2, is_visible: true, created_at: "2026-01-01T00:00:00Z", updated_at: "2026-01-01T00:00:00Z" },
  { id: "page-3", page_name: "Members", slug: "/people", display_order: 3, is_visible: true, created_at: "2026-01-01T00:00:00Z", updated_at: "2026-01-01T00:00:00Z" },
  { id: "page-4", page_name: "Projects", slug: "/projects", display_order: 4, is_visible: true, created_at: "2026-01-01T00:00:00Z", updated_at: "2026-01-01T00:00:00Z" },
  { id: "page-5", page_name: "Events", slug: "/events", display_order: 5, is_visible: true, created_at: "2026-01-01T00:00:00Z", updated_at: "2026-01-01T00:00:00Z" },
  { id: "page-6", page_name: "Blog", slug: "/blog", display_order: 6, is_visible: true, created_at: "2026-01-01T00:00:00Z", updated_at: "2026-01-01T00:00:00Z" },
  { id: "page-7", page_name: "Achievements", slug: "/achievements", display_order: 7, is_visible: true, created_at: "2026-01-01T00:00:00Z", updated_at: "2026-01-01T00:00:00Z" },
  { id: "page-8", page_name: "Alumni", slug: "/alumni", display_order: 8, is_visible: true, created_at: "2026-01-01T00:00:00Z", updated_at: "2026-01-01T00:00:00Z" },
  { id: "page-9", page_name: "Portal", slug: "/portal", display_order: 9, is_visible: true, created_at: "2026-01-01T00:00:00Z", updated_at: "2026-01-01T00:00:00Z" },
  { id: "page-10", page_name: "Notices", slug: "/notices", display_order: 10, is_visible: true, created_at: "2026-01-01T00:00:00Z", updated_at: "2026-01-01T00:00:00Z" },
  { id: "page-11", page_name: "Contact", slug: "/contact", display_order: 11, is_visible: true, created_at: "2026-01-01T00:00:00Z", updated_at: "2026-01-01T00:00:00Z" }
];

const INITIAL_EVENTS: Tables<"events">[] = [
  {
    id: "evt-1",
    title: "National Bio-Innovation Summit 2026",
    description: "A flagship national gathering uniting medical device researchers, biomedical engineers, clinicians, and student innovators across Bangladesh.",
    date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
    location: "CUET Central Auditorium, Chattogram",
    type: "Conference",
    image_url: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=80",
    is_upcoming: true,
    registration_start_date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    registration_end_date: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000).toISOString(),
    created_at: "2026-01-10T10:00:00Z",
    updated_at: "2026-01-10T10:00:00Z"
  },
  {
    id: "evt-2",
    title: "Workshop on EMG Signal Acquisition & Prosthetic Hand Control",
    description: "Hands-on workshop covering surface electromyography (sEMG) sensor interfacing, signal filtering with DSP, and servo motor control for prosthetics.",
    date: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString(),
    location: "BME Hardware & Embedded Systems Lab",
    type: "Workshop",
    image_url: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800&auto=format&fit=crop&q=80",
    is_upcoming: true,
    registration_start_date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    registration_end_date: new Date(Date.now() + 18 * 24 * 60 * 60 * 1000).toISOString(),
    created_at: "2026-01-12T10:00:00Z",
    updated_at: "2026-01-12T10:00:00Z"
  },
  {
    id: "evt-3",
    title: "AI in Medical Image Computing & Diagnostic Radiology",
    description: "Explore state-of-the-art deep learning architectures for MRI, CT scan segmentation, and automated lesion detection in clinical datasets.",
    date: new Date(Date.now() + 35 * 24 * 60 * 60 * 1000).toISOString(),
    location: "Online (Zoom / Hybrid Seminar Room)",
    type: "Seminar",
    image_url: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&auto=format&fit=crop&q=80",
    is_upcoming: true,
    registration_start_date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    registration_end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    created_at: "2026-01-15T10:00:00Z",
    updated_at: "2026-01-15T10:00:00Z"
  },
  {
    id: "evt-4",
    title: "Introductory PCB Design for Wearable Biosensors",
    description: "Comprehensive tutorial on KiCad, analog front-end routing for ECG/PPG, noise reduction techniques, and manufacturing guidelines.",
    date: "2026-02-14T09:00:00Z",
    location: "Department Computer Lab 2",
    type: "Workshop",
    image_url: "https://images.unsplash.com/photo-1517077304055-6e89abbf09b0?w=800&auto=format&fit=crop&q=80",
    is_upcoming: false,
    registration_start_date: "2026-01-20T00:00:00Z",
    registration_end_date: "2026-02-10T00:00:00Z",
    created_at: "2026-01-05T10:00:00Z",
    updated_at: "2026-01-05T10:00:00Z"
  }
];

const INITIAL_BLOG_POSTS: Tables<"blog_posts">[] = [
  {
    id: "post-1",
    title: "Advancements in Neural Prosthetics & Brain-Computer Interfaces",
    slug: "advancements-in-neural-prosthetics-and-bci",
    excerpt: "How modern neural signal processing algorithms and microelectrode arrays are enabling intuitive prosthetic control for amputees.",
    content: `## Bridging Biology and Silicon

Neural prosthetics have transitioned from sci-fi concepts into clinically tested devices that restore mobility and sensory feedback to individuals with severe neuromuscular disabilities.

### Surface EMG vs. Invasive Neural Interfaces
While non-invasive surface electromyography (sEMG) remains the gold standard for commercial bionic limbs due to safety and ease of use, intracranial electrocorticography (ECoG) and intracortical arrays provide significantly higher spatial resolution and multi-degree-of-freedom control.

### Current Research at CUET BMES
Our undergraduate research teams are currently developing embedded edge-AI classifiers capable of decoding multi-channel EMG signals with under 50ms latency using ultra-low-power microcontrollers.

> "The combination of low-cost 3D printing and smart pattern recognition is democratizing advanced prosthetics for developing nations."

Stay tuned for our upcoming open-source prosthetic toolkit release!`,
    featured_image: "https://images.unsplash.com/photo-1530497610245-94d3c16cda28?w=800&auto=format&fit=crop&q=80",
    category: "Prosthetics & Rehabilitation",
    tags: ["Neural Engineering", "EMG", "Robotics", "Research"],
    status: "published",
    author: "BMES Research Team",
    external_url: null,
    published_at: "2026-03-01T12:00:00Z",
    created_at: "2026-03-01T12:00:00Z",
    updated_at: "2026-03-01T12:00:00Z"
  },
  {
    id: "post-2",
    title: "AI in Medical Diagnostics: Transforming Healthcare in Bangladesh",
    slug: "ai-in-medical-diagnostics-bangladesh",
    excerpt: "Exploring practical applications of computer vision in chest X-ray screening, diabetic retinopathy detection, and rural telemedicine.",
    content: `## Expanding Healthcare Access Through Intelligent Algorithms

In countries with limited specialist physicians per capita, AI-assisted screening systems offer tremendous potential for early triage and accurate second opinions.

### Key Focus Areas:
1. **Automated Tuberculosis & Pneumonia Detection**: Utilizing lightweight Convolutional Neural Networks on edge devices for rural clinics.
2. **Tele-Ophthalmology**: Screening for diabetic retinopathy from standard fundus camera photos.
3. **ECG Arrhythmia Classification**: Continuous 24-hour monitoring with wearable patches.

Through collaborative projects between CUET BME students and local healthcare providers, we are actively validating these models on diverse local patient datasets.`,
    featured_image: "https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=800&auto=format&fit=crop&q=80",
    category: "Healthcare AI",
    tags: ["Artificial Intelligence", "Medical Imaging", "Telemedicine"],
    status: "published",
    author: "Academic & Tech Wing",
    external_url: null,
    published_at: "2026-02-18T10:00:00Z",
    created_at: "2026-02-18T10:00:00Z",
    updated_at: "2026-02-18T10:00:00Z"
  },
  {
    id: "post-3",
    title: "Getting Started with Biomedical Signal Processing in Python",
    slug: "getting-started-with-biosignal-processing-python",
    excerpt: "A beginner-friendly guide to filtering, feature extraction, and frequency analysis for ECG, EEG, and PPG signals.",
    content: `## A Hands-On Guide for BME Students

Python has become the premier language for biomedical signal processing thanks to libraries like NumPy, SciPy, BioSPPy, and NeuroKit2.

### Step 1: Bandpass Filtering
Raw biosignals typically carry powerline interference (50/60 Hz) and baseline wander. Applying a Butterworth bandpass filter is essential:

\`\`\`python
from scipy.signal import butter, filtfilt

def butter_bandpass_filter(data, lowcut, highcut, fs, order=4):
    nyquist = 0.5 * fs
    low = lowcut / nyquist
    high = highcut / nyquist
    b, a = butter(order, [low, high], btype='band')
    y = filtfilt(b, a, data)
    return y
\`\`\`

Join our upcoming workshop series to dive deeper into real-time peak detection and time-frequency analysis!`,
    featured_image: "https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=800&auto=format&fit=crop&q=80",
    category: "Tutorials",
    tags: ["Python", "DSP", "Biosignals", "Education"],
    status: "published",
    author: "CUET BMES Workshop Committee",
    external_url: null,
    published_at: "2026-01-28T09:00:00Z",
    created_at: "2026-01-28T09:00:00Z",
    updated_at: "2026-01-28T09:00:00Z"
  }
];

const INITIAL_PROJECTS: Tables<"projects">[] = [
  {
    id: "proj-1",
    title: "Low-Cost Smart Prosthetic Hand with Multichannel EMG",
    description: "An affordable 3D-printed bionic prosthetic hand powered by lightweight brushless motors and pattern-recognition EMG classification.",
    category: "Biomechanics & Robotics",
    lead: "Swoptorshi Dastidar",
    team_members: ["Swoptorshi Dastidar", "A. Rahman", "S. Chowdhury", "F. Hossain"],
    progress: 85,
    status: "ongoing",
    image_url: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800&auto=format&fit=crop&q=80",
    created_at: "2026-01-05T00:00:00Z",
    updated_at: "2026-01-05T00:00:00Z"
  },
  {
    id: "proj-2",
    title: "Non-Invasive Optical Blood Glucose Monitoring Device",
    description: "Near-infrared (NIR) spectrophotometry and photoplethysmography sensor array to estimate blood glucose levels continuously without skin pricking.",
    category: "Biomedical Instrumentation",
    lead: "T. Mahmud",
    team_members: ["T. Mahmud", "N. Sultana", "R. Islam"],
    progress: 70,
    status: "ongoing",
    image_url: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&auto=format&fit=crop&q=80",
    created_at: "2026-01-08T00:00:00Z",
    updated_at: "2026-01-08T00:00:00Z"
  },
  {
    id: "proj-3",
    title: "Deep Learning Model for Multi-Class Arrhythmia Detection",
    description: "12-lead ECG beat classification using customized Transformer architectures achieving 98.4% diagnostic sensitivity on the MIT-BIH dataset.",
    category: "Healthcare AI",
    lead: "M. Ahmed",
    team_members: ["M. Ahmed", "K. Farhan", "Z. Hasan"],
    progress: 95,
    status: "completed",
    image_url: "https://images.unsplash.com/photo-1530497610245-94d3c16cda28?w=800&auto=format&fit=crop&q=80",
    created_at: "2026-01-02T00:00:00Z",
    updated_at: "2026-01-02T00:00:00Z"
  }
];

const INITIAL_ACHIEVEMENTS: Tables<"achievements">[] = [
  {
    id: "ach-1",
    title: "1st Runner Up - National Health-Tech Innovation Challenge 2025",
    description: "Awarded for designing a low-cost automated neonatal incubator monitoring system with remote telemetry.",
    category: "competition",
    year: "2025",
    team: "CUET BioMinds",
    place: "Dhaka, Bangladesh",
    journal: null,
    authors: null,
    doi: null,
    amount: "BDT 100,000",
    status: "Awarded",
    outlet: null,
    date_text: "December 2025",
    media_type: null,
    image_url: "https://images.unsplash.com/photo-1567427017947-545c5f8d16ad?w=800&auto=format&fit=crop&q=80",
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z"
  },
  {
    id: "ach-2",
    title: "IEEE EMBC 2025 Best Undergraduate Research Paper",
    description: "Paper titled 'Feature Extraction in Multi-channel Surface EMG for Dexterous Prosthetic Control' recognized at international flagship conference.",
    category: "publication",
    year: "2025",
    team: null,
    place: "Sydney, Australia",
    journal: "IEEE Transactions on Neural Systems & Rehabilitation",
    authors: "S. Dastidar, et al.",
    doi: "10.1109/TNSRE.2025.1234567",
    amount: null,
    status: "Published",
    outlet: null,
    date_text: "October 2025",
    media_type: null,
    image_url: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800&auto=format&fit=crop&q=80",
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z"
  },
  {
    id: "ach-3",
    title: "ICT Division Research & Innovation Grant 2025-2026",
    description: "Competitive funding secured for development and clinical pilot testing of smart wearable biosensing patches.",
    category: "grant",
    year: "2025",
    team: "BMES Innovation Lab",
    place: "CUET",
    journal: null,
    authors: null,
    doi: null,
    amount: "BDT 500,000",
    status: "Active",
    outlet: null,
    date_text: "November 2025",
    media_type: null,
    image_url: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=800&auto=format&fit=crop&q=80",
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z"
  }
];

const INITIAL_MEMBERS: Tables<"members">[] = [
  {
    id: "mem-1",
    name: "Swoptorshi Dastidar",
    role: "President",
    department: "Biomedical Engineering",
    image_url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80",
    team: "Executive Committee",
    bio: "Passionate about biosignal processing, embedded neural prosthetics, and leading student engineering initiatives.",
    email: "u2111008@student.cuet.ac.bd",
    linkedin: "https://linkedin.com",
    is_active: true,
    display_order: 1,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z"
  },
  {
    id: "mem-2",
    name: "Anika Tahsin",
    role: "General Secretary",
    department: "Biomedical Engineering",
    image_url: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&auto=format&fit=crop&q=80",
    team: "Executive Committee",
    bio: "Focusing on medical device regulations, clinical engineering, and organizing national student symposiums.",
    email: "u2111015@student.cuet.ac.bd",
    linkedin: "https://linkedin.com",
    is_active: true,
    display_order: 2,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z"
  },
  {
    id: "mem-3",
    name: "Tanvir Hasan",
    role: "Vice President (Research & Tech)",
    department: "Biomedical Engineering",
    image_url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80",
    team: "Executive Committee",
    bio: "Deep learning enthusiast working on computer vision for oncology imaging and magnetic resonance spectroscopy.",
    email: "u2111022@student.cuet.ac.bd",
    linkedin: "https://linkedin.com",
    is_active: true,
    display_order: 3,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z"
  }
];

const INITIAL_ADVISORS: Tables<"advisors">[] = [
  {
    id: "adv-1",
    name: "Dr. Md. Mostafa Kamal",
    designation: "Professor & Head",
    department: "Department of Biomedical Engineering",
    photo: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80",
    role_type: "Chief Patron",
    bio: "Pioneering biomedical engineering education and research at CUET with expertise in medical instrumentation and biosensors.",
    email: "headbme@cuet.ac.bd",
    linkedin: "https://linkedin.com",
    display_order: 1,
    is_active: true,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z"
  },
  {
    id: "adv-2",
    name: "Dr. Farzana Rahman",
    designation: "Associate Professor",
    department: "Department of Biomedical Engineering",
    photo: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&auto=format&fit=crop&q=80",
    role_type: "Faculty Advisor",
    bio: "Specializing in biomechanics, computational biomaterials, and mentoring undergraduate innovation teams.",
    email: "farzana@cuet.ac.bd",
    linkedin: "https://linkedin.com",
    display_order: 2,
    is_active: true,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z"
  }
];

const INITIAL_ALUMNI: Tables<"alumni">[] = [
  {
    id: "alm-1",
    name: "Kazi Nayeem",
    batch: "2016",
    current_position: "Senior Biomedical Engineer",
    organization: "Siemens Healthineers",
    location: "Erlangen, Germany",
    photo: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&auto=format&fit=crop&q=80",
    testimonial: "CUET BMES provided me with the research rigor, hands-on hardware exposure, and leadership platform that propelled my international career in medical technology.",
    linkedin: "https://linkedin.com",
    is_featured: true,
    display_order: 1,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z"
  },
  {
    id: "alm-2",
    name: "Sadia Afrin",
    batch: "2018",
    current_position: "Postdoctoral Research Fellow",
    organization: "Johns Hopkins Medicine",
    location: "Baltimore, USA",
    photo: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=400&auto=format&fit=crop&q=80",
    testimonial: "The collaborative culture and early research opportunities at CUET BMES laid the foundation for my PhD and clinical AI research.",
    linkedin: "https://linkedin.com",
    is_featured: true,
    display_order: 2,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z"
  }
];

// Helper to load/save in localStorage
function getLocalTable<T>(tableName: string, defaultData: T[]): T[] {
  try {
    const key = `cuet_bmes_db_${tableName}`;
    const raw = localStorage.getItem(key);
    if (!raw) {
      localStorage.setItem(key, JSON.stringify(defaultData));
      return defaultData;
    }
    return JSON.parse(raw) as T[];
  } catch {
    return defaultData;
  }
}

function saveLocalTable<T>(tableName: string, data: T[]) {
  try {
    const key = `cuet_bmes_db_${tableName}`;
    localStorage.setItem(key, JSON.stringify(data));
  } catch {
    // ignore
  }
}

function getSiteSettings(): Tables<"site_settings">[] {
  const defaultList: Tables<"site_settings">[] = Object.entries(INITIAL_SITE_SETTINGS).map(([k, v], idx) => ({
    id: `setting-${idx + 1}`,
    setting_key: k,
    setting_value: v,
    setting_group: "general",
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z"
  }));
  return getLocalTable("site_settings", defaultList);
}

// Handler for all mock PostgREST requests
export function handlePostgrestFallback(
  urlStr: string,
  method = "GET",
  body?: unknown
): { status: number; data: unknown } {
  let url: URL;
  try {
    url = new URL(urlStr);
  } catch {
    url = new URL(urlStr, "https://placeholder-project.supabase.co");
  }

  const path = url.pathname;
  const match = path.match(/\/rest\/v1\/([a-zA-Z0-9_]+)/);
  if (!match) {
    return { status: 200, data: [] };
  }

  const tableName = match[1] as TableName;
  const searchParams = url.searchParams;

  // Retrieve data for table
  let tableData: Record<string, unknown>[] = [];
  switch (tableName) {
    case "site_settings":
      tableData = getSiteSettings() as unknown as Record<string, unknown>[];
      break;
    case "home_sections":
      tableData = getLocalTable("home_sections", INITIAL_HOME_SECTIONS) as unknown as Record<string, unknown>[];
      break;
    case "pages":
      tableData = getLocalTable("pages", INITIAL_PAGES) as unknown as Record<string, unknown>[];
      break;
    case "events":
      tableData = getLocalTable("events", INITIAL_EVENTS) as unknown as Record<string, unknown>[];
      break;
    case "blog_posts":
      tableData = getLocalTable("blog_posts", INITIAL_BLOG_POSTS) as unknown as Record<string, unknown>[];
      break;
    case "projects":
      tableData = getLocalTable("projects", INITIAL_PROJECTS) as unknown as Record<string, unknown>[];
      break;
    case "achievements":
      tableData = getLocalTable("achievements", INITIAL_ACHIEVEMENTS) as unknown as Record<string, unknown>[];
      break;
    case "members":
      tableData = getLocalTable("members", INITIAL_MEMBERS) as unknown as Record<string, unknown>[];
      break;
    case "advisors":
      tableData = getLocalTable("advisors", INITIAL_ADVISORS) as unknown as Record<string, unknown>[];
      break;
    case "alumni":
      tableData = getLocalTable("alumni", INITIAL_ALUMNI) as unknown as Record<string, unknown>[];
      break;
    case "user_roles":
      tableData = getLocalTable("user_roles", [
        { id: "ur-1", user_id: "demo-user-id", role: "admin" }
      ]) as unknown as Record<string, unknown>[];
      break;
    case "profiles":
      tableData = getLocalTable("profiles", [
        { id: "demo-user-id", user_id: "demo-user-id", full_name: "Demo Admin", avatar_url: null, created_at: "2026-01-01T00:00:00Z" }
      ]) as unknown as Record<string, unknown>[];
      break;
    case "contact_submissions":
      tableData = getLocalTable("contact_submissions", []) as unknown as Record<string, unknown>[];
      break;
    case "event_registrations":
      tableData = getLocalTable("event_registrations", []) as unknown as Record<string, unknown>[];
      break;
    case "membership_registrations":
      tableData = getLocalTable("membership_registrations", []) as unknown as Record<string, unknown>[];
      break;
    case "media_library":
      tableData = getLocalTable("media_library", []) as unknown as Record<string, unknown>[];
      break;
    default:
      tableData = getLocalTable(tableName, []) as unknown as Record<string, unknown>[];
  }

  // Handle mutations
  if (method === "POST") {
    const bodyArray = Array.isArray(body) ? body : [body as Record<string, unknown>];
    const newItems = bodyArray.map((item, i) => ({
      id: (item as Record<string, unknown>)?.id || `mock-${Date.now()}-${i}`,
      created_at: (item as Record<string, unknown>)?.created_at || new Date().toISOString(),
      updated_at: (item as Record<string, unknown>)?.updated_at || new Date().toISOString(),
      ...(item as Record<string, unknown>)
    }));
    const updated = [...tableData, ...newItems];
    saveLocalTable(tableName, updated);
    return { status: 201, data: Array.isArray(body) ? newItems : newItems[0] };
  }

  if (method === "PATCH" || method === "PUT") {
    // Simple ID or match patch
    const idFilter = searchParams.get("id");
    const keyFilter = searchParams.get("setting_key");
    const updateBody = (body || {}) as Record<string, unknown>;
    const updated = tableData.map((item) => {
      let matchPatch = false;
      if (idFilter && (idFilter.startsWith("eq.") ? item.id === idFilter.replace("eq.", "") : item.id === idFilter)) {
        matchPatch = true;
      }
      if (keyFilter && (keyFilter.startsWith("eq.") ? item.setting_key === keyFilter.replace("eq.", "") : item.setting_key === keyFilter)) {
        matchPatch = true;
      }
      if (matchPatch) {
        return { ...item, ...updateBody, updated_at: new Date().toISOString() };
      }
      return item;
    });
    saveLocalTable(tableName, updated);
    return { status: 200, data: body };
  }

  if (method === "DELETE") {
    const idFilter = searchParams.get("id");
    if (idFilter) {
      const targetId = idFilter.startsWith("eq.") ? idFilter.replace("eq.", "") : idFilter;
      const updated = tableData.filter((item) => item.id !== targetId);
      saveLocalTable(tableName, updated);
    }
    return { status: 200, data: [] };
  }

  // GET Queries - Filter & Sort & Limit
  let result = [...tableData];

  // Process filters
  searchParams.forEach((val, key) => {
    if (["select", "order", "limit", "offset"].includes(key)) return;

    if (key === "or") {
      // e.g. (is_upcoming.eq.true,date.gte.2026-08-25T18:00:00.000Z)
      // Allow items that match any or-clause
      return;
    }

    if (val.startsWith("eq.")) {
      const target = val.slice(3);
      result = result.filter((item) => {
        const itemVal = item[key];
        if (typeof itemVal === "boolean") return String(itemVal) === target;
        if (typeof itemVal === "number") return itemVal === Number(target);
        return String(itemVal) === target;
      });
    } else if (val.startsWith("neq.")) {
      const target = val.slice(4);
      result = result.filter((item) => String(item[key]) !== target);
    } else if (val.startsWith("in.")) {
      // e.g. (logo_url,site_title)
      const list = val.replace(/^\(|\)$/g, "").replace(/^in\./, "").replace(/^\(|\)$/g, "").split(",");
      result = result.filter((item) => list.includes(String(item[key])));
    } else if (val.startsWith("is.")) {
      const target = val.slice(3);
      if (target === "null") result = result.filter((item) => item[key] == null);
      if (target === "true") result = result.filter((item) => item[key] === true);
      if (target === "false") result = result.filter((item) => item[key] === false);
    }
  });

  // Handle order
  const order = searchParams.get("order");
  if (order) {
    const [col, dir] = order.split(".");
    const ascending = dir !== "desc";
    result.sort((a, b) => {
      const valA = a[col];
      const valB = b[col];
      if (valA == null) return 1;
      if (valB == null) return -1;
      if (valA < valB) return ascending ? -1 : 1;
      if (valA > valB) return ascending ? 1 : -1;
      return 0;
    });
  }

  // Handle limit / offset
  const offset = parseInt(searchParams.get("offset") || "0", 10);
  const limit = parseInt(searchParams.get("limit") || "1000", 10);
  result = result.slice(offset, offset + limit);

  // If single request via accept header or query like .single()
  return { status: 200, data: result };
}

// Handler for all mock Supabase Auth requests
export function handleAuthFallback(
  urlString: string,
  _method?: string,
  body?: unknown,
  headers?: Headers
): { status: number; data: unknown } {
  let url: URL;
  try {
    url = new URL(urlString);
  } catch {
    url = new URL(urlString, "https://placeholder-project.supabase.co");
  }

  const path = url.pathname;
  const reqBody = (body || {}) as Record<string, unknown>;

  // Token endpoint (login with password or refresh)
  if (path.includes("/token")) {
    const email = (reqBody.email as string) || "hrictikdastidar@gmail.com";
    const userId = "admin-user-" + email.replace(/[^a-zA-Z0-9]/g, "_");
    const fullName = email.split("@")[0];

    // Ensure this user has admin role in local user_roles
    const userRoles = getLocalTable("user_roles", [
      { id: "ur-1", user_id: "demo-user-id", role: "admin" }
    ]);
    if (!userRoles.some((r) => (r as Record<string, unknown>).user_id === userId && (r as Record<string, unknown>).role === "admin")) {
      userRoles.push({ id: `ur-${Date.now()}`, user_id: userId, role: "admin" });
      saveLocalTable("user_roles", userRoles);
    }

    const userData = {
      id: userId,
      aud: "authenticated",
      role: "authenticated",
      email: email,
      email_confirmed_at: new Date().toISOString(),
      phone: "",
      user_metadata: { full_name: fullName },
      app_metadata: { provider: "email", providers: ["email"] },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    return {
      status: 200,
      data: {
        access_token: `mock-jwt-token-${userId}`,
        token_type: "bearer",
        expires_in: 3600,
        refresh_token: `mock-refresh-token-${userId}`,
        user: userData
      }
    };
  }

  // Signup endpoint
  if (path.includes("/signup")) {
    const email = (reqBody.email as string) || "user@student.cuet.ac.bd";
    const meta = (reqBody.data as Record<string, unknown>) || {};
    const fullName = (meta.full_name as string) || email.split("@")[0];
    const userId = "user-" + Date.now();

    const userRoles = getLocalTable("user_roles", [
      { id: "ur-1", user_id: "demo-user-id", role: "admin" }
    ]);
    userRoles.push({ id: `ur-${Date.now()}`, user_id: userId, role: "admin" });
    saveLocalTable("user_roles", userRoles);

    const userData = {
      id: userId,
      aud: "authenticated",
      role: "authenticated",
      email: email,
      email_confirmed_at: new Date().toISOString(),
      phone: "",
      user_metadata: { full_name: fullName },
      app_metadata: { provider: "email", providers: ["email"] },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    return {
      status: 200,
      data: {
        access_token: `mock-jwt-token-${userId}`,
        token_type: "bearer",
        expires_in: 3600,
        refresh_token: `mock-refresh-token-${userId}`,
        user: userData
      }
    };
  }

  // Current user endpoint (/user)
  if (path.includes("/user")) {
    const authHeader = headers?.get("authorization") || headers?.get("Authorization") || "";
    if (authHeader.includes("mock-jwt-token-")) {
      const userId = authHeader.replace("Bearer ", "").replace("mock-jwt-token-", "");
      const email = userId.startsWith("admin-user-") ? userId.replace("admin-user-", "") : "hrictikdastidar@gmail.com";
      return {
        status: 200,
        data: {
          id: userId,
          aud: "authenticated",
          role: "authenticated",
          email: email,
          email_confirmed_at: new Date().toISOString(),
          phone: "",
          user_metadata: { full_name: "Admin User" },
          app_metadata: { provider: "email", providers: ["email"] },
          created_at: "2026-01-01T00:00:00.000Z",
          updated_at: "2026-01-01T00:00:00.000Z"
        }
      };
    }

    return {
      status: 200,
      data: {
        id: "demo-user-id",
        aud: "authenticated",
        role: "authenticated",
        email: "hrictikdastidar@gmail.com",
        email_confirmed_at: "2026-01-01T00:00:00.000Z",
        phone: "",
        user_metadata: { full_name: "Swoptorshi Dastidar" },
        app_metadata: { provider: "email", providers: ["email"] },
        created_at: "2026-01-01T00:00:00.000Z",
        updated_at: "2026-01-01T00:00:00.000Z"
      }
    };
  }

  // Password reset / recover / logout
  if (path.includes("/recover") || path.includes("/logout") || path.includes("/verify")) {
    return { status: 200, data: {} };
  }

  return { status: 200, data: {} };
}

interface StorageFile {
  name: string;
  id: string;
  updated_at: string;
  created_at: string;
  last_accessed_at: string;
  metadata: {
    size: number;
    mimetype: string;
  };
}

// Handler for mock Supabase Storage requests
export function handleStorageFallback(
  urlString: string,
  method = "GET",
  body?: unknown
): { status: number; data: unknown } {
  let url: URL;
  try {
    url = new URL(urlString);
  } catch {
    url = new URL(urlString, "https://placeholder-project.supabase.co");
  }

  const path = url.pathname;
  const storageFiles = getLocalTable<StorageFile>("storage_media_files", [
    {
      name: "hero-bg.jpg",
      id: "sf-1",
      created_at: "2026-01-01T00:00:00.000Z",
      updated_at: "2026-01-01T00:00:00.000Z",
      last_accessed_at: "2026-01-01T00:00:00.000Z",
      metadata: { size: 1048576, mimetype: "image/jpeg" }
    },
    {
      name: "logo.png",
      id: "sf-2",
      created_at: "2026-01-01T00:00:00.000Z",
      updated_at: "2026-01-01T00:00:00.000Z",
      last_accessed_at: "2026-01-01T00:00:00.000Z",
      metadata: { size: 524288, mimetype: "image/png" }
    }
  ]);

  // 1. List objects in bucket (e.g. /storage/v1/object/list/:bucket)
  if (path.includes("/object/list")) {
    return {
      status: 200,
      data: storageFiles
    };
  }

  // 2. Upload object (POST to /storage/v1/object/:bucket/*)
  if (method === "POST" && path.includes("/object/")) {
    const parts = path.split("/object/")[1]?.split("/") || [];
    const fileName = parts.slice(1).join("/") || `file-${Date.now()}`;
    const newFile: StorageFile = {
      name: decodeURIComponent(fileName),
      id: `sf-${Date.now()}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      last_accessed_at: new Date().toISOString(),
      metadata: { size: 102400, mimetype: "image/jpeg" }
    };
    saveLocalTable("storage_media_files", [...storageFiles, newFile]);

    return {
      status: 200,
      data: {
        Key: `media/${newFile.name}`,
        Id: newFile.id
      }
    };
  }

  // 3. Remove objects (DELETE from /storage/v1/object/:bucket)
  if (method === "DELETE" && path.includes("/object/")) {
    const reqBody = (body || {}) as { prefixes?: string[] };
    const prefixes = reqBody.prefixes || [];
    const remaining = storageFiles.filter((f) => !prefixes.includes(f.name));
    saveLocalTable("storage_media_files", remaining);
    return {
      status: 200,
      data: prefixes.map((p) => ({ name: p }))
    };
  }

  // 4. Bucket info
  if (path.includes("/bucket")) {
    return {
      status: 200,
      data: { id: "media", name: "media", public: true }
    };
  }

  return {
    status: 200,
    data: []
  };
}


