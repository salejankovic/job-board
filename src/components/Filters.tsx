"use client";

interface FiltersProps {
  source: string;
  remoteOnly: boolean;
  minScore: number;
  onSourceChange: (source: string) => void;
  onRemoteChange: (remote: boolean) => void;
  onMinScoreChange: (score: number) => void;
}

const SOURCES = [
  { value: "", label: "All Sources" },
  { value: "infostud", label: "Infostud (Serbia)" },
  { value: "linkedin", label: "LinkedIn" },
  { value: "remoteok", label: "RemoteOK" },
  { value: "weworkremotely", label: "WeWorkRemotely" },
  { value: "jobicy", label: "Jobicy (Remote)" },
  { value: "jobicy_es", label: "Jobicy Spain" },
  { value: "jobicy_gr", label: "Jobicy Greece" },
  { value: "jobicy_it", label: "Jobicy Italy" },
  { value: "jobicy_eu", label: "Jobicy Europe" },
];

export function Filters({
  source,
  remoteOnly,
  minScore,
  onSourceChange,
  onRemoteChange,
  onMinScoreChange,
}: FiltersProps) {
  return (
    <div className="flex flex-wrap items-center gap-4">
      <select
        value={source}
        onChange={(e) => onSourceChange(e.target.value)}
        className="px-3 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        {SOURCES.map((s) => (
          <option key={s.value} value={s.value}>
            {s.label}
          </option>
        ))}
      </select>

      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={remoteOnly}
          onChange={(e) => onRemoteChange(e.target.checked)}
          className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
        />
        <span className="text-sm text-gray-700">Remote only</span>
      </label>

      <div className="flex items-center gap-2">
        <label className="text-sm text-gray-700">Min relevance:</label>
        <input
          type="range"
          min="0"
          max="100"
          value={minScore}
          onChange={(e) => onMinScoreChange(parseInt(e.target.value, 10))}
          className="w-24"
        />
        <span className="text-sm text-gray-600 w-8">{minScore}%</span>
      </div>
    </div>
  );
}
