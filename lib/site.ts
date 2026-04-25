export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || "https://aminuolawale.com";

export const SITE = {
  name: "Aminu Olawale",
  title: "Aminu Olawale — Software Engineer · Astrophotographer · Writer",
  description:
    "Software Engineer based in Zurich, Switzerland. Building software since 2019, capturing deep-sky objects, and writing about technology and the cosmos.",
  url: SITE_URL,
  ogImage: `${SITE_URL}/opengraph-image`,
  twitter: "@aminuolawalekan",
  github: "https://github.com/aminuolawale",
  linkedin: "https://www.linkedin.com/in/mohammed-aminu-b94468195",
};
