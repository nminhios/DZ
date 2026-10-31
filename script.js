(() => {
  "use strict";

  const config = window.NMINHIOS_CONFIG || {};
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;

  // Pull editable public details from config.js.
  const avatar = $("[data-avatar]");
  if (avatar && typeof config.avatar === "string" && config.avatar.trim()) {
    avatar.src = config.avatar.trim();
  }
  $$('[data-link]').forEach((element) => {
    const key = element.dataset.link;
    const destination = config.links?.[key];
    if (typeof destination === "string" && /^https:\/\//i.test(destination)) {
      element.href = destination;
    }
  });
  const year = $("#year");
  if (year) year.textContent = String(new Date().getFullYear());
  if (avatar) {
    avatar.addEventListener("error", () => {
      avatar.style.display = "none";
    }, { once: true });
  }

  // Small, non-intrusive notice used by share and audio controls.
  const notice = $("#notice");
  let noticeTimer = 0;
  const showNotice = (message) => {
    if (!notice) return;
    notice.textContent = message;
    notice.classList.add("visible");
    window.clearTimeout(noticeTimer);
    noticeTimer = window.setTimeout(() => notice.classList.remove("visible"), 2900);
  };

  // Reveal the sections once they enter the viewport.
  const revealItems = $$(".reveal");
  if (reducedMotion || !("IntersectionObserver" in window)) {
    revealItems.forEach((item) => item.classList.add("in-view"));
  } else {
    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("in-view");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -24px 0px" });
    revealItems.forEach((item) => revealObserver.observe(item));
  }

  // Scroll progress without forcing a layout on every scroll event.
  const readingLine = $("#reading-line");
  let scrollQueued = false;
  const updateScroll = () => {
    if (!readingLine) return;
    const scrollable = document.documentElement.scrollHeight - window.innerHeight;
    const amount = scrollable > 0 ? Math.min(100, Math.max(0, (window.scrollY / scrollable) * 100)) : 0;
    readingLine.style.width = `${amount}%`;
    scrollQueued = false;
  };
  window.addEventListener("scroll", () => {
    if (!scrollQueued) {
      scrollQueued = true;
      window.requestAnimationFrame(updateScroll);
    }
  }, { passive: true });
  window.addEventListener("resize", updateScroll, { passive: true });
  updateScroll();

  // Cursor light and subtle pointer response are desktop-only.
  const finePointer = window.matchMedia?.("(hover: hover) and (pointer: fine)").matches;
  const cursorLight = $(".cursor-light");
  if (finePointer && !reducedMotion) {
    let pointerQueued = false;
    let pointerX = 0;
    let pointerY = 0;
    window.addEventListener("pointermove", (event) => {
      pointerX = event.clientX;
      pointerY = event.clientY;
      document.body.classList.add("pointer-active");
      if (!pointerQueued) {
        pointerQueued = true;
        window.requestAnimationFrame(() => {
          if (cursorLight) cursorLight.style.transform = `translate3d(${pointerX - 260}px, ${pointerY - 260}px, 0)`;
          pointerQueued = false;
        });
      }
    }, { passive: true });
    window.addEventListener("pointerleave", () => document.body.classList.remove("pointer-active"));

    // Soft, restrained 3D response on the profile panel.
    const profile = $("#profile-panel");
    if (profile) {
      profile.addEventListener("pointermove", (event) => {
        const rect = profile.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width - 0.5;
        const y = (event.clientY - rect.top) / rect.height - 0.5;
        profile.style.transform = `perspective(1100px) rotateX(${(-y * 2.2).toFixed(2)}deg) rotateY(${(x * 2.6).toFixed(2)}deg) translateY(-2px)`;
      });
      profile.addEventListener("pointerleave", () => {
        profile.style.transform = "";
      });
    }

    // Each link receives a soft radial highlight at the pointer position.
    $$(".link-row").forEach((row) => {
      row.addEventListener("pointermove", (event) => {
        const rect = row.getBoundingClientRect();
        row.style.setProperty("--spot-x", `${event.clientX - rect.left}px`);
        row.style.setProperty("--spot-y", `${event.clientY - rect.top}px`);
      });
    });
  }

  // Lightweight ambient particles, capped for mobile and paused in background tabs.
  const canvas = $("#particle-field");
  if (canvas && !reducedMotion) {
    const context = canvas.getContext("2d", { alpha: true });
    if (context) {
      let width = 0;
      let height = 0;
      let pixelRatio = 1;
      let particles = [];
      let animationFrame = 0;
      let lastDraw = 0;
      const makeParticle = () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.12,
        vy: (Math.random() - 0.5) * 0.1 - 0.018,
        radius: Math.random() * 1.05 + 0.35,
        alpha: Math.random() * 0.34 + 0.1,
        phase: Math.random() * Math.PI * 2,
        hue: Math.random() > 0.54 ? 177 : 264
      });
      const resizeCanvas = () => {
        pixelRatio = Math.min(window.devicePixelRatio || 1, 1.5);
        width = window.innerWidth;
        height = window.innerHeight;
        canvas.width = Math.round(width * pixelRatio);
        canvas.height = Math.round(height * pixelRatio);
        context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
        const quantity = Math.min(48, Math.max(17, Math.round(width / 27)));
        particles = Array.from({ length: quantity }, makeParticle);
      };
      const draw = (timestamp) => {
        animationFrame = 0;
        if (document.hidden) return;
        if (timestamp - lastDraw < 30) {
          animationFrame = window.requestAnimationFrame(draw);
          return;
        }
        lastDraw = timestamp;
        context.clearRect(0, 0, width, height);
        const pulse = timestamp * 0.00045;
        particles.forEach((particle, index) => {
          particle.x += particle.vx;
          particle.y += particle.vy;
          if (particle.x < -8) particle.x = width + 8;
          if (particle.x > width + 8) particle.x = -8;
          if (particle.y < -8) particle.y = height + 8;
          if (particle.y > height + 8) particle.y = -8;
          const alpha = particle.alpha * (0.58 + (Math.sin(pulse + particle.phase) + 1) * 0.2);
          context.beginPath();
          context.fillStyle = `hsla(${particle.hue}, 76%, 78%, ${alpha})`;
          context.shadowColor = `hsla(${particle.hue}, 85%, 74%, .34)`;
          context.shadowBlur = particle.radius * 5;
          context.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
          context.fill();
          context.shadowBlur = 0;
          for (let next = index + 1; next < Math.min(particles.length, index + 5); next += 1) {
            const other = particles[next];
            const dx = particle.x - other.x;
            const dy = particle.y - other.y;
            const distance = Math.hypot(dx, dy);
            if (distance < 112) {
              context.beginPath();
              context.strokeStyle = `rgba(173, 159, 218, ${(1 - distance / 112) * 0.045})`;
              context.lineWidth = 0.55;
              context.moveTo(particle.x, particle.y);
              context.lineTo(other.x, other.y);
              context.stroke();
            }
          }
        });
        animationFrame = window.requestAnimationFrame(draw);
      };
      const startParticles = () => {
        if (!document.hidden && !animationFrame) animationFrame = window.requestAnimationFrame(draw);
      };
      const stopParticles = () => {
        if (animationFrame) window.cancelAnimationFrame(animationFrame);
        animationFrame = 0;
      };
      resizeCanvas();
      startParticles();
      window.addEventListener("resize", resizeCanvas, { passive: true });
      document.addEventListener("visibilitychange", () => document.hidden ? stopParticles() : startParticles());
    }
  }

  // Share the bio using the native share sheet, with clipboard fallback.
  const shareButton = $("#share-button");
  shareButton?.addEventListener("click", async () => {
    const shareData = { title: "nminhios — Personal Space", text: "Kết nối với nminhios", url: window.location.href };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(window.location.href);
        showNotice("Đã sao chép liên kết bio.");
      } else {
        showNotice("Hãy sao chép địa chỉ trang trên thanh trình duyệt.");
      }
    } catch (error) {
      if (error?.name !== "AbortError") showNotice("Không thể chia sẻ lúc này. Thử lại nhé.");
    }
  });

  // SoundCloud background playlist. Tracks play in order and loop forever.
  // Browsers (especially iOS Safari) may require one user gesture before audio starts.
  const audioFrame = $("#soundcloud-frame");
  const musicButton = $("#music-toggle");
  const musicLabel = $("#music-label");
  const musicSubtitle = $("#music-subtitle");
  const musicHint = $("#music-tooltip");
  let widget = null;
  let widgetReady = false;
  let isPlaying = false;
  let hintTimer = 0;
  let firstGestureHandled = false;
  let currentTrackIndex = 0;
  let switchingTrack = false;
  let switchGuardTimer = 0;

  const rawTracks = Array.isArray(config.music?.soundcloudTracks)
    ? config.music.soundcloudTracks
    : [config.music?.soundcloudTrack].filter(Boolean);

  const showMusicHint = (message) => {
    if (!musicHint) return;
    musicHint.textContent = message;
    musicHint.classList.add("visible");
    window.clearTimeout(hintTimer);
    hintTimer = window.setTimeout(() => musicHint.classList.remove("visible"), 3300);
  };
  const setMusicState = (active) => {
    isPlaying = Boolean(active);
    musicButton?.classList.toggle("is-playing", isPlaying);
    musicButton?.setAttribute("aria-pressed", String(isPlaying));
    musicButton?.setAttribute("aria-label", isPlaying ? "Tạm dừng nhạc nền" : "Bật nhạc nền");
    if (musicLabel) musicLabel.textContent = "BACKGROUND SOUND";
    if (musicSubtitle) musicSubtitle.textContent = isPlaying ? "NOW PLAYING" : "TAP TO LISTEN";
  };
  const cleanTrackUrl = (rawUrl) => {
    const parsed = new URL(rawUrl);
    parsed.hostname = "soundcloud.com";
    parsed.search = "";
    parsed.hash = "";
    return parsed.toString();
  };
  const widgetOptions = () => ({
    auto_play: true,
    hide_related: true,
    show_comments: false,
    show_user: false,
    show_reposts: false,
    visual: false,
    buying: false,
    sharing: false,
    download: false,
    show_artwork: false,
    color: "#b99aff"
  });
  const advanceTrack = () => {
    if (!widget || !widgetReady || rawTracks.length < 2 || switchingTrack) {
      setMusicState(false);
      return;
    }

    currentTrackIndex = (currentTrackIndex + 1) % rawTracks.length;
    switchingTrack = true;
    window.clearTimeout(switchGuardTimer);

    try {
      // SoundCloud's Widget API loads the next track into the existing hidden player.
      // Keeping the same widget preserves event listeners and the small music control.
      widget.load(cleanTrackUrl(rawTracks[currentTrackIndex]), widgetOptions());
      // PLAY normally clears this guard. The timeout prevents a stuck guard if
      // SoundCloud takes unusually long or the browser blocks chained playback.
      switchGuardTimer = window.setTimeout(() => {
        switchingTrack = false;
      }, 10000);
    } catch (_) {
      switchingTrack = false;
      setMusicState(false);
      showMusicHint("Không thể chuyển bài lúc này. Chạm nút nhạc để thử lại.");
    }
  };
  const attachSoundCloudWidget = () => {
    if (!audioFrame || !window.SC?.Widget || widget) return;
    try {
      widget = window.SC.Widget(audioFrame);
      const events = window.SC.Widget.Events;
      widget.bind(events.READY, () => {
        widgetReady = true;
        const volume = Number(config.music?.volume);
        try {
          widget.setVolume(Number.isFinite(volume) ? Math.max(0, Math.min(100, volume)) : 24);
          widget.play();
        } catch (_) {
          showMusicHint("Chạm vào nút nhạc nền để bắt đầu phát.");
        }
      });
      widget.bind(events.PLAY, () => {
        switchingTrack = false;
        window.clearTimeout(switchGuardTimer);
        setMusicState(true);
      });
      widget.bind(events.PAUSE, () => setMusicState(false));
      widget.bind(events.FINISH, advanceTrack);
      if (events.ERROR) widget.bind(events.ERROR, () => {
        switchingTrack = false;
        setMusicState(false);
        showMusicHint("Không tải được bài nhạc tiếp theo lúc này.");
      });
    } catch (_) {
      setMusicState(false);
      showMusicHint("SoundCloud chưa sẵn sàng.");
    }
  };
  const loadSoundCloud = () => {
    if (!audioFrame || !rawTracks.length || typeof rawTracks[0] !== "string") return;
    try {
      const embedUrl = new URL("https://w.soundcloud.com/player/");
      embedUrl.search = new URLSearchParams({
        url: cleanTrackUrl(rawTracks[0]),
        ...Object.fromEntries(Object.entries(widgetOptions()).map(([key, value]) => [key, String(value)]))
      }).toString();
      audioFrame.src = embedUrl.toString();
      if (window.SC?.Widget) {
        attachSoundCloudWidget();
      } else {
        const sdk = document.createElement("script");
        sdk.src = "https://w.soundcloud.com/player/api.js";
        sdk.async = true;
        sdk.onload = attachSoundCloudWidget;
        sdk.onerror = () => showMusicHint("Nhạc nền không tải được. Các liên kết vẫn hoạt động bình thường.");
        document.head.append(sdk);
      }
    } catch (_) {
      showMusicHint("Đường dẫn nhạc nền chưa hợp lệ.");
    }
  };
  const toggleMusic = () => {
    if (!widget || !widgetReady) {
      showMusicHint("Nhạc nền đang tải. Chạm lại sau một chút nhé.");
      return;
    }
    try {
      if (isPlaying) widget.pause();
      else widget.play();
    } catch (_) {
      showMusicHint("Trình duyệt chưa cho phép phát nhạc. Hãy chạm lại.");
    }
  };
  musicButton?.addEventListener("click", toggleMusic);
  document.addEventListener("pointerdown", () => {
    if (firstGestureHandled) return;
    firstGestureHandled = true;
    if (widget && widgetReady && !isPlaying) {
      try { widget.play(); } catch (_) { /* Browser autoplay policy may still block playback. */ }
    }
  }, { once: true, passive: true });
  loadSoundCloud();
})();
