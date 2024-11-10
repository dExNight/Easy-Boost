import React, { useState } from "react";
import { Address } from "@ton/core";
import { useJettonWallet } from "../../hooks/useStakingPool";
import { SendTransactionResponse } from "@tonconnect/ui-react";

export interface CreatePoolProps {
  isOpen: boolean;
  setIsModalOpen: (state: boolean) => void;
  nextBoostAddress: Address;
  createBoost: (
    boostDuration: number
  ) => Promise<SendTransactionResponse | undefined>;
  initializeBoost: (
    boostAddress: Address,
    boostWalletAddress: Address
  ) => Promise<SendTransactionResponse | undefined>;
}

const CreateBoost: React.FC<CreatePoolProps> = ({
  isOpen,
  setIsModalOpen,
  nextBoostAddress,
  createBoost,
  initializeBoost,
}) => {
  const [jettonMinterAddress, setJettonMinterAddress] =
    useState<Address | null>(null);
  const nextBoostJettonWallet: Address | null = useJettonWallet(
    nextBoostAddress,
    jettonMinterAddress
  );

  console.log(initializeBoost.name);
  console.log(nextBoostJettonWallet?.workChain);

  const [formData, setFormData] = useState({
    boostDuration: "30",
    jettonAddress: "",
  });

  const [errors, setErrors] = useState({
    boostDuration: "",
    jettonAddress: "",
  });

  const validateForm = () => {
    let isValid = true;
    const newErrors = {
      boostDuration: "",
      jettonAddress: "",
    };

    if (!formData.boostDuration) {
      newErrors.boostDuration = "Boost duration is required";
      isValid = false;
    } else if (
      isNaN(Number(formData.boostDuration)) ||
      Number(formData.boostDuration) <= 0 ||
      Number(formData.boostDuration) % 1 !== 0
    ) {
      newErrors.boostDuration = "Please enter a valid positive integer";
      isValid = false;
    }

    if (!formData.jettonAddress) {
      newErrors.jettonAddress = "Jetton address is required";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      setJettonMinterAddress(Address.parse(formData.jettonAddress));
      await createBoost(Number(formData.boostDuration));
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (errors[name as keyof typeof errors]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  return (
    <div
      className={`fixed bg-black bg-opacity-50 backdrop-blur-sm inset-0 flex items-center justify-center z-50 ${
        isOpen ? "" : "hidden"
      }`}
    >
      <div className="bg-gray-800 flex flex-col gap-4 p-6 rounded-lg shadow-md w-full max-w-lg">
        <h2 className="text-2xl font-bold text-center text-white">
          Complete boost information
        </h2>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <label className="text-white">
              Boost Duration (days)
              <input
                type="text"
                name="boostDuration"
                value={formData.boostDuration}
                onChange={handleChange}
                className="w-full mt-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:border-blue-500"
                placeholder="Enter boost duration"
              />
            </label>
            {errors.boostDuration && (
              <p className="text-red-500 text-sm">{errors.boostDuration}</p>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-white">
              Jetton Address
              <input
                type="text"
                name="jettonAddress"
                value={formData.jettonAddress}
                onChange={handleChange}
                className="w-full mt-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:border-blue-500"
                placeholder="Enter jetton address"
              />
            </label>
            {errors.jettonAddress && (
              <p className="text-red-500 text-sm">{errors.jettonAddress}</p>
            )}
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-500 focus:outline-none"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-500 focus:outline-none"
            >
              Create Boost
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateBoost;
