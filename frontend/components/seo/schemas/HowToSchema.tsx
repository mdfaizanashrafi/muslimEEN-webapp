/**
 * HowTo Schema Component
 * 
 * For step-by-step guides and tutorials.
 * Enables rich results with step previews in Google search.
 * 
 * @see https://schema.org/HowTo
 */

import SchemaInjector from '@/components/seo/SchemaInjector';

interface HowToStep {
  name: string;
  text: string;
  url?: string;
  image?: string;
}

interface HowToSchemaProps {
  name: string;
  description: string;
  steps: HowToStep[];
  totalTime?: string; // ISO 8601 duration format (e.g., "PT30M")
  estimatedCost?: {
    currency: string;
    value: string;
  };
  supply?: string[];
  tool?: string[];
  image?: string | string[];
}

/**
 * HowTo Schema Component
 * 
 * Usage:
 * ```tsx
 * <HowToSchema
 *   name="How to Calculate Zakat"
 *   description="Step-by-step guide to calculating your Zakat obligations"
 *   totalTime="PT15M"
 *   steps={[
 *     { name: 'Calculate assets', text: 'Add up all your savings...' },
 *     { name: 'Calculate liabilities', text: 'Subtract any debts...' },
 *   ]}
 * />
 * ```
 */
export default function HowToSchema({
  name,
  description,
  steps,
  totalTime,
  estimatedCost,
  supply,
  tool,
  image,
}: HowToSchemaProps) {
  const images = image ? (Array.isArray(image) ? image : [image]) : undefined;

  const schema: {
    '@context': 'https://schema.org';
    '@type': 'HowTo';
    name: string;
    description: string;
    step: Array<{
      '@type': 'HowToStep';
      name: string;
      text: string;
      url?: string;
      image?: string;
    }>;
    totalTime?: string;
    estimatedCost?: {
      '@type': 'MonetaryAmount';
      currency: string;
      value: string;
    };
    supply?: Array<{
      '@type': 'HowToSupply';
      name: string;
    }>;
    tool?: Array<{
      '@type': 'HowToTool';
      name: string;
    }>;
    image?: string[];
  } = {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name,
    description,
    step: steps.map((step, index) => ({
      '@type': 'HowToStep',
      name: step.name,
      text: step.text,
      ...(step.url && { url: step.url }),
      ...(step.image && { image: step.image }),
    })),
    ...(totalTime && { totalTime }),
    ...(estimatedCost && {
      estimatedCost: {
        '@type': 'MonetaryAmount',
        currency: estimatedCost.currency,
        value: estimatedCost.value,
      },
    }),
    ...(supply && {
      supply: supply.map(s => ({
        '@type': 'HowToSupply',
        name: s,
      })),
    }),
    ...(tool && {
      tool: tool.map(t => ({
        '@type': 'HowToTool',
        name: t,
      })),
    }),
    ...(images && { image: images }),
  };

  return <SchemaInjector schema={schema} />;
}

/**
 * Pre-defined HowTo guides for MuslimEEN
 */

export const zakatHowTo = {
  name: 'How to Calculate Zakat on Your Assets',
  description: 'A complete step-by-step guide to calculating Zakat on cash, gold, silver, investments, and business assets according to Islamic principles.',
  totalTime: 'PT20M',
  steps: [
    {
      name: 'Calculate Your Zakatable Assets',
      text: 'Add up all your cash savings, gold and silver jewelry, stocks and investments, business inventory, and any money owed to you that you expect to receive. Do not include your primary residence, personal vehicle, or furniture.',
    },
    {
      name: 'Calculate Your Liabilities',
      text: 'Subtract any immediate debts or obligations that are due now. This includes credit card balances, loans due within the lunar year, and business expenses. Do not subtract long-term debts like mortgages.',
    },
    {
      name: 'Determine the Nisab Threshold',
      text: 'The Nisab is the minimum amount of wealth requiring Zakat payment. It equals 87.48 grams of gold or 612.36 grams of silver. Use the current market price to calculate the cash value. Most scholars recommend using the silver Nisab as it benefits more people.',
    },
    {
      name: 'Check if You Meet Nisab',
      text: 'If your net assets (assets minus liabilities) equal or exceed the Nisab threshold, and you have held this amount for one lunar year (Hawl), you must pay Zakat.',
    },
    {
      name: 'Calculate 2.5% of Net Assets',
      text: 'Multiply your net zakatable assets by 0.025 (2.5%). This is your Zakat obligation. For example, if you have £10,000 in zakatable assets, your Zakat is £250.',
    },
    {
      name: 'Choose Recipients and Pay',
      text: 'Distribute your Zakat to eligible recipients: the poor, the needy, Zakat administrators, those whose hearts are to be reconciled, freeing captives, the debt-ridden, in the cause of Allah, and the wayfarer. MuslimEEN connects you with verified campaigns.',
    },
  ],
  supply: ['Calculator', 'Current gold/silver prices', 'Financial records'],
};

export const verificationHowTo = {
  name: 'How to Get Verified on MuslimEEN',
  description: 'Complete guide to the MuslimEEN verification process including invitation requirements, two-witness attestation, and biometric verification.',
  totalTime: 'PT3D',
  steps: [
    {
      name: 'Receive an Invitation',
      text: 'You need an invitation from two existing verified MuslimEEN members. Reach out to friends or colleagues who are already on the platform and ask them to vouch for you.',
    },
    {
      name: 'Complete Your Profile',
      text: 'Fill out your profile completely with your professional information, education, and a clear photo. A complete profile helps witnesses verify your identity.',
    },
    {
      name: 'Submit Verification Request',
      text: 'Submit your verification request through the platform. Your inviting members will be notified and can begin the attestation process.',
    },
    {
      name: 'Two-Witness Attestation',
      text: 'Two verified members (trust score 800+) must independently attest that you are a Muslim and that they know you personally. This process typically takes 1-3 business days.',
    },
    {
      name: 'Biometric Verification',
      text: 'Complete biometric verification by scanning your fingerprint or face. This creates a unique hash tied to your identity, preventing duplicate accounts. Your biometric data is never stored - only an irreversible hash.',
    },
    {
      name: 'Start Building Trust',
      text: 'Once verified, start building your trust score through positive community participation: complete transactions, receive endorsements, and maintain an active presence.',
    },
  ],
  tool: ['Valid ID', 'Smartphone for biometric scan', 'Two Muslim witnesses'],
};

export const jobApplicationHowTo = {
  name: 'How to Apply for Jobs on MuslimEEN',
  description: 'Step-by-step guide to finding and applying for halal job opportunities on the MuslimEEN marketplace.',
  totalTime: 'PT30M',
  steps: [
    {
      name: 'Complete Your Profile',
      text: 'Ensure your MuslimEEN profile is 100% complete with your work experience, education, skills, and a professional photo. Employers prefer detailed profiles.',
    },
    {
      name: 'Browse the EARN Marketplace',
      text: 'Visit the EARN marketplace to browse job listings. Use filters to find jobs matching your skills, location preferences, and employment type.',
    },
    {
      name: 'Review Job Requirements',
      text: 'Carefully read the job description, requirements, and company profile. Check the trust score of the employer - higher scores indicate more reliable employers.',
    },
    {
      name: 'Prepare Your Application',
      text: 'Tailor your application to the specific role. Highlight relevant experience and explain why you are interested in working for this particular employer.',
    },
    {
      name: 'Submit Application',
      text: 'Click the Apply button and complete the application form. Attach any required documents like your CV or portfolio. Review before submitting.',
    },
    {
      name: 'Follow Up',
      text: 'Monitor your messages for employer responses. Respond promptly to any inquiries. The typical response time is 3-5 business days.',
    },
  ],
};

export const networkingHowTo = {
  name: 'How to Build Your Professional Network on MuslimEEN',
  description: 'Learn effective strategies for growing your professional connections within the Muslim community.',
  totalTime: 'PT1H',
  steps: [
    {
      name: 'Optimize Your Profile',
      text: 'Create a compelling headline, write a detailed bio highlighting your expertise, and list your key skills. Use a professional photo.',
    },
    {
      name: 'Find Relevant Connections',
      text: 'Use the people directory to find professionals in your industry. Look for people with complementary skills or in companies you are interested in.',
    },
    {
      name: 'Send Personalized Invites',
      text: 'When connecting, always include a personalized message. Mention why you want to connect, shared interests, or how you can add value to their network.',
    },
    {
      name: 'Engage with Content',
      text: 'Regularly engage with posts from your connections. Thoughtful comments and shares increase your visibility and build relationships.',
    },
    {
      name: 'Join Relevant Discussions',
      text: 'Participate in marketplace discussions and Islamic finance forums. Share your expertise and ask thoughtful questions.',
    },
    {
      name: 'Request Endorsements',
      text: 'Ask colleagues and clients to endorse your skills. Endorsements boost your credibility and trust score.',
    },
  ],
};
