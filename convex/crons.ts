import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();
// Sign-in: the owner hears before Apple's client secret lapses; Apple tokens pending revocation are retried.
crons.daily(
  "Remind the owner before the Apple sign-in secret lapses",
  { hourUTC: 0, minuteUTC: 0 },
  internal.auth.remindAppleSecret,
);
crons.interval(
  "Retry pending Apple token revocations",
  { hours: 1 },
  internal.signIn.appleTokens.retry,
);
export default crons;
