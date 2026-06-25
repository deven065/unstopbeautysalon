import DeploymentIssue from "./deployment-issue";
import SalonMarketplace from "./salon-marketplace";
import { getCurrentSession } from "./lib/auth";
import { getMarketplaceData } from "./lib/marketplace-data";
import { getDatabaseSetupIssue } from "./lib/postgres";

export const dynamic = "force-dynamic";

type HomeProps = {
  searchParams: Promise<{ authError?: string | string[] }>;
};

function getFirstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function Home({ searchParams }: HomeProps) {
  const params = await searchParams;
  const setupIssue = getDatabaseSetupIssue();

  if (setupIssue) {
    return <DeploymentIssue message={setupIssue} />;
  }

  let marketplaceData: Awaited<ReturnType<typeof getMarketplaceData>>;
  let session: Awaited<ReturnType<typeof getCurrentSession>>;

  try {
    [marketplaceData, session] = await Promise.all([
      getMarketplaceData(),
      getCurrentSession(),
    ]);
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "The deployment could not load marketplace data from Postgres.";

    return <DeploymentIssue message={message} />;
  }

  const authError = getFirstParam(params.authError);

  return (
    <SalonMarketplace
      {...marketplaceData}
      authError={authError}
      authUser={session?.user || null}
    />
  );
}
