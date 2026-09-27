import { Navigate, type RouteObject } from "react-router-dom";
import { AnalysisPage } from "@/pages/AnalysisPage/AnalysisPage";
import { MatchPage } from "@/pages/MatchPage/MatchPage";
import { PatternsPage } from "@/pages/PatternsPage/PatternsPage";

export const routes: RouteObject[] = [
  { path: "/", element: <Navigate to="/match" replace /> },
  { path: "/match", element: <MatchPage /> },
  { path: "/patterns", element: <PatternsPage /> },
  { path: "/analysis", element: <AnalysisPage /> },
  { path: "*", element: <Navigate to="/match" replace /> },
];
