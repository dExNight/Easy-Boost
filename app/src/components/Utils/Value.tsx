export interface PoolValueProps {
  key_: string;
  value_: string | number | undefined;
  keyClass?: string;
  valueClass?: string;
}

const PoolValue: React.FC<PoolValueProps> = ({
  key_,
  value_,
  keyClass,
  valueClass,
}) => {
  return (
    <p className={`text-sm md:text-lg ${valueClass ? valueClass : ""}`}>
      <span className={`font-semibold ${keyClass ? keyClass : ""}`}>
        {key_}:{" "}
      </span>
      {value_}
    </p>
  );
};

export default PoolValue;