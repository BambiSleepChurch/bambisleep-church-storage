// Metronome Component
function Metronome() {
  const { useState, useEffect, useRef } = React;
  const [isPlaying, setIsPlaying] = useState(false);
  const [bpm, setBpm] = useState(60);
  const [beat, setBeat] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const intervalRef = useRef(null);
  const audioContextRef = useRef(null);

  useEffect(() => {
    // Initialize Web Audio API
    if (typeof window !== "undefined" && window.AudioContext) {
      audioContextRef.current = new (window.AudioContext ||
        window.webkitAudioContext)();
    }

    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  useEffect(() => {
    if (isPlaying) {
      const interval = 60000 / bpm; // Convert BPM to milliseconds
      intervalRef.current = setInterval(() => {
        setBeat((prev) => (prev + 1) % 4);
        if (soundEnabled && audioContextRef.current) {
          playClick();
        }
      }, interval);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      setBeat(0);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isPlaying, bpm, soundEnabled]);

  const playClick = () => {
    const ctx = audioContextRef.current;
    if (!ctx) return;

    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    // Higher pitch for beat 0, lower for others
    oscillator.frequency.value = beat === 0 ? 1000 : 800;
    oscillator.type = "sine";

    gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.1);
  };

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  const handleBpmChange = (e) => {
    const newBpm = parseInt(e.target.value);
    setBpm(newBpm);
  };

  const adjustBpm = (delta) => {
    setBpm((prev) => Math.max(30, Math.min(240, prev + delta)));
  };

  return React.createElement(
    "div",
    {
      className: "glass-bubble compact-container",
      style: {
        position: "fixed",
        bottom: "20px",
        right: "20px",
        padding: "1rem",
        minWidth: "280px",
        background:
          "linear-gradient(135deg, rgba(23, 219, 216, 0.15), rgba(2, 184, 147, 0.15))",
        border: "2px solid rgba(23, 219, 216, 0.5)",
        boxShadow: isPlaying
          ? "0 0 30px rgba(23, 219, 216, 0.6), 0 0 60px rgba(0, 255, 255, 0.4)"
          : "0 0 20px rgba(23, 219, 216, 0.3)",
        zIndex: 1000,
        transition: "all 0.3s ease",
      },
    },
    React.createElement(
      "div",
      {
        style: {
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "1rem",
        },
      },
      React.createElement(
        "h3",
        {
          style: {
            margin: 0,
            fontSize: "1rem",
            color: "var(--nav-alt)",
            textShadow: "0 0 10px var(--glow-cyan)",
            fontWeight: "bold",
          },
        },
        "🎵 Metronome"
      ),
      React.createElement(
        "div",
        {
          style: {
            display: "flex",
            gap: "0.5rem",
          },
        },
        // Visual beat indicators
        [0, 1, 2, 3].map((i) =>
          React.createElement("div", {
            key: i,
            style: {
              width: "12px",
              height: "12px",
              borderRadius: "50%",
              background:
                beat === i && isPlaying
                  ? "var(--glow-cyan)"
                  : "rgba(255, 255, 255, 0.2)",
              boxShadow:
                beat === i && isPlaying
                  ? "0 0 15px var(--glow-cyan), 0 0 30px var(--glow-cyan)"
                  : "none",
              transition: "all 0.1s ease",
              border:
                i === 0
                  ? "2px solid var(--button-color)"
                  : "1px solid rgba(255, 255, 255, 0.3)",
            },
          })
        )
      )
    ),

    // BPM Display
    React.createElement(
      "div",
      {
        style: {
          textAlign: "center",
          marginBottom: "1rem",
        },
      },
      React.createElement(
        "div",
        {
          style: {
            fontSize: "2.5rem",
            fontWeight: "bold",
            color: "var(--glow-cyan)",
            textShadow: "0 0 20px var(--glow-cyan)",
            fontFamily: "monospace",
            marginBottom: "0.25rem",
          },
        },
        bpm
      ),
      React.createElement(
        "div",
        {
          style: {
            fontSize: "0.8rem",
            color: "var(--primary-alt)",
            opacity: 0.9,
          },
        },
        "BPM"
      )
    ),

    // BPM Controls
    React.createElement(
      "div",
      {
        style: {
          display: "flex",
          gap: "0.5rem",
          marginBottom: "1rem",
          alignItems: "center",
        },
      },
      React.createElement(
        "button",
        {
          onClick: () => adjustBpm(-10),
          className: "bubble-button",
          style: {
            padding: "0.5rem 0.75rem",
            fontSize: "1rem",
            minWidth: "auto",
            background: "rgba(223, 4, 113, 0.3)",
            border: "1px solid var(--button-color)",
          },
        },
        "−10"
      ),
      React.createElement(
        "button",
        {
          onClick: () => adjustBpm(-1),
          className: "bubble-button",
          style: {
            padding: "0.5rem 0.75rem",
            fontSize: "1rem",
            minWidth: "auto",
            background: "rgba(223, 4, 113, 0.3)",
            border: "1px solid var(--button-color)",
          },
        },
        "−1"
      ),
      React.createElement("input", {
        type: "range",
        min: "30",
        max: "240",
        value: bpm,
        onChange: handleBpmChange,
        style: {
          flex: 1,
          accentColor: "var(--glow-cyan)",
        },
      }),
      React.createElement(
        "button",
        {
          onClick: () => adjustBpm(1),
          className: "bubble-button",
          style: {
            padding: "0.5rem 0.75rem",
            fontSize: "1rem",
            minWidth: "auto",
            background: "rgba(223, 4, 113, 0.3)",
            border: "1px solid var(--button-color)",
          },
        },
        "+1"
      ),
      React.createElement(
        "button",
        {
          onClick: () => adjustBpm(10),
          className: "bubble-button",
          style: {
            padding: "0.5rem 0.75rem",
            fontSize: "1rem",
            minWidth: "auto",
            background: "rgba(223, 4, 113, 0.3)",
            border: "1px solid var(--button-color)",
          },
        },
        "+10"
      )
    ),

    // Play/Stop and Sound Toggle
    React.createElement(
      "div",
      {
        style: {
          display: "flex",
          gap: "0.5rem",
        },
      },
      React.createElement(
        "button",
        {
          onClick: togglePlay,
          className: "bubble-button",
          style: {
            flex: 1,
            padding: "0.75rem",
            fontSize: "1rem",
            fontWeight: "bold",
            background: isPlaying
              ? "linear-gradient(135deg, rgba(223, 4, 113, 0.4), rgba(255, 0, 255, 0.4))"
              : "linear-gradient(135deg, rgba(2, 184, 147, 0.3), rgba(23, 219, 216, 0.3))",
            border: isPlaying
              ? "2px solid var(--button-color)"
              : "2px solid var(--nav-alt)",
            boxShadow: isPlaying
              ? "0 0 20px rgba(223, 4, 113, 0.6)"
              : "0 0 15px rgba(23, 219, 216, 0.5)",
          },
        },
        isPlaying ? "⏸ Stop" : "▶ Start"
      ),
      React.createElement(
        "button",
        {
          onClick: () => setSoundEnabled(!soundEnabled),
          className: "bubble-button",
          style: {
            padding: "0.75rem 1rem",
            fontSize: "1rem",
            background: soundEnabled
              ? "rgba(138, 43, 226, 0.3)"
              : "rgba(0, 0, 0, 0.3)",
            border: soundEnabled
              ? "2px solid var(--glow-purple)"
              : "1px solid rgba(255, 255, 255, 0.3)",
            boxShadow: soundEnabled
              ? "0 0 15px rgba(138, 43, 226, 0.5)"
              : "none",
          },
        },
        soundEnabled ? "🔊" : "🔇"
      )
    ),

    // Tempo presets
    React.createElement(
      "div",
      {
        style: {
          marginTop: "1rem",
          display: "flex",
          gap: "0.5rem",
          flexWrap: "wrap",
          justifyContent: "center",
        },
      },
      [
        { label: "Slow", value: 60 },
        { label: "Med", value: 120 },
        { label: "Fast", value: 180 },
      ].map((preset) =>
        React.createElement(
          "button",
          {
            key: preset.label,
            onClick: () => setBpm(preset.value),
            className: "bubble-button",
            style: {
              padding: "0.4rem 0.8rem",
              fontSize: "0.75rem",
              background:
                bpm === preset.value
                  ? "rgba(138, 43, 226, 0.3)"
                  : "rgba(0, 0, 0, 0.2)",
              border:
                bpm === preset.value
                  ? "1px solid var(--glow-purple)"
                  : "1px solid rgba(255, 255, 255, 0.2)",
              opacity: bpm === preset.value ? 1 : 0.7,
            },
          },
          preset.label
        )
      )
    )
  );
}
