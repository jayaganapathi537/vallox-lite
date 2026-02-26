export type UserRole = 'student' | 'organisation' | 'admin';
export type AccountStatus = 'active' | 'suspended' | 'pending';

export type OpportunityType = 'internship' | 'project' | 'volunteer' | 'job';
export type OpportunityStatus = 'open' | 'closed';
export type OrganisationType = 'startup' | 'ngo' | 'company' | 'other';
export type ApplicationStatus = 'applied' | 'shortlisted' | 'rejected' | 'contacted';
export type MessageSenderRole = UserRole;
export type TaskType = 'quiz' | 'coding' | 'file' | 'case-study';
export type TaskSubmissionStatus = 'pending' | 'in_progress' | 'submitted' | 'approved' | 'rejected';
export type AchievementType = 'internship' | 'hackathon' | 'certification';
export type VerificationStatus = 'pending' | 'approved' | 'rejected';
export type VerificationProofType = 'github' | 'demo' | 'video' | 'organization';
export type ReportStatus = 'pending' | 'resolved' | 'dismissed';

export interface BaseUser {
  id: string;
  role: UserRole;
  name: string;
  email: string;
  onboardingComplete: boolean;
  status?: AccountStatus;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface StudentProfile {
  userId: string;
  headline: string;
  bio: string;
  skills: string[];
  sdgInterests: number[];
  createdAt: string;
  updatedAt: string;
}

export interface ProjectLinks {
  github?: string;
  demo?: string;
  video?: string;
}

export interface Project {
  id: string;
  userId: string;
  title: string;
  description: string;
  techStack: string[];
  links: ProjectLinks;
  sdgTags: number[];
  createdAt: string;
  updatedAt: string;
}

export interface OrganisationProfile {
  userId: string;
  orgName: string;
  type: OrganisationType;
  description: string;
  sdgFocus: number[];
  website?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Opportunity {
  id: string;
  orgId: string;
  title: string;
  description: string;
  requiredSkills: string[];
  sdgTags: number[];
  type: OpportunityType;
  location: string;
  isRemote: boolean;
  status: OpportunityStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Application {
  id: string;
  opportunityId: string;
  orgId: string;
  studentId: string;
  status: ApplicationStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  id: string;
  orgId: string;
  opportunityId?: string;
  title: string;
  description: string;
  taskType: TaskType;
  skillsTested: string[];
  deadline: string;
  studentIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface TaskSubmission {
  id: string;
  taskId: string;
  orgId: string;
  studentId: string;
  status: TaskSubmissionStatus;
  responseText?: string;
  score?: number;
  feedback?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Achievement {
  id: string;
  studentId: string;
  type: AchievementType;
  title: string;
  organization: string;
  roleOrAward?: string;
  description: string;
  credentialUrl?: string;
  issuedAt: string;
  verified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface VerificationRequest {
  id: string;
  studentId: string;
  projectId: string;
  opportunityId?: string;
  orgId?: string;
  proofType: VerificationProofType;
  proofLink: string;
  notes?: string;
  status: VerificationStatus;
  reviewerId?: string;
  feedback?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PlatformReport {
  id: string;
  reporterId: string;
  reportedUserId?: string;
  type: string;
  evidence: string;
  status: ReportStatus;
  resolutionNote?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Announcement {
  id: string;
  title: string;
  message: string;
  targetGroup: 'students' | 'organizations' | 'all';
  channel: 'in_app' | 'email' | 'both';
  createdBy: string;
  createdAt: string;
}

export interface SystemSetting {
  id: string;
  matchingSkillWeight: number;
  matchingSdgWeight: number;
  tasksEnabled: boolean;
  verificationEnabled: boolean;
  sessionTimeoutMinutes: number;
  updatedBy: string;
  updatedAt: string;
}

export interface BillingRecord {
  id: string;
  orgId: string;
  planName: string;
  amount: number;
  cycle: string;
  status: 'paid' | 'pending' | 'refunded';
  createdAt: string;
}

export interface AuditLog {
  id: string;
  actorId: string;
  actorRole: UserRole;
  action: string;
  targetType: string;
  targetId?: string;
  details?: string;
  createdAt: string;
}

export interface SavedOpportunity {
  id: string;
  studentId: string;
  opportunityId: string;
  orgId: string;
  createdAt: string;
  updatedAt: string;
}

export interface ConversationMessage {
  id: string;
  conversationId: string;
  opportunityId: string;
  orgId: string;
  studentId: string;
  senderId: string;
  senderRole: MessageSenderRole;
  body: string;
  createdAt: string;
}

export interface OpportunityMatch {
  opportunity: Opportunity;
  skillOverlap: string[];
  sdgOverlap: number[];
  skillScore: number;
  sdgScore: number;
  normalizedSkillScore: number;
  normalizedSdgScore: number;
  matchScore: number;
}

export interface StudentMatch {
  student: BaseUser;
  profile: StudentProfile;
  skillOverlap: string[];
  sdgOverlap: number[];
  skillScore: number;
  sdgScore: number;
  normalizedSkillScore: number;
  normalizedSdgScore: number;
  matchScore: number;
}
