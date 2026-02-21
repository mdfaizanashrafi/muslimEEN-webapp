import { Metadata } from 'next';
import MarketplaceClient from './client';

// Generate static params for all verticals
export function generateStaticParams() {
  return [
    { vertical: 'earn' },
    { vertical: 'build' },
    { vertical: 'live' },
    { vertical: 'protect' },
  ];
}

// Generate metadata for each vertical
export function generateMetadata({ params }: { params: { vertical: string } }): Metadata {
  const titles: Record<string, string> = {
    earn: 'EARN Marketplace - Jobs & Services',
    build: 'BUILD Marketplace - Ventures & Partnerships',
    live: 'LIVE Marketplace - Housing & Services',
    protect: 'PROTECT Marketplace - Health & Insurance',
  };
  
  return {
    title: `${titles[params.vertical] || 'Marketplace'} - MuslimEEN`,
    description: 'Muslim Economic Empowerment Network Marketplace',
  };
}

// Server component that renders the client component
export default function MarketplacePage({ params }: { params: { vertical: string } }) {
  return <MarketplaceClient vertical={params.vertical} />;
}
