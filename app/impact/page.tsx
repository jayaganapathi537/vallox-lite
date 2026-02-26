'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import LoadingState from '@/components/common/LoadingState';
import ErrorState from '@/components/common/ErrorState';
import { SDG_META, SUPPORTED_SDGS } from '@/lib/sdg';
import { getAllApplications } from '@/services/vallox/applicationService';
import { getAllOpportunities } from '@/services/vallox/opportunityService';
import { seedDemoData } from '@/services/vallox/seedService';
import { getAllStudentProfiles } from '@/services/vallox/studentService';

const COLORS = ['#2e7d32', '#0288d1', '#d81b60', '#6a1b9a'];

export default function ImpactDashboardPage() {
  const [studentData, setStudentData] = useState<Array<{ sdg: string; count: number }>>([]);
  const [opportunityData, setOpportunityData] = useState<Array<{ sdg: string; count: number }>>([]);
  const [applicationData, setApplicationData] = useState<Array<{ sdg: string; applications: number; shortlists: number }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [seeding, setSeeding] = useState(false);
  const [seedMessage, setSeedMessage] = useState('');

  const loadData = async () => {
    setLoading(true);
    setError('');

    try {
      const [students, opportunities, applications] = await Promise.all([
        getAllStudentProfiles(),
        getAllOpportunities(),
        getAllApplications()
      ]);

      const studentCounts = Object.fromEntries(SUPPORTED_SDGS.map((sdg) => [sdg, 0]));
      const opportunityCounts = Object.fromEntries(SUPPORTED_SDGS.map((sdg) => [sdg, 0]));
      const applicationCounts = Object.fromEntries(SUPPORTED_SDGS.map((sdg) => [sdg, { applications: 0, shortlists: 0 }]));

      for (const student of students) {
        for (const sdg of student.sdgInterests) {
          if (sdg in studentCounts) {
            studentCounts[sdg as keyof typeof studentCounts] += 1;
          }
        }
      }

      for (const opportunity of opportunities) {
        for (const sdg of opportunity.sdgTags) {
          if (sdg in opportunityCounts) {
            opportunityCounts[sdg as keyof typeof opportunityCounts] += 1;
          }
        }
      }

      const opportunityById = Object.fromEntries(opportunities.map((opportunity) => [opportunity.id, opportunity]));

      for (const application of applications) {
        const opportunity = opportunityById[application.opportunityId];
        if (!opportunity) continue;

        for (const sdg of opportunity.sdgTags) {
          if (!(sdg in applicationCounts)) continue;

          applicationCounts[sdg as keyof typeof applicationCounts].applications += 1;
          if (application.status === 'shortlisted') {
            applicationCounts[sdg as keyof typeof applicationCounts].shortlists += 1;
          }
        }
      }

      setStudentData(
        SUPPORTED_SDGS.map((sdg) => ({
          sdg: `SDG ${sdg}`,
          count: studentCounts[sdg]
        }))
      );

      setOpportunityData(
        SUPPORTED_SDGS.map((sdg) => ({
          sdg: `SDG ${sdg}`,
          count: opportunityCounts[sdg]
        }))
      );

      setApplicationData(
        SUPPORTED_SDGS.map((sdg) => ({
          sdg: `SDG ${sdg}`,
          applications: applicationCounts[sdg].applications,
          shortlists: applicationCounts[sdg].shortlists
        }))
      );
    } catch (loadError) {
      const message = loadError instanceof Error ? loadError.message : 'Failed to load impact dashboard.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const totals = useMemo(() => {
    return applicationData.reduce(
      (acc, item) => {
        acc.applications += item.applications;
        acc.shortlists += item.shortlists;
        return acc;
      },
      { applications: 0, shortlists: 0 }
    );
  }, [applicationData]);

  const handleSeed = async () => {
    setSeeding(true);
    setSeedMessage('');

    try {
      await seedDemoData();
      setSeedMessage('Demo records created/updated successfully.');
      await loadData();
    } catch (seedError) {
      const message = seedError instanceof Error ? seedError.message : 'Unable to seed demo records.';
      setSeedMessage(message);
    } finally {
      setSeeding(false);
    }
  };

  if (loading) {
    return <LoadingState message="Loading impact dashboard..." />;
  }

  return (
    <div className="space-y-6">
      <Card className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold text-ink-900">Impact Dashboard</h1>
            <p className="text-ink-600">Live SDG distribution of students, opportunities, and applications.</p>
          </div>
          <Button onClick={handleSeed} disabled={seeding}>
            {seeding ? 'Seeding...' : 'Seed demo data'}
          </Button>
        </div>
        {seedMessage && <p className="text-sm text-sea-700">{seedMessage}</p>}
      </Card>

      {error && <ErrorState message={error} />}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="space-y-3">
          <h2 className="text-lg font-semibold text-ink-900">Students per SDG Interest</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={studentData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="sdg" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" fill="#1e8280" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="space-y-3">
          <h2 className="text-lg font-semibold text-ink-900">Opportunities per SDG</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={opportunityData} dataKey="count" nameKey="sdg" outerRadius={100} label>
                  {opportunityData.map((entry, index) => (
                    <Cell key={`${entry.sdg}-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <Card className="space-y-3">
        <h2 className="text-lg font-semibold text-ink-900">Applications and Shortlists per SDG</h2>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={applicationData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="sdg" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Legend />
              <Bar dataKey="applications" fill="#0288d1" radius={[8, 8, 0, 0]} />
              <Bar dataKey="shortlists" fill="#d81b60" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <p className="text-sm text-ink-600">
          Total applications: {totals.applications} | Total shortlists: {totals.shortlists}
        </p>
      </Card>

      <Card className="space-y-2">
        <h2 className="text-lg font-semibold text-ink-900">Supported SDGs</h2>
        <ul className="space-y-1 text-sm text-ink-600">
          {SUPPORTED_SDGS.map((sdg) => (
            <li key={sdg}>
              SDG {sdg}: {SDG_META[sdg].title}
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
