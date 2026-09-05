(function (global) {
  function isLocalDevHost() {
    const host = global.location.hostname;
    return host === "localhost" || host === "127.0.0.1" || host === "[::1]";
  }

  function clampPercent(value) {
    return Math.max(0, Math.min(100, value));
  }

  function normalizePoint(point) {
    return [clampPercent(Number(point[0]) || 0), clampPercent(Number(point[1]) || 0)];
  }

  function clonePoints(points) {
    return (points || []).map(function (point) {
      return normalizePoint(point);
    });
  }

  function isPolygonHotspot(spec) {
    return Array.isArray(spec && spec.points) && spec.points.length >= 3;
  }

  function isCircleHotspot(spec) {
    return (
      spec &&
      (spec.shape === "circle" ||
        (Number.isFinite(Number(spec.cx)) &&
          Number.isFinite(Number(spec.cy)) &&
          Number.isFinite(Number(spec.r))))
    );
  }

  function normalizeCircle(spec) {
    return {
      shape: "circle",
      cx: clampPercent(Number(spec.cx) || 50),
      cy: clampPercent(Number(spec.cy) || 50),
      r: Math.max(1, Math.min(50, Number(spec.r) || 5)),
    };
  }

  function boxToCircle(box) {
    const rect = normalizeBox(box);
    return normalizeCircle({
      cx: rect.left + rect.width / 2,
      cy: rect.top + rect.height / 2,
      r: Math.min(rect.width, rect.height) / 2,
    });
  }

  function circleToClipPath(circle) {
    const next = normalizeCircle(circle);
    return (
      "circle(" +
      next.r.toFixed(2) +
      "% at " +
      next.cx.toFixed(2) +
      "% " +
      next.cy.toFixed(2) +
      "%)"
    );
  }

  function readCircleFromElement(el, fallbackCircle) {
    if (el.dataset.hotspotCircle) {
      try {
        const parsed = JSON.parse(el.dataset.hotspotCircle);
        if (parsed && Number.isFinite(Number(parsed.r))) {
          return normalizeCircle(parsed);
        }
      } catch (_error) {
        /* use fallback */
      }
    }
    if (isCircleHotspot(fallbackCircle)) {
      return normalizeCircle(fallbackCircle);
    }
    return normalizeCircle({ cx: 50, cy: 50, r: 5 });
  }

  function slugFromHotspotId(id) {
    return String(id || "hotspot")
      .replace(/-btn$/, "")
      .replace(/[^a-z0-9-]+/gi, "-")
      .replace(/^-+|-+$/g, "");
  }

  function normalizeBox(spec) {
    return {
      left: Number(spec.left) || 0,
      top: Number(spec.top) || 0,
      width: Number(spec.width) || 10,
      height: Number(spec.height) || 10,
      rotate: Number(spec.rotate) || 0,
    };
  }

  function clampBox(box) {
    const next = normalizeBox(box);
    const minSize = 2;
    next.width = Math.max(minSize, Math.min(100, next.width));
    next.height = Math.max(minSize, Math.min(100, next.height));
    next.left = Math.max(0, Math.min(100 - next.width, next.left));
    next.top = Math.max(0, Math.min(100 - next.height, next.top));
    return next;
  }

  function rotatePoint(x, y, cx, cy, degrees) {
    const rad = (degrees * Math.PI) / 180;
    const dx = x - cx;
    const dy = y - cy;
    return [
      clampPercent(cx + dx * Math.cos(rad) - dy * Math.sin(rad)),
      clampPercent(cy + dx * Math.sin(rad) + dy * Math.cos(rad)),
    ];
  }

  function boxToPoints(box) {
    const rect = normalizeBox(box);
    const corners = [
      [rect.left, rect.top],
      [rect.left + rect.width, rect.top],
      [rect.left + rect.width, rect.top + rect.height],
      [rect.left, rect.top + rect.height],
    ];
    if (!rect.rotate) {
      return corners.map(normalizePoint);
    }
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    return corners.map(function (point) {
      return rotatePoint(point[0], point[1], cx, cy, rect.rotate);
    });
  }

  function pointsToClipPath(points) {
    return (
      "polygon(" +
      points
        .map(function (point) {
          return point[0].toFixed(2) + "% " + point[1].toFixed(2) + "%";
        })
        .join(", ") +
      ")"
    );
  }

  function pointsToBoundingBox(points) {
    const xs = points.map(function (point) {
      return point[0];
    });
    const ys = points.map(function (point) {
      return point[1];
    });
    const left = Math.min.apply(null, xs);
    const top = Math.min.apply(null, ys);
    const right = Math.max.apply(null, xs);
    const bottom = Math.max.apply(null, ys);
    return clampBox({
      left: left,
      top: top,
      width: right - left,
      height: bottom - top,
      rotate: 0,
    });
  }

  function normalizeHotspot(spec) {
    if (isPolygonHotspot(spec)) {
      return {
        type: "polygon",
        points: clonePoints(spec.points),
      };
    }
    if (isCircleHotspot(spec)) {
      return {
        type: "circle",
        circle: normalizeCircle(spec),
      };
    }
    return {
      type: "box",
      box: normalizeBox(spec || {}),
    };
  }

  function readPointsFromElement(el, fallbackPoints) {
    if (el.dataset.hotspotPoints) {
      try {
        const parsed = JSON.parse(el.dataset.hotspotPoints);
        if (Array.isArray(parsed) && parsed.length >= 3) {
          return clonePoints(parsed);
        }
      } catch (_error) {
        /* use fallback */
      }
    }
    return clonePoints(fallbackPoints || []);
  }

  function clearHotspotStyles(el) {
    el.style.transform = "";
    el.style.clipPath = "";
    delete el.dataset.hotspotRotate;
    delete el.dataset.hotspotMode;
    delete el.dataset.hotspotPoints;
    delete el.dataset.hotspotCircle;
  }

  function applyBox(el, box) {
    const next = normalizeBox(box);
    clearHotspotStyles(el);
    el.style.left = next.left.toFixed(2) + "%";
    el.style.top = next.top.toFixed(2) + "%";
    el.style.width = next.width.toFixed(2) + "%";
    el.style.height = next.height.toFixed(2) + "%";
    el.style.transformOrigin = "center center";
    if (next.rotate) {
      el.style.transform = "rotate(" + next.rotate.toFixed(2) + "deg)";
      el.dataset.hotspotRotate = next.rotate.toFixed(2);
    }
    el.dataset.hotspotMode = "box";
  }

  function applyPolygon(el, points) {
    const nextPoints = clonePoints(points);
    clearHotspotStyles(el);
    el.style.left = "0";
    el.style.top = "0";
    el.style.width = "100%";
    el.style.height = "100%";
    el.style.clipPath = pointsToClipPath(nextPoints);
    el.dataset.hotspotMode = "polygon";
    el.dataset.hotspotPoints = JSON.stringify(nextPoints);
  }

  function applyCircle(el, circle) {
    const next = normalizeCircle(circle);
    clearHotspotStyles(el);
    el.style.left = "0";
    el.style.top = "0";
    el.style.width = "100%";
    el.style.height = "100%";
    el.style.clipPath = circleToClipPath(next);
    el.dataset.hotspotMode = "circle";
    el.dataset.hotspotCircle = JSON.stringify({
      cx: Number(next.cx.toFixed(2)),
      cy: Number(next.cy.toFixed(2)),
      r: Number(next.r.toFixed(2)),
    });
  }

  function applyHotspot(el, spec) {
    const hotspot = normalizeHotspot(spec);
    if (hotspot.type === "polygon") {
      applyPolygon(el, hotspot.points);
      return;
    }
    if (hotspot.type === "circle") {
      applyCircle(el, hotspot.circle);
      return;
    }
    applyBox(el, hotspot.box);
  }

  function mergeHotspotSpec(base, override) {
    if (override) {
      if (isPolygonHotspot(override)) {
        return { points: clonePoints(override.points) };
      }
      if (isCircleHotspot(override)) {
        return normalizeCircle(override);
      }
      if (isPolygonHotspot(base) || isCircleHotspot(base)) {
        return normalizeBox(override);
      }
      return normalizeBox(Object.assign({}, base || {}, override));
    }
    if (isPolygonHotspot(base)) {
      return { points: clonePoints(base.points) };
    }
    if (isCircleHotspot(base)) {
      return normalizeCircle(base);
    }
    return normalizeBox(base || {});
  }

  function mergeHotspotMaps(baked, draft) {
    const merged = {};
    const ids = new Set(Object.keys(baked || {}).concat(Object.keys(draft || {})));
    ids.forEach(function (id) {
      merged[id] = mergeHotspotSpec(baked && baked[id], draft && draft[id]);
    });
    return merged;
  }

  function getPointerAngle(el, clientX, clientY) {
    const box = el.getBoundingClientRect();
    const cx = box.left + box.width / 2;
    const cy = box.top + box.height / 2;
    return (Math.atan2(clientY - cy, clientX - cx) * 180) / Math.PI;
  }

  function stagePointFromClient(stage, clientX, clientY) {
    const bounds = stage.getBoundingClientRect();
    return normalizePoint([
      ((clientX - bounds.left) / bounds.width) * 100,
      ((clientY - bounds.top) / bounds.height) * 100,
    ]);
  }

  function HotspotMapper(options) {
    this.pageId = options.pageId;
    this.stage =
      typeof options.stageSelector === "string"
        ? document.querySelector(options.stageSelector)
        : options.stageSelector;
    this.root =
      typeof options.rootSelector === "string"
        ? document.querySelector(options.rootSelector)
        : options.rootSelector;
    this.hotspotSelector = options.hotspotSelector || ".hotspot";
    this.layout = options.layout || { hotspots: {}, classMap: {} };
    this.classMap = options.classMap || this.layout.classMap || {};
    this.hotspotClassPrefix = options.hotspotClassPrefix || "hotspot";
    this.hotspotBaseClass = options.hotspotBaseClass || "hotspot";
    this.hotspotTag = options.hotspotTag || "button";
    this.hotspotIds = Object.keys(this.layout.hotspots || {});
    this.storageKey = "them1947-hotspot-draft-" + this.pageId;
    this.legacyStorageKey = "them1947-hotspot-layout-v2";

    const params = new URLSearchParams(global.location.search);
    this.isEditMode =
      params.get("edit") === "hotspots" ||
      (isLocalDevHost() && params.get("edit") !== "off" && params.get("preview") !== "1");
    this.isDebugMode = params.get("debug") === "hotspots" || this.isEditMode;
    this.params = params;

    if (this.isDebugMode) {
      document.body.classList.add("hotspot-debug");
    }
    if (this.isEditMode) {
      document.body.classList.add("hotspot-edit");
    }
  }

  HotspotMapper.prototype.getElements = function () {
    if (!this.root) return [];
    return Array.from(this.root.querySelectorAll(this.hotspotSelector)).filter(function (el) {
      return el.id;
    });
  };

  HotspotMapper.prototype.readHotspot = function (el) {
    const fallback = this.layout.hotspots[el.id] || {
      left: 0,
      top: 0,
      width: 10,
      height: 10,
      rotate: 0,
    };

    if (el.dataset.hotspotMode === "circle" || isCircleHotspot(fallback)) {
      return readCircleFromElement(el, isCircleHotspot(fallback) ? fallback : null);
    }

    if (el.dataset.hotspotMode === "polygon" || isPolygonHotspot(fallback)) {
      return {
        points: readPointsFromElement(
          el,
          isPolygonHotspot(fallback) ? fallback.points : boxToPoints(fallback)
        ),
      };
    }

    const box = normalizeBox(fallback);
    const rotateFromDataset =
      el.dataset.hotspotRotate !== undefined
        ? parseFloat(el.dataset.hotspotRotate)
        : box.rotate;

    return {
      left: parseFloat(el.style.left) || box.left,
      top: parseFloat(el.style.top) || box.top,
      width: parseFloat(el.style.width) || box.width,
      height: parseFloat(el.style.height) || box.height,
      rotate: Number.isFinite(rotateFromDataset) ? rotateFromDataset : box.rotate,
    };
  };

  HotspotMapper.prototype.getCurrentLayout = function () {
    const layout = {};
    this.getElements().forEach(
      function (el) {
        layout[el.id] = this.readHotspot(el);
      }.bind(this)
    );
    return layout;
  };

  HotspotMapper.prototype.applyLayout = function (hotspots) {
    this.getElements().forEach(
      function (el) {
        const spec = hotspots[el.id] || this.layout.hotspots[el.id];
        if (spec) {
          applyHotspot(el, spec);
        }
      }.bind(this)
    );
  };

  HotspotMapper.prototype.toCss = function (hotspots) {
    const classMap = this.classMap;
    return Object.keys(hotspots)
      .map(function (id) {
        const spec = hotspots[id];
        const className = classMap[id];
        if (!className) return "";

        if (isPolygonHotspot(spec)) {
          return (
            "." +
            className +
            " {\n  left: 0;\n  top: 0;\n  width: 100%;\n  height: 100%;\n  clip-path: " +
            pointsToClipPath(clonePoints(spec.points)) +
            ";\n}"
          );
        }

        if (isCircleHotspot(spec)) {
          return (
            "." +
            className +
            " {\n  left: 0;\n  top: 0;\n  width: 100%;\n  height: 100%;\n  clip-path: " +
            circleToClipPath(spec) +
            ";\n}"
          );
        }

        const box = normalizeBox(spec);
        let block =
          "." +
          className +
          " {\n  left: " +
          box.left.toFixed(2) +
          "%;\n  top: " +
          box.top.toFixed(2) +
          "%;\n  width: " +
          box.width.toFixed(2) +
          "%;\n  height: " +
          box.height.toFixed(2) +
          "%;";
        if (box.rotate) {
          block +=
            "\n  transform: rotate(" +
            box.rotate.toFixed(2) +
            "deg);\n  transform-origin: center center;";
        }
        block += "\n}";
        return block;
      })
      .filter(Boolean)
      .join("\n\n");
  };

  HotspotMapper.prototype.toJson = function (hotspots) {
    const normalized = {};
    Object.keys(hotspots).forEach(function (id) {
      const spec = hotspots[id];
      if (isPolygonHotspot(spec)) {
        normalized[id] = {
          points: clonePoints(spec.points).map(function (point) {
            return [Number(point[0].toFixed(2)), Number(point[1].toFixed(2))];
          }),
        };
        return;
      }
      if (isCircleHotspot(spec)) {
        const circle = normalizeCircle(spec);
        normalized[id] = {
          shape: "circle",
          cx: Number(circle.cx.toFixed(2)),
          cy: Number(circle.cy.toFixed(2)),
          r: Number(circle.r.toFixed(2)),
        };
        return;
      }
      const box = normalizeBox(spec);
      normalized[id] = {
        left: Number(box.left.toFixed(2)),
        top: Number(box.top.toFixed(2)),
        width: Number(box.width.toFixed(2)),
        height: Number(box.height.toFixed(2)),
      };
      if (box.rotate) {
        normalized[id].rotate = Number(box.rotate.toFixed(2));
      }
    });

    return JSON.stringify(
      {
        id: this.pageId,
        aspectRatio: this.layout.aspectRatio || null,
        classMap: this.classMap,
        hotspots: normalized,
      },
      null,
      2
    );
  };

  HotspotMapper.prototype.loadDraft = function () {
    try {
      let raw = localStorage.getItem(this.storageKey);
      if (!raw && this.legacyStorageKey) {
        raw = localStorage.getItem(this.legacyStorageKey);
        if (raw) {
          localStorage.setItem(this.storageKey, raw);
        }
      }
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === "object" ? parsed : null;
    } catch (_error) {
      return null;
    }
  };

  HotspotMapper.prototype.saveDraft = function (hotspots) {
    localStorage.setItem(this.storageKey, JSON.stringify(hotspots));
  };

  HotspotMapper.prototype.apply = function () {
    const baked = this.layout.hotspots || {};
    const draft = this.loadDraft();
    if (draft && (this.isEditMode || isLocalDevHost())) {
      this.applyLayout(mergeHotspotMaps(baked, draft));
      return;
    }
    this.applyLayout(mergeHotspotMaps(baked, null));
  };

  HotspotMapper.prototype.persistDraft = function () {
    this.saveDraft(this.getCurrentLayout());
  };

  HotspotMapper.prototype.createHotspotElement = function (id, label, spec) {
    const slug = slugFromHotspotId(id);
    const modifier = this.hotspotClassPrefix + "--" + slug;
    this.classMap[id] = modifier;
    this.layout.hotspots[id] = spec;
    if (this.hotspotIds.indexOf(id) === -1) {
      this.hotspotIds.push(id);
    }

    const el = document.createElement(this.hotspotTag);
    el.id = id;
    if (this.hotspotTag === "button") {
      el.type = "button";
    }
    el.className = this.hotspotBaseClass + " " + modifier;
    el.setAttribute("aria-label", label);
    this.root.appendChild(el);
    applyHotspot(el, spec);
    return el;
  };

  HotspotMapper.prototype.toHtmlSnippet = function (id) {
    const el = document.getElementById(id);
    if (!el) return "";
    const label = el.getAttribute("aria-label") || id;
    const classes = el.className;
    const tag = el.tagName.toLowerCase();
    if (tag === "a") {
      return (
        '<a id="' +
        id +
        '" class="' +
        classes +
        '" href="#" aria-label="' +
        label +
        '"></a>'
      );
    }
    return (
      '<button id="' +
      id +
      '" class="' +
      classes +
      '" type="button" aria-label="' +
      label +
      '"></button>'
    );
  };

  HotspotMapper.prototype.initEditor = function () {
    if (!this.isEditMode || !this.stage || !this.root) return;

    const self = this;
    let selectedEl = null;
    let selectedPointIndex = null;
    let dragState = null;
    let resizeState = null;
    let rotateState = null;
    let pointDragState = null;
    let addPointMode = false;
    const baked = this.layout.hotspots || {};

    const pointLayer = document.createElement("div");
    pointLayer.className = "hotspot-point-layer";
    pointLayer.setAttribute("aria-hidden", "true");
    this.stage.appendChild(pointLayer);

    const editor = document.createElement("div");
    editor.className = "hotspot-editor";
    editor.innerHTML =
      '<strong>Hotspot editor</strong>' +
      '<span>Box · circle · polygon. Add buttons in-editor, then copy JSON + HTML.</span>' +
      '<button type="button" data-action="add-hotspot">Add hotspot</button>' +
      '<button type="button" data-action="delete-hotspot">Delete</button>' +
      '<button type="button" data-action="add-point">Add point</button>' +
      '<button type="button" data-action="delete-point">Delete point</button>' +
      '<button type="button" data-action="to-circle">To circle</button>' +
      '<button type="button" data-action="to-polygon">To polygon</button>' +
      '<button type="button" data-action="to-box">To box</button>' +
      '<button type="button" data-action="save-draft">Save draft</button>' +
      '<button type="button" data-action="copy-json">Copy JSON</button>' +
      '<button type="button" data-action="copy-css">Copy CSS</button>' +
      '<button type="button" data-action="copy-html">Copy HTML</button>' +
      '<button type="button" data-action="reset">Reset</button>' +
      '<button type="button" data-action="exit">Exit</button>' +
      '<pre class="hotspot-editor-output" aria-live="polite"></pre>';
    document.body.appendChild(editor);

    const output = editor.querySelector(".hotspot-editor-output");

    function updateOutput() {
      output.textContent = self.toJson(self.getCurrentLayout());
    }

    function isPolygonElement(el) {
      return el && el.dataset.hotspotMode === "polygon";
    }

    function isCircleElement(el) {
      return el && el.dataset.hotspotMode === "circle";
    }

    function isStageShapeElement(el) {
      return isPolygonElement(el) || isCircleElement(el);
    }

    function clearPointSelection() {
      selectedPointIndex = null;
      pointLayer.querySelectorAll(".hotspot-point.is-selected").forEach(function (node) {
        node.classList.remove("is-selected");
      });
    }

    function renderPointHandles(el) {
      pointLayer.innerHTML = "";
      if (!el || !isPolygonElement(el)) return;

      const spec = self.readHotspot(el);
      spec.points.forEach(function (point, index) {
        const handle = document.createElement("button");
        handle.type = "button";
        handle.className =
          "hotspot-point" + (selectedPointIndex === index ? " is-selected" : "");
        handle.dataset.index = String(index);
        handle.style.left = point[0].toFixed(2) + "%";
        handle.style.top = point[1].toFixed(2) + "%";
        handle.setAttribute("aria-label", "Point " + (index + 1));

        handle.addEventListener("pointerdown", function (event) {
          event.preventDefault();
          event.stopPropagation();
          selectedPointIndex = index;
          renderPointHandles(el);
          pointDragState = {
            el: el,
            index: index,
          };
          handle.setPointerCapture(event.pointerId);
        });

        handle.addEventListener("pointermove", function (event) {
          if (!pointDragState || pointDragState.el !== el || pointDragState.index !== index) {
            return;
          }
          const current = self.readHotspot(el);
          current.points[index] = stagePointFromClient(self.stage, event.clientX, event.clientY);
          applyHotspot(el, current);
          handle.style.left = current.points[index][0].toFixed(2) + "%";
          handle.style.top = current.points[index][1].toFixed(2) + "%";
          updateOutput();
        });

        handle.addEventListener("pointerup", function () {
          if (pointDragState && pointDragState.el === el) {
            self.persistDraft();
          }
          pointDragState = null;
        });

        handle.addEventListener("click", function (event) {
          event.stopPropagation();
          selectedPointIndex = index;
          renderPointHandles(el);
        });

        pointLayer.appendChild(handle);
      });
    }

    function selectHotspot(el) {
      if (selectedEl) {
        selectedEl.classList.remove("is-selected");
      }
      selectedEl = el;
      clearPointSelection();
      if (selectedEl) {
        selectedEl.classList.add("is-selected");
      }
      renderPointHandles(selectedEl);
      updateOutput();
    }

    function setAddPointMode(active) {
      addPointMode = active;
      editor.querySelector('[data-action="add-point"]').classList.toggle("is-active", active);
      self.stage.classList.toggle("is-add-point", active);
    }

    function isEditorHandle(target) {
      return (
        target.classList.contains("hotspot-resize") ||
        target.classList.contains("hotspot-rotate") ||
        target.classList.contains("hotspot-point")
      );
    }

    function bindHotspotEditor(el) {
      if (el.dataset.hotspotEditorBound === "1") return;
      el.dataset.hotspotEditorBound = "1";

      const resizeHandle = document.createElement("span");
      resizeHandle.className = "hotspot-resize";
      resizeHandle.setAttribute("aria-hidden", "true");
      el.appendChild(resizeHandle);

      const rotateHandle = document.createElement("span");
      rotateHandle.className = "hotspot-rotate";
      rotateHandle.setAttribute("aria-hidden", "true");
      el.appendChild(rotateHandle);

      el.addEventListener("click", function (event) {
        event.preventDefault();
        event.stopPropagation();
        selectHotspot(el);
      });

      resizeHandle.addEventListener("pointerdown", function (event) {
        if (isPolygonElement(el)) return;
        event.preventDefault();
        event.stopPropagation();
        selectHotspot(el);
        if (isCircleElement(el)) {
          resizeState = {
            el: el,
            mode: "circle",
            startCircle: normalizeCircle(self.readHotspot(el)),
          };
        } else {
          resizeState = {
            el: el,
            mode: "box",
            startX: event.clientX,
            startY: event.clientY,
            startRect: self.readHotspot(el),
          };
        }
        resizeHandle.setPointerCapture(event.pointerId);
      });

      resizeHandle.addEventListener("pointermove", function (event) {
        if (!resizeState || resizeState.el !== el) return;
        if (resizeState.mode === "circle") {
          const point = stagePointFromClient(self.stage, event.clientX, event.clientY);
          const start = resizeState.startCircle;
          const dx = point[0] - start.cx;
          const dy = point[1] - start.cy;
          applyHotspot(el, {
            shape: "circle",
            cx: start.cx,
            cy: start.cy,
            r: Math.max(1, Math.sqrt(dx * dx + dy * dy)),
          });
          updateOutput();
          return;
        }
        if (isPolygonElement(el)) return;
        const bounds = self.stage.getBoundingClientRect();
        const dx = ((event.clientX - resizeState.startX) / bounds.width) * 100;
        const dy = ((event.clientY - resizeState.startY) / bounds.height) * 100;
        const start = normalizeBox(resizeState.startRect);
        applyHotspot(
          el,
          clampBox({
            left: start.left,
            top: start.top,
            width: start.width + dx,
            height: start.height + dy,
            rotate: start.rotate,
          })
        );
        updateOutput();
      });

      resizeHandle.addEventListener("pointerup", function () {
        if (resizeState && resizeState.el === el) {
          self.persistDraft();
        }
        resizeState = null;
      });

      rotateHandle.addEventListener("pointerdown", function (event) {
        if (isStageShapeElement(el)) return;
        event.preventDefault();
        event.stopPropagation();
        selectHotspot(el);
        const startRect = normalizeBox(self.readHotspot(el));
        rotateState = {
          el: el,
          startRect: startRect,
          startPointerAngle: getPointerAngle(el, event.clientX, event.clientY),
        };
        rotateHandle.setPointerCapture(event.pointerId);
      });

      rotateHandle.addEventListener("pointermove", function (event) {
        if (!rotateState || rotateState.el !== el || isStageShapeElement(el)) return;
        const pointerAngle = getPointerAngle(el, event.clientX, event.clientY);
        let rotate =
          rotateState.startRect.rotate +
          (pointerAngle - rotateState.startPointerAngle);
        if (event.shiftKey) {
          rotate = Math.round(rotate / 15) * 15;
        }
        applyHotspot(el, Object.assign({}, rotateState.startRect, { rotate: rotate }));
        updateOutput();
      });

      rotateHandle.addEventListener("pointerup", function () {
        if (rotateState && rotateState.el === el) {
          self.persistDraft();
        }
        rotateState = null;
      });

      el.addEventListener("pointerdown", function (event) {
        if (isEditorHandle(event.target) || isPolygonElement(el)) return;
        event.preventDefault();
        selectHotspot(el);
        if (isCircleElement(el)) {
          dragState = {
            el: el,
            mode: "circle",
            startX: event.clientX,
            startY: event.clientY,
            startCircle: normalizeCircle(self.readHotspot(el)),
          };
        } else {
          dragState = {
            el: el,
            mode: "box",
            startX: event.clientX,
            startY: event.clientY,
            startRect: normalizeBox(self.readHotspot(el)),
          };
        }
        el.setPointerCapture(event.pointerId);
      });

      el.addEventListener("pointermove", function (event) {
        if (!dragState || dragState.el !== el || isPolygonElement(el)) return;
        const bounds = self.stage.getBoundingClientRect();
        const dx = ((event.clientX - dragState.startX) / bounds.width) * 100;
        const dy = ((event.clientY - dragState.startY) / bounds.height) * 100;
        if (dragState.mode === "circle") {
          applyHotspot(el, {
            shape: "circle",
            cx: dragState.startCircle.cx + dx,
            cy: dragState.startCircle.cy + dy,
            r: dragState.startCircle.r,
          });
          updateOutput();
          return;
        }
        applyHotspot(
          el,
          clampBox({
            left: dragState.startRect.left + dx,
            top: dragState.startRect.top + dy,
            width: dragState.startRect.width,
            height: dragState.startRect.height,
            rotate: dragState.startRect.rotate,
          })
        );
        updateOutput();
      });

      el.addEventListener("pointerup", function () {
        if (dragState && dragState.el === el) {
          self.persistDraft();
        }
        dragState = null;
      });
    }

    this.getElements().forEach(bindHotspotEditor);

    this.stage.addEventListener("click", function (event) {
      if (!addPointMode || !selectedEl) return;
      if (isEditorHandle(event.target)) return;
      const current = self.readHotspot(selectedEl);
      if (!isPolygonHotspot(current)) return;
      event.preventDefault();
      event.stopPropagation();
      current.points.push(stagePointFromClient(self.stage, event.clientX, event.clientY));
      applyHotspot(selectedEl, current);
      renderPointHandles(selectedEl);
      self.persistDraft();
      updateOutput();
    });

    this.root.addEventListener("click", function (event) {
      if (event.target === self.root && !addPointMode) {
        selectHotspot(null);
      }
    });

    global.addEventListener("keydown", function (event) {
      if (!selectedEl || !isPolygonElement(selectedEl)) return;
      if (event.key !== "Delete" && event.key !== "Backspace") return;
      if (selectedPointIndex === null) return;
      const current = self.readHotspot(selectedEl);
      if (current.points.length <= 3) return;
      current.points.splice(selectedPointIndex, 1);
      selectedPointIndex = null;
      applyHotspot(selectedEl, current);
      renderPointHandles(selectedEl);
      self.persistDraft();
      updateOutput();
    });

    editor.addEventListener("click", function (event) {
      const action = event.target.closest("[data-action]");
      if (!action) return;

      if (action.dataset.action === "add-hotspot") {
        const id = global.prompt("Hotspot id (e.g. comms-btn):", "new-btn");
        if (!id || !/^[a-z][a-z0-9-]*$/i.test(id)) {
          output.textContent = "Hotspot id required (letters, numbers, hyphens).";
          return;
        }
        if (document.getElementById(id)) {
          output.textContent = "Id already exists: " + id;
          return;
        }
        const label = global.prompt("Aria label:", id.replace(/-/g, " ")) || id;
        const el = self.createHotspotElement(id, label, {
          left: 42,
          top: 42,
          width: 10,
          height: 10,
        });
        bindHotspotEditor(el);
        selectHotspot(el);
        self.persistDraft();
        output.textContent =
          "Added " +
          id +
          ". Wire click/href in page JS, then Copy JSON + Copy HTML.\n\n" +
          self.toHtmlSnippet(id) +
          "\n\n" +
          self.toJson(self.getCurrentLayout());
        return;
      }

      if (action.dataset.action === "delete-hotspot") {
        if (!selectedEl) return;
        if (!global.confirm("Delete hotspot " + selectedEl.id + "?")) return;
        const removeId = selectedEl.id;
        delete self.classMap[removeId];
        delete self.layout.hotspots[removeId];
        self.hotspotIds = self.hotspotIds.filter(function (hotspotId) {
          return hotspotId !== removeId;
        });
        selectedEl.remove();
        selectHotspot(null);
        self.persistDraft();
        updateOutput();
        return;
      }

      if (action.dataset.action === "add-point") {
        if (!selectedEl) return;
        if (!isPolygonElement(selectedEl)) {
          const current = self.readHotspot(selectedEl);
          if (isCircleHotspot(current)) {
            const circle = normalizeCircle(current);
            applyHotspot(
              selectedEl,
              clampBox({
                left: circle.cx - circle.r,
                top: circle.cy - circle.r,
                width: circle.r * 2,
                height: circle.r * 2,
                rotate: 0,
              })
            );
            applyHotspot(selectedEl, {
              points: boxToPoints(
                clampBox({
                  left: circle.cx - circle.r,
                  top: circle.cy - circle.r,
                  width: circle.r * 2,
                  height: circle.r * 2,
                  rotate: 0,
                })
              ),
            });
          } else {
            applyHotspot(selectedEl, { points: boxToPoints(current) });
          }
          renderPointHandles(selectedEl);
        }
        setAddPointMode(!addPointMode);
        return;
      }

      if (action.dataset.action === "delete-point") {
        if (!selectedEl || !isPolygonElement(selectedEl) || selectedPointIndex === null) return;
        const current = self.readHotspot(selectedEl);
        if (current.points.length <= 3) return;
        current.points.splice(selectedPointIndex, 1);
        selectedPointIndex = null;
        applyHotspot(selectedEl, current);
        renderPointHandles(selectedEl);
        self.persistDraft();
        updateOutput();
        return;
      }

      if (action.dataset.action === "to-circle") {
        if (!selectedEl) return;
        const current = self.readHotspot(selectedEl);
        if (isPolygonHotspot(current)) {
          applyHotspot(selectedEl, boxToCircle(pointsToBoundingBox(current.points)));
        } else if (isCircleHotspot(current)) {
          applyHotspot(selectedEl, current);
        } else {
          applyHotspot(selectedEl, boxToCircle(current));
        }
        renderPointHandles(null);
        self.persistDraft();
        updateOutput();
        setAddPointMode(false);
        return;
      }

      if (action.dataset.action === "to-polygon") {
        if (!selectedEl) return;
        const current = self.readHotspot(selectedEl);
        if (isCircleHotspot(current)) {
          const circle = normalizeCircle(current);
          applyHotspot(selectedEl, {
            points: boxToPoints(
              clampBox({
                left: circle.cx - circle.r,
                top: circle.cy - circle.r,
                width: circle.r * 2,
                height: circle.r * 2,
                rotate: 0,
              })
            ),
          });
        } else {
          applyHotspot(selectedEl, { points: boxToPoints(current) });
        }
        renderPointHandles(selectedEl);
        self.persistDraft();
        updateOutput();
        setAddPointMode(false);
        return;
      }

      if (action.dataset.action === "to-box") {
        if (!selectedEl) return;
        const current = self.readHotspot(selectedEl);
        if (isPolygonHotspot(current)) {
          applyHotspot(selectedEl, pointsToBoundingBox(current.points));
        } else if (isCircleHotspot(current)) {
          const circle = normalizeCircle(current);
          applyHotspot(
            selectedEl,
            clampBox({
              left: circle.cx - circle.r,
              top: circle.cy - circle.r,
              width: circle.r * 2,
              height: circle.r * 2,
              rotate: 0,
            })
          );
        }
        renderPointHandles(null);
        self.persistDraft();
        updateOutput();
        setAddPointMode(false);
        return;
      }

      if (action.dataset.action === "save-draft") {
        const layout = self.getCurrentLayout();
        self.saveDraft(layout);
        output.textContent =
          (isLocalDevHost()
            ? "Draft saved. Reload / locally to preview. Copy JSON to commit for production."
            : "Draft saved to localStorage (editor only). Copy JSON to commit.") +
          "\n\n" +
          self.toJson(layout);
        return;
      }

      if (action.dataset.action === "copy-json") {
        const json = self.toJson(self.getCurrentLayout());
        navigator.clipboard.writeText(json).then(
          function () {
            output.textContent = "JSON copied - commit to hotspot-layouts/.\n\n" + json;
          },
          function () {
            output.textContent = json;
          }
        );
        return;
      }

      if (action.dataset.action === "copy-css") {
        const css = self.toCss(self.getCurrentLayout());
        navigator.clipboard.writeText(css).then(
          function () {
            output.textContent = "CSS copied to clipboard.\n\n" + css;
          },
          function () {
            output.textContent = css;
          }
        );
        return;
      }

      if (action.dataset.action === "copy-html") {
        const snippets = self
          .getElements()
          .map(function (el) {
            return self.toHtmlSnippet(el.id);
          })
          .filter(Boolean)
          .join("\n");
        navigator.clipboard.writeText(snippets).then(
          function () {
            output.textContent = "HTML copied - paste new lines into your page shell.\n\n" + snippets;
          },
          function () {
            output.textContent = snippets;
          }
        );
        return;
      }

      if (action.dataset.action === "reset") {
        localStorage.removeItem(self.storageKey);
        self.applyLayout(mergeHotspotMaps(baked, null));
        setAddPointMode(false);
        selectHotspot(null);
        updateOutput();
        return;
      }

      if (action.dataset.action === "exit") {
        self.params.delete("edit");
        self.params.delete("debug");
        const query = self.params.toString();
        global.location.href = global.location.pathname + (query ? "?" + query : "");
      }
    });

    updateOutput();
  };

  HotspotMapper.init = function (options) {
    const mapper = new HotspotMapper(options);
    mapper.apply();
    mapper.initEditor();
    return mapper;
  };

  HotspotMapper.loadLayout = function (url) {
    const fetchUrl =
      url + (url.indexOf("?") === -1 ? "?" : "&") + "_=" + Date.now();
    return fetch(fetchUrl).then(function (response) {
      if (!response.ok) {
        throw new Error("Failed to load hotspot layout: " + url);
      }
      return response.json();
    });
  };

  global.HotspotMapper = HotspotMapper;
})(window);
