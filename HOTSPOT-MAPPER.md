# Hotspot mapper

Reusable image-overlay hotspot system for aligning invisible click targets on dashboard art.

## Quick recipe

1. **HTML** - Wrap your background in a stage and add hotspot elements:

```html
<link rel="stylesheet" href="/assets/css/hotspot-mapper.css" />
<link rel="stylesheet" href="/assets/css/your-page.css" />

<div class="your-stage hotspot-stage">
  <img src="/assets/brand/your-art.png" alt="" />
  <div id="your-ui" class="your-hotspots hotspot-layer is-visible">
    <button id="foo-btn" class="hotspot your-hotspot your-hotspot--foo" type="button" aria-label="Foo"></button>
  </div>
</div>

<script src="/assets/js/hotspot-mapper.js"></script>
<script src="/assets/js/your-page.js"></script>
```

2. **Layout JSON** - Create `assets/js/hotspot-layouts/{page}.json`:

```json
{
  "id": "your-page",
  "aspectRatio": [1672, 941],
  "classMap": {
    "foo-btn": "your-hotspot--foo"
  },
  "hotspots": {
    "foo-btn": { "left": 10, "top": 20, "width": 15, "height": 8 },
    "radar-btn": { "shape": "circle", "cx": 50, "cy": 40, "r": 6 }
  }
}
```

3. **Page init** - Load JSON and call `HotspotMapper.init`:

```javascript
  HotspotMapper.loadLayout("/assets/js/hotspot-layouts/your-page.json").then(function (layout) {
  HotspotMapper.init({
    pageId: "your-page",
    stageSelector: ".your-stage",
    rootSelector: "#your-ui",
    hotspotSelector: ".your-hotspot",
    hotspotClassPrefix: "your-hotspot",
    hotspotBaseClass: "hotspot your-hotspot",
    hotspotTag: "button",
    layout: layout,
    classMap: layout.classMap,
  });
});
```

4. **Align locally** - Open `?edit=hotspots` on the page:
   - **Box mode:** drag to move; corner handle resize; top handle rotate (Shift = 15° snap).
   - **Circle mode:** click **To circle**; drag to move center; corner handle changes radius.
   - **Polygon mode:** click **To polygon**, then **Add point** and click the art to place vertices. Drag gold dots to refine. **Delete point** or Delete/Backspace removes a selected vertex (minimum 3).
   - **Overlay image** (elements with an `<img>` child, e.g. `developer-mode-banner`): select the overlay, then **drag the image** to pan, use the **cyan corner handle** or **scroll wheel** to scale, **gold corner** to resize the viewport window, **top handle** to rotate the window. Values save in JSON under `"image": { scale, x, y, rotateX, rotateY, rotateZ }`. **Reset image** restores baked image settings.
   - **Add hotspot:** creates a new button in the overlay (prompts for id + label). Wire behavior in page JS, then **Copy JSON** + **Copy HTML**.
   - **Delete:** removes the selected hotspot from the editor session.
   - **Copy JSON** → paste into your layout file and commit.
   - **Copy HTML** → paste new `<button>` lines into your page shell.
   - **Copy CSS** → optional fallback rules for page-specific modifier classes.
   - **Save draft** stores a local-only scratchpad in `localStorage` (not used in production).

5. **Debug** - `?debug=hotspots` shows outlines without the editor toolbar.

6. **Page CSS** - Mirror baked `%` coords in modifier classes as a no-JS fallback. Add hover glows and other visuals in your page stylesheet.

## Production vs editor

| Mode | Layout source |
|------|----------------|
| Normal visit | Committed JSON in `hotspot-layouts/` |
| `?edit=hotspots` | JSON + optional `localStorage` draft merge |
| `?debug=hotspots` | Committed JSON only |

## Landing reference

- Layout: `assets/js/hotspot-layouts/landing.json`
- Init: `assets/js/landing.js`
- Styles: `assets/css/hotspot-mapper.css` (shared) + `assets/css/landing.css` (page-specific)

Reach the landing editor at `/?edit=hotspots` (not linked in the public footer).

## Mobile

Hotspots use percentage positioning on an aspect-ratio stage, so they scale on all viewports. Touch targets stay small by design; no separate mobile layout is required. Ensure the hotspot layer sits above the footer (`z-index`) so center buttons remain tappable.
