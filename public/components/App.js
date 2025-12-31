// Main App Component
function App() {
  const { useState, useEffect } = React;
  const [videos, setVideos] = useState([]);
  const [images, setImages] = useState([]);
  const [streams, setStreams] = useState([]);
  const [publicFiles, setPublicFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedStream, setSelectedStream] = useState(null);
  const [hasAccess, setHasAccess] = useState(false);
  const [ticketId, setTicketId] = useState(null);
  const [activeTab, setActiveTab] = useState("videos"); // 'videos', 'images', 'streams'
  const [refreshing, setRefreshing] = useState(false);
  const [workerStatus, setWorkerStatus] = useState(null);

  useEffect(() => {
    if (hasAccess) {
      fetchData();
      fetchWorkerStatus();
      // Update worker status every 10 seconds
      const interval = setInterval(fetchWorkerStatus, 10000);
      return () => clearInterval(interval);
    }
  }, [hasAccess]);

  const handleAccessGranted = (ticket) => {
    setTicketId(ticket);
    setHasAccess(true);
  };

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch videos
      const videosResponse = await fetch("/api/videos");
      if (!videosResponse.ok) throw new Error("Failed to fetch videos");
      const videosData = await videosResponse.json();
      setVideos(videosData.videos);

      // Fetch images
      const imagesResponse = await fetch("/api/images");
      if (!imagesResponse.ok) throw new Error("Failed to fetch images");
      const imagesData = await imagesResponse.json();
      setImages(imagesData.images);

      // Fetch streams (RTSP + RTMP)
      const rtspResponse = await fetch("/api/streams");
      const rtmpResponse = await fetch("/api/rtmp/streams");
      if (rtspResponse.ok && rtmpResponse.ok) {
        const rtspData = await rtspResponse.json();
        const rtmpData = await rtmpResponse.json();
        const allStreams = [
          ...rtspData.streams.map((s) => ({ ...s, type: "RTSP" })),
          ...rtmpData.streams.map((s) => ({ ...s, type: "RTMP" })),
        ];
        setStreams(allStreams);
      }

      // Fetch public files
      const publicResponse = await fetch("/api/public");
      if (!publicResponse.ok) throw new Error("Failed to fetch public files");
      const publicData = await publicResponse.json();
      setPublicFiles(publicData.files);

      // Auto-select first item based on active tab
      if (activeTab === "videos" && videosData.videos.length > 0) {
        setSelectedVideo(videosData.videos[0]);
      } else if (activeTab === "images" && imagesData.images.length > 0) {
        setSelectedImage(imagesData.images[0]);
      }
    } catch (err) {
      console.error("Error fetching data:", err);
      setError("Failed to load data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const fetchWorkerStatus = async () => {
    try {
      const response = await fetch("/api/rtmp/worker-status");
      if (!response.ok) return;
      const data = await response.json();
      setWorkerStatus(data);
    } catch (error) {
      console.error("Error fetching worker status:", error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    await fetchWorkerStatus();
    setTimeout(() => setRefreshing(false), 500);
  };

  // Show queue modal if no access
  if (!hasAccess) {
    return React.createElement(QueueModal, {
      onAccessGranted: handleAccessGranted,
    });
  }

  // Show loading after access granted
  if (loading) {
    return React.createElement(
      "div",
      {
        style: {
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
          color: "white",
          textAlign: "center",
        },
      },
      React.createElement("div", {
        style: {
          width: "50px",
          height: "50px",
          border: "4px solid rgba(255,255,255,0.3)",
          borderTop: "4px solid white",
          borderRadius: "50%",
          animation: "spin 1s linear infinite",
          marginBottom: "1rem",
        },
      }),
      React.createElement("p", null, "Loading videos...")
    );
  }

  return React.createElement(
    "div",
    { style: { minHeight: "100vh", color: "white" } },
    React.createElement(
      "header",
      {
        className: "glass-bubble glow-effect",
        style: {
          textAlign: "center",
          padding: "0.5rem",
          margin: "0.2rem",
        },
      },
      React.createElement(
        "h1",
        {
          style: {
            margin: "0 0 0.5rem 0",
            fontSize: "2.5rem",
            fontWeight: "700",
            textShadow: "2px 2px 4px rgba(0,0,0,0.5)",
            fontFamily: "Audiowide, sans-serif",
            color: "var(--nav-alt)",
            textTransform: "uppercase",
            letterSpacing: "2.5px",
          },
        },
        "🎬 Brandynette's FileHost"
      ),
      React.createElement(
        "div",
        {
          style: {
            margin: "0.5rem 0",
            overflow: "hidden",
            background:
              "linear-gradient(90deg, rgba(0,0,0,0.8), rgba(138,43,226,0.3), rgba(0,0,0,0.8))",
            border: "2px solid var(--glow-purple)",
            borderRadius: "8px",
            padding: "0.5rem 0",
            boxShadow:
              "0 0 20px rgba(138,43,226,0.6), inset 0 0 20px rgba(255,0,255,0.2)",
          },
        },
        React.createElement(
          "div",
          {
            style: {
              display: "inline-block",
              whiteSpace: "nowrap",
              animation: "scroll-left 20s linear infinite",
              fontSize: "1rem",
              fontWeight: "bold",
              fontFamily: "Audiowide, sans-serif",
              background:
                "linear-gradient(90deg, var(--glow-cyan), var(--glow-pink), var(--glow-purple), var(--glow-cyan))",
              backgroundSize: "200% 100%",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              textShadow: "none",
              filter:
                "drop-shadow(0 0 8px var(--glow-cyan)) drop-shadow(0 0 12px var(--glow-pink))",
            },
          },
          "⚡ BREAKING: Premium video streaming NOW LIVE on port 7878 ⚡ Unlimited concurrent viewers ⚡ Browser-cached playback ⚡ Download queue: 3-5 concurrent ⚡ Zero-build CDN architecture ⚡ Cyber goth neon aesthetics ⚡ HTTP Range request support ⚡ Glass morphism UI ⚡ React 18 + Babel transpilation ⚡ ES6 modules ⚡ "
        )
      )
    ),
    // Download Status Component
    React.createElement(DownloadStatus),
    React.createElement(
      "main",
      {
        className: "compact-container",
        style: { maxWidth: "1200px", margin: "0 auto" },
      },
      // Tab Navigation Bar - Folders with Refresh
      React.createElement(
        "nav",
        {
          className: "glass-bubble glow-effect compact-container",
          style: {
            margin: "0 0 1rem 0",
            padding: "0.75rem 1rem",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "1rem",
            flexWrap: "wrap",
            background:
              "linear-gradient(135deg, rgba(12, 42, 42, 0.4), rgba(64, 0, 47, 0.4))",
            border: "2px solid rgba(23, 219, 216, 0.6)",
            boxShadow:
              "0 0 30px rgba(0, 255, 255, 0.3), 0 0 60px rgba(138, 43, 226, 0.2)",
            backdropFilter: "blur(20px)",
          },
        },
        React.createElement(
          "div",
          {
            style: {
              display: "flex",
              gap: "1rem",
              flexWrap: "wrap",
              flex: 1,
              justifyContent: "center",
            },
          },
          React.createElement(
            "button",
            {
              onClick: () => setActiveTab("videos"),
              className:
                activeTab === "videos"
                  ? "bubble-button selected glow-effect"
                  : "bubble-button",
              style: {
                color: activeTab === "videos" ? "#FF1493" : "#FF69B4",
                fontSize: "0.9rem",
                fontWeight: "bold",
                textShadow:
                  activeTab === "videos"
                    ? "0 0 15px #FF00FF, 0 0 30px #FF1493"
                    : "0 0 8px #FF00FF",
                transition: "all 0.3s ease",
                padding: "0.5rem 1rem",
                border:
                  activeTab === "videos"
                    ? "2px solid rgba(255, 20, 147, 0.8)"
                    : "1px solid rgba(255, 20, 147, 0.5)",
                borderRadius: "8px",
                background:
                  activeTab === "videos"
                    ? "rgba(255, 20, 147, 0.3)"
                    : "rgba(255, 20, 147, 0.1)",
              },
            },
            `🎥 Videos (${videos.length})`
          ),
          React.createElement(
            "button",
            {
              onClick: () => setActiveTab("images"),
              className:
                activeTab === "images"
                  ? "bubble-button selected glow-effect"
                  : "bubble-button",
              style: {
                color: activeTab === "images" ? "#00FF7F" : "#7FFF7F",
                fontSize: "0.9rem",
                fontWeight: "bold",
                textShadow:
                  activeTab === "images"
                    ? "0 0 15px #00FF00, 0 0 30px #7FFF00"
                    : "0 0 8px #00FF00",
                transition: "all 0.3s ease",
                padding: "0.5rem 1rem",
                border:
                  activeTab === "images"
                    ? "2px solid rgba(0, 255, 127, 0.8)"
                    : "1px solid rgba(0, 255, 127, 0.5)",
                borderRadius: "8px",
                background:
                  activeTab === "images"
                    ? "rgba(0, 255, 127, 0.3)"
                    : "rgba(0, 255, 127, 0.1)",
              },
            },
            `🖼️ Images (${images.length})`
          ),
          React.createElement(
            "button",
            {
              onClick: () => setActiveTab("streams"),
              className:
                activeTab === "streams"
                  ? "bubble-button selected glow-effect"
                  : "bubble-button",
              style: {
                color: activeTab === "streams" ? "var(--glow-cyan)" : "#7FFFFF",
                fontSize: "0.9rem",
                fontWeight: "bold",
                textShadow:
                  activeTab === "streams"
                    ? "0 0 15px var(--glow-cyan), 0 0 30px var(--glow-cyan)"
                    : "0 0 8px var(--glow-cyan)",
                transition: "all 0.3s ease",
                padding: "0.5rem 1rem",
                border:
                  activeTab === "streams"
                    ? "2px solid rgba(0, 255, 255, 0.8)"
                    : "1px solid rgba(0, 255, 255, 0.5)",
                borderRadius: "8px",
                background:
                  activeTab === "streams"
                    ? "rgba(0, 255, 255, 0.3)"
                    : "rgba(0, 255, 255, 0.1)",
              },
            },
            `📡 Streams (${streams.length})`
          )
        ),
        React.createElement(
          "button",
          {
            onClick: handleRefresh,
            disabled: refreshing,
            className: "bubble-button glow-effect",
            style: {
              color: refreshing ? "#888" : "var(--glow-purple)",
              fontSize: "0.9rem",
              fontWeight: "bold",
              textShadow: refreshing ? "none" : "0 0 10px var(--glow-purple)",
              transition: "all 0.3s ease",
              padding: "0.5rem 1rem",
              border: "1px solid rgba(138, 43, 226, 0.5)",
              borderRadius: "8px",
              background: refreshing
                ? "rgba(138, 43, 226, 0.05)"
                : "rgba(138, 43, 226, 0.2)",
              cursor: refreshing ? "not-allowed" : "pointer",
            },
          },
          refreshing ? "🔄 Refreshing..." : "🔄 Refresh"
        ),
        // Worker Thread Status Indicator
        workerStatus && workerStatus.enabled
          ? React.createElement(
              "div",
              {
                title: `Worker Thread: ${
                  workerStatus.status.state
                }\nActive Streams: ${
                  workerStatus.status.activeStreams || 0
                }\nThread ID: ${workerStatus.threadId || "N/A"}`,
                style: {
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  padding: "0.5rem 1rem",
                  background: "rgba(255, 255, 255, 0.05)",
                  backdropFilter: "blur(10px)",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  borderRadius: "8px",
                  fontSize: "0.75rem",
                  color: "var(--glow-cyan)",
                },
              },
              React.createElement("span", {
                style: {
                  display: "inline-block",
                  width: "8px",
                  height: "8px",
                  borderRadius: "50%",
                  backgroundColor:
                    workerStatus.status.state === "running"
                      ? "#00ff00"
                      : workerStatus.status.state === "error"
                      ? "#ff0000"
                      : "#888888",
                  boxShadow:
                    workerStatus.status.state === "running"
                      ? "0 0 8px #00ff00, 0 0 16px #00ff0088"
                      : workerStatus.status.state === "error"
                      ? "0 0 8px #ff0000, 0 0 16px #ff000088"
                      : "none",
                  animation:
                    workerStatus.status.state === "running"
                      ? "pulse 2s ease-in-out infinite"
                      : "none",
                },
              }),
              React.createElement(
                "span",
                null,
                `🧵 Worker: ${workerStatus.status.state} (${
                  workerStatus.status.activeStreams || 0
                })`
              )
            )
          : null
      ),
      // Content based on active tab
      activeTab === "videos" && videos.length === 0
        ? React.createElement(
            "div",
            { style: { textAlign: "center", padding: "3rem 1rem" } },
            React.createElement(
              "h2",
              { style: { color: "#ffd93d" } },
              "No videos found"
            ),
            React.createElement(
              "p",
              null,
              "Please add video files to the BRANDIFICATION folder"
            )
          )
        : activeTab === "images" && images.length === 0
        ? React.createElement(
            "div",
            { style: { textAlign: "center", padding: "3rem 1rem" } },
            React.createElement(
              "h2",
              { style: { color: "#00FF7F" } },
              "No images found"
            ),
            React.createElement(
              "p",
              null,
              "Please add image files to the BRANDIFICATION/Images folder"
            )
          )
        : activeTab === "streams" && streams.length === 0
        ? React.createElement(
            "div",
            { style: { textAlign: "center", padding: "3rem 1rem" } },
            React.createElement(
              "h2",
              { style: { color: "var(--glow-cyan)" } },
              "No streams active"
            ),
            React.createElement(
              "p",
              null,
              "Configure RTSP cameras or start RTMP streams in .env file"
            )
          )
        : React.createElement(
            "div",
            {
              style: {
                display: "flex",
                gap: "1rem",
                alignItems: "flex-start",
                flexWrap: "wrap",
              },
            },
            // Left sidebar - File selection based on active tab
            React.createElement(
              "div",
              {
                className: "glass-bubble glow-effect",
                style: {
                  flex: "0 0 280px",
                  padding: "1rem",
                  maxHeight: "80vh",
                  overflowY: "auto",
                  position: "sticky",
                  top: "1rem",
                },
              },
              React.createElement(
                "h3",
                {
                  style: {
                    marginBottom: "1rem",
                    textAlign: "center",
                    color:
                      activeTab === "videos"
                        ? "var(--glow-pink)"
                        : activeTab === "images"
                        ? "#00FF7F"
                        : "var(--glow-cyan)",
                    fontSize: "1.1rem",
                    textShadow:
                      activeTab === "videos"
                        ? "0 0 10px var(--glow-pink)"
                        : activeTab === "images"
                        ? "0 0 10px #00FF00"
                        : "0 0 10px var(--glow-cyan)",
                  },
                },
                activeTab === "videos"
                  ? "📁 Select a video:"
                  : activeTab === "images"
                  ? "📁 Select an image:"
                  : "📁 Active streams:"
              ),
              React.createElement(
                "div",
                {
                  className: "no-spacing",
                  style: {
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.5rem",
                  },
                },
                activeTab === "videos"
                  ? videos.map((video) =>
                      React.createElement(
                        "button",
                        {
                          key: video.filename,
                          onClick: () => setSelectedVideo(video),
                          className:
                            selectedVideo?.filename === video.filename
                              ? "bubble-button selected glow-effect"
                              : "bubble-button",
                          style: {
                            fontSize: "0.7rem",
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "flex-start",
                            gap: "0.2rem",
                            textAlign: "left",
                            width: "100%",
                          },
                        },
                        React.createElement(
                          "span",
                          {
                            style: {
                              wordBreak: "break-word",
                              width: "100%",
                            },
                          },
                          video.filename
                        ),
                        React.createElement(
                          "span",
                          {
                            style: {
                              fontSize: "0.6rem",
                              opacity: 0.7,
                              color: "var(--primary-alt)",
                            },
                          },
                          `${video.sizeMB} MB`
                        )
                      )
                    )
                  : activeTab === "images"
                  ? images.map((image) =>
                      React.createElement(
                        "button",
                        {
                          key: image.filename,
                          onClick: () => setSelectedImage(image),
                          className:
                            selectedImage?.filename === image.filename
                              ? "bubble-button selected glow-effect"
                              : "bubble-button",
                          style: {
                            fontSize: "0.7rem",
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "flex-start",
                            gap: "0.2rem",
                            textAlign: "left",
                            width: "100%",
                          },
                        },
                        React.createElement(
                          "span",
                          {
                            style: {
                              wordBreak: "break-word",
                              width: "100%",
                            },
                          },
                          image.filename
                        ),
                        React.createElement(
                          "span",
                          {
                            style: {
                              fontSize: "0.6rem",
                              opacity: 0.7,
                              color: "#00FF7F",
                            },
                          },
                          `${image.sizeKB} KB`
                        )
                      )
                    )
                  : streams.map((stream) =>
                      React.createElement(
                        "button",
                        {
                          key: stream.id || stream.streamKey,
                          onClick: () => setSelectedStream(stream),
                          className:
                            selectedStream?.id === stream.id ||
                            selectedStream?.streamKey === stream.streamKey
                              ? "bubble-button selected glow-effect"
                              : "bubble-button",
                          style: {
                            fontSize: "0.7rem",
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "flex-start",
                            gap: "0.2rem",
                            textAlign: "left",
                            width: "100%",
                          },
                        },
                        React.createElement(
                          "span",
                          {
                            style: {
                              wordBreak: "break-word",
                              width: "100%",
                            },
                          },
                          stream.name || stream.streamKey
                        ),
                        React.createElement(
                          "span",
                          {
                            style: {
                              fontSize: "0.6rem",
                              opacity: 0.7,
                              color: "var(--glow-cyan)",
                            },
                          },
                          `${stream.type} • ${stream.status || "LIVE"}`
                        )
                      )
                    )
              )
            ),
            // Right content - Display based on active tab
            React.createElement(
              "div",
              {
                style: {
                  flex: "1 1 600px",
                  minWidth: 0,
                },
              },
              activeTab === "videos" &&
                selectedVideo &&
                React.createElement(
                  "div",
                  {
                    className: "glass-bubble",
                    style: {
                      margin: "0 0 1rem 0",
                      padding: "0.75rem 1rem",
                      background:
                        "linear-gradient(135deg, rgba(12, 42, 42, 0.5), rgba(64, 0, 47, 0.5))",
                      border: "2px solid rgba(255, 20, 147, 0.6)",
                      boxShadow:
                        "0 0 20px rgba(255, 0, 255, 0.4), 0 0 40px rgba(138, 43, 226, 0.2)",
                      backdropFilter: "blur(15px)",
                    },
                  },
                  React.createElement(
                    "h2",
                    {
                      style: {
                        margin: 0,
                        fontSize: "1.2rem",
                        fontWeight: "bold",
                        color: "#FF1493",
                        textShadow: "0 0 10px #FF00FF, 0 0 20px #FF1493",
                        textAlign: "center",
                      },
                    },
                    `🎬 ${selectedVideo.filename}`
                  )
                ),
              activeTab === "videos" &&
                selectedVideo &&
                React.createElement(VideoPlayer, {
                  videoSrc: `/videos/${selectedVideo.filename}?ticket=${ticketId}`,
                  title: selectedVideo.filename,
                }),
              activeTab === "images" &&
                selectedImage &&
                React.createElement(
                  "div",
                  {
                    className: "glass-bubble glow-effect",
                    style: {
                      padding: "1.5rem",
                      textAlign: "center",
                    },
                  },
                  React.createElement(
                    "h2",
                    {
                      style: {
                        margin: "0 0 1rem 0",
                        fontSize: "1.2rem",
                        fontWeight: "bold",
                        color: "#00FF7F",
                        textShadow: "0 0 10px #00FF00, 0 0 20px #7FFF00",
                      },
                    },
                    `🖼️ ${selectedImage.filename}`
                  ),
                  React.createElement("img", {
                    src: selectedImage.url,
                    alt: selectedImage.filename,
                    style: {
                      maxWidth: "100%",
                      height: "auto",
                      borderRadius: "12px",
                      border: "2px solid rgba(0, 255, 127, 0.6)",
                      boxShadow: "0 0 30px rgba(0, 255, 0, 0.4)",
                    },
                  })
                ),
              activeTab === "streams" &&
                selectedStream &&
                React.createElement(
                  "div",
                  {
                    className: "glass-bubble glow-effect",
                    style: {
                      padding: "1.5rem",
                    },
                  },
                  React.createElement(
                    "h2",
                    {
                      style: {
                        margin: "0 0 1rem 0",
                        fontSize: "1.2rem",
                        fontWeight: "bold",
                        color: "var(--glow-cyan)",
                        textShadow:
                          "0 0 10px var(--glow-cyan), 0 0 20px var(--glow-cyan)",
                        textAlign: "center",
                      },
                    },
                    `📡 ${selectedStream.name || selectedStream.streamKey} (${
                      selectedStream.type
                    })`
                  ),
                  React.createElement("video", {
                    controls: true,
                    autoplay: true,
                    style: {
                      width: "100%",
                      borderRadius: "12px",
                      border: "2px solid rgba(0, 255, 255, 0.6)",
                      boxShadow: "0 0 30px rgba(0, 255, 255, 0.4)",
                    },
                    src:
                      selectedStream.playlistUrl ||
                      (selectedStream.type === "RTSP"
                        ? `/streams/${selectedStream.id}.m3u8`
                        : selectedStream.playlistUrl),
                  }),
                  React.createElement(
                    "div",
                    {
                      style: {
                        marginTop: "1rem",
                        fontSize: "0.85rem",
                        opacity: 0.8,
                        textAlign: "center",
                      },
                    },
                    React.createElement(
                      "p",
                      null,
                      `Type: ${selectedStream.type}`
                    ),
                    selectedStream.uptime &&
                      React.createElement(
                        "p",
                        null,
                        `Uptime: ${Math.floor(
                          selectedStream.uptime / 60
                        )} minutes`
                      )
                  )
                )
            )
          )
    ),
    React.createElement(
      "footer",
      {
        className: "glass-bubble compact-container",
        style: {
          textAlign: "center",
          margin: "1rem auto",
          maxWidth: "1200px",
          fontSize: "0.9rem",
          lineHeight: "1.6",
          background:
            "linear-gradient(135deg, rgba(12, 42, 42, 0.4), rgba(64, 0, 47, 0.4))",
          border: "2px solid rgba(23, 219, 216, 0.6)",
          boxShadow:
            "0 0 40px rgba(0, 255, 255, 0.4), 0 0 80px rgba(138, 43, 226, 0.3), inset 0 0 30px rgba(0, 255, 255, 0.15)",
          backdropFilter: "blur(25px)",
        },
      },
      // Special Thanks section
      React.createElement(
        "div",
        {
          style: {
            borderTop: "2px solid rgba(21, 170, 181, 0.5)",
            paddingTop: "1.5rem",
            marginBottom: "1.5rem",
            background: "rgba(21, 170, 181, 0.05)",
            padding: "1.5rem 1rem",
            borderRadius: "12px",
          },
        },
        React.createElement(
          "p",
          {
            style: {
              fontSize: "1.1rem",
              marginBottom: "1rem",
              color: "#00FF7F",
              fontWeight: "bold",
              textShadow:
                "0 0 15px #00FF00, 0 0 30px #7FFF00, 0 0 45px #00FFFF",
              letterSpacing: "1.25px",
            },
          },
          "🙏 Special Thanks To:"
        ),
        React.createElement(
          "div",
          {
            style: {
              display: "flex",
              justifyContent: "center",
              gap: "2rem",
              flexWrap: "wrap",
            },
          },
          React.createElement(
            "a",
            {
              href: "https://bambisleep.info",
              style: {
                color: "var(--glow-purple)",
                textDecoration: "none",
                fontSize: "0.9rem",
                fontWeight: "bold",
                textShadow: "0 0 8px var(--glow-purple)",
                transition: "all 0.3s ease",
                padding: "0.5rem 1rem",
                border: "1px solid rgba(138, 43, 226, 0.5)",
                borderRadius: "8px",
                background: "rgba(138, 43, 226, 0.1)",
              },
              target: "_blank",
              onMouseEnter: (e) => {
                e.target.style.textShadow =
                  "0 0 15px var(--glow-purple), 0 0 30px var(--glow-purple)";
                e.target.style.background = "rgba(138, 43, 226, 0.2)";
              },
              onMouseLeave: (e) => {
                e.target.style.textShadow = "0 0 8px var(--glow-purple)";
                e.target.style.background = "rgba(138, 43, 226, 0.1)";
              },
            },
            "📚 BambiSleep Wiki"
          ),
          React.createElement(
            "a",
            {
              href: "https://bambicloud.com",
              style: {
                color: "var(--glow-cyan)",
                textDecoration: "none",
                fontSize: "0.9rem",
                fontWeight: "bold",
                textShadow: "0 0 8px var(--glow-cyan)",
                transition: "all 0.3s ease",
                padding: "0.5rem 1rem",
                border: "1px solid rgba(0, 255, 255, 0.5)",
                borderRadius: "8px",
                background: "rgba(0, 255, 255, 0.1)",
              },
              target: "_blank",
              onMouseEnter: (e) => {
                e.target.style.textShadow =
                  "0 0 15px var(--glow-cyan), 0 0 30px var(--glow-cyan)";
                e.target.style.background = "rgba(0, 255, 255, 0.2)";
              },
              onMouseLeave: (e) => {
                e.target.style.textShadow = "0 0 8px var(--glow-cyan)";
                e.target.style.background = "rgba(0, 255, 255, 0.1)";
              },
            },
            "☁️ Bambi Cloud"
          )
        )
      ),

      // Main Projects section
      React.createElement(
        "div",
        {
          style: {
            borderTop: "2px solid rgba(223, 4, 113, 0.5)",
            paddingTop: "1.5rem",
            background: "rgba(223, 4, 113, 0.08)",
            padding: "1.5rem 1rem",
            borderRadius: "12px",
          },
        },
        React.createElement(
          "p",
          {
            style: {
              fontSize: "1.1rem",
              marginBottom: "1rem",
              color: "#FF1493",
              fontWeight: "bold",
              textShadow:
                "0 0 15px #FF00FF, 0 0 30px #FF1493, 0 0 45px #FF69B4",
              letterSpacing: "1.25px",
            },
          },
          "🚀 Main Projects:"
        ),
        React.createElement(
          "div",
          {
            style: {
              display: "flex",
              justifyContent: "center",
              gap: "1.5rem",
              flexWrap: "wrap",
              marginTop: "1rem",
            },
          },
          React.createElement(
            "a",
            {
              href: "https://bambisleep.chat",
              style: {
                color: "#ffffff",
                textDecoration: "none",
                fontSize: "0.85rem",
                fontWeight: "bold",
                padding: "0.75rem 1.5rem",
                background:
                  "linear-gradient(135deg, rgba(223, 4, 113, 0.3), rgba(255, 0, 255, 0.3))",
                border: "2px solid var(--button-color)",
                borderRadius: "12px",
                boxShadow: "0 0 15px rgba(223, 4, 113, 0.5)",
                textShadow: "0 0 8px var(--glow-pink)",
                transition: "all 0.3s ease",
                display: "inline-block",
              },
              target: "_blank",
              onMouseEnter: (e) => {
                e.target.style.boxShadow =
                  "0 0 25px rgba(223, 4, 113, 0.8), 0 0 50px rgba(255, 0, 255, 0.5)";
                e.target.style.transform = "translateY(-2px)";
                e.target.style.textShadow =
                  "0 0 15px var(--glow-pink), 0 0 30px var(--glow-pink)";
              },
              onMouseLeave: (e) => {
                e.target.style.boxShadow = "0 0 15px rgba(223, 4, 113, 0.5)";
                e.target.style.transform = "translateY(0)";
                e.target.style.textShadow = "0 0 8px var(--glow-pink)";
              },
            },
            "🤖 BambiSleep.Chat - AI Hypnotic Girlfriend • Mind Control • Programming • Transformation • NSFW"
          ),
          React.createElement(
            "a",
            {
              href: "https://bambisleep.church",
              style: {
                color: "#ffffff",
                textDecoration: "none",
                fontSize: "0.85rem",
                fontWeight: "bold",
                padding: "0.75rem 1.5rem",
                background:
                  "linear-gradient(135deg, rgba(138, 43, 226, 0.3), rgba(64, 0, 47, 0.3))",
                border: "2px solid var(--glow-purple)",
                borderRadius: "12px",
                boxShadow: "0 0 15px rgba(138, 43, 226, 0.5)",
                textShadow: "0 0 8px var(--glow-purple)",
                transition: "all 0.3s ease",
                display: "inline-block",
              },
              target: "_blank",
              onMouseEnter: (e) => {
                e.target.style.boxShadow =
                  "0 0 25px rgba(138, 43, 226, 0.8), 0 0 50px rgba(138, 43, 226, 0.5)";
                e.target.style.transform = "translateY(-2px)";
                e.target.style.textShadow =
                  "0 0 15px var(--glow-purple), 0 0 30px var(--glow-purple)";
              },
              onMouseLeave: (e) => {
                e.target.style.boxShadow = "0 0 15px rgba(138, 43, 226, 0.5)";
                e.target.style.transform = "translateY(0)";
                e.target.style.textShadow = "0 0 8px var(--glow-purple)";
              },
            },
            "⛪ BambiSleep.Church - Digital Sanctuary"
          )
        )
      )
    ),

    // Built with credit - bottom right corner
    React.createElement(
      "div",
      {
        style: {
          position: "fixed",
          bottom: "10px",
          right: "10px",
          padding: "0.5rem 0.75rem",
          background: "rgba(0, 0, 0, 0.5)",
          borderRadius: "8px",
          border: "1px solid rgba(255, 215, 0, 0.3)",
          boxShadow: "0 0 15px rgba(255, 140, 0, 0.3)",
          backdropFilter: "blur(10px)",
          fontSize: "0.7rem",
          zIndex: 1000,
        },
      },
      React.createElement(
        "p",
        {
          style: {
            margin: 0,
            color: "#FFD700",
            textShadow: "0 0 8px #FF8C00",
            fontWeight: "bold",
          },
        },
        "💖 Built with ❤️ by ",
        React.createElement(
          "a",
          {
            href: "https://github.com/HarleyVader",
            style: {
              color: "var(--glow-pink)",
              textDecoration: "none",
              fontWeight: "bold",
              textShadow: "0 0 5px var(--glow-pink)",
            },
            target: "_blank",
          },
          "HarleyVader"
        )
      )
    )
  );
}
