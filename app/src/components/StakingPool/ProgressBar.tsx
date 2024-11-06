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
    <div className={`w-100 text-white ${className} mb-3`}>
      <div className="d-flex justify-content-between align-items-end mb-2">
        <div>
          <p className="text-lg mb-1">Current Farming Speed</p>
          <p className="h4 mb-0">
            {normalizeNumber(fromNano(currentSpeed))}
            <span className="small ms-1">{symbol}/day</span>
          </p>
        </div>
        <div className="text-end">
          <p className="small mb-0">{normalizeNumber(percentage)}% of total</p>
        </div>
      </div>

      <BootstrapProgressBar
        now={percentage}
        variant="primary"
        className="my-3 h-0.75 text-white"
      />

      <div className="d-flex justify-content-between small">
        <div>
          <p className="fw-medium mb-1">Total Rewards</p>
          <p className="mb-0">
            {normalizeNumber(fromNano(totalAmount))} {symbol}
          </p>
        </div>
        <div className="text-end">
          <p className="fw-medium mb-1">Estimated Time</p>
          <p className="mb-0">
            {daysRemaining.toFixed(1)} days at current speed
          </p>
        </div>
      </div>
    </div>
  );
};

export default ProgressBar;
