export interface PoolValueProps {
  key_: string;
  value_: string | number | undefined;
}

const PoolValue: React.FC<PoolValueProps> = ({ key_, value_ }) => {
  return (
    <>
      <p className="text-lg">
        <span className="font-semibold">{key_}: </span>
        {value_}
      </p>
    </>
  );
};

export default PoolValue;
