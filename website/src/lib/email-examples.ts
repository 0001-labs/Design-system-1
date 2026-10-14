import { emailMessage } from '../../../DS1/4-page/email';

// Three made-up products: a short name, a second short one, and a longer
// name that takes the wide label.
export const emailExamples = ['Notes', 'Projects', 'Site builder'].flatMap(product => {
  const homeUrl = { Notes: 'https://example.com', Projects: 'https://example.org', 'Site builder': 'https://example.net' }[product]!;
  const identity = { product, homeUrl, wideLabel: product === 'Site builder', fontUrl: '/email-assets/GT-America-Standard-Regular.woff2' };
  return [
    { id: `${product}-welcome`, label: `${product} · Welcome`, ...emailMessage({ ...identity,
      title: product === 'Notes' ? 'Happy onboarding : )' : `Welcome to ${product}`,
      paragraphs: product === 'Notes' ? ['Hi,', 'Notes keeps your lists and notes the way you like them.', 'Make a simple list or a whole new system.'] : ['Hi,', product === 'Site builder' ? 'Your next website starts here.' : 'Your projects, plans and updates are ready.', 'Everything you need is in one place.'],
      action: { label: 'Begin here', href: homeUrl }, footer: 'Feel free to reply if you have thoughts or questions.' }) },
    { id: `${product}-code`, label: `${product} · Sign-in code`, ...emailMessage({ ...identity,
      title: `Your ${product} sign-in code`, paragraphs: ['482913', `Enter this code to sign in to ${product}. It expires in 10 minutes and can only be used once.`],
      footer: 'If you did not request this code, you can ignore this email.' }) },
    { id: `${product}-invitation`, label: `${product} · Invitation`, ...emailMessage({ ...identity,
      title: 'You’re invited', paragraphs: [`Alex shared work with you on ${product}.`, 'Open the invitation to see what is waiting for you.'],
      action: { label: 'View invitation', href: homeUrl }, footer: 'This is a design example. It does not grant access or send email.' }) },
  ];
});
