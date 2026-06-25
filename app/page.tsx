import SalonMarketplace from "./salon-marketplace";
import { getCurrentSession } from "./lib/auth";
import { getMarketplaceData } from "./lib/marketplace-data";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [marketplaceData, session] = await Promise.all([
    getMarketplaceData(),
    getCurrentSession(),
  ]);

  return <SalonMarketplace {...marketplaceData} authUser={session?.user || null} />;
}
