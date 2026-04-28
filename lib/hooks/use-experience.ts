"use client";

import { useState, useEffect } from "react";

export interface WorkExperience {
  id: string;
  company: string;
  role: string;
  startDate: string;
  endDate: string;
  location: string;
  responsibilities: string[];
}

export const DEFAULT_EXPERIENCES: WorkExperience[] = [
  {
    id: "google",
    company: "Google",
    role: "Software Engineer",
    startDate: "Jun 2022",
    endDate: "Present",
    location: "Zurich, Switzerland",
    responsibilities: [
      "Build and maintain large-scale distributed systems serving millions of users globally",
      "Collaborate with cross-functional teams across engineering, product, and design",
      "Drive technical design and code reviews within the team",
      "Contribute to infrastructure improvements that improve reliability and reduce latency",
    ],
  },
  {
    id: "kudi",
    company: "Kudi",
    role: "Data Engineer",
    startDate: "Aug 2021",
    endDate: "Mar 2022",
    location: "Lagos, Nigeria",
    responsibilities: [
      "Designed and maintained data pipelines for financial transaction processing",
      "Built and optimised ETL workflows to support analytics and business reporting",
      "Worked closely with data science and product teams to surface actionable insights",
    ],
  },
  {
    id: "centricity",
    company: "Centricity",
    role: "Software Engineer",
    startDate: "Mar 2021",
    endDate: "Jun 2021",
    location: "Lagos, Nigeria",
    responsibilities: [
      "Developed backend services and APIs for the core product",
      "Participated in agile sprints, code reviews, and technical planning sessions",
    ],
  },
  {
    id: "sendbox",
    company: "Sendbox",
    role: "Software Engineer",
    startDate: "Dec 2019",
    endDate: "Apr 2021",
    location: "Nigeria",
    responsibilities: [
      "Developed and maintained the firm's core infrastructure and services",
      "Carried out data analytics and reporting on the firm's financial performance",
      "Implemented a real-time monitoring system for the firm's logistics services",
      "Developed in-house tools to speed up product development life-cycles",
    ],
  },
];

export function useExperience(): WorkExperience[] {
  const [experiences, setExperiences] = useState<WorkExperience[]>(DEFAULT_EXPERIENCES);

  useEffect(() => {
    fetch("/api/config?key=work-experience")
      .then((r) => (r.ok ? r.json() : { value: null }))
      .then(({ value }) => {
        if (Array.isArray(value) && value.length > 0) setExperiences(value);
      })
      .catch(() => {});
  }, []);

  return experiences;
}
