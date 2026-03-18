'use client';

import { analytics, feedback } from '@/lib/api';
import { useEffect, useState } from 'react';

interface BetaMetrics {
  totalUsers: number;
  activeUsers24h: number;
  activeUsers7d: number;
  totalSessions: number;
  onboarding: {
    inviteReceived: number;
    registrationStarted: number;
    registrationCompleted: number;
    firstLogin: number;
    profileCompleted: number;
  };
  connectionsCreated: number;
  invitesSent: number;
  errors24h: number;
  loginFailures24h: number;
}

interface FunnelStep {
  name: string;
  count: number;
  conversionRate?: number;
}

interface FeedbackStats {
  total_feedback: string;
  avg_rating: string;
  five_star: string;
  four_star: string;
  three_star: string;
  two_star: string;
  one_star: string;
}

export default function BetaDashboard() {
  const [metrics, setMetrics] = useState<BetaMetrics | null>(null);
  const [funnel, setFunnel] = useState<FunnelStep[]>([]);
  const [feedbackStats, setFeedbackStats] = useState<FeedbackStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);

        const [metricsRes, funnelRes, feedbackRes] = await Promise.all([
          analytics.getMetrics(),
          analytics.getFunnel(),
          feedback.getStats(),
        ]);


        if (funnelRes.success && typeof funnelRes.funnel === 'object' && funnelRes.funnel !== null) {
          const funnelData = funnelRes.funnel as { steps: FunnelStep[] };
          setFunnel(funnelData.steps);
        }

        if (feedbackRes.success && typeof feedbackRes.stats === 'object' && feedbackRes.stats !== null) {
          setFeedbackStats(feedbackRes.stats as FeedbackStats);
        }

        if (metricsRes.success && typeof metricsRes.metrics === 'object' && metricsRes.metrics !== null) {
          setMetrics(metricsRes.metrics as BetaMetrics);
        }
      } catch (err) {
        setError('Failed to load beta metrics');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
    const interval = setInterval(fetchData, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading beta metrics...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-2">🚀 Beta Dashboard</h1>
      <p className="text-gray-600 mb-6">Real-time metrics for the first 100 beta users</p>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <MetricCard
          title="Total Users"
          value={metrics?.totalUsers || 0}
          subtitle="Beta signups"
          color="blue"
        />
        <MetricCard
          title="Daily Active"
          value={metrics?.activeUsers24h || 0}
          subtitle="Last 24 hours"
          color="green"
        />
        <MetricCard
          title="Weekly Active"
          value={metrics?.activeUsers7d || 0}
          subtitle="Last 7 days"
          color="purple"
        />
        <MetricCard
          title="Connections"
          value={metrics?.connectionsCreated || 0}
          subtitle="Created"
          color="orange"
        />
      </div>

      {/* Funnel Visualization */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">📊 Onboarding Funnel</h2>
        <div className="space-y-3">
          {funnel.map((step, index) => (
            <FunnelBar
              key={step.name}
              step={step}
              maxCount={funnel[0]?.count || 1}
              isFirst={index === 0}
            />
          ))}
        </div>
      </div>

      {/* Health Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">⚠️ Health Alerts</h2>
          <div className="space-y-3">
            <AlertItem
              label="Errors (24h)"
              value={metrics?.errors24h || 0}
              threshold={10}
              unit="errors"
            />
            <AlertItem
              label="Login Failures (24h)"
              value={metrics?.loginFailures24h || 0}
              threshold={20}
              unit="failures"
            />
            <AlertItem
              label="Sessions"
              value={metrics?.totalSessions || 0}
              threshold={0}
              unit="total"
              inverse
            />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">⭐ User Satisfaction</h2>
          {feedbackStats ? (
            <>
              <div className="text-4xl font-bold text-center mb-4">
                {parseFloat(feedbackStats.avg_rating).toFixed(1)}
                <span className="text-lg text-gray-400">/5</span>
              </div>
              <div className="space-y-2">
                <RatingBar
                  label="5★"
                  count={parseInt(feedbackStats.five_star)}
                  total={parseInt(feedbackStats.total_feedback)}
                  color="green"
                />
                <RatingBar
                  label="4★"
                  count={parseInt(feedbackStats.four_star)}
                  total={parseInt(feedbackStats.total_feedback)}
                  color="lightgreen"
                />
                <RatingBar
                  label="3★"
                  count={parseInt(feedbackStats.three_star)}
                  total={parseInt(feedbackStats.total_feedback)}
                  color="yellow"
                />
                <RatingBar
                  label="2★"
                  count={parseInt(feedbackStats.two_star)}
                  total={parseInt(feedbackStats.total_feedback)}
                  color="orange"
                />
                <RatingBar
                  label="1★"
                  count={parseInt(feedbackStats.one_star)}
                  total={parseInt(feedbackStats.total_feedback)}
                  color="red"
                />
              </div>
              <p className="text-sm text-gray-500 mt-3">
                {feedbackStats.total_feedback} total responses
              </p>
            </>
          ) : (
            <p className="text-gray-500 text-center py-8">No feedback yet</p>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">⚡ Quick Actions</h2>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => window.open('/admin/invites', '_blank')}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
          >
            Manage Invites
          </button>
          <button
            onClick={() => window.open('/admin/users', '_blank')}
            className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 transition-colors"
          >
            View Users
          </button>
          <button
            onClick={() => window.location.reload()}
            className="border border-gray-300 px-4 py-2 rounded hover:bg-gray-50 transition-colors"
          >
            Refresh Data
          </button>
        </div>
      </div>
    </div>
  );
}

function MetricCard({
  title,
  value,
  subtitle,
  color,
}: {
  title: string;
  value: number;
  subtitle: string;
  color: string;
}) {
  const colorClasses: Record<string, string> = {
    blue: 'bg-blue-50 border-blue-200',
    green: 'bg-green-50 border-green-200',
    purple: 'bg-purple-50 border-purple-200',
    orange: 'bg-orange-50 border-orange-200',
  };

  return (
    <div className={`${colorClasses[color]} border rounded-lg p-4`}>
      <div className="text-sm text-gray-600 mb-1">{title}</div>
      <div className="text-3xl font-bold">{value}</div>
      <div className="text-xs text-gray-500">{subtitle}</div>
    </div>
  );
}

function FunnelBar({
  step,
  maxCount,
  isFirst,
}: {
  step: FunnelStep;
  maxCount: number;
  isFirst: boolean;
}) {
  const width = maxCount > 0 ? (step.count / maxCount) * 100 : 0;
  const conversionRate = isFirst ? 100 : step.conversionRate || 0;

  return (
    <div className="flex items-center gap-4">
      <div className="w-32 text-sm text-gray-600 truncate">{step.name}</div>
      <div className="flex-1 bg-gray-100 rounded-full h-8 relative overflow-hidden">
        <div
          className="bg-blue-500 h-full rounded-full transition-all duration-500 flex items-center justify-end pr-2"
          style={{ width: `${width}%` }}
        >
          <span className="text-white text-sm font-medium">{step.count}</span>
        </div>
      </div>
      {!isFirst && (
        <div className="w-20 text-sm text-right">
          <span
            className={`font-medium ${conversionRate >= 70 ? 'text-green-600' : conversionRate >= 40 ? 'text-yellow-600' : 'text-red-600'}`}
          >
            {conversionRate}%
          </span>
        </div>
      )}
    </div>
  );
}

function AlertItem({
  label,
  value,
  threshold,
  unit,
  inverse,
}: {
  label: string;
  value: number;
  threshold: number;
  unit: string;
  inverse?: boolean;
}) {
  const isAlert = inverse ? value < threshold : value > threshold;

  return (
    <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
      <span className="text-sm text-gray-600">{label}</span>
      <span className={`font-medium ${isAlert ? 'text-red-600' : 'text-green-600'}`}>
        {value} {unit}
      </span>
    </div>
  );
}

function RatingBar({
  label,
  count,
  total,
  color,
}: {
  label: string;
  count: number;
  total: number;
  color: string;
}) {
  const percentage = total > 0 ? (count / total) * 100 : 0;
  const colorClasses: Record<string, string> = {
    green: 'bg-green-500',
    lightgreen: 'bg-green-400',
    yellow: 'bg-yellow-400',
    orange: 'bg-orange-400',
    red: 'bg-red-500',
  };

  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="w-8 text-gray-500">{label}</span>
      <div className="flex-1 bg-gray-100 rounded-full h-2">
        <div
          className={`${colorClasses[color]} h-full rounded-full transition-all duration-500`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="w-8 text-right text-gray-600">{count}</span>
    </div>
  );
}
