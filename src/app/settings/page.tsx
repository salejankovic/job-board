"use client";

import { useState, useEffect } from "react";

export default function SettingsPage() {
  const [keywords, setKeywords] = useState<string[]>([]);
  const [excludedKeywords, setExcludedKeywords] = useState<string[]>([]);
  const [minRelevanceScore, setMinRelevanceScore] = useState(0);
  const [newKeyword, setNewKeyword] = useState("");
  const [newExcluded, setNewExcluded] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch("/api/preferences")
      .then((r) => r.json())
      .then((data) => {
        setKeywords(data.keywords || []);
        setExcludedKeywords(data.excludedKeywords || []);
        setMinRelevanceScore(data.minRelevanceScore || 0);
      })
      .finally(() => setLoading(false));
  }, []);

  const save = async () => {
    setSaving(true);
    setMessage("");
    try {
      await fetch("/api/preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keywords, excludedKeywords, minRelevanceScore }),
      });
      setMessage("Saved! All jobs have been re-scored with your new keywords.");
    } catch {
      setMessage("Failed to save preferences.");
    } finally {
      setSaving(false);
    }
  };

  const addKeyword = () => {
    const kw = newKeyword.trim();
    if (kw && !keywords.includes(kw)) {
      setKeywords([...keywords, kw]);
      setNewKeyword("");
    }
  };

  const addExcluded = () => {
    const kw = newExcluded.trim();
    if (kw && !excludedKeywords.includes(kw)) {
      setExcludedKeywords([...excludedKeywords, kw]);
      setNewExcluded("");
    }
  };

  if (loading) return <div className="text-center py-12 text-gray-500">Loading...</div>;

  return (
    <div className="space-y-8 max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900">Relevance Settings</h1>
      <p className="text-gray-500">
        Configure which keywords increase or decrease job relevance. Jobs are scored 0-100% based on
        how many of your keywords appear in the title and description.
      </p>

      {/* Positive Keywords */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-gray-800">Relevant Keywords</h2>
        <p className="text-sm text-gray-500">Jobs matching these keywords will score higher.</p>
        <div className="flex flex-wrap gap-2">
          {keywords.map((kw) => (
            <span
              key={kw}
              className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
            >
              {kw}
              <button
                onClick={() => setKeywords(keywords.filter((k) => k !== kw))}
                className="ml-1 text-blue-600 hover:text-blue-900 font-bold"
              >
                x
              </button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={newKeyword}
            onChange={(e) => setNewKeyword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addKeyword())}
            placeholder="Add keyword..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={addKeyword}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Add
          </button>
        </div>
      </div>

      {/* Excluded Keywords */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-gray-800">Excluded Keywords</h2>
        <p className="text-sm text-gray-500">Jobs containing these keywords will be hidden.</p>
        <div className="flex flex-wrap gap-2">
          {excludedKeywords.map((kw) => (
            <span
              key={kw}
              className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm"
            >
              {kw}
              <button
                onClick={() => setExcludedKeywords(excludedKeywords.filter((k) => k !== kw))}
                className="ml-1 text-red-600 hover:text-red-900 font-bold"
              >
                x
              </button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={newExcluded}
            onChange={(e) => setNewExcluded(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addExcluded())}
            placeholder="Add excluded keyword..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
          />
          <button
            onClick={addExcluded}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Add
          </button>
        </div>
      </div>

      {/* Min Score */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-gray-800">Minimum Relevance Score</h2>
        <p className="text-sm text-gray-500">
          Default minimum score filter on the jobs page. Currently: {minRelevanceScore}%
        </p>
        <input
          type="range"
          min="0"
          max="100"
          value={minRelevanceScore}
          onChange={(e) => setMinRelevanceScore(parseInt(e.target.value, 10))}
          className="w-full"
        />
      </div>

      {/* Save */}
      <div className="flex items-center gap-4">
        <button
          onClick={save}
          disabled={saving}
          className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 font-medium"
        >
          {saving ? "Saving & re-scoring..." : "Save Preferences"}
        </button>
        {message && <span className="text-green-600 text-sm">{message}</span>}
      </div>
    </div>
  );
}
