/** THEM 1947 — site config */
window.SITE_CONFIG = {
  name: "THEM 1947",
  legalName: "THEM 1947",
  tagline: "Grey-series 3D prints and digital files.",
  domain: "https://them1947.com",
  web3formsAccessKey: "",
  videos: {
    landing: "/assets/video/landing.mp4",
    brief: "/assets/video/classified-brief.mp4",
    poster: "/assets/video/landing-poster.jpg",
  },
  links: {
    makerWorld: "https://makerworld.com/en/@user_935464230",
  },
  adsense: {
    publisherId: "ca-pub-7048606415692002",
    slots: {
      header: "",
      footer: "",
      inContent: "",
    },
  },
  /** Set enabled: false before public launch. Store passwordHash only — see scripts/hash-preview-password.ps1 */
  previewGate: {
    enabled: true,
    passwordHash: "9e5f51e664e86a14de29e6385637fe8b2cb101b90cc93c3eaeba51a014665289",
    maxFails: 3,
  },
};
