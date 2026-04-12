"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  if (status === "loading") {
    return <div className="p-4 font-mono">Loading session...</div>;
  }

  if (!session) return null;

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <div className="flex justify-between items-center border-b-2 border-black pb-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">Smart Waste System</h1>
          <p className="text-sm font-mono text-gray-600">
            Logged in as: {session.user?.name} | Role: {session.user?.role}
          </p>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="border border-black p-2 hover:bg-gray-100"
        >
          Sign Out
        </button>
      </div>

      {session.user?.role === "admin" ? <AdminView /> : <DriverView />}
    </div>
  );
}

// --- ADMIN COMPONENT ---
function AdminView() {
  return (
    <div className="border border-black p-4">
      <h2 className="text-xl font-bold mb-4">Admin Control Center</h2>
      
      <div className="flex gap-4">
        <div className="border border-gray-400 p-4 w-1/2">
          <h3 className="font-bold mb-2">Manage Bins</h3>
          <p className="text-sm mb-4">View map and add new bins to the system.</p>
          <button className="border border-black p-2 w-full bg-gray-100">Open Map</button>
        </div>

        <div className="border border-gray-400 p-4 w-1/2">
          <h3 className="font-bold mb-2">Route Assignment</h3>
          <p className="text-sm mb-4">Assign bins to drivers for Today&apos;s pickup.</p>
          <button className="border border-black p-2 w-full bg-gray-100">Create Route</button>
        </div>
      </div>
    </div>
  );
}

// --- DRIVER COMPONENT ---
function DriverView() {
  return (
    <div className="border border-black p-4">
      <h2 className="text-xl font-bold mb-4">Driver Interface</h2>
      
      <div className="border border-gray-400 p-4 mb-4">
        <h3 className="font-bold mb-2">Today&apos;s Route</h3>
        <p className="text-sm mb-4">You have pending bins to collect today.</p>
        <button className="border border-black p-4 w-full bg-blue-100 font-bold text-lg">
          Start Collection Route
        </button>
      </div>
    </div>
  );
}