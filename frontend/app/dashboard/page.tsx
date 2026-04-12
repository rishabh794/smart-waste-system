"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import AdminDashboard from "../../components/admin/AdminDashboard";
import DriverDashboard from "../../components/driver/DriverDashboard";

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  if (status === "loading") {
    return <div className="p-4 font-mono max-w-4xl mx-auto">Loading session...</div>;
  }

  if (!session) return null;

  return (
    <div className="p-4 max-w-4xl mx-auto">
      {/* Universal Header */}
      <div className="flex justify-between items-center border-b-2 border-black pb-4">
        <div>
          <h1 className="text-2xl font-bold">Smart Waste System</h1>
          <p className="text-sm font-mono text-gray-600">
            Logged in as: {session.user?.name} | Role: {session.user?.role}
          </p>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="border border-black px-4 py-2 hover:bg-gray-100 font-bold text-sm text-red-600"
        >
          Sign Out
        </button>
      </div>

      {session.user?.role === "admin" ? (
        <AdminDashboard />
      ) : (
        <DriverDashboard userId={session.user?.id as string} />
      )}
    </div>
  );
}