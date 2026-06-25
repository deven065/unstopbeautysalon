type DeploymentIssueProps = {
  message: string;
};

const requiredEnvironment = [
  "DATABASE_URL",
  "AUTH_SECRET",
  "ADMIN_EMAILS",
  "LOCAL_AUTH_PASSWORD",
  "NEXT_PUBLIC_SITE_URL",
  "NEXT_PUBLIC_RAZORPAY_KEY_ID",
  "RAZORPAY_KEY_ID",
  "RAZORPAY_KEY_SECRET",
];

export default function DeploymentIssue({ message }: DeploymentIssueProps) {
  return (
    <main className="min-h-screen bg-[#fff9f7] px-4 py-10 text-[#2d2525] sm:px-8">
      <section className="mx-auto max-w-3xl rounded-lg border border-[#eadbd6] bg-white p-6 shadow-[0_24px_70px_rgba(110,48,56,0.12)] sm:p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#9b5963]">
          Deployment setup needed
        </p>
        <h1 className="mt-3 text-3xl font-semibold sm:text-4xl">
          GlowNest is deployed, but the database is not reachable.
        </h1>
        <p className="mt-4 rounded-lg bg-[#fff3ef] p-4 text-sm font-semibold text-[#8d4a55]">
          {message}
        </p>
        <p className="mt-5 text-base leading-7 text-[#665957]">
          The marketplace is database-backed. On Vercel, use Vercel Postgres, Neon, Supabase,
          Railway, or another hosted Postgres database. A local pgAdmin/Postgres URL cannot work
          from Vercel serverless functions.
        </p>
        <div className="mt-6 rounded-lg bg-[#edf8f3] p-4">
          <strong className="block text-sm text-[#356c5c]">Set these in Vercel Project Settings</strong>
          <ul className="mt-3 grid gap-2 text-sm text-[#4d625c] sm:grid-cols-2">
            {requiredEnvironment.map((key) => (
              <li key={key} className="rounded-md bg-white px-3 py-2 font-mono text-xs">
                {key}
              </li>
            ))}
          </ul>
        </div>
        <p className="mt-5 text-sm text-[#665957]">
          After updating environment variables, redeploy the project from Vercel.
        </p>
      </section>
    </main>
  );
}
