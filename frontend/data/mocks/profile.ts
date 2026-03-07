export interface WorkHistoryItem {
  title: string;
  subtitle: string;
  date: string;
  description?: string;
}

export interface EducationItem {
  title: string;
  subtitle: string;
  date: string;
}

export interface Skill {
  name: string;
  count: number;
}

export const workHistory: WorkHistoryItem[] = [
  {
    title: 'Senior Software Engineer',
    subtitle: 'HalalTech Solutions',
    date: 'Mar 2022 - Present',
    description: 'Leading development of Shariah-compliant fintech solutions',
  },
  {
    title: 'Full Stack Developer',
    subtitle: 'Global Devs Inc',
    date: 'Jun 2019 - Feb 2022',
    description: 'Built scalable web applications for enterprise clients',
  },
];

export const education: EducationItem[] = [
  {
    title: 'MSc Computer Science',
    subtitle: 'University of Manchester',
    date: '2017 - 2019',
  },
];

export const skills: Skill[] = [
  { name: 'JavaScript', count: 12 },
  { name: 'Islamic Finance', count: 8 },
  { name: 'Project Management', count: 5 },
  { name: 'Community Building', count: 7 },
  { name: 'React', count: 9 },
  { name: 'Node.js', count: 6 },
];
