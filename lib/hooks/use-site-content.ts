"use client";

import { useState, useEffect } from "react";

// Default values mirror the current hardcoded text exactly, so the page
// renders the correct content on first paint and there is no visible flash
// if the API returns the same values (or hasn't been customised yet).
export const DEFAULT_CONTENT = {
  greeting:           "Hi, my name is",
  name:               "Aminu Olawale.",
  roles:              "Software Engineer · Astrophotographer · Writer.",
  bio:                "Based in Zurich, Switzerland. Building software since 2022. I also capture deep-sky objects and write.",
  sweTitle:           "Software Engineering",
  sweDescription:     "Building software since 2019 — web applications, APIs, microservices, and the tools that tie them together.",
  astroTitle:         "Capturing the Night Sky",
  astroDescription:   "Session logs from Zurich and the Swiss Alps — acquisition planning, capture notes, and post-processing walkthroughs.",
  writingTitle:       "Essays & Reflections",
  writingDescription: "On technology, the cosmos, and the occasional personal dispatch from life in Zurich.",
  miscTitle:          "Miscellaneous",
  miscDescription:    "Various documents, legal notices, and other bits and pieces.",
  aboutBio:           "Hi, I’m Aminu Olawale — a Software Engineer based in Zurich, Switzerland. I enjoy building things that live on the internet, from high-throughput APIs to polished user interfaces.",
  aboutSkills:        "Python\nJavaScript / TypeScript\nNode.js\nReact / React Native\nGo\nDocker\nPostgreSQL\nRedis\nMicroservices",
};

export type SiteContent = typeof DEFAULT_CONTENT;

export function useSiteContent(): SiteContent {
  const [content, setContent] = useState<SiteContent>(DEFAULT_CONTENT);

  useEffect(() => {
    fetch("/api/config?key=site-content")
      .then((r) => (r.ok ? r.json() : { value: null }))
      .then(({ value }) => {
        if (value && typeof value === "object") {
          setContent({ ...DEFAULT_CONTENT, ...value });
        }
      })
      .catch(() => {});
  }, []);

  return content;
}
