import { createFileRoute } from "@tanstack/react-router";
import { HomePage } from "@/pages/home/components/HomePage";

export const Route = createFileRoute("/_auth/")({
  component: HomePage,
});

