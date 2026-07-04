export const DEFAULT_RESUME_CODE = `% Resume Chef — LaTeX Template
\\documentclass[11pt,a4paper]{article}
\\usepackage[margin=0.75in]{geometry}
\\usepackage{enumitem}
\\usepackage{hyperref}

\\begin{document}

\\begin{center}
  {\\LARGE \\textbf{Alex Morgan}} \\\\
  \\href{mailto:alex@email.com}{alex@email.com} \\;|\\;
  (555) 123-4567 \\;|\\;
  \\href{https://linkedin.com/in/alexmorgan}{linkedin.com/in/alexmorgan}
\\end{center}

\\section*{Summary}
Full-stack engineer with 6+ years building scalable web applications.
Passionate about clean architecture, developer experience, and shipping
products that users love.

\\section*{Experience}
\\textbf{Senior Software Engineer} \\hfill \\textit{Jan 2022 -- Present}\\\\
\\textit{TechCorp Inc.} \\hfill Remote
\\begin{itemize}[leftmargin=*, nosep]
  \\item Led migration to microservices, reducing deploy time by 60\\%
  \\item Built real-time analytics dashboard serving 50k+ daily users
  \\item Mentored team of 4 junior engineers on React and Node.js best practices
\\end{itemize}

\\textbf{Software Engineer} \\hfill \\textit{Jun 2019 -- Dec 2021}\\\\
\\textit{StartupXYZ} \\hfill San Francisco, CA
\\begin{itemize}[leftmargin=*, nosep]
  \\item Developed REST APIs handling 2M+ requests/day with 99.9\\% uptime
  \\item Implemented CI/CD pipeline cutting release cycles from weekly to daily
\\end{itemize}

\\section*{Education}
\\textbf{B.S. Computer Science} \\hfill \\textit{2015 -- 2019}\\\\
University of California, Berkeley

\\section*{Skills}
JavaScript, TypeScript, React, Node.js, Python, PostgreSQL, Docker, AWS

\\end{document}`;

export const DEFAULT_ELEMENTS = {
  contact: {
    name: "Alex Morgan",
    email: "alex@email.com",
    phone: "(555) 123-4567",
    linkedin: "linkedin.com/in/alexmorgan",
    location: "San Francisco, CA",
  },
  summary:
    "Full-stack engineer with 6+ years building scalable web applications. Passionate about clean architecture, developer experience, and shipping products that users love.",
  experience: [
    {
      id: "exp-1",
      title: "Senior Software Engineer",
      company: "TechCorp Inc.",
      location: "Remote",
      start: "Jan 2022",
      end: "Present",
      bullets: [
        "Led migration to microservices, reducing deploy time by 60%",
        "Built real-time analytics dashboard serving 50k+ daily users",
        "Mentored team of 4 junior engineers on React and Node.js best practices",
      ],
    },
    {
      id: "exp-2",
      title: "Software Engineer",
      company: "StartupXYZ",
      location: "San Francisco, CA",
      start: "Jun 2019",
      end: "Dec 2021",
      bullets: [
        "Developed REST APIs handling 2M+ requests/day with 99.9% uptime",
        "Implemented CI/CD pipeline cutting release cycles from weekly to daily",
      ],
    },
  ],
  education: [
    {
      id: "edu-1",
      degree: "B.S. Computer Science",
      school: "University of California, Berkeley",
      start: "2015",
      end: "2019",
    },
  ],
  skills: [
    "JavaScript",
    "TypeScript",
    "React",
    "Node.js",
    "Python",
    "PostgreSQL",
    "Docker",
    "AWS",
  ],
};

export const TEMPLATES = [
  {
    id: "professional",
    name: "Professional",
    description: "Clean single-column layout for corporate roles",
  },
  {
    id: "modern",
    name: "Modern",
    description: "Bold headers with accent color highlights",
  },
  {
    id: "minimal",
    name: "Minimal",
    description: "Whitespace-focused design for senior positions",
  },
  {
    id: "technical",
    name: "Technical",
    description: "Skills-first layout optimized for engineering roles",
  },
];

export const ELEMENT_BLOCKS = [
  { id: "contact", label: "Contact", icon: "user" },
  { id: "summary", label: "Summary", icon: "file-text" },
  { id: "experience", label: "Experience", icon: "briefcase" },
  { id: "education", label: "Education", icon: "graduation-cap" },
  { id: "skills", label: "Skills", icon: "code" },
];
