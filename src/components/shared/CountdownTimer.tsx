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
    <div className="flex gap-4 text-center">
      <div className="flex flex-col">
        <span className="text-3xl font-bold">{formatTime(timeLeft.days)}</span>
        <span className="text-sm text-muted-foreground uppercase">Days</span>
      </div>
      <span className="text-3xl font-bold">:</span>
      <div className="flex flex-col">
        <span className="text-3xl font-bold">{formatTime(timeLeft.hours)}</span>
        <span className="text-sm text-muted-foreground uppercase">Hours</span>
      </div>
      <span className="text-3xl font-bold">:</span>
      <div className="flex flex-col">
        <span className="text-3xl font-bold">{formatTime(timeLeft.minutes)}</span>
        <span className="text-sm text-muted-foreground uppercase">Mins</span>
      </div>
      <span className="text-3xl font-bold">:</span>
      <div className="flex flex-col">
        <span className="text-3xl font-bold">{formatTime(timeLeft.seconds)}</span>
        <span className="text-sm text-muted-foreground uppercase">Secs</span>
      </div>
    </div>
  );
}
