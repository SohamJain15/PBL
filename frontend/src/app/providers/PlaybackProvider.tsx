import { createContext, useContext, useMemo, useSyncExternalStore, type ReactNode } from "react";
import { PlaybackStore, type PlaybackSnapshot } from "./playbackStore";

const PlaybackContext = createContext<PlaybackStore | null>(null);

export function PlaybackProvider({ children }: { children: ReactNode }) {
  const store = useMemo(() => new PlaybackStore(), []);
  return <PlaybackContext.Provider value={store}>{children}</PlaybackContext.Provider>;
}

export function usePlaybackStore(): PlaybackStore {
  const store = useContext(PlaybackContext);
  if (!store) throw new Error("PlaybackProvider missing");
  return store;
}

/** Subscribe to a primitive slice of the playback state. */
export function usePlaybackSelector<T>(selector: (s: PlaybackSnapshot) => T): T {
  const store = usePlaybackStore();
  return useSyncExternalStore(store.subscribe, () => selector(store.get()));
}
