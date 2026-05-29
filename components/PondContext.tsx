"use client";
import { createContext, useContext, useState } from "react";
import KoiFish from "./KoiFish";

interface PondCtx {
  on: boolean;
  toggle: () => void;
}

const Ctx = createContext<PondCtx>({ on: false, toggle: () => {} });
export const usePond = () => useContext(Ctx);

export default function PondProvider({ children }: { children: React.ReactNode }) {
  // `on` = immersive mode (extra pond detail). The koi itself is always on.
  // Always starts OFF on load/refresh — Pond mode is opt-in per visit.
  const [on, setOn] = useState(false);

  const toggle = () => setOn((prev) => !prev);

  return (
    <Ctx.Provider value={{ on, toggle }}>
      {children}
      <KoiFish immersive={on} />
    </Ctx.Provider>
  );
}
