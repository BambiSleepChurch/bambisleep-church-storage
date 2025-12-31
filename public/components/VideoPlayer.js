// Video Player Component
function VideoPlayer({ videoSrc, title }) {
  const { useState, useEffect, useRef } = React;
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const videoRef = useRef(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoadedMetadata = () => {
      setDuration(video.duration);
      setLoading(false);
    };

    const handleTimeUpdate = () => setCurrentTime(video.currentTime);
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleEnded = () => setIsPlaying(false);
    const handleError = () => {
      setError("Failed to load video");
      setLoading(false);
    };

    video.addEventListener("loadedmetadata", handleLoadedMetadata);
    video.addEventListener("timeupdate", handleTimeUpdate);
    video.addEventListener("play", handlePlay);
    video.addEventListener("pause", handlePause);
    video.addEventListener("ended", handleEnded);
    video.addEventListener("error", handleError);

    return () => {
      video.removeEventListener("loadedmetadata", handleLoadedMetadata);
      video.removeEventListener("timeupdate", handleTimeUpdate);
      video.removeEventListener("play", handlePlay);
      video.removeEventListener("pause", handlePause);
      video.removeEventListener("ended", handleEnded);
      video.removeEventListener("error", handleError);
    };
  }, [videoSrc]);

  const togglePlay = () => {
    const video = videoRef.current;
    if (video.paused) {
      video.play();
    } else {
      video.pause();
    }
  };

  const handleSeek = (e) => {
    const video = videoRef.current;
    const rect = e.currentTarget.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    video.currentTime = percent * duration;
  };

  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    videoRef.current.volume = newVolume;
  };

  const formatTime = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  if (error) {
    return React.createElement(
      "div",
      { style: { color: "red", padding: "2rem", textAlign: "center" } },
      error
    );
  }

  return React.createElement(
    "div",
    {
      className: "glass-bubble glow-effect",
      style: {
        padding: "0.8rem",
        margin: "0.4rem",
      },
    },
    React.createElement(
      "div",
      {
        className: "glass-bubble",
        style: {
          position: "relative",
          background: "black",
          overflow: "hidden",
          margin: "0.3rem",
        },
      },
      React.createElement("video", {
        ref: videoRef,
        src: videoSrc,
        style: {
          width: "100%",
          height: "auto",
          maxHeight: "70vh",
          display: "block",
          cursor: "pointer",
        },
        onClick: togglePlay,
      }),
      loading &&
        React.createElement(
          "div",
          {
            style: {
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              color: "white",
              textAlign: "center",
            },
          },
          "Loading video..."
        )
    ),
    React.createElement(
      "div",
      {
        className: "glass-bubble compact-container",
        style: {
          display: "flex",
          alignItems: "center",
          gap: "0.3rem",
          color: "white",
        },
      },
      React.createElement(
        "button",
        {
          onClick: togglePlay,
          disabled: loading,
          className: "bubble-button glow-effect",
          style: {
            fontSize: "1.1rem",
          },
        },
        isPlaying ? "⏸️" : "▶️"
      ),
      React.createElement(
        "div",
        {
          style: {
            flex: 1,
            height: "8px",
            background: "var(--button-alt)",
            borderRadius: "var(--border-radius)",
            cursor: "pointer",
            border: "1px solid var(--nav-alt)",
          },
          onClick: handleSeek,
        },
        React.createElement("div", {
          style: {
            height: "100%",
            background:
              "linear-gradient(90deg, var(--tertiary-alt), var(--primary-alt))",
            width: `${(currentTime / duration) * 100}%`,
            borderRadius: "var(--border-radius)",
            transition: "width 0.1s ease",
          },
        })
      ),
      React.createElement(
        "span",
        {
          style: {
            fontSize: "0.9rem",
            fontFamily: "monospace",
            minWidth: "80px",
          },
        },
        `${formatTime(currentTime)} / ${formatTime(duration)}`
      ),
      React.createElement("span", null, "🔊"),
      React.createElement("input", {
        type: "range",
        min: "0",
        max: "1",
        step: "0.1",
        value: volume,
        onChange: handleVolumeChange,
        style: { width: "80px" },
      })
    )
  );
}
