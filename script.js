(() => {
  "use strict";

  const config = window.NMINHIOS_CONFIG || {};
  const links = config.links || {};
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
  const toast = $("#toast");
  let toastTimer = 0;

  const showToast = (message) => {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add("is-visible");
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => toast.classList.remove("is-visible"), 2500);
  };

  // Apply public owner-configured URLs without coupling them to the page layout.
  $$('[data-link]').forEach((node) => {
    const destination = links[node.dataset.link];
    if (typeof destination === "string" && destination.trim()) {
      node.href = destination.trim();
    } else {
      node.addEventListener("click", (event) => {
        event.preventDefault();
        showToast("Liên kết này chưa được cấu hình.");
      });
    }
  });

  // Avatar fallback: the page remains usable even if the image host is unavailable.
  const avatar = $("[data-avatar]");
  if (avatar && typeof config.avatar === "string" && config.avatar.trim()) avatar.src = config.avatar.trim();
  avatar?.addEventListener("error", () => {
    if (avatar.dataset.fallbackApplied) return;
    avatar.dataset.fallbackApplied = "true";
    avatar.hidden = true;
    const fallback = document.createElement("span");
    fallback.className = "avatar-fallback";
    fallback.textContent = (config.brand || "N").slice(0, 1).toUpperCase();
    avatar.parentElement?.append(fallback);
  }, { once: true });

  // Reveal-on-scroll animation, with a safe fallback for older browsers.
  const revealItems = $$(".reveal");
  if ("IntersectionObserver" in window) {
    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08, rootMargin: "0px 0px -20px 0px" });
    revealItems.forEach((item) => revealObserver.observe(item));
  } else {
    revealItems.forEach((item) => item.classList.add("is-visible"));
  }
  // First viewport always appears, even when the observer is delayed by a browser.
  window.addEventListener("load", () => {
    revealItems.filter((item) => item.getBoundingClientRect().top < window.innerHeight * 1.05)
      .forEach((item) => item.classList.add("is-visible"));
  }, { once: true });

  const year = $("#year");
  if (year) year.textContent = String(new Date().getFullYear());

  // Scroll progress.
  const progress = $("#scroll-progress");
  let scrollTicking = false;
  const updateProgress = () => {
    if (!progress) return;
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    const ratio = maxScroll > 0 ? Math.min(1, Math.max(0, window.scrollY / maxScroll)) : 0;
    progress.style.width = `${ratio * 100}%`;
    scrollTicking = false;
  };
  window.addEventListener("scroll", () => {
    if (!scrollTicking) {
      window.requestAnimationFrame(updateProgress);
      scrollTicking = true;
    }
  }, { passive: true });
  updateProgress();

  // Subtle cursor light and card spotlight/tilt on pointer devices only.
  const pointerGlow = $(".pointer-glow");
  const profileCard = $("#profile-card");
  const finePointer = window.matchMedia?.("(hover: hover) and (pointer: fine)").matches;
  if (finePointer) {
    document.body.classList.add("has-pointer");
    let pointerFrame = 0;
    document.addEventListener("pointermove", (event) => {
      if (pointerFrame) return;
      pointerFrame = window.requestAnimationFrame(() => {
        pointerGlow?.style.setProperty("left", `${event.clientX}px`);
        pointerGlow?.style.setProperty("top", `${event.clientY}px`);
        if (profileCard) {
          const rect = profileCard.getBoundingClientRect();
          const x = Math.min(100, Math.max(0, ((event.clientX - rect.left) / rect.width) * 100));
          const y = Math.min(100, Math.max(0, ((event.clientY - rect.top) / rect.height) * 100));
          profileCard.style.setProperty("--mx", `${x}%`);
          profileCard.style.setProperty("--my", `${y}%`);
          if (event.clientX >= rect.left - 30 && event.clientX <= rect.right + 30 && event.clientY >= rect.top - 30 && event.clientY <= rect.bottom + 30) {
            const dx = (event.clientX - (rect.left + rect.width / 2)) / rect.width;
            const dy = (event.clientY - (rect.top + rect.height / 2)) / rect.height;
            profileCard.style.setProperty("--tilt-x", `${dx * 2.1}deg`);
            profileCard.style.setProperty("--tilt-y", `${dy * -2.1}deg`);
            profileCard.classList.add("is-tilting");
          } else {
            profileCard.classList.remove("is-tilting");
          }
        }
        pointerFrame = 0;
      });
    }, { passive: true });
    profileCard?.addEventListener("pointerleave", () => profileCard.classList.remove("is-tilting"));
  }

  // Little light ripple on link-card interaction (visual only).
  $$(".link-card").forEach((card) => {
    card.addEventListener("pointerdown", (event) => {
      if (event.pointerType === "touch") return;
      const rect = card.getBoundingClientRect();
      const ripple = document.createElement("span");
      ripple.className = "link-ripple";
      ripple.style.left = `${event.clientX - rect.left}px`;
      ripple.style.top = `${event.clientY - rect.top}px`;
      card.append(ripple);
      window.setTimeout(() => ripple.remove(), 650);
    });
  });

  // Share/copy current bio URL.
  const shareButton = $("#share-button");
  shareButton?.addEventListener("click", async () => {
    const shareData = { title: "nminhios — Personal Bio", text: "Kết nối với nminhios", url: window.location.href };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(window.location.href);
        showToast("Đã sao chép liên kết bio!");
      } else {
        showToast("Hãy sao chép địa chỉ trên thanh trình duyệt nhé.");
      }
    } catch (error) {
      if (error?.name !== "AbortError") showToast("Không thể chia sẻ lúc này.");
    }
  });

  // Ambient particles. Keep the count modest on phones to preserve smooth scrolling.
  const canvas = $("#particle-canvas");
  const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  if (canvas && !reduceMotion) {
    const ctx = canvas.getContext("2d", { alpha: true });
    if (ctx) {
      let width = 0;
      let height = 0;
      let particles = [];
      let frame = 0;
      let dpr = 1;
      const makeParticle = () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.16,
        vy: (Math.random() - 0.5) * 0.13 - 0.025,
        radius: Math.random() * 1.35 + 0.35,
        alpha: Math.random() * 0.48 + 0.12,
        phase: Math.random() * Math.PI * 2,
        tint: Math.random() > 0.52 ? 0 : 1
      });
      const resizeCanvas = () => {
        dpr = Math.min(window.devicePixelRatio || 1, 1.5);
        width = window.innerWidth;
        height = window.innerHeight;
        canvas.width = Math.round(width * dpr);
        canvas.height = Math.round(height * dpr);
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        const count = Math.min(62, Math.max(24, Math.round(width / 19)));
        particles = Array.from({ length: count }, makeParticle);
      };
      const drawParticles = () => {
        ctx.clearRect(0, 0, width, height);
        const now = performance.now() * 0.0005;
        particles.forEach((p, index) => {
          p.x += p.vx;
          p.y += p.vy;
          if (p.x < -10) p.x = width + 10;
          if (p.x > width + 10) p.x = -10;
          if (p.y < -10) p.y = height + 10;
          if (p.y > height + 10) p.y = -10;
          const alpha = p.alpha * (0.55 + (Math.sin(now + p.phase) + 1) * 0.22);
          ctx.beginPath();
          ctx.fillStyle = p.tint ? `rgba(112,234,220,${alpha})` : `rgba(187,158,255,${alpha})`;
          ctx.shadowColor = p.tint ? "rgba(112,234,220,.45)" : "rgba(187,158,255,.45)";
          ctx.shadowBlur = p.radius * 5;
          ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
          for (let j = index + 1; j < Math.min(particles.length, index + 5); j += 1) {
            const q = particles[j];
            const dx = p.x - q.x;
            const dy = p.y - q.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            if (distance < 105) {
              ctx.beginPath();
              ctx.strokeStyle = `rgba(157,145,216,${(1 - distance / 105) * 0.055})`;
              ctx.lineWidth = 0.6;
              ctx.moveTo(p.x, p.y);
              ctx.lineTo(q.x, q.y);
              ctx.stroke();
            }
          }
        });
        frame = window.requestAnimationFrame(drawParticles);
      };
      resizeCanvas();
      drawParticles();
      window.addEventListener("resize", resizeCanvas, { passive: true });
      document.addEventListener("visibilitychange", () => {
        if (document.hidden && frame) {
          window.cancelAnimationFrame(frame);
          frame = 0;
        } else if (!document.hidden && !frame) {
          frame = window.requestAnimationFrame(drawParticles);
        }
      });
    }
  }

  // SoundCloud background only. Browsers may block autoplay until a user gesture.
  const audioFrame = $("#soundcloud-audio");
  const musicButton = $("#music-toggle");
  const musicLabel = $("#music-label");
  const musicTooltip = $("#music-tooltip");
  let widget = null;
  let widgetReady = false;
  let playing = false;
  let firstGestureTried = false;
  let tooltipTimer = 0;

  const showMusicHint = (message) => {
    if (!musicTooltip || !message) return;
    musicTooltip.textContent = message;
    musicTooltip.classList.add("is-visible");
    window.clearTimeout(tooltipTimer);
    tooltipTimer = window.setTimeout(() => musicTooltip.classList.remove("is-visible"), 3200);
  };
  const setMusicState = (active, hint) => {
    playing = Boolean(active);
    musicButton?.classList.toggle("is-playing", playing);
    musicButton?.setAttribute("aria-pressed", String(playing));
    musicButton?.setAttribute("aria-label", playing ? "Tạm dừng nhạc nền" : "Bật nhạc nền");
    if (musicLabel) musicLabel.textContent = playing ? "ĐANG PHÁT" : "NHẠC NỀN";
    if (hint) showMusicHint(hint);
  };
  const normalizeTrack = (raw) => {
    const parsed = new URL(raw);
    parsed.hostname = "soundcloud.com";
    parsed.search = "";
    parsed.hash = "";
    return parsed.toString();
  };
  const attachWidget = () => {
    if (!audioFrame || !window.SC?.Widget || widget) return;
    try {
      widget = window.SC.Widget(audioFrame);
      const events = window.SC.Widget.Events;
      widget.bind(events.READY, () => {
        widgetReady = true;
        try {
          widget.setVolume(26);
          widget.play();
        } catch (_) {
          setMusicState(false, "Chạm nút nhỏ để bật nhạc nền.");
        }
      });
      widget.bind(events.PLAY, () => setMusicState(true, "Nhạc nền đang phát."));
      widget.bind(events.PAUSE, () => setMusicState(false, "Nhạc nền đã tạm dừng."));
      widget.bind(events.FINISH, () => setMusicState(false, "Bài nhạc đã kết thúc."));
      if (events.ERROR) widget.bind(events.ERROR, () => setMusicState(false, "Không tải được nhạc nền lúc này."));
    } catch (_) {
      setMusicState(false, "Không tải được trình phát nhạc nền.");
    }
  };
  const loadSoundCloud = () => {
    if (!audioFrame || !config.music?.soundcloudTrack) return;
    try {
      const track = normalizeTrack(config.music.soundcloudTrack);
      const embed = new URL("https://w.soundcloud.com/player/");
      embed.search = new URLSearchParams({
        url: track,
        auto_play: "true",
        hide_related: "true",
        show_comments: "false",
        show_user: "false",
        show_reposts: "false",
        visual: "false",
        buying: "false",
        sharing: "false",
        download: "false",
        show_artwork: "false",
        color: "#b69aff"
      }).toString();
      audioFrame.src = embed.toString();
      if (window.SC?.Widget) attachWidget();
      else {
        const sdk = document.createElement("script");
        sdk.src = "https://w.soundcloud.com/player/api.js";
        sdk.async = true;
        sdk.onload = attachWidget;
        sdk.onerror = () => setMusicState(false, "SoundCloud không tải được. Các liên kết khác vẫn hoạt động bình thường.");
        document.head.append(sdk);
      }
    } catch (_) {
      setMusicState(false, "Liên kết nhạc nền chưa hợp lệ.");
    }
  };
  loadSoundCloud();

  const toggleMusic = () => {
    if (!widget || !widgetReady) {
      showToast("Nhạc nền đang tải. Thử lại sau một chút nhé.");
      return;
    }
    try {
      if (playing) widget.pause();
      else widget.play();
    } catch (_) {
      showMusicHint("Trình duyệt chưa cho phép phát nhạc. Chạm lại để thử.");
    }
  };
  musicButton?.addEventListener("click", toggleMusic);

  const unlockAudio = () => {
    if (firstGestureTried || !widget || !widgetReady || playing) return;
    firstGestureTried = true;
    try { widget.play(); } catch (_) { /* Manual control stays available. */ }
    document.removeEventListener("pointerdown", unlockAudio, true);
    document.removeEventListener("keydown", unlockAudio, true);
  };
  document.addEventListener("pointerdown", unlockAudio, true);
  document.addEventListener("keydown", unlockAudio, true);
})();
