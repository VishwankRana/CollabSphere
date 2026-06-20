import { RefreshCw, Wifi, WifiOff } from "lucide-react";

const STATUS_CONFIG = {
  synced: {
    label: "Synced",
    className: "connection-synced",
    icon: Wifi,
    spin: false,
  },
  connected: {
    label: "Syncing",
    className: "connection-syncing",
    icon: RefreshCw,
    spin: true,
  },
  connecting: {
    label: "Syncing",
    className: "connection-syncing",
    icon: RefreshCw,
    spin: true,
  },
  disconnected: {
    label: "Offline",
    className: "connection-offline",
    icon: WifiOff,
    spin: false,
  },
};

export default function ConnectionStatusBadge({ status }) {
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.disconnected;
  const Icon = config.icon;

  return (
    <div
      className={`connection-status-badge ${config.className}`}
      aria-live="polite"
      aria-label={`Connection status: ${config.label}`}
    >
      <Icon className={config.spin ? "is-spinning" : ""} size={13} strokeWidth={1.5} />
      <span>{config.label}</span>
    </div>
  );
}
