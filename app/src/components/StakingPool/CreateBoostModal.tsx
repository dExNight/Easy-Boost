import React, { useState } from "react";
import { Address, Sender } from "@ton/core";
import { useJettonWallet } from "../../hooks/useStakingPool";
import { isValidAddress } from "../../utils";
import { boostStorageService } from "../../utils/boostStorage";

export interface CreatePoolProps {
  isOpen: boolean;
  setIsModalOpen: (state: boolean) => void;
  nextBoostAddress: Address;
  createBoost: (
    boostDuration: number,
    boostWalletAddress: Address,
    sender: Sender
  ) => Promise<void>;
  sender: Sender;
}

const CreateBoost: React.FC<CreatePoolProps> = ({
  isOpen,
  setIsModalOpen,
  nextBoostAddress,
  createBoost,
  sender,
}) => {
  const [jettonMinterAddress, setJettonMinterAddress] =
    useState<Address | null>(null);
  const nextBoostJettonWallet: Address | null = useJettonWallet(
    nextBoostAddress,
    jettonMinterAddress
  );

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

    if (!nextBoostJettonWallet) {
      alert("Jetton wallet is not found");
      return;
    }

    if (validateForm()) {
      try {
        await createBoost(
          Number(formData.boostDuration),
          nextBoostJettonWallet,
          sender
        );

        boostStorageService.saveBoostJettonMapping(
          nextBoostAddress.toString(),
          formData.jettonAddress
        );

        alert(`Boost created successfully`);
        setIsModalOpen(false);
      } catch (e: any) {
        alert(`Failed to create boost: ${e.message}`);
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    if (name === "jettonAddress" && isValidAddress(value)) {
      console.log("Jetton address", value);
      setJettonMinterAddress(Address.parse(value));
    }

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
      className={`fixed scrollbar-modern bg-telegram-gray-lighter bg-opacity-50 backdrop-blur-[10px] inset-0 flex items-center justify-center z-50 ${
        isOpen ? "" : "hidden"
      }`}
    >
      <div className="border border-telegram-blue bg-white max-h-[80%] overflow-auto scrollbar-modern p-6 rounded-lg shadow-md w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-center">
          Complete boost information
        </h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="block text-lg font-medium">
              Boost Duration (days)
              <input
                type="text"
                name="boostDuration"
                value={formData.boostDuration}
                onChange={handleChange}
                className="w-full mt-1 p-3 bg-telegram-gray-lighter rounded-lg border border-transparent focus:border-telegram-blue focus:ring-1 focus:ring-telegram-blue outline-none transition-colors"
                placeholder="Enter boost duration"
              />
            </label>
            {errors.boostDuration && (
              <p className="text-red-500 text-sm">{errors.boostDuration}</p>
            )}
          </div>

          <div className="space-y-2">
            <label className="block text-lg font-medium">
              Jetton Address
              <input
                type="text"
                name="jettonAddress"
                value={formData.jettonAddress}
                onChange={handleChange}
                className="w-full mt-1 p-3 bg-telegram-gray-lighter rounded-lg border border-transparent focus:border-telegram-blue focus:ring-1 focus:ring-telegram-blue outline-none transition-colors"
                placeholder="Enter jetton address"
              />
            </label>
            {errors.jettonAddress && (
              <p className="text-red-500 text-sm">{errors.jettonAddress}</p>
            )}
          </div>

          {!nextBoostJettonWallet && formData.jettonAddress && (
            <p className="text-yellow-600 text-sm">
              Searching for jetton wallet...
            </p>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-500 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`px-4 py-2 text-white rounded transition-colors ${
                !nextBoostJettonWallet
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-telegram-blue hover:bg-telegram-blue-dark"
              }`}
              disabled={!nextBoostJettonWallet}
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
