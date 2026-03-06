import React, { useState, useEffect } from "react";

interface CountdownTimerProps {
  targetDate: Date | string | number;
  onComplete?: () => void;
}

export function CountdownTimer({ targetDate, onComplete }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

  function calculateTimeLeft() {
    const difference = new Date(targetDate).getTime() - new Date().getTime();
    let timeLeft = {
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
    };

    if (difference > 0) {
      timeLeft = {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
      };
    }

    return timeLeft;
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      const newTimeLeft = calculateTimeLeft();
      setTimeLeft(newTimeLeft);

      if (
        newTimeLeft.days === 0 &&
        newTimeLeft.hours === 0 &&
        newTimeLeft.minutes === 0 &&
        newTimeLeft.seconds === 0
      ) {
        if (onComplete) {
          onComplete();
        }
      }
    }, 1000);

    return () => clearTimeout(timer);
  });

  const formatTime = (time: number) => {
    return time < 10 ? `0${time}` : time;
  };

  return (
    <div className="flex gap-3 text-center">
      <div className="flex flex-col items-center justify-center rounded-xl bg-black/20 backdrop-blur-sm p-3 min-w-[70px]">
        <span className="text-2xl font-bold leading-none">{formatTime(timeLeft.days)}</span>
        <span className="text-[10px] font-bold uppercase tracking-wider opacity-70 mt-1">Days</span>
      </div>
      <div className="flex flex-col items-center justify-center rounded-xl bg-black/20 backdrop-blur-sm p-3 min-w-[70px]">
        <span className="text-2xl font-bold leading-none">{formatTime(timeLeft.hours)}</span>
        <span className="text-[10px] font-bold uppercase tracking-wider opacity-70 mt-1">Hours</span>
      </div>
      <div className="flex flex-col items-center justify-center rounded-xl bg-black/20 backdrop-blur-sm p-3 min-w-[70px]">
        <span className="text-2xl font-bold leading-none">{formatTime(timeLeft.minutes)}</span>
        <span className="text-[10px] font-bold uppercase tracking-wider opacity-70 mt-1">Mins</span>
      </div>
      <div className="flex flex-col items-center justify-center rounded-xl bg-black/20 backdrop-blur-sm p-3 min-w-[70px]">
        <span className="text-2xl font-bold leading-none">{formatTime(timeLeft.seconds)}</span>
        <span className="text-[10px] font-bold uppercase tracking-wider opacity-70 mt-1">Secs</span>
      </div>
    </div>
  );
}
