"use client";

import { useState, useEffect, useCallback } from "react";
import { JobCard } from "@/components/JobCard";
import { SearchBar } from "@/components/SearchBar";
import { Filters } from "@/components/Filters";
import type { Job } from "@/lib/schema";

const TABS = [
  { key: "", label: "All" },
  { key: "belgrade", label: "Belgrade" },
  { key: "remote", label: "Remote" },
  { key: "italy", label: "Italy" },
  { key: "spain", label: "Spain" },
  { key: "greece", label: "Greece" },
];

export default function Home() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [scraping, setScraping] = useState(false);

  // Filters
  const [search, setSearch] = useState("");
  const [source, setSource] = useState("");
  const [tab, setTab] = useState("");
  const [remoteOnly, setRemoteOnly] = useState(false);
  const [minScore, setMinScore] = useState(0);
  const [sortBy, setSortBy] = useState("relevance");

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (source) params.set("source", source);
      if (tab) params.set("tab", tab);
      if (remoteOnly) params.set("remote", "true");
      if (minScore > 0) params.set("minScore", minScore.toString());
      if (sortBy !== "relevance") params.set("sort", sortBy);
      params.set("page", page.toString());

      const res = await fetch(`/api/jobs?${params}`);
      const data = await res.json();
      setJobs(data.jobs || []);
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || 1);
    } catch (err) {
      console.error("Failed to fetch jobs:", err);
    } finally {
      setLoading(false);
    }
  }, [search, source, tab, remoteOnly, minScore, sortBy, page]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  const handleScrape = async () => {
    setScraping(true);
    try {
      const res = await fetch("/api/scrape", { method: "POST" });
      const data = await res.json();
      console.log("Scrape results:", data);
      await fetchJobs();
    } catch (err) {
      console.error("Scrape failed:", err);
    } finally {
      setScraping(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bekin novi posao</h1>
          <p className="text-gray-500 mt-1">
            {total} jobs found across all sources
          </p>
        </div>
        <button
          onClick={handleScrape}
          disabled={scraping}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
        >
          {scraping ? "Scraping..." : "Scrape Now"}
        </button>
      </div>

      {/* Region Tabs */}
      <div className="flex gap-1 border-b border-gray-200">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => { setTab(t.key); setPage(1); }}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              tab === t.key
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <SearchBar onSearch={(q) => { setSearch(q); setPage(1); }} initialQuery={search} />

      <div className="flex flex-wrap items-center justify-between gap-4">
        <Filters
          source={source}
          remoteOnly={remoteOnly}
          minScore={minScore}
          onSourceChange={(s) => { setSource(s); setPage(1); }}
          onRemoteChange={(r) => { setRemoteOnly(r); setPage(1); }}
          onMinScoreChange={(s) => { setMinScore(s); setPage(1); }}
        />

        {/* Sort */}
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-700">Sort by:</label>
          <select
            value={sortBy}
            onChange={(e) => { setSortBy(e.target.value); setPage(1); }}
            className="px-3 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          >
            <option value="relevance">Relevance</option>
            <option value="date">Date (newest)</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading jobs...</div>
      ) : jobs.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No jobs found</p>
          <p className="text-gray-400 mt-2">
            Try adjusting your filters or click &quot;Scrape Now&quot; to fetch new jobs
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {jobs.map((job) => (
            <JobCard key={job.id} job={job} />
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-4 pt-4">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 hover:bg-gray-50"
          >
            Previous
          </button>
          <span className="text-gray-600">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 hover:bg-gray-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
