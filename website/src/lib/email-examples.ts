import { emailMessage } from '../../../DS1/4-page/email';

export const emailExamples = ['Ezo', 'Consistency', 'Link'].flatMap(product => {
  const homeUrl = { Ezo: 'https://ezo.gs', Consistency: 'https://consistency.site', Link: 'https://using.link' }[product]!;
  const identity = { product, homeUrl, wideLabel: product === 'Consistency', fontUrl: '/email-assets/GT-America-Standard-Regular.woff2' };
  return [
    { id: `${product}-welcome`, label: `${product} · Welcome`, ...emailMessage({ ...identity,
      title: product === 'Ezo' ? 'Happy onboarding : )' : `Welcome to ${product}`,
      paragraphs: product === 'Ezo' ? ['Hi,', 'Ezo is a highly customizable items and notes app.', 'Make a simple list or a whole new system.', 'And yes, connect to AI.'] : ['Hi,', product === 'Consistency' ? 'Your next website starts here.' : 'Your projects, plans and updates are ready.', 'Everything you need is in one place.'],
      action: { label: 'Begin here', href: homeUrl }, footer: 'Feel free to reply if you have thoughts or questions.' }) },
    { id: `${product}-code`, label: `${product} · Sign-in code`, ...emailMessage({ ...identity,
      title: `Your ${product} sign-in code`, paragraphs: ['482913', `Enter this code to sign in to ${product}. It expires in 10 minutes and can only be used once.`],
      footer: 'If you did not request this code, you can ignore this email.' }) },
    { id: `${product}-invitation`, label: `${product} · Invitation`, ...emailMessage({ ...identity,
      title: 'You’re invited', paragraphs: [`Alex shared work with you on ${product}.`, 'Open the invitation to see what is waiting for you.'],
      action: { label: 'View invitation', href: homeUrl }, footer: 'This is a design example. It does not grant access or send email.' }) },
  ];
});
