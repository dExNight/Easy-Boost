import { useEffect, useState } from "react";
import { StakingPool } from "../contracts/StakingPool";
import { useTonClient } from "./useTonClient";
import {
  Address,
  beginCell,
  Cell,
  OpenedContract,
  Sender,
  toNano,
} from "@ton/core";
import TonCenterV3, {
  JettonMaster,
  NftCollection,
  NftItemResponse,
} from "./useTonCenter";
import { JettonMaster as JettonMsaterWrapper, TonClient } from "@ton/ton";
import { JettonWallet } from "../contracts/JettonWallet";
import { buildStakeJettonsPoolPayload } from "../contracts/payload";
import { timestamp, withRetry } from "../utils";
import { Gas, Opcodes } from "../contracts/constants";
import { day } from "../constants";
import { Message, sendTransaction } from "./useTonConnectUI";
import { useTonConnectContext } from "../contexts/TonConnectContext";

export interface PoolStorage {
  init: number;
  nextItemIndex: number;
  lastUpdateTime: number;
  nftItemCode: Cell;
  collectionContent: Cell;
  boostCode: Cell;
  boostHelperCode: Cell;
  nextBoostIndex: number;
  lastTvl: bigint;
  distributedRewards: bigint;
  minLockPeriod: number;
  farmingSpeed: bigint;
  rewardsWalletAddress: Address | null;
  rewardsBalance: bigint;
  commissionFactor: number;
  premintOpen: number;
  startTime: number;
  endTime: number;
  minimumDeposit: bigint;
  lockWalletAddress: Address | null;
  adminAddress: Address;
  creatorAddress: Address;
}

export function usePoolStorage(address: string | undefined) {
  const client = useTonClient();
  const { tonConnectUI } = useTonConnectContext();
  const [poolStorage, setPoolStorage] = useState<null | PoolStorage>(null);
  const [nextBoostAddress, setNextBoostAddress] = useState<null | Address>(
    null
  );
  const [stakingPool, setStakingPool] =
    useState<null | OpenedContract<StakingPool>>(null);

  useEffect(() => {
    const fetchPoolStorage = async () => {
      if (!client || !address) return;

      const contract = StakingPool.createFromAddress(Address.parse(address));
      const pool = client.open(contract) as OpenedContract<StakingPool>;
      setStakingPool(pool);

      try {
        await withRetry(async () => {
          const data: PoolStorage = await pool.getStorageData();
          setPoolStorage(data);

          const nextBoostAddr: Address = await pool.getBoost(
            data.nextBoostIndex
          );
          setNextBoostAddress(nextBoostAddr);
        });
      } catch (error) {
        console.error("Error fetching sale data:", error);
      }
    };

    fetchPoolStorage();
  }, [address, client]);

  return {
    poolStorage,
    nextBoostAddress,
    stake: async (amount: bigint, duration: number, sender: Sender) => {
      if (!stakingPool || !poolStorage || !client || !sender.address) {
        console.error("Staking pool contract is not initialized");
        return;
      }
      try {
        const { stack } = await client.runMethod(
          poolStorage.lockWalletAddress!,
          "get_wallet_data"
        );
        stack.readBigNumber();
        stack.readAddress();
        const jetton_master_address = stack.readAddress();

        const jettonMinter = client.open(
          JettonMsaterWrapper.create(jetton_master_address)
        );

        const userJettonWalletAddress = await jettonMinter.getWalletAddress(
          sender.address
        );

        const userJettonWallet = client.open(
          JettonWallet.createFromAddress(userJettonWalletAddress)
        );

        await userJettonWallet.sendTransfer(sender, {
          toAddress: stakingPool.address,
          jettonAmount: amount,
          fwdAmount: toNano("0.25"),
          fwdPayload: buildStakeJettonsPoolPayload(duration),
          value: toNano("0.5"),
        });
      } catch (error) {
        console.error("Error sending transactions", error);
      }
    },
    createBoost: async (boostDuration: number) => {
      if (!client || !address || !nextBoostAddress) {
        console.error("Boost is not initialized");
        return;
      }
      try {
        const now = timestamp();
        const creationMsgBody = beginCell()
          .storeUint(Opcodes.add_boost, 32)
          .storeUint(0, 64)
          .storeUint(now, 32)
          .storeUint(now + boostDuration * day, 32)
          .endCell();

        const cretionMsg: Message = {
          to: address,
          amount: Gas.add_boost,
          msg_body: creationMsgBody.toBoc().toString("base64"),
        };

        return await sendTransaction(tonConnectUI, [cretionMsg]);
      } catch (error) {
        console.error("Error sending transactions", error);
      }
    },
    initializeBoost: async (
      boostAddress: Address,
      boostWalletAddress: Address
    ) => {
      if (!client || !address || !boostAddress || !boostWalletAddress) {
        console.error("Boost is not initialized");
        return;
      }
      try {
        const addBoostWalletMsgBody = beginCell()
          .storeUint(Opcodes.set_boost_wallet_address, 32)
          .storeUint(0, 64)
          .storeAddress(boostWalletAddress)
          .endCell();

        console.log("Sending with wallet:", boostWalletAddress.toString());

        const addBoostWalletMsg: Message = {
          to: boostAddress.toString(),
          amount: Gas.set_boost_wallet_address,
          msg_body: addBoostWalletMsgBody.toBoc().toString("base64"),
        };

        return await sendTransaction(tonConnectUI, [addBoostWalletMsg]);
      } catch (error) {
        console.error("Error sending transactions", error);
      }
    },
  };
}

export function usePoolJettons(
  jettonWalletAddress: Address | null | undefined
) {
  const client = useTonClient();
  const [jettonMetadata, setJettonMetadata] = useState<null | JettonMaster>(
    null
  );

  const tonclient: TonCenterV3 = new TonCenterV3();

  useEffect(() => {
    const fetchJettonMaster = async () => {
      if (!client || !jettonWalletAddress) return;

      try {
        await withRetry(async () => {
          const { stack } = await client.runMethod(
            jettonWalletAddress,
            "get_wallet_data"
          );
          stack.readBigNumber();
          stack.readAddress();
          const jetton_master_address = stack.readAddress();

          const metadata: JettonMaster | undefined =
            await tonclient.getJettonMetadata(
              jetton_master_address.toRawString()
            );
          setJettonMetadata(metadata ? metadata : null);
        });
      } catch (error) {
        console.error("Error fetching sale data:", error);
      }
    };

    fetchJettonMaster();
  }, [jettonWalletAddress, client]);

  return jettonMetadata;
}

export async function getJettonWallet(
  client: TonClient,
  minterAddress: Address,
  address: Address
): Promise<Address | null> {
  await withRetry(async () => {
    const minterContract: JettonMsaterWrapper =
      JettonMsaterWrapper.create(minterAddress);
    const jettonMinter = client.open(minterContract);
    const walletAddress = await jettonMinter.getWalletAddress(address);

    return walletAddress;
  });
  return null;
}

export function useJettonWallet(
  address: Address | string | null,
  jettonMasterAddress: Address | string | null
) {
  const client = useTonClient();
  const [jettonWalletAddress, setJettonWalletAddress] =
    useState<null | Address>(null);

  address = address
    ? typeof address === "string"
      ? Address.parse(address)
      : address
    : address;
  jettonMasterAddress = jettonMasterAddress
    ? typeof jettonMasterAddress === "string"
      ? Address.parse(jettonMasterAddress)
      : jettonMasterAddress
    : null;

  useEffect(() => {
    const fetchJettonMaster = async () => {
      if (!client || !address || !jettonMasterAddress) return;

      const minterContract: JettonMsaterWrapper = JettonMsaterWrapper.create(
        jettonMasterAddress!
      );

      try {
        await withRetry(async () => {
          const jettonMinter = client.open(minterContract);
          const walletAddress = await jettonMinter.getWalletAddress(
            address as Address
          );
          setJettonWalletAddress(walletAddress);
        });
      } catch (error) {
        console.error("Error fetching sale data:", error);
      }
    };

    fetchJettonMaster();
  }, [address, jettonWalletAddress, client]);

  return jettonWalletAddress;
}

export function usePoolMetadata(address: string | null | undefined) {
  const client = useTonClient();
  const [collection, setCollection] = useState<null | NftCollection>(null);

  const tonclient: TonCenterV3 = new TonCenterV3();

  useEffect(() => {
    const fetchCollectionMetadata = async () => {
      if (!client || !address) return;

      try {
        const metadata: NftCollection | undefined =
          await tonclient.getCollectionMetadata(address);
        setCollection(metadata ? metadata : null);
      } catch (error) {
        console.error("Error fetching sale data:", error);
      }
    };

    fetchCollectionMetadata();
  }, [address, collection, client]);

  return collection;
}

export function usePoolPositions(
  poolAddress: Address | string,
  ownerAddress: Address | string | undefined
) {
  const client = useTonClient();
  const [userPositions, setUserPositions] = useState<NftItemResponse[]>([]);
  const tonclient: TonCenterV3 = new TonCenterV3();

  poolAddress =
    poolAddress instanceof Address ? poolAddress.toRawString() : poolAddress;
  ownerAddress =
    ownerAddress instanceof Address ? ownerAddress.toRawString() : ownerAddress;

  useEffect(() => {
    const fetchUserPositions = async () => {
      if (!client || !poolAddress || !ownerAddress) return;

      try {
        const positions: NftItemResponse[] | null =
          await tonclient.getNftItemsInfo(
            {
              collection_address: poolAddress,
              owner_address: ownerAddress,
            },
            20,
            0
          );
        setUserPositions(positions ? positions : []);
      } catch (error) {
        console.error("Error fetching sale data:", error);
      }
    };

    fetchUserPositions();
  }, [poolAddress, ownerAddress, client]);

  return userPositions;
}
