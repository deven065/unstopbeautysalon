import SalonMarketplace from "./salon-marketplace";
import { getCurrentSession } from "./lib/auth";
import { fallbackMarketplaceData } from "./lib/fallback-marketplace-data";
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
  let marketplaceData: Awaited<ReturnType<typeof getMarketplaceData>> = fallbackMarketplaceData;
  let session: Awaited<ReturnType<typeof getCurrentSession>> | null = null;

  try {
    if (!setupIssue) {
      [marketplaceData, session] = await Promise.all([getMarketplaceData(), getCurrentSession()]);
    }
  } catch (error) {
    console.error("Falling back to bundled marketplace data.", error);
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
