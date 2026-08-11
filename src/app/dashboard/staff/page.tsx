"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { LoaderCircle, UserPlus, Users } from "lucide-react";
import { StrongPasswordFields } from "@/components/strong-password-fields";

type Staff = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  role: string;
  isActive: boolean;
};
const roles = [
  "SUPER_ADMIN",
  "MANAGER",
  "RECEPTIONIST",
  "ACCOUNTANT",
  "HOUSEKEEPER",
];
const input =
  "h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-slate-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10";

export default function StaffPage() {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [message, setMessage] = useState("");
  const [creating, setCreating] = useState(false);
  const load = useCallback(async () => {
    const response = await fetch("/api/staff");
    if (response.ok) setStaff(await response.json());
    else setMessage((await response.json()).message);
  }, []);
  useEffect(() => {
    const timer = setTimeout(() => {
      void load();
    }, 0);
    return () => clearTimeout(timer);
  }, [load]);
  async function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCreating(true);
    const form = event.currentTarget;
    const response = await fetch("/api/staff", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(Object.fromEntries(new FormData(form))),
    });
    const result = await response.json();
    setCreating(false);
    setMessage(
      response.ok ? "Staff account created successfully" : result.message,
    );
    if (response.ok) {
      form.reset();
      load();
    }
  }
  async function update(id: string, data: object) {
    const response = await fetch(`/api/staff/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const result = await response.json();
    setMessage(response.ok ? "Staff account updated" : result.message);
    if (response.ok) load();
  }
  return (
    <main className="p-5 md:p-8 xl:p-10">
      <div className="flex items-center gap-4">
        <span className="rounded-[16px] bg-violet-50 p-3 text-violet-700">
          <Users />
        </span>
        <div>
          <h1 className="text-4xl font-black tracking-[-0.04em]">
            Staff management
          </h1>
          <p className="text-slate-500">
            Create secure accounts and control staff access.
          </p>
        </div>
      </div>
      <form
        onSubmit={create}
        className="mt-7 rounded-[26px] border bg-white p-6 shadow-sm"
      >
        <div className="mb-6 flex items-center gap-3 border-b border-slate-100 pb-4">
          <UserPlus className="text-emerald-600" />
          <div>
            <h2 className="font-black">Register new staff member</h2>
            <p className="text-sm text-slate-500">
              Assign a role and strong temporary password.
            </p>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <input
            name="firstName"
            required
            placeholder="First name"
            className={input}
          />
          <input
            name="lastName"
            required
            placeholder="Last name"
            className={input}
          />
          <input
            name="email"
            type="email"
            required
            placeholder="Email address"
            className={input}
          />
          <input name="phone" placeholder="Phone number" className={input} />
          <select name="role" className={input}>
            {roles
              .filter((role) => role !== "SUPER_ADMIN")
              .map((role) => (
                <option key={role}>{role}</option>
              ))}
          </select>
        </div>
        <div className="mt-5 max-w-2xl">
          <StrongPasswordFields
            passwordName="password"
            passwordLabel="Strong temporary password"
          />
        </div>
        <button
          disabled={creating}
          className="mt-6 flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-emerald-600 px-6 py-3.5 font-black text-white disabled:opacity-60"
        >
          {creating ? (
            <LoaderCircle className="animate-spin" size={18} />
          ) : (
            <UserPlus size={18} />
          )}
          {creating ? "Creating account..." : "Create secure staff account"}
        </button>
      </form>
      {message && (
        <p className="mt-5 rounded-xl bg-blue-50 p-4 text-sm font-bold text-blue-800">
          {message}
        </p>
      )}
      <div className="mt-6 space-y-3">
        {staff.map((member) => (
          <div
            key={member.id}
            className="grid gap-4 rounded-[20px] border bg-white p-5 shadow-sm md:grid-cols-[1fr_220px_auto] md:items-center"
          >
            <div>
              <p className="font-black">
                {member.firstName} {member.lastName}
              </p>
              <p className="text-sm text-slate-500">
                {member.email} Â· {member.phone || "No phone"}
              </p>
            </div>
            <select
              value={member.role}
              onChange={(event) =>
                update(member.id, { role: event.target.value })
              }
              className={input}
            >
              {roles.map((role) => (
                <option key={role}>{role}</option>
              ))}
            </select>
            <button
              onClick={() => update(member.id, { isActive: !member.isActive })}
              className={`rounded-xl px-4 py-2.5 text-sm font-black ${member.isActive ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700"}`}
            >
              {member.isActive ? "Deactivate" : "Activate"}
            </button>
          </div>
        ))}
      </div>
    </main>
  );
}
