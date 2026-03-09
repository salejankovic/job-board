"use client";

import { useState, useEffect, useRef } from "react";

export default function SettingsPage() {
  const [keywords, setKeywords] = useState<string[]>([]);
  const [excludedKeywords, setExcludedKeywords] = useState<string[]>([]);
  const [minRelevanceScore, setMinRelevanceScore] = useState(0);
  const [newKeyword, setNewKeyword] = useState("");
  const [newExcluded, setNewExcluded] = useState("");

  // Profile
  const [profileName, setProfileName] = useState("");
  const [profileSummary, setProfileSummary] = useState("");
  const [profileSkills, setProfileSkills] = useState<string[]>([]);
  const [profilePreferences, setProfilePreferences] = useState("");
  const [newSkill, setNewSkill] = useState("");

  // CV
  const [cvKeywords, setCvKeywords] = useState<string[]>([]);
  const [cvUploaded, setCvUploaded] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
        setProfileName(data.profileName || "");
        setProfileSummary(data.profileSummary || "");
        setProfileSkills(data.profileSkills || []);
        setProfilePreferences(data.profilePreferences || "");
        setCvKeywords(data.cvKeywords || []);
        setCvUploaded(!!data.cvText);
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
        body: JSON.stringify({
          keywords,
          excludedKeywords,
          minRelevanceScore,
          profileName,
          profileSummary,
          profileSkills,
          profilePreferences,
        }),
      });
      setMessage("Saved! All jobs have been re-scored.");
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

  const addSkill = () => {
    const s = newSkill.trim();
    if (s && !profileSkills.includes(s)) {
      setProfileSkills([...profileSkills, s]);
      setNewSkill("");
    }
  };

  const handleCvUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setMessage("");
    try {
      const formData = new FormData();
      formData.append("cv", file);

      const res = await fetch("/api/cv", { method: "POST", body: formData });
      const data = await res.json();

      if (data.success) {
        setCvKeywords(data.extractedKeywords || []);
        setCvUploaded(true);
        setMessage(`CV uploaded! Extracted ${data.extractedKeywords?.length || 0} keywords. Jobs re-scored.`);
      } else {
        setMessage(data.error || "Failed to process CV.");
      }
    } catch {
      setMessage("Failed to upload CV.");
    } finally {
      setUploading(false);
    }
  };

  if (loading) return <div className="text-center py-12 text-gray-500">Loading...</div>;

  return (
    <div className="space-y-10 max-w-2xl pb-12">
      <h1 className="text-2xl font-bold text-gray-900">Settings</h1>

      {/* Profile Section */}
      <section className="space-y-4 p-6 bg-white rounded-xl border border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900">About Me</h2>
        <p className="text-sm text-gray-500">
          Tell us about yourself so we can find more relevant jobs. This info helps improve relevance scoring.
        </p>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
          <input
            type="text"
            value={profileName}
            onChange={(e) => setProfileName(e.target.value)}
            placeholder="Your name"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            About me / Current job
          </label>
          <textarea
            value={profileSummary}
            onChange={(e) => setProfileSummary(e.target.value)}
            placeholder="What do you do at your current job? What are you looking for? What kind of role would be ideal?"
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            What kind of work are you looking for?
          </label>
          <textarea
            value={profilePreferences}
            onChange={(e) => setProfilePreferences(e.target.value)}
            placeholder="E.g., Full-time remote, marketing manager role, prefer creative agency, open to contract work..."
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Skills</label>
          <p className="text-xs text-gray-400 mb-2">These are used to boost relevance for matching jobs.</p>
          <div className="flex flex-wrap gap-2 mb-2">
            {profileSkills.map((s) => (
              <span
                key={s}
                className="inline-flex items-center gap-1 px-3 py-1 bg-violet-100 text-violet-800 rounded-full text-sm"
              >
                {s}
                <button
                  onClick={() => setProfileSkills(profileSkills.filter((x) => x !== s))}
                  className="ml-1 text-violet-600 hover:text-violet-900 font-bold"
                >
                  x
                </button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={newSkill}
              onChange={(e) => setNewSkill(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addSkill())}
              placeholder="Add a skill..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
            <button
              onClick={addSkill}
              className="px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700"
            >
              Add
            </button>
          </div>
        </div>
      </section>

      {/* CV Upload Section */}
      <section className="space-y-4 p-6 bg-white rounded-xl border border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900">Upload CV</h2>
        <p className="text-sm text-gray-500">
          Upload your CV (PDF or TXT) and we&apos;ll extract keywords to improve job relevance scoring.
        </p>

        <div className="flex items-center gap-4">
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.txt"
            onChange={handleCvUpload}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 font-medium"
          >
            {uploading ? "Processing..." : cvUploaded ? "Re-upload CV" : "Upload CV"}
          </button>
          {cvUploaded && (
            <span className="text-sm text-green-600">CV uploaded</span>
          )}
        </div>

        {cvKeywords.length > 0 && (
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">
              Extracted keywords from CV ({cvKeywords.length}):
            </p>
            <div className="flex flex-wrap gap-1">
              {cvKeywords.map((kw) => (
                <span
                  key={kw}
                  className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded text-xs"
                >
                  {kw}
                </span>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Keywords Section */}
      <section className="space-y-4 p-6 bg-white rounded-xl border border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900">Relevance Keywords</h2>
        <p className="text-sm text-gray-500">
          Jobs are scored 0-100% based on how many keywords match the title and description.
        </p>

        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-gray-700">Positive Keywords</h3>
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

        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-gray-700">Excluded Keywords</h3>
          <p className="text-xs text-gray-400">Jobs with these keywords will be hidden.</p>
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

        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-gray-700">Minimum Relevance Score</h3>
          <p className="text-xs text-gray-400">
            Default filter on the jobs page. Currently: {minRelevanceScore}%
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
      </section>

      {/* Save */}
      <div className="flex items-center gap-4">
        <button
          onClick={save}
          disabled={saving}
          className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 font-medium"
        >
          {saving ? "Saving & re-scoring..." : "Save All Settings"}
        </button>
        {message && <span className="text-green-600 text-sm">{message}</span>}
      </div>
    </div>
  );
}
