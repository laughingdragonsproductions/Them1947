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
  /** Vault hub spotlight - full-width release banner on /files/ */
  featuredRelease: {
    makerWorldId: 3259272,
    pathSlug: "the-descender-them-1947-alien-greys-spaceship",
    poster:
      "/assets/catalog/classified/the-descender-them-1947-alien-greys-spaceship/featured-release.png",
    eyebrow: "New arrival",
    tagline: "THE DESCENDER has entered the vault - THEM 1947 Alien Greys spaceship.",
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
      header: "",
      footer: "",
      inContent: "",
    },
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
