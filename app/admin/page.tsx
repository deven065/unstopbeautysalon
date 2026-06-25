import { revalidatePath } from "next/cache";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  isCustomerRequestStatus,
  listCustomerRequests,
  updateCustomerRequestStatus,
  type CustomerRequestStatus,
} from "@/app/lib/customer-requests";
import { getCurrentSession } from "@/app/lib/auth";

export const dynamic = "force-dynamic";

const statuses: CustomerRequestStatus[] = [
  "new",
  "confirmed",
  "contacted",
  "completed",
  "cancelled",
];

function toDateOnly(value: Date | string) {
  if (typeof value === "string") return value.slice(0, 10);
  return value.toISOString().slice(0, 10);
}

async function updateRequestStatus(formData: FormData) {
  "use server";

  const session = await getCurrentSession();

  if (session?.user.role !== "admin") {
    redirect("/api/auth/google/start?role=admin&returnTo=/admin");
  }

  const id = String(formData.get("id") || "");
  const status = formData.get("status");

  if (id && isCustomerRequestStatus(status)) {
    await updateCustomerRequestStatus(id, status);
    revalidatePath("/admin");
  }
}

export default async function AdminPage() {
  const session = await getCurrentSession();

  if (!session) {
    redirect("/api/auth/google/start?role=admin&returnTo=/admin");
  }

  if (session.user.role !== "admin") {
    return (
      <main className="min-h-screen bg-[#fff9f7] px-6 py-16 text-[#2d2525]">
        <section className="mx-auto max-w-2xl rounded-lg border border-[#eadbd6] bg-white p-6 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#9b5963]">
            Admin access denied
          </p>
          <h1 className="mt-3 text-3xl font-semibold">This Google account is a customer account.</h1>
          <p className="mt-3 text-[#665957]">
            Ask the site owner to add {session.user.email} to ADMIN_EMAILS, then sign in again.
          </p>
          <a
            className="mt-6 inline-flex rounded-lg bg-[#2d2525] px-4 py-3 font-semibold text-white"
            href="/api/auth/logout"
          >
            Sign out
          </a>
        </section>
      </main>
    );
  }

  const requests = await listCustomerRequests(100);

  return (
    <main className="min-h-screen bg-[#fff9f7] px-4 py-8 text-[#2d2525] sm:px-8">
      <section className="mx-auto max-w-7xl">
        <div className="flex flex-col justify-between gap-4 border-b border-[#eadbd6] pb-6 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#9b5963]">
              GlowNest admin
            </p>
            <h1 className="mt-2 text-3xl font-semibold sm:text-4xl">Customer requests</h1>
            <p className="mt-2 text-sm text-[#665957]">
              Signed in as {session.user.email}
            </p>
          </div>
          <div className="flex gap-3">
            <Link
              className="rounded-lg border border-[#e7d6d0] bg-white px-4 py-3 text-sm font-semibold text-[#6e3038]"
              href="/"
            >
              Website
            </Link>
            <a
              className="rounded-lg bg-[#2d2525] px-4 py-3 text-sm font-semibold text-white"
              href="/api/auth/logout"
            >
              Sign out
            </a>
          </div>
        </div>

        <div className="mt-6 overflow-hidden rounded-lg border border-[#eadbd6] bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-[#efe1dc] text-left text-sm">
              <thead className="bg-[#fff3ef] text-xs font-semibold uppercase tracking-[0.12em] text-[#8d4a55]">
                <tr>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Salon</th>
                  <th className="px-4 py-3">Service</th>
                  <th className="px-4 py-3">When</th>
                  <th className="px-4 py-3">Payment</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f1e5e1]">
                {requests.map((request) => (
                  <tr key={request.id} className="align-top">
                    <td className="px-4 py-4">
                      <strong className="block">{request.customer_name}</strong>
                      <span className="block text-[#665957]">{request.phone}</span>
                      {request.email && <span className="block text-[#665957]">{request.email}</span>}
                    </td>
                    <td className="px-4 py-4">
                      <strong className="block">{request.salon_name}</strong>
                      <span className="block text-[#665957]">{request.request_type}</span>
                    </td>
                    <td className="px-4 py-4">
                      <span className="block">{request.service}</span>
                      {request.notes && (
                        <span className="mt-1 block max-w-xs text-[#665957]">{request.notes}</span>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      {toDateOnly(request.appointment_date)}
                      <span className="block text-[#665957]">{request.appointment_time}</span>
                    </td>
                    <td className="px-4 py-4">
                      {request.amount_paid ? `Rs. ${request.amount_paid}` : "Not paid"}
                      {request.payment_id && (
                        <span className="block max-w-[12rem] truncate text-[#665957]">
                          {request.payment_id}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <form action={updateRequestStatus} className="flex min-w-44 gap-2">
                        <input name="id" type="hidden" value={request.id} />
                        <select
                          className="h-10 rounded-lg border border-[#eadbd6] bg-white px-2 text-sm"
                          defaultValue={request.status}
                          name="status"
                        >
                          {statuses.map((status) => (
                            <option key={status} value={status}>
                              {status}
                            </option>
                          ))}
                        </select>
                        <button
                          className="h-10 rounded-lg bg-[#2d2525] px-3 text-sm font-semibold text-white"
                          type="submit"
                        >
                          Save
                        </button>
                      </form>
                    </td>
                  </tr>
                ))}
                {requests.length === 0 && (
                  <tr>
                    <td className="px-4 py-8 text-center text-[#665957]" colSpan={6}>
                      No customer requests yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </main>
  );
}
