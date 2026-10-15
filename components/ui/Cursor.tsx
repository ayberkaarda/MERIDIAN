"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

const FineCursor = dynamic(() => import("@/lib/deferred/Cursor").then((module) => module.Cursor), { ssr: false });

export function Cursor() {
  const [fine, setFine] = useState(false);
  useEffect(() => {
    const query = window.matchMedia("(pointer: fine)");
    const update = () => setFine(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
  return fine ? <FineCursor /> : null;
}
