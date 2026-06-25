import SalonMarketplace from "./salon-marketplace";
import { getCurrentSession } from "./lib/auth";
import { getMarketplaceData } from "./lib/marketplace-data";

export const dynamic = "force-dynamic";

type HomeProps = {
  searchParams: Promise<{ authError?: string | string[] }>;
};

function getFirstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function Home({ searchParams }: HomeProps) {
  const [marketplaceData, session, params] = await Promise.all([
    getMarketplaceData(),
    getCurrentSession(),
    searchParams,
  ]);
  const authError = getFirstParam(params.authError);

  return (
    <SalonMarketplace
      {...marketplaceData}
      authError={authError}
      authUser={session?.user || null}
    />
  );
}
