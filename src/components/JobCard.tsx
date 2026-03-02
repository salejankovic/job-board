"use client";

import type { Job } from "@/lib/schema";

const sourceColors: Record<string, string> = {
  infostud: "bg-blue-100 text-blue-800",
  linkedin: "bg-sky-100 text-sky-800",
  remoteok: "bg-green-100 text-green-800",
  weworkremotely: "bg-purple-100 text-purple-800",
  jobicy: "bg-orange-100 text-orange-800",
  jobicy_es: "bg-orange-100 text-orange-800",
  jobicy_gr: "bg-cyan-100 text-cyan-800",
  jobicy_it: "bg-red-100 text-red-800",
  jobicy_eu: "bg-amber-100 text-amber-800",
};

const sourceLabels: Record<string, string> = {
  infostud: "Infostud",
  linkedin: "LinkedIn",
  remoteok: "RemoteOK",
  weworkremotely: "WeWorkRemotely",
  jobicy: "Jobicy",
  jobicy_es: "Jobicy Spain",
  jobicy_gr: "Jobicy Greece",
  jobicy_it: "Jobicy Italy",
  jobicy_eu: "Jobicy Europe",
};

export function JobCard({ job }: { job: Job }) {
  const scoreColor =
    (job.relevanceScore ?? 0) >= 60
      ? "text-green-600"
      : (job.relevanceScore ?? 0) >= 30
        ? "text-yellow-600"
        : "text-gray-400";

  return (
    <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow bg-white">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <a
            href={job.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-lg font-semibold text-gray-900 hover:text-blue-600 line-clamp-2"
          >
            {job.title}
          </a>
          <p className="text-gray-600 mt-1">{job.company}</p>
        </div>
        <div className={`text-2xl font-bold ${scoreColor} shrink-0`}>
          {job.relevanceScore ?? 0}%
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 mt-3">
        {job.location && (
          <span className="text-sm text-gray-500">{job.location}</span>
        )}
        {job.isRemote && (
          <span className="px-2 py-0.5 text-xs font-medium bg-emerald-100 text-emerald-700 rounded-full">
            Remote
          </span>
        )}
        <span
          className={`px-2 py-0.5 text-xs font-medium rounded-full ${sourceColors[job.source] || "bg-gray-100 text-gray-800"}`}
        >
          {sourceLabels[job.source] || job.source}
        </span>
        {job.salary && (
          <span className="text-sm text-green-700 font-medium">{job.salary}</span>
        )}
      </div>

      {job.description && (
        <p className="text-sm text-gray-500 mt-2 line-clamp-2">{job.description}</p>
      )}

      <div className="text-xs text-gray-400 mt-2">
        Scraped: {new Date(job.scrapedAt).toLocaleDateString()}
      </div>
    </div>
  );
}
