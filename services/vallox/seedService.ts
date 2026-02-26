import { doc, writeBatch } from 'firebase/firestore';
import { getFirestoreDb } from '@/lib/firebase';
import { nowIso } from '@/lib/time';
import type { Application, BaseUser, Opportunity, OrganisationProfile, Project, StudentProfile } from '@/models/vallox';

const DEMO_IDS = {
  students: ['demo-student-a', 'demo-student-b', 'demo-student-c'],
  organisation: 'demo-org-impact',
  opportunities: ['demo-opportunity-1', 'demo-opportunity-2', 'demo-opportunity-3'],
  projects: ['demo-project-1', 'demo-project-2', 'demo-project-3']
};

export async function seedDemoData() {
  const timestamp = nowIso();
  const batch = writeBatch(getFirestoreDb());

  const users: BaseUser[] = [
    {
      id: DEMO_IDS.students[0],
      role: 'student',
      name: 'Ava Mensah',
      email: 'ava.demo@valloxlite.test',
      onboardingComplete: true,
      createdAt: timestamp,
      updatedAt: timestamp
    },
    {
      id: DEMO_IDS.students[1],
      role: 'student',
      name: 'Liam Chen',
      email: 'liam.demo@valloxlite.test',
      onboardingComplete: true,
      createdAt: timestamp,
      updatedAt: timestamp
    },
    {
      id: DEMO_IDS.students[2],
      role: 'student',
      name: 'Fatima Noor',
      email: 'fatima.demo@valloxlite.test',
      onboardingComplete: true,
      createdAt: timestamp,
      updatedAt: timestamp
    },
    {
      id: DEMO_IDS.organisation,
      role: 'organisation',
      name: 'EcoBridge Team',
      email: 'hello@ecobridge.demo',
      onboardingComplete: true,
      createdAt: timestamp,
      updatedAt: timestamp
    }
  ];

  const studentProfiles: StudentProfile[] = [
    {
      userId: DEMO_IDS.students[0],
      headline: 'Frontend + data storytelling builder',
      bio: 'I build web experiences for NGOs and youth initiatives.',
      skills: ['React', 'TypeScript', 'UI/UX', 'Data Analysis'],
      sdgInterests: [4, 10, 17],
      createdAt: timestamp,
      updatedAt: timestamp
    },
    {
      userId: DEMO_IDS.students[1],
      headline: 'ML and mobile developer',
      bio: 'I prototype learning tools and youth employment products.',
      skills: ['Python', 'TensorFlow', 'Flutter', 'Firebase'],
      sdgInterests: [4, 8],
      createdAt: timestamp,
      updatedAt: timestamp
    },
    {
      userId: DEMO_IDS.students[2],
      headline: 'Community ops and product intern',
      bio: 'I work on outreach, partnerships, and product operations.',
      skills: ['Project Management', 'Community Outreach', 'Research', 'Public Speaking'],
      sdgInterests: [8, 10, 17],
      createdAt: timestamp,
      updatedAt: timestamp
    }
  ];

  const organisationProfile: OrganisationProfile = {
    userId: DEMO_IDS.organisation,
    orgName: 'EcoBridge Impact Lab',
    type: 'startup',
    description: 'Building youth-focused climate and jobs programs with local NGOs.',
    sdgFocus: [8, 10, 17],
    website: 'https://example.org',
    createdAt: timestamp,
    updatedAt: timestamp
  };

  const opportunities: Opportunity[] = [
    {
      id: DEMO_IDS.opportunities[0],
      orgId: DEMO_IDS.organisation,
      title: 'Frontend Intern - Youth Jobs Portal',
      description: 'Build reusable React components for a youth opportunity portal.',
      requiredSkills: ['React', 'TypeScript', 'UI/UX'],
      sdgTags: [8, 10],
      type: 'internship',
      location: 'Accra, Ghana',
      isRemote: true,
      status: 'open',
      createdAt: timestamp,
      updatedAt: timestamp
    },
    {
      id: DEMO_IDS.opportunities[1],
      orgId: DEMO_IDS.organisation,
      title: 'AI Project Fellow - Skills Matching Engine',
      description: 'Prototype a lightweight recommendation engine for training pathways.',
      requiredSkills: ['Python', 'TensorFlow', 'Data Analysis'],
      sdgTags: [4, 8],
      type: 'project',
      location: 'Remote',
      isRemote: true,
      status: 'open',
      createdAt: timestamp,
      updatedAt: timestamp
    },
    {
      id: DEMO_IDS.opportunities[2],
      orgId: DEMO_IDS.organisation,
      title: 'Community Partnerships Volunteer',
      description: 'Support outreach campaigns and partnership mapping with NGOs.',
      requiredSkills: ['Community Outreach', 'Research', 'Public Speaking'],
      sdgTags: [10, 17],
      type: 'volunteer',
      location: 'Nairobi, Kenya',
      isRemote: false,
      status: 'open',
      createdAt: timestamp,
      updatedAt: timestamp
    }
  ];

  const projects: Project[] = [
    {
      id: DEMO_IDS.projects[0],
      userId: DEMO_IDS.students[0],
      title: 'NGO Volunteer Portal',
      description: 'Built a volunteer workflow dashboard with analytics for inclusion programs.',
      techStack: ['React', 'TypeScript', 'Firebase'],
      links: { github: 'https://github.com/example/ngo-portal' },
      sdgTags: [10, 17],
      createdAt: timestamp,
      updatedAt: timestamp
    },
    {
      id: DEMO_IDS.projects[1],
      userId: DEMO_IDS.students[1],
      title: 'Career Path Recommender',
      description: 'ML proof-of-concept for recommending youth training paths.',
      techStack: ['Python', 'TensorFlow'],
      links: { demo: 'https://example.org/demo-ml' },
      sdgTags: [4, 8],
      createdAt: timestamp,
      updatedAt: timestamp
    },
    {
      id: DEMO_IDS.projects[2],
      userId: DEMO_IDS.students[2],
      title: 'Local Startup Partnership Map',
      description: 'Mapped startup + NGO collaborations for youth employment initiatives.',
      techStack: ['Research', 'Public Speaking'],
      links: { video: 'https://example.org/demo-video' },
      sdgTags: [8, 17],
      createdAt: timestamp,
      updatedAt: timestamp
    }
  ];

  const applications: Application[] = [
    {
      id: `${DEMO_IDS.opportunities[0]}_${DEMO_IDS.students[0]}`,
      opportunityId: DEMO_IDS.opportunities[0],
      orgId: DEMO_IDS.organisation,
      studentId: DEMO_IDS.students[0],
      status: 'applied',
      createdAt: timestamp,
      updatedAt: timestamp
    },
    {
      id: `${DEMO_IDS.opportunities[1]}_${DEMO_IDS.students[1]}`,
      opportunityId: DEMO_IDS.opportunities[1],
      orgId: DEMO_IDS.organisation,
      studentId: DEMO_IDS.students[1],
      status: 'shortlisted',
      createdAt: timestamp,
      updatedAt: timestamp
    }
  ];

  for (const user of users) {
    batch.set(doc(getFirestoreDb(), 'users', user.id), user, { merge: true });
  }

  for (const profile of studentProfiles) {
    batch.set(doc(getFirestoreDb(), 'studentProfiles', profile.userId), profile, { merge: true });
  }

  batch.set(doc(getFirestoreDb(), 'organisationProfiles', organisationProfile.userId), organisationProfile, { merge: true });

  for (const opportunity of opportunities) {
    batch.set(doc(getFirestoreDb(), 'opportunities', opportunity.id), opportunity, { merge: true });
  }

  for (const project of projects) {
    batch.set(doc(getFirestoreDb(), 'projects', project.id), project, { merge: true });
  }

  for (const application of applications) {
    batch.set(doc(getFirestoreDb(), 'applications', application.id), application, { merge: true });
  }

  await batch.commit();
}
