// Download Status Component
function DownloadStatus() {
  const { useState, useEffect } = React;
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const response = await fetch("/api/download-status");
        if (response.ok) {
          const data = await response.json();
          setStatus(data);
        }
      } catch (err) {
        console.error("Error fetching download status:", err);
      } finally {
        setLoading(false);
      }
    };

    // Initial fetch
    fetchStatus();

    // Poll every 2 seconds for updates
    const interval = setInterval(fetchStatus, 2000);

    return () => clearInterval(interval);
  }, []);

  if (loading || !status) {
    return null;
  }

  const hasActivity =
    status.stats.activeCount > 0 || status.stats.waitingCount > 0;

  if (!hasActivity) {
    return null; // Don't show if no downloads
  }

  return React.createElement(
    "div",
    {
      className: "glass-bubble glow-effect compact-container",
      style: {
        margin: "0.4rem",
        maxWidth: "1200px",
        marginLeft: "auto",
        marginRight: "auto",
      },
    },
    React.createElement(
      "h3",
      {
        className: "video-title",
        style: {
          textAlign: "center",
          marginBottom: "1rem",
          color: "var(--nav-alt)",
          fontSize: "1.2rem",
        },
      },
      `📊 Download Status (${status.stats.activeCount}/${status.stats.maxConcurrent} Active)`
    ),

    // Active Downloads
    status.stats.activeCount > 0 &&
      React.createElement(
        "div",
        {
          style: { marginBottom: "1rem" },
        },
        React.createElement(
          "h4",
          {
            style: {
              color: "var(--primary-alt)",
              fontSize: "0.9rem",
              marginBottom: "0.5rem",
            },
          },
          "🔥 Currently Downloading:"
        ),
        React.createElement(
          "div",
          {
            className: "glass-bubble",
            style: {
              padding: "0.5rem",
              background: "rgba(0, 255, 255, 0.05)",
            },
          },
          status.active.map((download, index) =>
            React.createElement(
              "div",
              {
                key: download.sessionId,
                style: {
                  padding: "0.3rem 0.5rem",
                  borderBottom:
                    index < status.active.length - 1
                      ? "1px solid var(--glass-border)"
                      : "none",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                },
              },
              React.createElement(
                "span",
                {
                  style: {
                    color: "var(--tertiary-alt)",
                    fontSize: "0.8rem",
                    fontWeight: "bold",
                  },
                },
                `📥 ${download.filename}`
              ),
              React.createElement(
                "span",
                {
                  style: {
                    color: "var(--primary-alt)",
                    fontSize: "0.7rem",
                    opacity: 0.8,
                  },
                },
                `${download.duration}s`
              )
            )
          )
        )
      ),

    // Queue
    status.stats.waitingCount > 0 &&
      React.createElement(
        "div",
        null,
        React.createElement(
          "h4",
          {
            style: {
              color: "var(--secondary-alt)",
              fontSize: "0.9rem",
              marginBottom: "0.5rem",
            },
          },
          `⏳ Queue (${status.stats.waitingCount} waiting):`
        ),
        React.createElement(
          "div",
          {
            className: "glass-bubble",
            style: {
              padding: "0.5rem",
              background: "rgba(255, 0, 255, 0.05)",
            },
          },
          status.waiting.map((item, index) =>
            React.createElement(
              "div",
              {
                key: item.sessionId,
                style: {
                  padding: "0.3rem 0.5rem",
                  borderBottom:
                    index < status.waiting.length - 1
                      ? "1px solid var(--glass-border)"
                      : "none",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                },
              },
              React.createElement(
                "span",
                {
                  style: {
                    color: "var(--button-color)",
                    fontSize: "0.8rem",
                  },
                },
                `#${item.position} - ${item.filename}`
              ),
              React.createElement(
                "span",
                {
                  style: {
                    color: "var(--secondary-alt)",
                    fontSize: "0.7rem",
                    opacity: 0.8,
                  },
                },
                `waiting ${item.waitTime}s`
              )
            )
          )
        )
      )
  );
}
