/** THEM 1947 - site config */
window.SITE_CONFIG = {
  name: "THEM 1947",
  legalName: "THEM 1947",
  tagline: "Grey-series 3D prints and digital files.",
  domain: "https://them1947.com",
  web3formsAccessKey: "",
  videos: {
    landing: "/assets/video/landing.mp4",
    brief: "/assets/video/classified-brief.mp4",
    litFlight: "/assets/video/litflight.mp4",
    litFlightRedirectBeforeEndSec: 1.5,
    poster: "/assets/brand/landing-dashboard.png",
  },
  links: {
    makerWorld: "https://makerworld.com/en/@user_935464230",
    commercialMembership:
      "https://makerworld.com/en/@user_935464230#commercial-membership-open",
    buyMeACoffee: "https://buymeacoffee.com/brewer177j",
    litPrintzSite: "https://litprintz.com",
    litPrintzCoozie:
      "https://litprintz.com/products/them-1947-alien-coozie-free-stl",
    witnessFiles: "/files/declassified/",
    intelFeed: "https://theassociatedguess.com",
    /** The Associated Guess (TAG) - unlocked via View all logs easter egg */
    tagWebsite: "https://theassociatedguess.com",
  },
  /** Vault hub spotlights on /files/ and /files/prints/ (newest first). */
  featuredReleases: [
    {
      makerWorldId: 3646125,
      pathSlug: "them-1947-alien-greys-christmas-orniement-ufo",
      poster:
        "/assets/catalog/classified/them-1947-alien-greys-christmas-orniement-ufo/gallery-01.png",
      eyebrow: "Holiday drop",
      tagline:
        "Christmas UFO ornament - Greys meet the tree with a glowing saucer for shelves, workshops, and collectors.",
      layout: "arrival",
    },
    {
      makerWorldId: 3538408,
      pathSlug: "them-1947-alien-greys-cup",
      poster: "/assets/catalog/classified/them-1947-alien-greys-cup/gallery-01.png",
      eyebrow: "New arrival",
      tagline:
        "THE ALIEN CUP - oversized Grey head mug with built-in handle for desks, kitchens, and UFO breaks.",
    },
    {
      makerWorldId: 3450569,
      pathSlug: "5-foot-the-observer-them-1947-alien-greys",
      poster:
        "/assets/catalog/classified/5-foot-the-observer-them-1947-alien-greys/featured-release.png",
      eyebrow: "5 foot series",
      tagline:
        "5 Foot THE OBSERVER - life-size Grey sentinel for displays, Halloween setups, and the THEM 1947 line.",
    },
    {
      makerWorldId: 3446108,
      pathSlug: "3-foot-roswell-them-1947-alien-greys",
      eyebrow: "3 foot series",
      tagline: "3 Foot Roswell - classic crash-site Grey scaled for the 3-foot THEM 1947 series.",
    },
    {
      makerWorldId: 3396796,
      pathSlug: "3-foot-series-the-aggressor-them-1947-alien-greys",
      poster:
        "/assets/catalog/classified/3-foot-series-the-aggressor-them-1947-alien-greys/featured-release.jpg",
      eyebrow: "3 foot series",
      tagline:
        "3 Foot Series THE AGGRESSOR - battle-worn Grey display piece, scaled for the P1S-friendly 3-foot line.",
    },
    {
      makerWorldId: 3259272,
      pathSlug: "the-descender-them-1947-alien-greys-spaceship",
      poster:
        "/assets/catalog/classified/the-descender-them-1947-alien-greys-spaceship/featured-release.png",
      eyebrow: "UFO craft",
      tagline: "THE DESCENDER flying saucer - open ramp, landing gear, Greys-scale companion.",
    },
  ],
  /** Primary spotlight (first entry in featuredReleases). */
  featuredRelease: {
    makerWorldId: 3646125,
    pathSlug: "them-1947-alien-greys-christmas-orniement-ufo",
    poster:
      "/assets/catalog/classified/them-1947-alien-greys-christmas-orniement-ufo/gallery-01.png",
    eyebrow: "Holiday drop",
    tagline:
      "Christmas UFO ornament - Greys meet the tree with a glowing saucer for shelves, workshops, and collectors.",
  },
  /** Lit Printz coozie companion - only shown on this case file. */
  litPrintzCollabRelease: {
    makerWorldId: 3200946,
    pathSlug: "one-hit-wonder-them-1947-alien-greys-3-foot-and-10",
  },
  /** Fully redacted Lit Printz coozie case file (purchase link only). */
  featuredCoozie: {
    pathSlug: "them-1947-alien-coozie",
    href: "/files/prints/them-1947-alien-coozie/",
    title: "THEM 1947 Alien Coozie",
    caseFile: "022-R",
    poster: "/assets/catalog/classified/them-1947-alien-coozie/featured-release.png",
    eyebrow: "Redacted file",
    tagline: "Lit Printz collaboration companion. Clearance withheld - purchase link only.",
    gallery: [
      "/assets/catalog/classified/them-1947-alien-coozie/gallery-01.png",
      "/assets/catalog/classified/them-1947-alien-coozie/gallery-02.png",
    ],
    purchaseUrl:
      "https://litprintz.com/products/them-1947-alien-coozie-free-stl",
  },
  adsense: {
    publisherId: "ca-pub-7048606415692002",
    slots: {
      header: "2936560577",
      footer: "4852277474",
      inContent: "7102817128",
    },
  },
  /** One-week promo logo — auto-reverts after temporaryUntil; Jarvis: scripts/revert-temporary-brand-logo.ps1 */
  brand: {
    defaultLogo: "/assets/brand/logo.png",
    temporaryLogo: "/assets/brand/logo-promo-electronic-warfare.png",
    temporaryUntil: "2026-12-03T00:03:00.000Z",
  },
  /** Owner preview gate - set enabled: true to require clearance on inner pages. */
  previewGate: {
    enabled: false,
    passwordHash: "",
    maxFails: 3,
  },
  /** Landing logs / intel feed easter egg (5 view-logs clicks unlocks TAG). */
  landingDevMode: {
    enabled: false,
    intelFeedLocked: true,
    logsClicksRequired: 5,
  },
};
