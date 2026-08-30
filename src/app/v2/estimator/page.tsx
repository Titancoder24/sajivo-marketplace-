import type { Metadata } from "next";
import { EstimatorWorkspace } from "@/components/v2/projects/EstimatorWorkspace";

export const metadata: Metadata = {
  title: "Budget Estimator | Sajivo",
  description: "Build a detailed interior project estimate with Sajivo.",
};

export default function V2EstimatorPage() {
  return <EstimatorWorkspace />;
}
