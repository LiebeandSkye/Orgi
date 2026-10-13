import { useEffect, useState } from "react";

function CountUp({ value, duration = 1800, decimals = 1 }) {
    const [count, setCount] = useState(0);
    useEffect(() => {
    if (value == null || !Number.isFinite(Number(value))) {
      setCount(0);
      return;
    }

    const target = Number(value);
    let startTime;
    let frameId;

    const animate = (timestamp) => {
    if (startTime === undefined){
        startTime = timestamp;
    }
    
    // Eased-out Effect
    const progress = Math.min((timestamp - startTime) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);

    setCount(target * eased);

    if (progress < 1) {
        frameId = requestAnimationFrame(animate);
      }
    };

    setCount(0);
    frameId = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(frameId);
  }, [value, duration]);

    if (value == null || !Number.isFinite(Number(value))) {
    return <>—</>;
  }

  return <>{count.toFixed(decimals)}</>;
}

export default CountUp
