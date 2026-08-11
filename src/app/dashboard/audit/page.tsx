import type { Prisma } from "@prisma/client";
import {
  Activity,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Database,
  Filter,
  History,
  RotateCcw,
  Search,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type SearchParams = {
  page?: string;
  size?: string;
  search?: string;
  action?: string;
  entity?: string;
  from?: string;
  to?: string;
};

const pageSizes = [20, 50, 100];

function first(value: string | undefined) {
  return value?.trim() ?? "";
}

function actionTone(action: string) {
  if (action.includes("LOGIN")) {
    return "bg-blue-50 text-blue-700 ring-blue-200 dark:bg-blue-500/10 dark:text-blue-300 dark:ring-blue-500/20";
  }
  if (action.includes("PASSWORD") || action.includes("DEACTIVATE")) {
    return "bg-red-50 text-red-700 ring-red-200 dark:bg-red-500/10 dark:text-red-300 dark:ring-red-500/20";
  }
  if (action.includes("CREATE") || action.includes("CHECK_IN")) {
    return "bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/20";
  }
  if (action.includes("UPDATE") || action.includes("CHANGE")) {
    return "bg-violet-50 text-violet-700 ring-violet-200 dark:bg-violet-500/10 dark:text-violet-300 dark:ring-violet-500/20";
  }
  return "bg-slate-100 text-slate-700 ring-slate-200 dark:bg-white/10 dark:text-slate-300 dark:ring-white/10";
}

function buildHref(params: SearchParams, changes: Partial<SearchParams>) {
  const next = new URLSearchParams();
  const merged = { ...params, ...changes };
  for (const [key, value] of Object.entries(merged)) {
    if (value) next.set(key, value);
  }
  return "?" + next.toString();
}

export default async function AuditPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  if (!["SUPER_ADMIN", "MANAGER"].includes(user.role)) {
    return (
      <main className="p-6 md:p-8">
        <div className="mx-auto max-w-xl rounded-[26px] border border-red-200 bg-red-50 p-8 text-center text-red-800">
          <ShieldCheck className="mx-auto" size={36} />
          <h1 className="mt-4 text-2xl font-black">Access denied</h1>
          <p className="mt-2">
            Only administrators and managers can view audit records.
          </p>
        </div>
      </main>
    );
  }

  const raw = await searchParams;
  const search = first(raw.search);
  const action = first(raw.action);
  const entity = first(raw.entity);
  const from = first(raw.from);
  const to = first(raw.to);
  const requestedSize = Number(raw.size);
  const size = pageSizes.includes(requestedSize) ? requestedSize : 20;
  const requestedPage = Math.max(1, Number(raw.page) || 1);

  const createdAt: Prisma.DateTimeFilter = {};
  if (from) createdAt.gte = new Date(from + "T00:00:00");
  if (to) {
    const nextDay = new Date(to + "T00:00:00");
    nextDay.setDate(nextDay.getDate() + 1);
    createdAt.lt = nextDay;
  }

  const where: Prisma.AuditLogWhereInput = {
    user: { propertyId: user.propertyId },
    ...(action ? { action } : {}),
    ...(entity ? { entity } : {}),
    ...(from || to ? { createdAt } : {}),
    ...(search
      ? {
          OR: [
            { action: { contains: search, mode: "insensitive" } },
            { entity: { contains: search, mode: "insensitive" } },
            { entityId: { contains: search, mode: "insensitive" } },
            {
              user: {
                propertyId: user.propertyId,
                OR: [
                  { firstName: { contains: search, mode: "insensitive" } },
                  { lastName: { contains: search, mode: "insensitive" } },
                  { email: { contains: search, mode: "insensitive" } },
                ],
              },
            },
          ],
        }
      : {}),
  };

  const propertyFilter: Prisma.AuditLogWhereInput = {
    user: { propertyId: user.propertyId },
  };
  const last24Hours = new Date();
  last24Hours.setHours(last24Hours.getHours() - 24);

  const [total, actionRows, entityRows, last24, latest] = await Promise.all([
    prisma.auditLog.count({ where }),
    prisma.auditLog.findMany({
      where: propertyFilter,
      distinct: ["action"],
      select: { action: true },
      orderBy: { action: "asc" },
    }),
    prisma.auditLog.findMany({
      where: propertyFilter,
      distinct: ["entity"],
      select: { entity: true },
      orderBy: { entity: "asc" },
    }),
    prisma.auditLog.count({
      where: { ...propertyFilter, createdAt: { gte: last24Hours } },
    }),
    prisma.auditLog.findFirst({
      where: propertyFilter,
      orderBy: { createdAt: "desc" },
      select: { createdAt: true },
    }),
  ]);

  const pages = Math.max(1, Math.ceil(total / size));
  const page = Math.min(requestedPage, pages);
  const logs = await prisma.auditLog.findMany({
    where,
    include: {
      user: {
        select: {
          firstName: true,
          lastName: true,
          email: true,
          role: true,
        },
      },
    },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    skip: (page - 1) * size,
    take: size,
  });

  const actions = actionRows.map((row) => row.action);
  const entities = entityRows.map((row) => row.entity);
  const activeFilters = [search, action, entity, from, to].filter(
    Boolean,
  ).length;
  const params: SearchParams = {
    search,
    action,
    entity,
    from,
    to,
    size: String(size),
  };
  const rangeStart = total === 0 ? 0 : (page - 1) * size + 1;
  const rangeEnd = Math.min(page * size, total);

  return (
    <main className="min-h-full bg-slate-100/70 p-4 dark:bg-slate-950 sm:p-6 md:p-8">
      <div className="mx-auto max-w-[1500px]">
        <section className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-slate-950 via-indigo-950 to-emerald-950 p-6 text-white shadow-xl md:p-8">
          <div className="absolute -right-16 -top-20 h-64 w-64 rounded-full bg-blue-500/20 blur-3xl" />
          <div className="relative flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-bold text-emerald-300">
                <ShieldCheck size={14} /> Security and accountability
              </div>
              <h1 className="mt-4 text-3xl font-black md:text-4xl">
                Audit trail
              </h1>
              <p className="mt-2 max-w-xl text-sm leading-6 text-slate-300">
                Searchable, immutable history of important staff and system
                activity.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Summary
                label="Last 24 hours"
                value={last24.toLocaleString()}
                icon={Activity}
              />
              <Summary
                label="Latest event"
                value={
                  latest
                    ? latest.createdAt.toLocaleTimeString("en-ZM", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "None"
                }
                icon={Clock3}
              />
            </div>
          </div>
        </section>

        <form className="mt-5 rounded-[24px] border border-slate-200/80 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-slate-900 md:p-5">
          <input type="hidden" name="page" value="1" />
          <div className="grid gap-3 lg:grid-cols-[minmax(240px,1.6fr)_1fr_1fr_1fr_1fr_auto]">
            <label className="relative">
              <Search
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                size={17}
              />
              <input
                name="search"
                defaultValue={search}
                placeholder="Search staff, action or record ID"
                className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:border-white/10 dark:bg-slate-950"
              />
            </label>
            <select
              name="action"
              defaultValue={action}
              className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm dark:border-white/10 dark:bg-slate-950"
            >
              <option value="">All actions</option>
              {actions.map((value) => (
                <option key={value} value={value}>
                  {value.replaceAll("_", " ")}
                </option>
              ))}
            </select>
            <select
              name="entity"
              defaultValue={entity}
              className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm dark:border-white/10 dark:bg-slate-950"
            >
              <option value="">All entities</option>
              {entities.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
            <label className="relative">
              <span className="pointer-events-none absolute -top-2 left-3 bg-white px-1 text-[10px] font-bold text-slate-500 dark:bg-slate-900">
                From
              </span>
              <input
                name="from"
                type="date"
                defaultValue={from}
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm dark:border-white/10 dark:bg-slate-950"
              />
            </label>
            <label className="relative">
              <span className="pointer-events-none absolute -top-2 left-3 bg-white px-1 text-[10px] font-bold text-slate-500 dark:bg-slate-900">
                To
              </span>
              <input
                name="to"
                type="date"
                defaultValue={to}
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm dark:border-white/10 dark:bg-slate-950"
              />
            </label>
            <button className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 text-sm font-black text-white hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-500">
              <Filter size={16} /> Apply
            </button>
          </div>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3 dark:border-white/10">
            <p className="text-xs font-semibold text-slate-500">
              {activeFilters > 0
                ? activeFilters +
                  " active filter" +
                  (activeFilters > 1 ? "s" : "")
                : "Showing all property activity"}
            </p>
            <div className="flex items-center gap-3">
              {activeFilters > 0 && (
                <Link
                  href="/dashboard/audit"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-red-600"
                >
                  <RotateCcw size={13} /> Clear filters
                </Link>
              )}
              <label className="flex items-center gap-2 text-xs font-bold text-slate-500">
                Rows
                <select
                  name="size"
                  defaultValue={String(size)}
                  className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 dark:border-white/10 dark:bg-slate-950"
                >
                  {pageSizes.map((value) => (
                    <option key={value}>{value}</option>
                  ))}
                </select>
              </label>
            </div>
          </div>
        </form>

        <section className="mt-5 overflow-hidden rounded-[24px] border border-slate-200/80 bg-white shadow-sm dark:border-white/10 dark:bg-slate-900">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4 dark:border-white/10">
            <div>
              <h2 className="font-black text-slate-950 dark:text-white">
                Activity records
              </h2>
              <p className="text-xs text-slate-500">
                Showing {rangeStart}â€“{rangeEnd} of {total.toLocaleString()}{" "}
                records
              </p>
            </div>
            <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-600 dark:bg-white/10 dark:text-slate-300">
              <Database size={14} /> Page {page} of {pages}
            </span>
          </div>

          {logs.length > 0 ? (
            <>
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full min-w-[1000px] text-left text-sm">
                  <thead className="bg-slate-50/80 text-[11px] uppercase tracking-[0.08em] text-slate-500 dark:bg-white/[0.03] dark:text-slate-400">
                    <tr>
                      <th className="px-5 py-3.5">Time</th>
                      <th className="py-3.5">Staff member</th>
                      <th className="py-3.5">Action</th>
                      <th className="py-3.5">Entity</th>
                      <th className="py-3.5">Record</th>
                      <th className="px-5 py-3.5 text-right">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-white/10">
                    {logs.map((log) => (
                      <tr
                        key={log.id}
                        className="transition hover:bg-slate-50/80 dark:hover:bg-white/[0.03]"
                      >
                        <td className="whitespace-nowrap px-5 py-4">
                          <p className="font-bold text-slate-800 dark:text-slate-200">
                            {log.createdAt.toLocaleDateString("en-ZM")}
                          </p>
                          <p className="text-xs text-slate-400">
                            {log.createdAt.toLocaleTimeString("en-ZM")}
                          </p>
                        </td>
                        <td className="py-4">
                          <div className="flex items-center gap-3">
                            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-slate-100 text-xs font-black text-slate-600 dark:bg-white/10 dark:text-slate-300">
                              {log.user
                                ? log.user.firstName.charAt(0) +
                                  log.user.lastName.charAt(0)
                                : "SY"}
                            </span>
                            <div className="min-w-0">
                              <p className="truncate font-bold text-slate-800 dark:text-slate-200">
                                {log.user
                                  ? log.user.firstName + " " + log.user.lastName
                                  : "System"}
                              </p>
                              <p className="max-w-[220px] truncate text-xs text-slate-400">
                                {log.user?.email ?? "Automated event"}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4">
                          <span
                            className={
                              "inline-flex rounded-full px-2.5 py-1 text-[10px] font-black ring-1 " +
                              actionTone(log.action)
                            }
                          >
                            {log.action.replaceAll("_", " ")}
                          </span>
                        </td>
                        <td className="py-4 font-semibold text-slate-600 dark:text-slate-300">
                          {log.entity}
                        </td>
                        <td className="py-4">
                          <code className="block max-w-[170px] truncate rounded-lg bg-slate-100 px-2 py-1 text-[11px] text-slate-600 dark:bg-white/10 dark:text-slate-300">
                            {log.entityId ?? "â€”"}
                          </code>
                        </td>
                        <td className="px-5 py-4 text-right">
                          {log.details ? (
                            <details className="relative inline-block text-left">
                              <summary className="cursor-pointer list-none rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-50 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/5">
                                View
                              </summary>
                              <div className="absolute right-0 z-20 mt-2 w-80 rounded-xl border border-slate-200 bg-slate-950 p-4 text-left text-slate-200 shadow-2xl dark:border-white/10">
                                <pre className="max-h-60 overflow-auto whitespace-pre-wrap break-all text-[11px] leading-5">
                                  {JSON.stringify(log.details, null, 2)}
                                </pre>
                              </div>
                            </details>
                          ) : (
                            <span className="text-xs text-slate-400">None</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="divide-y divide-slate-100 dark:divide-white/10 md:hidden">
                {logs.map((log) => (
                  <article key={log.id} className="p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-slate-100 text-xs font-black dark:bg-white/10">
                          {log.user
                            ? log.user.firstName.charAt(0) +
                              log.user.lastName.charAt(0)
                            : "SY"}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate font-bold text-slate-900 dark:text-white">
                            {log.user
                              ? log.user.firstName + " " + log.user.lastName
                              : "System"}
                          </p>
                          <p className="text-xs text-slate-400">
                            {log.createdAt.toLocaleString("en-ZM")}
                          </p>
                        </div>
                      </div>
                      <span
                        className={
                          "shrink-0 rounded-full px-2 py-1 text-[9px] font-black ring-1 " +
                          actionTone(log.action)
                        }
                      >
                        {log.action.replaceAll("_", " ")}
                      </span>
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
                      <div className="rounded-xl bg-slate-50 p-3 dark:bg-white/5">
                        <p className="text-slate-400">Entity</p>
                        <p className="mt-1 font-bold">{log.entity}</p>
                      </div>
                      <div className="rounded-xl bg-slate-50 p-3 dark:bg-white/5">
                        <p className="text-slate-400">Record ID</p>
                        <p className="mt-1 truncate font-mono">
                          {log.entityId ?? "â€”"}
                        </p>
                      </div>
                    </div>
                    {log.details && (
                      <details className="mt-3">
                        <summary className="cursor-pointer text-xs font-bold text-blue-600 dark:text-blue-400">
                          View event details
                        </summary>
                        <pre className="mt-2 max-h-52 overflow-auto rounded-xl bg-slate-950 p-3 text-[10px] text-slate-200">
                          {JSON.stringify(log.details, null, 2)}
                        </pre>
                      </details>
                    )}
                  </article>
                ))}
              </div>
            </>
          ) : (
            <div className="grid min-h-[320px] place-items-center px-6 text-center">
              <div>
                <History className="mx-auto text-slate-300" size={48} />
                <h3 className="mt-4 text-lg font-black text-slate-900 dark:text-white">
                  No matching activity
                </h3>
                <p className="mt-2 text-sm text-slate-500">
                  Try changing or clearing the selected filters.
                </p>
                <Link
                  href="/dashboard/audit"
                  className="mt-5 inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-bold text-white dark:bg-blue-600"
                >
                  <RotateCcw size={15} /> Clear filters
                </Link>
              </div>
            </div>
          )}
        </section>

        <div className="mt-5 flex flex-col items-center justify-between gap-4 rounded-2xl border border-slate-200/80 bg-white px-5 py-4 dark:border-white/10 dark:bg-slate-900 sm:flex-row">
          <p className="text-sm font-semibold text-slate-500">
            Page {page} of {pages} Â· {total.toLocaleString()} total records
          </p>
          <div className="flex items-center gap-2">
            {page > 1 ? (
              <Link
                href={buildHref(params, { page: String(page - 1) })}
                className="inline-flex items-center gap-1 rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold hover:bg-slate-50 dark:border-white/10 dark:hover:bg-white/5"
              >
                <ChevronLeft size={16} /> Previous
              </Link>
            ) : (
              <span className="inline-flex cursor-not-allowed items-center gap-1 rounded-xl border border-slate-100 px-4 py-2 text-sm font-bold text-slate-300 dark:border-white/5 dark:text-slate-600">
                <ChevronLeft size={16} /> Previous
              </span>
            )}
            {page < pages ? (
              <Link
                href={buildHref(params, { page: String(page + 1) })}
                className="inline-flex items-center gap-1 rounded-xl bg-slate-950 px-4 py-2 text-sm font-bold text-white hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-500"
              >
                Next <ChevronRight size={16} />
              </Link>
            ) : (
              <span className="inline-flex cursor-not-allowed items-center gap-1 rounded-xl bg-slate-100 px-4 py-2 text-sm font-bold text-slate-300 dark:bg-white/5 dark:text-slate-600">
                Next <ChevronRight size={16} />
              </span>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

function Summary({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: typeof Activity;
}) {
  return (
    <div className="min-w-[145px] rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur">
      <Icon size={17} className="text-emerald-300" />
      <p className="mt-3 text-xl font-black">{value}</p>
      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
        {label}
      </p>
    </div>
  );
}
