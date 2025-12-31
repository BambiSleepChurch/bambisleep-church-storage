// Queue Modal Component
function QueueModal({ onAccessGranted }) {
  const { useState, useEffect, useRef } = React;
  const [queueState, setQueueState] = useState("initial"); // initial, joining, queued, active, error
  const [ticketData, setTicketData] = useState(null);
  const [countdown, setCountdown] = useState(0);
  const [queueStatus, setQueueStatus] = useState(null);
  const [error, setError] = useState(null);
  const ticketIdRef = useRef(null);

  // Join queue on mount
  useEffect(() => {
    const joinQueue = async () => {
      setQueueState("joining");
      try {
        console.log("Joining queue...");
        const response = await fetch("/api/queue/join", { method: "POST" });
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        console.log("Queue response:", data);

        ticketIdRef.current = data.ticketId;
        setTicketData(data);

        if (data.status === "granted") {
          console.log("Access granted immediately");
          setQueueState("active");
          setCountdown(0);
          setTimeout(() => onAccessGranted(data.ticketId), 1000);
        } else {
          console.log("Added to queue, position:", data.position);
          setQueueState("queued");
          setCountdown(data.waitTime);
        }
      } catch (err) {
        console.error("Error joining queue:", err);
        setError("Failed to join queue. Please refresh.");
        setQueueState("error");
      }
    };

    joinQueue();
  }, [onAccessGranted]);

  // Poll ticket status when queued
  useEffect(() => {
    if (queueState !== "queued" || !ticketIdRef.current) return;

    const checkTicket = async () => {
      try {
        const response = await fetch(`/api/queue/check/${ticketIdRef.current}`);
        const data = await response.json();

        if (data.status === "active") {
          setQueueState("active");
          setCountdown(0);
          setTimeout(() => onAccessGranted(data.ticketId), 1000);
        } else if (data.status === "queued") {
          setCountdown(data.waitTime);
          setTicketData(data);
        } else if (data.status === "expired") {
          setError("Ticket expired. Please refresh.");
          setQueueState("error");
        }
      } catch (err) {
        console.error("Error checking ticket:", err);
      }
    };

    const interval = setInterval(checkTicket, 1000);
    return () => clearInterval(interval);
  }, [queueState, onAccessGranted]);

  // Countdown timer - decrements every second
  useEffect(() => {
    if (queueState !== "queued" || countdown <= 0) return;

    const timer = setInterval(() => {
      setCountdown((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, [queueState, countdown]);

  // Fetch queue status for display
  useEffect(() => {
    const fetchQueueStatus = async () => {
      try {
        const response = await fetch("/api/queue/status");
        const data = await response.json();
        setQueueStatus(data);
      } catch (err) {
        console.error("Error fetching queue status:", err);
      }
    };

    fetchQueueStatus();
    const interval = setInterval(fetchQueueStatus, 3000);
    return () => clearInterval(interval);
  }, []);

  return React.createElement(
    "div",
    {
      style: {
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.95)",
        backdropFilter: "blur(10px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
        padding: "1rem",
      },
    },
    React.createElement(
      "div",
      {
        className: "glass-bubble glow-effect",
        style: {
          maxWidth: "600px",
          width: "100%",
          padding: "2rem",
          textAlign: "center",
        },
      },
      // Header
      React.createElement(
        "h1",
        {
          style: {
            color: "var(--button-color)",
            marginBottom: "1rem",
            fontSize: "2rem",
            textShadow: "0 0 20px var(--glow-pink)",
          },
        },
        "🎫 Queue System"
      ),

      // Loading State
      queueState === "joining" &&
        React.createElement(
          "div",
          null,
          React.createElement("div", {
            style: {
              width: "50px",
              height: "50px",
              border: "4px solid var(--glass-border)",
              borderTop: "4px solid var(--button-color)",
              borderRadius: "50%",
              animation: "spin 1s linear infinite",
              margin: "2rem auto",
            },
          }),
          React.createElement(
            "p",
            {
              style: { color: "var(--primary-alt)", fontSize: "1.2rem" },
            },
            "Joining queue..."
          )
        ),

      // Queued State
      queueState === "queued" &&
        ticketData &&
        React.createElement(
          "div",
          null,
          React.createElement(
            "div",
            {
              style: {
                fontSize: "4rem",
                color: "var(--secondary-alt)",
                marginBottom: "1rem",
              },
            },
            countdown > 0 ? countdown : "⏳"
          ),

          React.createElement(
            "h2",
            {
              style: { color: "var(--nav-alt)", marginBottom: "1rem" },
            },
            countdown > 0 ? `Wait ${countdown} seconds` : "Almost ready..."
          ),

          React.createElement(
            "div",
            {
              className: "glass-bubble",
              style: {
                padding: "1rem",
                marginTop: "1.5rem",
                background: "rgba(255, 0, 255, 0.1)",
              },
            },
            React.createElement(
              "p",
              {
                style: {
                  color: "var(--tertiary-alt)",
                  fontSize: "0.9rem",
                  marginBottom: "0.5rem",
                },
              },
              "🎫 Your Ticket"
            ),
            React.createElement(
              "p",
              {
                style: {
                  color: "var(--button-color)",
                  fontFamily: "monospace",
                  fontSize: "0.8rem",
                  wordBreak: "break-all",
                },
              },
              ticketData.ticketId
            ),
            React.createElement(
              "p",
              {
                style: {
                  color: "var(--primary-alt)",
                  fontSize: "1.2rem",
                  marginTop: "1rem",
                },
              },
              `Position in queue: #${ticketData.position}`
            )
          ),

          queueStatus &&
            React.createElement(
              "div",
              {
                style: {
                  marginTop: "1.5rem",
                  padding: "1rem",
                  borderTop: "1px solid var(--glass-border)",
                },
              },
              React.createElement(
                "p",
                {
                  style: { color: "var(--nav-color)", fontSize: "0.85rem" },
                },
                `👥 Active viewers: ${queueStatus.active}/${queueStatus.maxConcurrent}`
              ),
              React.createElement(
                "p",
                {
                  style: { color: "var(--nav-color)", fontSize: "0.85rem" },
                },
                `⏳ Waiting in queue: ${queueStatus.waiting}`
              )
            )
        ),

      // Active State
      queueState === "active" &&
        React.createElement(
          "div",
          null,
          React.createElement(
            "div",
            {
              style: {
                fontSize: "4rem",
                marginBottom: "1rem",
              },
            },
            "✅"
          ),
          React.createElement(
            "h2",
            {
              style: { color: "var(--tertiary-alt)", marginBottom: "1rem" },
            },
            "Access Granted!"
          ),
          React.createElement(
            "p",
            {
              style: { color: "var(--primary-alt)" },
            },
            "Loading content..."
          )
        ),

      // Error State
      queueState === "error" &&
        React.createElement(
          "div",
          null,
          React.createElement(
            "div",
            {
              style: {
                fontSize: "4rem",
                color: "var(--error)",
                marginBottom: "1rem",
              },
            },
            "❌"
          ),
          React.createElement(
            "h2",
            {
              style: { color: "var(--error)", marginBottom: "1rem" },
            },
            "Error"
          ),
          React.createElement(
            "p",
            {
              style: { color: "var(--primary-alt)", marginBottom: "1.5rem" },
            },
            error || "Something went wrong"
          ),
          React.createElement(
            "button",
            {
              className: "bubble-button",
              onClick: () => window.location.reload(),
              style: { padding: "0.8rem 1.5rem" },
            },
            "Refresh Page"
          )
        ),

      // Footer note
      queueState === "queued" &&
        React.createElement(
          "div",
          {
            style: {
              marginTop: "2rem",
              padding: "1rem",
              borderTop: "1px solid var(--glass-border)",
              fontSize: "0.75rem",
              color: "var(--nav-color)",
              opacity: 0.7,
            },
          },
          React.createElement(
            "p",
            null,
            "💡 Future: Premium members skip the queue"
          ),
          React.createElement("p", null, "Stripe • Patreon • BambiCloud")
        )
    )
  );
}
