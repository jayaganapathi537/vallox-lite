import type { Opportunity, OpportunityMatch, StudentMatch, StudentProfile, BaseUser } from '@/models/vallox';

const wSkills = 0.7;
const wSDG = 0.3;

function normalize(text: string) {
  return text.trim().toLowerCase();
}

function overlapStrings(source: string[], target: string[]) {
  const targetSet = new Set(target.map(normalize));
  return source.filter((item) => targetSet.has(normalize(item)));
}

function overlapNumbers(source: number[], target: number[]) {
  const targetSet = new Set(target);
  return source.filter((item) => targetSet.has(item));
}

function safeDivide(numerator: number, denominator: number) {
  if (!denominator) {
    return 0;
  }
  return numerator / denominator;
}

function roundedScore(value: number) {
  return Math.round(value * 100) / 100;
}

export function calculateMatch(
  student: Pick<StudentProfile, 'skills' | 'sdgInterests'>,
  opportunity: Pick<Opportunity, 'requiredSkills' | 'sdgTags'>
) {
  const skillOverlap = overlapStrings(student.skills, opportunity.requiredSkills);
  const sdgOverlap = overlapNumbers(student.sdgInterests, opportunity.sdgTags);

  const skillScore = skillOverlap.length;
  const sdgScore = sdgOverlap.length;

  const normalizedSkillScore = safeDivide(skillScore, opportunity.requiredSkills.length);
  const normalizedSdgScore = safeDivide(sdgScore, opportunity.sdgTags.length);

  const matchScore = 100 * (wSkills * normalizedSkillScore + wSDG * normalizedSdgScore);

  return {
    skillOverlap,
    sdgOverlap,
    skillScore,
    sdgScore,
    normalizedSkillScore: roundedScore(normalizedSkillScore),
    normalizedSdgScore: roundedScore(normalizedSdgScore),
    matchScore: roundedScore(matchScore)
  };
}

export function rankOpportunitiesForStudent(student: StudentProfile, opportunities: Opportunity[]): OpportunityMatch[] {
  return opportunities
    .map((opportunity) => {
      const score = calculateMatch(student, opportunity);
      return {
        opportunity,
        ...score
      };
    })
    .sort((a, b) => b.matchScore - a.matchScore);
}

export function rankStudentsForOpportunity(
  opportunity: Opportunity,
  students: Array<{ user: BaseUser; profile: StudentProfile }>
): StudentMatch[] {
  return students
    .map(({ user, profile }) => {
      const score = calculateMatch(profile, opportunity);
      return {
        student: user,
        profile,
        ...score
      };
    })
    .sort((a, b) => b.matchScore - a.matchScore);
}
