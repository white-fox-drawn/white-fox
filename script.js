/* Sem dependências. Funciona também ao abrir o index.html diretamente. */
document.addEventListener("DOMContentLoaded", () => {
    const header = document.querySelector(".header");
    const heroScroll = document.querySelector(".hero-scroll");
    let ticking = false;

    function toggleHeader() {
        if (!header) return;
        const triggerPoint = heroScroll
            ? heroScroll.getBoundingClientRect().top + window.scrollY
            : 0;
        const visible = !heroScroll || window.scrollY > triggerPoint;
        header.classList.toggle("visible", visible);
        header.inert = !visible;
        header.setAttribute("aria-hidden", String(!visible));
        if (!visible) closeMenus();
        ticking = false;
    }
    window.addEventListener(
        "scroll",
        () => {
            if (!ticking) {
                window.requestAnimationFrame(toggleHeader);
                ticking = true;
            }
        },
        { passive: true },
    );
    window.addEventListener("resize", toggleHeader);
    window.addEventListener("pageshow", toggleHeader);

    const menuButtons = [...document.querySelectorAll(".menu-toggle")];
    const projectMenus = [...document.querySelectorAll(".nav-projects")];
    function setProjectMenu(group, open) {
        group.querySelector(".projects-toggle").setAttribute("aria-expanded", String(open));
        group.querySelector(".projects-submenu").hidden = !open;
        group.classList.toggle("is-open", open);
    }
    function closeMenus() {
        menuButtons.forEach((button) => {
            button.setAttribute("aria-expanded", "false");
            button.textContent = "Menu";
            document.getElementById(button.getAttribute("aria-controls"))?.classList.remove("open");
        });
        projectMenus.forEach((group) => setProjectMenu(group, false));
    }
    menuButtons.forEach((button) => {
        const menu = document.getElementById(button.getAttribute("aria-controls"));
        button.addEventListener("click", () => {
            const expanded = button.getAttribute("aria-expanded") === "true";
            closeMenus();
            if (!expanded) {
                button.setAttribute("aria-expanded", "true");
                button.textContent = "Fechar";
                menu?.classList.add("open");
            }
        });
        menu?.addEventListener("click", (event) => {
            if (event.target.closest("a")) closeMenus();
        });
    });
    projectMenus.forEach((group) => {
        const toggle = group.querySelector(".projects-toggle");
        const panel = group.querySelector(".projects-submenu");
        group.addEventListener("pointerenter", (event) => {
            if (
                event.pointerType === "mouse" &&
                matchMedia("(hover: hover) and (min-width: 521px)").matches
            )
                setProjectMenu(group, true);
        });
        group.addEventListener("pointerleave", (event) => {
            if (event.pointerType === "mouse" && !group.contains(document.activeElement))
                setProjectMenu(group, false);
        });
        toggle.addEventListener("click", () =>
            setProjectMenu(group, toggle.getAttribute("aria-expanded") !== "true"),
        );
        group.addEventListener("focusout", (event) => {
            if (!group.contains(event.relatedTarget)) setProjectMenu(group, false);
        });
        group.querySelector(".nav-projects-main").addEventListener("keydown", (event) => {
            if (!["ArrowDown", "ArrowUp"].includes(event.key)) return;
            event.preventDefault();
            setProjectMenu(group, true);
            const links = panel.querySelectorAll("a");
            (event.key === "ArrowDown" ? links[0] : links[links.length - 1])?.focus();
        });
    });
    document.addEventListener("click", (event) => {
        if (!event.target.closest("header")) closeMenus();
    });
    document.addEventListener("keydown", (event) => {
        if (event.key !== "Escape") return;
        const openProjects = projectMenus.find((group) => group.classList.contains("is-open"));
        if (openProjects) {
            setProjectMenu(openProjects, false);
            openProjects.querySelector(".projects-toggle").focus();
            event.preventDefault();
            return;
        }
        const openMenu = menuButtons.find(
            (button) => button.getAttribute("aria-expanded") === "true",
        );
        closeMenus();
        openMenu?.focus();
    });
    toggleHeader();

    // Faixas de imagens com proporções naturais, sem caixas que completem a arte.
    const carouselUpdates = [];
    refreshCarousels();
    document
        .querySelectorAll(
            ".inner-page .art-grid, .inner-page .design-grid, .inner-page .video-grid",
        )
        .forEach((track, number) => {
            const items = [...track.children];
            if (!items.length) return;
            const label =
                track.closest("section")?.querySelector("h2, h1")?.textContent.trim() ||
                "Trabalhos";
            const carousel = document.createElement("div");
            carousel.className = `carousel${track.classList.contains("video-grid") ? " carousel--video" : ""}`;
            carousel.setAttribute("role", "region");
            carousel.setAttribute("aria-roledescription", "carrossel");
            carousel.setAttribute("aria-label", label);
            track.before(carousel);
            const viewport = document.createElement("div");
            viewport.className = "carousel-viewport";
            carousel.append(viewport);
            viewport.append(track);
            track.classList.add("carousel-track");
            track.id = `portfolio-carousel-${number + 1}`;
            track.tabIndex = items.length > 1 ? 0 : -1;
            track.setAttribute("aria-label", `${label}. Use as setas do teclado para navegar.`);

            const slides = items.map((item, position) => {
                const slide = document.createElement("div");
                slide.className = "carousel-slide";
                slide.setAttribute("role", "group");
                slide.setAttribute("aria-roledescription", "slide");
                slide.setAttribute("aria-label", `${position + 1} de ${items.length}`);
                track.append(slide);
                slide.append(item);
                const img = item.querySelector("img");
                if (img) {
                    img.draggable = false;
                    const setRatio = () => {
                        // Vídeos sempre usam a mesma proporção.
                        if (item.matches(".video-card") || item.querySelector(".video-card")) {
                            slide.classList.add("carousel-slide--video");
                            slide.style.setProperty("--image-ratio", 16 / 9);
                            return;
                        }

                        const width = img.naturalWidth || Number(img.getAttribute("width"));
                        const height = img.naturalHeight || Number(img.getAttribute("height"));

                        if (width && height) {
                            slide.style.setProperty("--image-ratio", width / height);
                        }
                    };
                    setRatio();
                    img.addEventListener("load", () => {
                        setRatio();
                        scheduleUpdate();
                    });
                }
                return slide;
            });
            const controls = document.createElement("div");
            controls.className = "carousel-controls";
            const hint = document.createElement("p");
            hint.className = "carousel-hint";
            hint.textContent = "Arraste ou deslize para explorar";
            const navigation = document.createElement("div");
            navigation.className = "carousel-navigation";
            const back = document.createElement("button");
            const forward = document.createElement("button");
            const count = document.createElement("span");
            back.type = forward.type = "button";
            back.textContent = "Anterior";
            forward.textContent = "Próximo";
            back.setAttribute("aria-label", `Anterior — ${label}`);
            forward.setAttribute("aria-label", `Próximo — ${label}`);
            back.setAttribute("aria-controls", track.id);
            forward.setAttribute("aria-controls", track.id);
            count.className = "carousel-count";
            count.setAttribute("aria-live", "polite");
            count.setAttribute("aria-atomic", "true");
            navigation.append(back, count, forward);
            controls.append(hint, navigation);
            carousel.append(controls);
            let frame = null;
            function scheduleUpdate() {
                if (frame !== null) return;
                frame = requestAnimationFrame(() => {
                    frame = null;
                    update();
                });
            }
            function gutter() {
                return parseFloat(getComputedStyle(track).paddingLeft) || 0;
            }
            function update() {
                const section = carousel.closest("section");
                const inset = Math.max(20, section?.getBoundingClientRect().left || 0);
                carousel.style.setProperty("--carousel-gutter", `${inset}px`);
                const max = Math.max(0, track.scrollWidth - track.clientWidth);
                const left = Math.max(0, Math.min(track.scrollLeft, max));
                const canBack = left > 2,
                    canForward = left < max - 2;
                carousel.classList.toggle("has-before", canBack);
                carousel.classList.toggle("has-after", canForward);
                back.disabled = !canBack;
                forward.disabled = !canForward;
                controls.hidden = max < 3;
                const visibleInset = gutter();
                const visible = slides
                    .map((slide, i) => ({ slide, i }))
                    .filter(
                        ({ slide }) =>
                            slide.offsetLeft + slide.offsetWidth > left + visibleInset + 2 &&
                            slide.offsetLeft < left + track.clientWidth - visibleInset - 2,
                    )
                    .map(({ i }) => i + 1);
                const first = visible[0] || 1,
                    last = visible.at(-1) || first;
                const value = `${first === last ? first : `${first}–${last}`} / ${slides.length}`;
                if (count.textContent !== value) count.textContent = value;
            }
            function move(direction) {
                const max = Math.max(0, track.scrollWidth - track.clientWidth);
                const stops = [
                    ...new Set([
                        0,
                        ...slides.map((slide) =>
                            Math.max(0, Math.min(max, slide.offsetLeft - gutter())),
                        ),
                        max,
                    ]),
                ].sort((a, b) => a - b);
                const nextStop =
                    direction > 0
                        ? stops.find((stop) => stop > track.scrollLeft + 3)
                        : stops.findLast((stop) => stop < track.scrollLeft - 3);
                track.scrollTo({
                    left: nextStop ?? (direction > 0 ? max : 0),
                    behavior: matchMedia("(prefers-reduced-motion: reduce)").matches
                        ? "instant"
                        : "smooth",
                });
            }
            back.addEventListener("click", () => move(-1));
            forward.addEventListener("click", () => move(1));
            track.addEventListener("scroll", scheduleUpdate, { passive: true });
            track.addEventListener("keydown", (event) => {
                if (event.key === "ArrowRight") {
                    event.preventDefault();
                    move(1);
                }
                if (event.key === "ArrowLeft") {
                    event.preventDefault();
                    move(-1);
                }
            });

            let drag = null,
                suppressClick = false;
            function endDrag() {
                if (!drag) return;
                const { pointerId, moved } = drag;
                drag = null;
                if (track.hasPointerCapture(pointerId)) track.releasePointerCapture(pointerId);
                track.classList.remove("is-dragging");
                suppressClick = moved;
                setTimeout(() => {
                    suppressClick = false;
                }, 0);
                scheduleUpdate();
            }
            track.addEventListener("pointerdown", (event) => {
                if (event.pointerType !== "mouse" || event.button !== 0) return;
                drag = {
                    pointerId: event.pointerId,
                    x: event.clientX,
                    scroll: track.scrollLeft,
                    moved: false,
                };
            });
            track.addEventListener("pointermove", (event) => {
                if (!drag || event.pointerId !== drag.pointerId) return;
                const dx = event.clientX - drag.x;
                if (!drag.moved && Math.abs(dx) < 6) return;
                if (!drag.moved) {
                    drag.moved = true;
                    track.classList.add("is-dragging");
                    track.setPointerCapture(event.pointerId);
                }
                event.preventDefault();
                track.scrollLeft = drag.scroll - dx;
            });
            track.addEventListener("pointerup", endDrag);
            track.addEventListener("pointercancel", endDrag);
            track.addEventListener("lostpointercapture", endDrag);
            track.addEventListener("dragstart", (event) => event.preventDefault());
            track.addEventListener(
                "click",
                (event) => {
                    if (!suppressClick) return;
                    event.preventDefault();
                    event.stopImmediatePropagation();
                },
                true,
            );
            carouselUpdates.push(scheduleUpdate);
            update();
        });
    function refreshCarousels() {
        document.documentElement.style.setProperty(
            "--portfolio-viewport-width",
            `${document.documentElement.clientWidth}px`,
        );
        carouselUpdates.forEach((update) => update());
    }
    window.addEventListener("resize", refreshCarousels);

    const viewer = document.getElementById("media-viewer");
    if (!viewer || typeof viewer.showModal !== "function") return;
    const viewerImage = viewer.querySelector("img");
    const viewerVideo = viewer.querySelector("video");
    const title = viewer.querySelector(".viewer-title");
    const counter = viewer.querySelector(".viewer-count");
    const previous = viewer.querySelector(".viewer-prev");
    const next = viewer.querySelector(".viewer-next");
    const loading = viewer.querySelector(".viewer-loading");
    const videoError = viewer.querySelector(".viewer-error");
    let collection = [],
        index = 0,
        opener = null;
    let touchStart = null;
    let playbackRequest = 0,
        activeLoad = null;
    const playableSources = new Map();

    async function playableSource(url, signal) {
        if (playableSources.has(url)) return playableSources.get(url);
        if (location.protocol === "file:") return url;
        let response = await fetch(url, {
            headers: { Range: "bytes=0-0" },
            credentials: "same-origin",
            signal,
        });
        if (response.status === 206) {
            if (response.body) await response.body.cancel();
            playableSources.set(url, url);
            return url;
        }
        if ([400, 403, 416].includes(response.status)) {
            if (response.body) await response.body.cancel();
            response = await fetch(url, { credentials: "same-origin", signal });
        }
        if (!response.ok || response.headers.get("content-type")?.includes("text/html"))
            throw new Error("Vídeo indisponível");
        // Alguns hosts entregam sempre o arquivo inteiro, ignorando o Range.
        // Uma URL local do arquivo completo permite buscar qualquer trecho.
        const bytes = await response.arrayBuffer();
        if (signal.aborted) throw new DOMException("Carregamento cancelado", "AbortError");
        const source = URL.createObjectURL(new Blob([bytes], { type: "video/mp4" }));
        playableSources.set(url, source);
        return source;
    }

    async function loadVideo(item, request) {
        const controller = new AbortController();
        activeLoad = controller;
        loading.hidden = false;
        viewer.setAttribute("aria-busy", "true");
        try {
            const source = await playableSource(item.href, controller.signal);
            if (request !== playbackRequest || controller.signal.aborted) return;
            viewerVideo.src = source;
            if (item.dataset.poster) viewerVideo.poster = item.dataset.poster;
            viewerVideo.hidden = false;
            loading.hidden = true;
            viewer.setAttribute("aria-busy", "false");
            activeLoad = null;
            viewerVideo.play().catch(() => {});
        } catch (error) {
            if (error.name === "AbortError" || request !== playbackRequest) return;
            loading.hidden = true;
            videoError.hidden = false;
            videoError.querySelector("a").href = item.href;
            viewer.setAttribute("aria-busy", "false");
        }
    }

    function resetVideo() {
        playbackRequest += 1;
        activeLoad?.abort();
        activeLoad = null;
        loading.hidden = true;
        videoError.hidden = true;
        viewer.setAttribute("aria-busy", "false");
        viewerVideo.pause();
        viewerVideo.removeAttribute("src");
        viewerVideo.removeAttribute("poster");
        viewerVideo.load();
        viewerVideo.hidden = true;
    }
    function showMedia(position) {
        index = position;
        const item = collection[index];
        const isVideo = item.dataset.type === "video";
        resetVideo();
        viewerImage.hidden = isVideo;
        if (isVideo) {
            viewerImage.removeAttribute("src");
            loadVideo(item, playbackRequest);
        } else {
            viewerImage.src = item.href;
            viewerImage.alt = item.dataset.title || item.querySelector("img")?.alt || "";
        }
        title.textContent = item.dataset.title || "";
        counter.textContent = `${index + 1} / ${collection.length}`;
        previous.disabled = index === 0;
        next.disabled = index === collection.length - 1;
        previous.hidden = next.hidden = collection.length < 2;
    }
    const galleryLinks = [...document.querySelectorAll("a[data-gallery]")];
    galleryLinks.forEach((link) => {
        link.addEventListener("click", (event) => {
            if (
                event.ctrlKey ||
                event.metaKey ||
                event.shiftKey ||
                event.altKey ||
                event.button !== 0
            )
                return;
            event.preventDefault();
            opener = link;
            collection = galleryLinks
                .filter((item) => item.dataset.gallery === link.dataset.gallery)
                .filter(
                    (item, position, items) =>
                        items.findIndex((other) => other.href === item.href) === position,
                );
            showMedia(collection.findIndex((item) => item.href === link.href));
            viewer.showModal();
            document.body.classList.add("viewer-open");
            refreshCarousels();
        });
    });
    previous.addEventListener("click", () => {
        if (index > 0) showMedia(index - 1);
    });
    next.addEventListener("click", () => {
        if (index < collection.length - 1) showMedia(index + 1);
    });
    viewer.querySelector(".viewer-retry").addEventListener("click", () => showMedia(index));
    viewer.querySelector(".viewer-close").addEventListener("click", () => viewer.close());
    viewer.addEventListener("click", (event) => {
        if (event.target !== viewer) return;
        const rect = viewer.getBoundingClientRect();
        if (
            event.clientX < rect.left ||
            event.clientX > rect.right ||
            event.clientY < rect.top ||
            event.clientY > rect.bottom
        )
            viewer.close();
    });
    viewer.addEventListener("keydown", (event) => {
        if (!viewerVideo.hidden || !loading.hidden) return;
        if (event.key === "ArrowLeft" && index > 0) {
            event.preventDefault();
            showMedia(index - 1);
        }
        if (event.key === "ArrowRight" && index < collection.length - 1) {
            event.preventDefault();
            showMedia(index + 1);
        }
    });
    const stage = viewer.querySelector(".viewer-stage");
    stage.addEventListener(
        "touchstart",
        (event) => {
            if (viewerImage.hidden || event.target !== viewerImage || event.touches.length !== 1) {
                touchStart = null;
                return;
            }
            touchStart = { x: event.touches[0].clientX, y: event.touches[0].clientY };
        },
        { passive: true },
    );
    stage.addEventListener(
        "touchend",
        (event) => {
            if (!touchStart) return;
            const deltaX = event.changedTouches[0].clientX - touchStart.x;
            const deltaY = event.changedTouches[0].clientY - touchStart.y;
            touchStart = null;
            if (Math.abs(deltaX) < 60 || Math.abs(deltaX) < Math.abs(deltaY)) return;
            if (deltaX < 0 && index < collection.length - 1) showMedia(index + 1);
            if (deltaX > 0 && index > 0) showMedia(index - 1);
        },
        { passive: true },
    );
    viewer.addEventListener("close", () => {
        resetVideo();
        viewerImage.removeAttribute("src");
        document.body.classList.remove("viewer-open");
        refreshCarousels();
        opener?.focus({ preventScroll: true });
    });
});
document.addEventListener("contextmenu", (event) => {
    if (event.target.closest("img, video, .image-link, .video-card")) {
        event.preventDefault();
    }
});
document.addEventListener("dragstart", (event) => {
    if (event.target instanceof HTMLImageElement) {
        event.preventDefault();
    }
});
