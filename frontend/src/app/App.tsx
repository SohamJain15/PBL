import { useEffect } from "react";
import { BrowserRouter, useRoutes } from "react-router-dom";
import { TopNav } from "@/components/common/TopNav";
import { useMatches } from "@/hooks/useMatch";
import { AppStateProvider, useAppState } from "./providers/AppStateProvider";
import { PlaybackProvider } from "./providers/PlaybackProvider";
import { routes } from "./routes";

/** Selects the first match with downloaded tracking on startup. */
function DefaultMatch() {
  const { matchId, setMatch } = useAppState();
  const { data } = useMatches();
  useEffect(() => {
    if (matchId !== null || !data?.length) return;
    const first = data.find((m) => m.tracking_available) ?? data.find((m) => m.metadata_available);
    if (first) setMatch(first.id);
  }, [data, matchId, setMatch]);
  return null;
}

function Shell() {
  const element = useRoutes(routes);
  return (
    <div className="flex h-full min-w-[1200px] flex-col">
      <TopNav />
      <main className="min-h-0 flex-1">{element}</main>
    </div>
  );
}

export function App() {
  return (
    <AppStateProvider>
      <PlaybackProvider>
        <BrowserRouter>
          <DefaultMatch />
          <Shell />
        </BrowserRouter>
      </PlaybackProvider>
    </AppStateProvider>
  );
}
