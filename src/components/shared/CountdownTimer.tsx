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
    <div className="flex flex-wrap gap-1.5 sm:gap-2 justify-center sm:justify-start">
      <div className="flex flex-col items-center justify-center rounded-lg bg-white/10 backdrop-blur-md p-1.5 sm:p-2 min-w-[45px] sm:min-w-[55px] border border-white/20 shadow-sm transition-all">
        <span className="text-lg sm:text-xl font-black tracking-tighter leading-none">{formatTime(timeLeft.days)}</span>
        <span className="text-[7px] sm:text-[8px] font-bold uppercase tracking-wider opacity-70 mt-0.5">Days</span>
      </div>
      <div className="flex flex-col items-center justify-center rounded-lg bg-white/10 backdrop-blur-md p-1.5 sm:p-2 min-w-[45px] sm:min-w-[55px] border border-white/20 shadow-sm transition-all">
        <span className="text-lg sm:text-xl font-black tracking-tighter leading-none">{formatTime(timeLeft.hours)}</span>
        <span className="text-[7px] sm:text-[8px] font-bold uppercase tracking-wider opacity-70 mt-0.5">Hours</span>
      </div>
      <div className="flex flex-col items-center justify-center rounded-lg bg-white/10 backdrop-blur-md p-1.5 sm:p-2 min-w-[45px] sm:min-w-[55px] border border-white/20 shadow-sm transition-all">
        <span className="text-lg sm:text-xl font-black tracking-tighter leading-none">{formatTime(timeLeft.minutes)}</span>
        <span className="text-[7px] sm:text-[8px] font-bold uppercase tracking-wider opacity-70 mt-0.5">Mins</span>
      </div>
      <div className="flex flex-col items-center justify-center rounded-lg bg-white/10 backdrop-blur-md p-1.5 sm:p-2 min-w-[45px] sm:min-w-[55px] border border-white/20 shadow-sm transition-all">
        <span className="text-lg sm:text-xl font-black tracking-tighter leading-none">{formatTime(timeLeft.seconds)}</span>
        <span className="text-[7px] sm:text-[8px] font-bold uppercase tracking-wider opacity-70 mt-0.5">Secs</span>
      </div>
    </div>
  );
}
