import { useState, useEffect } from "react";

export function useWindowSize() {
    const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });

    useEffect(() => {
        const updateWindowSize = () => {
            setWindowSize({ width: window.innerWidth, height: window.innerHeight });
        };

        updateWindowSize();
        window.addEventListener("resize", updateWindowSize);

        return () => window.removeEventListener("resize", updateWindowSize);
    }, []);

    return windowSize;
}
