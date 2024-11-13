import Spinner from "react-bootstrap/Spinner";

export interface SpinnerElementProps {
  sm?: boolean;
}

const SpinnerElement: React.FC<SpinnerElementProps> = ({ sm }) => {
  return (
    <Spinner animation="border" role="status" size={sm ? "sm" : undefined}>
      <span className="visually-hidden">Loading...</span>
    </Spinner>
  );
};

export default SpinnerElement;
