import { Settings } from "lucide-react";

import IconLabel from "../components/IconLabel";

export default function SettingsPage() {
  return (
    <main className="interview-dashboard-shell page-section">
      <div className="cs-page-header">
        <div>
          <h1 className="font-display section-header">
            <IconLabel icon={Settings} size={22}>
              Settings
            </IconLabel>
          </h1>
          <p className="cs-page-subtitle">Account and workspace preferences.</p>
        </div>
      </div>

      <section className="analytics-panel analytics-section-card">
        <p className="hero-copy">
          Settings are coming soon. Use the sidebar to navigate back to your interviews.
        </p>
      </section>
    </main>
  );
}
