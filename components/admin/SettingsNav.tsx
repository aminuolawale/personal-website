"use client";

export const SETTINGS_SECTIONS = [
  { id: "visibility", label: "Section Visibility" },
  { id: "content",    label: "Site Content" },
  { id: "experience", label: "Work Experience" },
  { id: "palette",    label: "Color Palette" },
  { id: "typography", label: "Typography" },
  { id: "tabs",       label: "Tab Order" },
] as const;

export type SettingsSectionId = (typeof SETTINGS_SECTIONS)[number]["id"];

interface Props {
  active: SettingsSectionId;
  onSelect: (id: SettingsSectionId) => void;
}

export default function SettingsNav({ active, onSelect }: Props) {
  return (
    <nav className="sticky top-8">
      <p className="font-mono text-[9px] uppercase tracking-widest text-muted/30 mb-3 px-2">
        Settings
      </p>
      <ul className="space-y-0.5">
        {SETTINGS_SECTIONS.map(({ id, label }) => (
          <li key={id}>
            <button
              onClick={() => onSelect(id)}
              className={`w-full text-left font-mono text-xs px-2 py-1.5 border-l-2 transition-colors ${
                active === id
                  ? "border-accent text-accent"
                  : "border-transparent text-muted/35 hover:text-muted/65 hover:border-muted/20"
              }`}
            >
              {label}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}
