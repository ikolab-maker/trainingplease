// Reference English translation of legal.ts. The Spanish text prevails: if a Spanish text changes,
// update this one in the same commit (LEGAL_VERSION is shared).
import { OWNER, PRIVACY_EMAIL, type LegalSection } from './legal.ts';

export const REQUIRED_CHECKS_EN = [
  { key: 'adult', text: 'I am 18 years of age or older.' },
  {
    key: 'health',
    text: 'I declare that I am in good enough health to do physical activity, that I have consulted or will consult a doctor before starting a plan, and that I will tell my coach about any injury, illness or symptom.',
  },
  {
    key: 'risk',
    text: 'I understand that sport involves risks (injuries, cardiovascular problems, accidents) and that I am responsible for how and when I train. I have read the Disclaimer.',
  },
  { key: 'terms', text: 'I accept the Terms and Conditions.' },
  {
    key: 'data',
    text: `I have read the Personal Data Policy and, freely, in advance, expressly, unequivocally and in an informed manner, I authorize ${OWNER} to process my personal data, including my health data, for the necessary purposes, including preparing my plans with the help of artificial intelligence under my coach's supervision, and their storage and processing with providers located outside Peru. I know I can revoke this authorization at any time from Settings > Privacy or by writing to ${PRIVACY_EMAIL}.`,
  },
] as const;

export const OPTIONAL_CHECKS_EN = [
  { key: 'marketing', text: 'Receive news, promotions and services from Training Please.' },
  { key: 'stats', text: 'Use my anonymized data to improve the plans and produce statistics.' },
] as const;

export const DISCLAIMER_EN: LegalSection = {
  title: 'Disclaimer',
  items: [
    'Not medical advice. The plans, recommendations and content of Training Please, whether prepared by a coach or generated or assisted by artificial intelligence, are sports training guidance. They do not constitute diagnosis, treatment or medical, nutritional or physiotherapy advice.',
    'Medical evaluation. The user declares that they have undergone, or undertakes to undergo, a medical evaluation clearing them for the proposed physical activity, especially if they are over 35, have a history of heart conditions, hypertension, diabetes or previous injuries, or are pregnant.',
    'Assumption of risk. Sport carries inherent risks. The user knows and accepts them and freely decides whether to follow each session, adapting it to how they feel that day.',
    'Listen to your body. The user must stop the activity in case of chest pain, dizziness, unusual shortness of breath, joint pain or any unusual symptom, seek medical attention and tell their coach.',
    'Environment. The user is responsible for the conditions in which they train (traffic, weather, altitude, surface, equipment, hydration).',
    'AI-generated content. When a plan has been generated or adjusted with AI, this will be indicated. It may contain errors and must be used with judgment.',
    `Limitation of liability. To the maximum extent permitted by Peruvian law, ${OWNER} will not be liable for injuries, damages or losses arising from carrying out the training plans, from failure to follow the indications in this notice, from false or omitted health information provided by the user, or from decisions made by the user about their training. This limitation does not apply in cases of wilful misconduct or gross negligence.`,
  ],
};

export const TERMS_EN: LegalSection = {
  title: 'Terms and Conditions of Use',
  items: [
    `Owner: ${OWNER}, with RUC [No.], domiciled at [address], Peru.`,
    'Purpose: Training Please is a private web platform that lets coaches create individual training plans and lets athletes view them and log their progress and how they feel.',
    'Access: only for users aged 18 or over registered by an administrator, using a Google account. The user is responsible for the security of their account and the accuracy of their data.',
    'Obligations: provide truthful information, especially about health, injuries and limitations; tell the coach about any change; do not share the account or attempt to access other users’ data.',
    'Nature of the plans: they are general sports recommendations adapted to the user’s information. Carrying them out is the user’s free decision, and the user assumes the inherent risks. No sporting results are guaranteed. The Disclaimer applies. Nothing in these terms excludes liability that cannot be excluded by law.',
    'Complementary services: paid plans may include in-person services subject to availability and the plan’s conditions; they may be provided by third-party professionals, who are responsible for their own service.',
    'Free and paid plans: pilot users have free access for the period communicated. The conditions of paid plans will be disclosed before purchase, in accordance with the Consumer Protection and Defense Code.',
    'Intellectual property: the software, the brand and the plans belong to their owner. The user’s comments and logs belong to the user, who authorizes us to use them to provide the service.',
    'Cancellation: the user may request cancellation at any time. If the terms change materially, a new acceptance will be requested.',
    'Applicable law: the laws of the Republic of Peru, without prejudice to the consumer’s right to go to INDECOPI.',
  ],
};

export const PRIVACY_EN: LegalSection = {
  title: 'Personal Data Policy',
  items: [
    `Controller: ${OWNER}. "Athletes" database (registration with the ANPD pending). Law No. 29733 and its Regulation (Supreme Decree No. 016-2024-JUS).`,
    'Data we process: identification and contact (name, Google email, photo); physical (age, height and weight); sports (level, goals, races, availability, equipment, completed sessions, comments and perceived effort); and sensitive health data you declare (injuries, limitations, medical conditions).',
    'Necessary purposes: creating and adjusting your plan, including with the help of artificial intelligence (Claude, by Anthropic) under the supervision of your coach, who sets its guidelines, receives the weeks with alerts to review them and can correct any week; allowing your coach to see your compliance and comments; and managing your account. Additional, optional purposes: news and anonymized statistics.',
    'International transfer: your data is stored with Google LLC (Firebase) and Vercel Inc., processed with Anthropic PBC (artificial intelligence) to prepare your plans, and your email is used with Resend to send you notices about your plan and, if you authorized it, the newsletter, on servers outside Peru. We do not sell your data.',
    'Retention: while you have an active account. After cancellation or revocation, we delete or anonymize your data within a maximum of [30] days, unless legally required otherwise.',
    'Rights: access, rectification, cancellation and objection (ARCO) and revocation of consent, free of charge and without having to give a reason.',
    `How to revoke: from Settings > Privacy > Revoke consent (one click and one confirmation; your coach stops seeing your logs immediately) or by writing to ${PRIVACY_EMAIL}. You can revoke only the additional purposes and keep using the app. Revocation does not affect processing carried out before it.`,
    'If you believe we did not handle your request, you can file a complaint with the National Personal Data Protection Authority (ANPD).',
  ],
};
