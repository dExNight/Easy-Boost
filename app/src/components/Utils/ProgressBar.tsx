import React from "react";
import { ProgressBar as BootstrapProgressBar } from "react-bootstrap";
import { normalizeNumber, timestamp } from "../../utils";
import { fromNano } from "@ton/core";

interface ProgressBarProps {
  currentSpeed: bigint;
  totalAmount: bigint;
  startTime: number;
  endTime: number;
  symbol?: string;
  className?: string;
}

const ProgressBar: React.FC<ProgressBarProps> = ({
  currentSpeed,
  totalAmount,
  startTime,
  endTime,
  symbol,
  className = "",
}) => {
  let now = timestamp();
  let passedTime = now - startTime;
  passedTime = now > endTime ? endTime - startTime : passedTime;
  passedTime = passedTime > 0 ? passedTime : 0;

  let passedTimeInDays = passedTime / (24 * 60 * 60);
  const percentage =
    ((Number(currentSpeed) * passedTimeInDays) / Number(totalAmount)) * 100;
  const daysRemaining =
    (Number(totalAmount) - Number(currentSpeed)) / Number(currentSpeed);

  return (
    <div className={`w-full ${className}`}>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-2 gap-2">
        <div>
          <p className="text-sm font-medium mb-1">Current Farming Speed</p>
          <p className="text-lg font-bold">
            {normalizeNumber(fromNano(currentSpeed))}
            <span className="text-xs ml-1">{symbol}/day</span>
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs">{normalizeNumber(percentage)}% of total</p>
        </div>
      </div>

      <BootstrapProgressBar
        now={percentage}
        variant="primary"
        className="h-2 my-3"
      />

      <div className="flex flex-col md:flex-row justify-between text-xs gap-2">
        <div>
          <p className="font-medium mb-1">Total Rewards</p>
          <p>
            {normalizeNumber(fromNano(totalAmount))} {symbol}
          </p>
        </div>
        <div className="text-right">
          <p className="font-medium mb-1">Estimated Time</p>
          <p>{daysRemaining.toFixed(1)} days at current speed</p>
        </div>
      </div>
    </div>
  );
};

export default ProgressBar;
