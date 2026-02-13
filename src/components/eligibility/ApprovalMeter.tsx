import { motion } from 'framer-motion';

interface ApprovalMeterProps {
  probability: number;
}

const ApprovalMeter = ({ probability }: ApprovalMeterProps) => {
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (probability / 100) * circumference;

  const color = probability >= 65
    ? 'hsl(var(--risk-low))'
    : probability >= 40
      ? 'hsl(var(--risk-medium))'
      : 'hsl(var(--risk-high))';

  const label = probability >= 65 ? 'Good' : probability >= 40 ? 'Moderate' : 'Low';

  return (
    <div className="flex flex-col items-center">
      <svg width="180" height="180" viewBox="0 0 180 180" className="drop-shadow-sm">
        <circle
          cx="90" cy="90" r={radius}
          fill="none"
          stroke="hsl(var(--border))"
          strokeWidth="12"
        />
        <motion.circle
          cx="90" cy="90" r={radius}
          fill="none"
          stroke={color}
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
          transform="rotate(-90 90 90)"
        />
        <text
          x="90" y="82"
          textAnchor="middle"
          className="fill-foreground text-3xl font-bold"
          style={{ fontSize: '2rem', fontFamily: 'Plus Jakarta Sans, sans-serif' }}
        >
          {probability}%
        </text>
        <text
          x="90" y="108"
          textAnchor="middle"
          className="fill-muted-foreground text-sm"
          style={{ fontSize: '0.8rem', fontFamily: 'Plus Jakarta Sans, sans-serif' }}
        >
          {label} Chance
        </text>
      </svg>
      <p className="mt-2 text-sm font-medium text-muted-foreground">Approval Probability</p>
    </div>
  );
};

export default ApprovalMeter;
