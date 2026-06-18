const STATUS_CONFIG = {
  synced: {
    label: "Synced",
    className: "connection-synced",
    showSpinner: false,
  },
  connected: {
    label: "Syncing",
    className: "connection-syncing",
    showSpinner: true,
  },
  connecting: {
    label: "Syncing",
    className: "connection-syncing",
    showSpinner: true,
  },
  disconnected: {
    label: "Offline",
    className: "connection-offline",
    showSpinner: false,
  },
};

export default function ConnectionStatusBadge({ status }) {
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.disconnected;

  return (
    <div
      className={`connection-status-badge ${config.className}`}
      aria-live="polite"
      aria-label={`Connection status: ${config.label}`}
    >
      {config.showSpinner ? (
        <span className="connection-status-spinner" aria-hidden="true" />
      ) : (
        <span className="connection-status-dot" aria-hidden="true" />
      )}
      <span>{config.label}</span>
    </div>
  );
}
