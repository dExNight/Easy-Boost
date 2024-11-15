import { Blockchain, SandboxContract, TreasuryContract } from '@ton/sandbox';
import { Address, beginCell, Cell, fromNano, toNano } from '@ton/core';
import { offchainCollectionContentToCell, StakingPool, stakingPoolConfigToCell } from '../wrappers/StakingPool';
import '@ton/test-utils';
import { compile } from '@ton/blueprint';
import { PoolsAdmin } from '../wrappers/PoolsAdmin';
import { randomAddress } from '@ton/test-utils';
import { JettonMinter } from '../wrappers/JettonMinter';
import { JettonWallet } from '../wrappers/JettonWallet';
import {
    Gas,
    Opcodes,
    ExitCodes,
    StakingPool as PoolConstants,
    distributedRewardsFivider,
} from '../wrappers/constants';
import { SendMode } from '@ton/core';
import {
    buildAddBoostRewardsPayload,
    buildAddPoolRewardsPayload,
    buildClaimPoolRewardsPayload,
    buildDeployPoolPayload,
    buildStakeJettonsPoolPayload,
} from '../wrappers/payload';
import { Boost } from '../wrappers/Boost';
import { NftItem } from '../wrappers/NftItem';
import { BoostHelper } from '../wrappers/BoostHelper';

const REWARDS_JETTONS: bigint = toNano('2000');
const STAKED_JETTONS: bigint = toNano('2000');
const BOOST_JETTONS: bigint = toNano('1000');

const testPoolsAdmin = {
    creationFee: toNano('10'),
    changeFee: toNano('100'),
    teamCommissionFactor: 1,
    conversionAddress: randomAddress(),
    host: 'https://easy-boost.io/',
};

const testStackingPool = {
    collectionContent: offchainCollectionContentToCell({
        uri: 'https://easy-boost.io/collection.json',
        base: 'https://easy-boost.io/',
    }),
    minLockPeriod: 60 * 30, // 30 minutes
    commissionFactor: 1,
    startTime: 1750000000,
    endTime: 1800000000,
    minimumDeposit: toNano('100'),
};

const testBoost = {
    startTime: 1755000000,
    endTime: 1756000000,
    farmingSpeed: 0n,
};

function calculateAddRewardsComission(jettonsAmount: bigint) {
    return (jettonsAmount * BigInt(testStackingPool.commissionFactor)) / PoolConstants.commissionDivider;
}

describe('StakingPool', () => {
    let stakingPoolCode: Cell;
    let nftItemCode: Cell;
    let jettonMinterCode: Cell;
    let jettonWalletCode: Cell;
    let poolsAdminCode: Cell;
    let boostCode: Cell;
    let boostHelperCode: Cell;

    beforeAll(async () => {
        stakingPoolCode = await compile('StakingPool');
        nftItemCode = await compile('NftItem');
        jettonMinterCode = await compile('JettonMinter');
        jettonWalletCode = await compile('JettonWallet');
        poolsAdminCode = await compile('PoolsAdmin');
        boostCode = await compile('Boost');
        boostHelperCode = await compile('BoostHelper');
    });

    let blockchain: Blockchain;
    let deployer: SandboxContract<TreasuryContract>;

    // Contracts
    let poolsAdmin: SandboxContract<PoolsAdmin>;
    let stakingPool: SandboxContract<StakingPool>;
    let nftItem: SandboxContract<NftItem>;
    let secondUserNftItem: SandboxContract<NftItem>;
    let boost: SandboxContract<Boost>;
    let boostHelper: SandboxContract<BoostHelper>;
    let secondUserBoostHelper: SandboxContract<BoostHelper>;

    // Jettons
    let jettonMinter: SandboxContract<JettonMinter>;
    let adminJettonWallet: SandboxContract<JettonWallet>;
    let poolCreatorJettonWallet: SandboxContract<JettonWallet>;
    let userJettonWallet: SandboxContract<JettonWallet>;
    let secondUserJettonWallet: SandboxContract<JettonWallet>;
    let poolsAdminJettonWallet: SandboxContract<JettonWallet>;
    let stackingPoolRewardsWallet: SandboxContract<JettonWallet>;
    let stackingPoolLockWallet: SandboxContract<JettonWallet>;
    let boostJettonWallet: SandboxContract<JettonWallet>;

    // Wallets
    let admin: SandboxContract<TreasuryContract>;
    let user: SandboxContract<TreasuryContract>;
    let secondUser: SandboxContract<TreasuryContract>;
    let team: SandboxContract<TreasuryContract>;
    let poolCreator: SandboxContract<TreasuryContract>;

    beforeEach(async () => {
        blockchain = await Blockchain.create();

        admin = await blockchain.treasury('admin');
        user = await blockchain.treasury('user');
        secondUser = await blockchain.treasury('secondUser');
        team = await blockchain.treasury('team');
        poolCreator = await blockchain.treasury('poolCreator');
        deployer = await blockchain.treasury('deployer');

        jettonMinter = blockchain.openContract(
            JettonMinter.createFromConfig(
                {
                    admin: deployer.address,
                    content: beginCell().endCell(),
                    walletСode: jettonWalletCode,
                },
                jettonMinterCode,
            ),
        );

        poolsAdmin = blockchain.openContract(
            PoolsAdmin.createFromConfig(
                {
                    creationFee: testPoolsAdmin.creationFee,
                    changeFee: testPoolsAdmin.changeFee,
                    stakingPoolCode: stakingPoolCode,
                    nftItemCode: nftItemCode,
                    boostCode: boostCode,
                    boostHelperCode: boostHelperCode,
                    teamCommissionFactor: testPoolsAdmin.teamCommissionFactor,
                    teamAddress: team.address,
                    conversionAddress: testPoolsAdmin.conversionAddress,
                    host: testPoolsAdmin.host,
                },
                poolsAdminCode,
            ),
        );

        await jettonMinter.sendDeploy(deployer.getSender(), toNano('0.05'));

        // Mint 10000 jettons
        await jettonMinter.sendMint(deployer.getSender(), {
            to: admin.address,
            jettonAmount: toNano('10000'),
            fwdTonAmount: 1n,
            totalTonAmount: toNano('0.05'),
        });

        await jettonMinter.sendMint(deployer.getSender(), {
            to: poolCreator.address,
            jettonAmount: toNano('10000'),
            fwdTonAmount: 1n,
            totalTonAmount: toNano('0.05'),
        });

        await jettonMinter.sendMint(deployer.getSender(), {
            to: user.address,
            jettonAmount: STAKED_JETTONS,
            fwdTonAmount: 1n,
            totalTonAmount: toNano('0.05'),
        });

        await jettonMinter.sendMint(deployer.getSender(), {
            to: secondUser.address,
            jettonAmount: STAKED_JETTONS / 2n,
            fwdTonAmount: 1n,
            totalTonAmount: toNano('0.05'),
        });

        adminJettonWallet = blockchain.openContract(
            JettonWallet.createFromAddress(await jettonMinter.getWalletAddress(admin.address)),
        );

        poolCreatorJettonWallet = blockchain.openContract(
            JettonWallet.createFromAddress(await jettonMinter.getWalletAddress(poolCreator.address)),
        );

        poolsAdminJettonWallet = blockchain.openContract(
            JettonWallet.createFromAddress(await jettonMinter.getWalletAddress(poolsAdmin.address)),
        );

        userJettonWallet = blockchain.openContract(
            JettonWallet.createFromAddress(await jettonMinter.getWalletAddress(user.address)),
        );

        secondUserJettonWallet = blockchain.openContract(
            JettonWallet.createFromAddress(await jettonMinter.getWalletAddress(secondUser.address)),
        );

        expect(await adminJettonWallet.getJettonBalance()).toEqual(toNano('10000'));
        expect(await poolCreatorJettonWallet.getJettonBalance()).toEqual(toNano('10000'));
        expect(await userJettonWallet.getJettonBalance()).toEqual(STAKED_JETTONS);
        expect(await secondUserJettonWallet.getJettonBalance()).toEqual(STAKED_JETTONS / 2n);

        const deployResult = await poolsAdmin.sendDeploy(deployer.getSender(), toNano('0.05'));
        expect(deployResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: poolsAdmin.address,
            deploy: true,
            success: true,
        });

        const setJettonWalletResult = await poolsAdmin.sendSetJettonWalletAddress(
            team.getSender(),
            poolsAdminJettonWallet.address,
        );
        expect(setJettonWalletResult.transactions).toHaveTransaction({
            from: team.address,
            to: poolsAdmin.address,
            success: true,
        });

        const { poolContent } = stakingPoolConfigToCell({
            poolAdminAddress: poolsAdmin.address,
            nftItemCode: nftItemCode,
            boostCode: boostCode,
            boostHelperCode: boostHelperCode,
            collectionContent: testStackingPool.collectionContent,
            minLockPeriod: testStackingPool.minLockPeriod,
            commissionFactor: testStackingPool.commissionFactor,
            startTime: testStackingPool.startTime,
            endTime: testStackingPool.endTime,
            minimumDeposit: testStackingPool.minimumDeposit,
            creatorAddress: poolCreator.address,
        });

        const deployPoolResult = await poolCreatorJettonWallet.sendTransfer(poolCreator.getSender(), {
            toAddress: poolsAdmin.address,
            jettonAmount: toNano('1000'),
            fwdAmount: toNano('0.2'),
            fwdPayload: buildDeployPoolPayload(poolContent),
            value: toNano('0.4'),
        });

        expect(deployPoolResult.transactions).toHaveTransaction({
            from: poolCreator.address,
            to: poolCreatorJettonWallet.address,
            success: true,
            outMessagesCount: 1,
            op: Opcodes.transfer_jetton,
        });

        expect(deployPoolResult.transactions).toHaveTransaction({
            from: poolCreatorJettonWallet.address,
            to: poolsAdminJettonWallet.address,
            success: true,
            op: Opcodes.internal_transfer,
        });

        expect(deployPoolResult.transactions).toHaveTransaction({
            from: poolsAdminJettonWallet.address,
            to: poolsAdmin.address,
            success: true,
            op: Opcodes.transfer_notification,
        });

        expect(deployPoolResult.transactions).toHaveTransaction({
            from: poolsAdmin.address,
            to: poolsAdminJettonWallet.address,
            success: true,
            op: Opcodes.burn_jetton,
        });

        expect(deployPoolResult.transactions).toHaveTransaction({
            from: poolsAdmin.address,
            to: deployPoolResult.transactions[5].inMessage?.info.dest as Address,
            success: true,
            deploy: true,
        });

        stakingPool = blockchain.openContract(
            StakingPool.createFromAddress(deployPoolResult.transactions[5].inMessage?.info.dest as Address),
        );
        expect((await blockchain.getContract(stakingPool.address)).accountState?.type === 'active');
        expect((await stakingPool.getCollectionData()).collectionContent).toEqual(
            'https://easy-boost.io/collection.json',
        );

        stackingPoolRewardsWallet = blockchain.openContract(
            JettonWallet.createFromAddress(await jettonMinter.getWalletAddress(stakingPool.address)),
        );

        stackingPoolLockWallet = blockchain.openContract(
            JettonWallet.createFromAddress(await jettonMinter.getWalletAddress(stakingPool.address)),
        );

        const expectedNftItemAddress: Address = await stakingPool.getNftAddressByIndex(0);
        nftItem = blockchain.openContract(NftItem.createFromAddress(expectedNftItemAddress));
    });

    it('should deploy staking pool', async () => {
        // await blockchain.setVerbosityForAddress(poolsAdmin.address, {
        //     vmLogs: 'vm_logs_full',
        //     blockchainLogs: false,
        //     debugLogs: false,
        //     print: true
        // })
        // const setWalletsResult = await printTransactionFees(deployPoolResult.transactions);
    });

    it('should set stacking pool wallets', async () => {
        const stackingPoolDataBefore = await stakingPool.getStorageData();
        expect(stackingPoolDataBefore.farmingSpeed).toEqual(0n);

        const setWalletsResult = await stakingPool.sendSetWallets(poolCreator.getSender(), {
            lockWalletAddress: stackingPoolLockWallet.address,
            rewardsWalletAddress: stackingPoolRewardsWallet.address,
        });

        expect(setWalletsResult.transactions).toHaveTransaction({
            from: poolCreator.address,
            to: stakingPool.address,
            success: true,
        });

        const stackingPoolDataAfter = await stakingPool.getStorageData();
        expect(stackingPoolDataAfter.lockWalletAddress).toEqualAddress(stackingPoolLockWallet.address);
        expect(stackingPoolDataAfter.rewardsWalletAddress).toEqualAddress(stackingPoolRewardsWallet.address);
    });

    it('should add stacking pool rewards', async () => {
        const setWalletsResult = await stakingPool.sendSetWallets(poolCreator.getSender(), {
            lockWalletAddress: stackingPoolLockWallet.address,
            rewardsWalletAddress: stackingPoolRewardsWallet.address,
        });

        const addRewardsPoolResult = await poolCreatorJettonWallet.sendTransfer(poolCreator.getSender(), {
            toAddress: stakingPool.address,
            jettonAmount: REWARDS_JETTONS,
            fwdAmount: toNano('0.25'),
            fwdPayload: buildAddPoolRewardsPayload(),
            value: toNano('0.5'),
        });

        expect(addRewardsPoolResult.transactions).toHaveTransaction({
            from: poolCreator.address,
            to: poolCreatorJettonWallet.address,
            success: true,
            outMessagesCount: 1,
            op: Opcodes.transfer_jetton,
        });

        expect(addRewardsPoolResult.transactions).toHaveTransaction({
            from: poolCreatorJettonWallet.address,
            to: stackingPoolRewardsWallet.address,
            success: true,
            op: Opcodes.internal_transfer,
        });

        expect(addRewardsPoolResult.transactions).toHaveTransaction({
            from: stackingPoolRewardsWallet.address,
            to: stakingPool.address,
            success: true,
            op: Opcodes.transfer_notification,
        });

        expect(addRewardsPoolResult.transactions).toHaveTransaction({
            from: stakingPool.address,
            to: stackingPoolRewardsWallet.address,
            success: true,
            op: Opcodes.transfer_jetton,
        });

        expect(addRewardsPoolResult.transactions).toHaveTransaction({
            from: stackingPoolRewardsWallet.address,
            to: poolsAdminJettonWallet.address,
            success: true,
            op: Opcodes.internal_transfer,
        });

        expect(addRewardsPoolResult.transactions).toHaveTransaction({
            from: poolsAdminJettonWallet.address,
            to: poolsAdmin.address,
            success: true,
            op: Opcodes.transfer_notification,
        });

        const commission: bigint = calculateAddRewardsComission(REWARDS_JETTONS);
        const { rewardsBalance, farmingSpeed } = await stakingPool.getStorageData();
        expect(rewardsBalance).toEqual(REWARDS_JETTONS - commission);
        expect(farmingSpeed).toEqual(0n);
    });

    it('should stake jettons to stacking pool', async () => {
        const setWalletsResult = await stakingPool.sendSetWallets(poolCreator.getSender(), {
            lockWalletAddress: stackingPoolLockWallet.address,
            rewardsWalletAddress: stackingPoolRewardsWallet.address,
        });

        const addRewardsPoolResult = await poolCreatorJettonWallet.sendTransfer(poolCreator.getSender(), {
            toAddress: stakingPool.address,
            jettonAmount: REWARDS_JETTONS,
            fwdAmount: toNano('0.25'),
            fwdPayload: buildAddPoolRewardsPayload(),
            value: toNano('0.5'),
        });

        blockchain.now = testStackingPool.startTime + 60;

        const stakeJettonsPoolResult = await userJettonWallet.sendTransfer(user.getSender(), {
            toAddress: stakingPool.address,
            jettonAmount: STAKED_JETTONS,
            fwdAmount: toNano('0.25'),
            fwdPayload: buildStakeJettonsPoolPayload(testStackingPool.endTime - testStackingPool.startTime),
            value: toNano('0.5'),
        });

        expect(stakeJettonsPoolResult.transactions).toHaveTransaction({
            from: user.address,
            to: userJettonWallet.address,
            success: true,
            outMessagesCount: 1,
            op: Opcodes.transfer_jetton,
        });

        expect(stakeJettonsPoolResult.transactions).toHaveTransaction({
            from: userJettonWallet.address,
            to: stackingPoolLockWallet.address,
            success: true,
            op: Opcodes.internal_transfer,
        });

        expect(stakeJettonsPoolResult.transactions).toHaveTransaction({
            from: stackingPoolLockWallet.address,
            to: stakingPool.address,
            success: true,
            op: Opcodes.transfer_notification,
        });

        expect(stakeJettonsPoolResult.transactions).toHaveTransaction({
            from: stakingPool.address,
            to: nftItem.address,
            success: true,
            deploy: true,
        });

        const { lastTvl } = await stakingPool.getStorageData();
        expect(lastTvl).toEqual(STAKED_JETTONS);

        const { owner_address } = await nftItem.getNftData();
        expect(owner_address).toEqualAddress(user.address);
    });

    it('should successfuly claim staking rewards', async () => {
        const setWalletsResult = await stakingPool.sendSetWallets(poolCreator.getSender(), {
            lockWalletAddress: stackingPoolLockWallet.address,
            rewardsWalletAddress: stackingPoolRewardsWallet.address,
        });

        const addRewardsPoolResult = await poolCreatorJettonWallet.sendTransfer(poolCreator.getSender(), {
            toAddress: stakingPool.address,
            jettonAmount: REWARDS_JETTONS,
            fwdAmount: toNano('0.25'),
            fwdPayload: buildAddPoolRewardsPayload(),
            value: toNano('0.5'),
        });

        blockchain.now = testStackingPool.startTime + 60; // 1 minute after start

        const stakeJettonsPoolResult = await userJettonWallet.sendTransfer(user.getSender(), {
            toAddress: stakingPool.address,
            jettonAmount: STAKED_JETTONS,
            fwdAmount: toNano('0.25'),
            fwdPayload: buildStakeJettonsPoolPayload(testStackingPool.endTime - testStackingPool.startTime),
            value: toNano('0.5'),
        });

        blockchain.now = testStackingPool.endTime + 60; // 1 minute after end

        const userBalanceBefore: bigint = await userJettonWallet.getJettonBalance();

        const claimStakeRewardsResult = await user.send({
            value: Gas.claim_nft,
            to: nftItem.address,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: buildClaimPoolRewardsPayload(),
        });

        expect(claimStakeRewardsResult.transactions).toHaveTransaction({
            from: user.address,
            to: nftItem.address,
            success: true,
        });

        expect(claimStakeRewardsResult.transactions).toHaveTransaction({
            from: nftItem.address,
            to: stakingPool.address,
            success: true,
        });

        expect(claimStakeRewardsResult.transactions).toHaveTransaction({
            from: stakingPool.address,
            to: stackingPoolRewardsWallet.address,
            success: true,
            op: Opcodes.transfer_jetton,
        });

        expect(claimStakeRewardsResult.transactions).toHaveTransaction({
            from: stackingPoolRewardsWallet.address,
            to: userJettonWallet.address,
            success: true,
            op: Opcodes.internal_transfer,
        });

        expect(claimStakeRewardsResult.transactions).toHaveTransaction({
            from: stakingPool.address,
            to: nftItem.address,
            success: true,
        });

        const { claimedRewards } = await nftItem.getStorageData();

        expect(Number(claimedRewards) / 10 ** 9).toBeCloseTo(
            Number(REWARDS_JETTONS - calculateAddRewardsComission(REWARDS_JETTONS)) / 10 ** 9,
        );

        const userBalanceAfter: bigint = await userJettonWallet.getJettonBalance();

        expect(userBalanceBefore + claimedRewards).toEqual(userBalanceAfter);
    });

    it('should successfuly add boost', async () => {
        const setWalletsResult = await stakingPool.sendSetWallets(poolCreator.getSender(), {
            lockWalletAddress: stackingPoolLockWallet.address,
            rewardsWalletAddress: stackingPoolRewardsWallet.address,
        });

        const addRewardsPoolResult = await poolCreatorJettonWallet.sendTransfer(poolCreator.getSender(), {
            toAddress: stakingPool.address,
            jettonAmount: REWARDS_JETTONS,
            fwdAmount: toNano('0.25'),
            fwdPayload: buildAddPoolRewardsPayload(),
            value: toNano('0.5'),
        });

        blockchain.now = testStackingPool.startTime + 60; // 1 minute after start

        const stakeJettonsPoolResult = await userJettonWallet.sendTransfer(user.getSender(), {
            toAddress: stakingPool.address,
            jettonAmount: STAKED_JETTONS,
            fwdAmount: toNano('0.25'),
            fwdPayload: buildStakeJettonsPoolPayload(testStackingPool.endTime - testStackingPool.startTime),
            value: toNano('0.5'),
        });

        const { nextItemId } = await stakingPool.getCollectionData();
        const { lastTvl, nextBoostIndex } = await stakingPool.getStorageData();

        const boostAddress: Address = await stakingPool.getBoost(nextBoostIndex);
        boost = blockchain.openContract(Boost.createFromAddress(boostAddress));

        boostJettonWallet = blockchain.openContract(
            JettonWallet.createFromAddress(await jettonMinter.getWalletAddress(boost.address)),
        );

        const addBoostResult = await stakingPool.sendAddBoost(poolCreator.getSender(), {
            boostIndex: nextBoostIndex,
            startTime: testBoost.startTime,
            endTime: testBoost.endTime,
            boostWalletAddress: boostJettonWallet.address,
        });

        expect(addBoostResult.transactions).toHaveTransaction({
            from: poolCreator.address,
            to: stakingPool.address,
            success: true,
        });

        expect(addBoostResult.transactions).toHaveTransaction({
            from: stakingPool.address,
            to: boost.address,
            success: true,
            deploy: true,
        });

        const { boostWalletAddress, init, farmingSpeed } = await boost.getBoostData();
        expect(init).toEqual(1);
        expect(farmingSpeed).toEqual(0n);
        expect(boostWalletAddress).toEqualAddress(boostJettonWallet.address);

        const { nextBoostIndex: nextBoostIndexAfter } = await stakingPool.getStorageData();
        expect(nextBoostIndexAfter).toEqual(nextBoostIndex + 1);
    });

    it('should successfuly top up boost', async () => {
        const setWalletsResult = await stakingPool.sendSetWallets(poolCreator.getSender(), {
            lockWalletAddress: stackingPoolLockWallet.address,
            rewardsWalletAddress: stackingPoolRewardsWallet.address,
        });

        const addRewardsPoolResult = await poolCreatorJettonWallet.sendTransfer(poolCreator.getSender(), {
            toAddress: stakingPool.address,
            jettonAmount: REWARDS_JETTONS,
            fwdAmount: toNano('0.25'),
            fwdPayload: buildAddPoolRewardsPayload(),
            value: toNano('0.5'),
        });

        blockchain.now = testStackingPool.startTime + 60; // 1 minute after start

        const stakeJettonsPoolResult = await userJettonWallet.sendTransfer(user.getSender(), {
            toAddress: stakingPool.address,
            jettonAmount: STAKED_JETTONS,
            fwdAmount: toNano('0.25'),
            fwdPayload: buildStakeJettonsPoolPayload(testStackingPool.endTime - testStackingPool.startTime),
            value: toNano('0.5'),
        });

        const { nextItemId } = await stakingPool.getCollectionData();
        const { lastTvl, nextBoostIndex } = await stakingPool.getStorageData();

        const boostAddress: Address = await stakingPool.getBoost(nextBoostIndex);
        boost = blockchain.openContract(Boost.createFromAddress(boostAddress));

        boostJettonWallet = blockchain.openContract(
            JettonWallet.createFromAddress(await jettonMinter.getWalletAddress(boost.address)),
        );

        const addBoostResult = await stakingPool.sendAddBoost(poolCreator.getSender(), {
            boostIndex: nextBoostIndex,
            startTime: testBoost.startTime,
            endTime: testBoost.endTime,
            boostWalletAddress: boostJettonWallet.address,
        });

        const addBoostRewardsResult = await poolCreatorJettonWallet.sendTransfer(poolCreator.getSender(), {
            toAddress: boost.address,
            jettonAmount: BOOST_JETTONS,
            fwdAmount: toNano('0.1'),
            fwdPayload: buildAddBoostRewardsPayload(),
            value: toNano('0.2'),
        });

        expect(addBoostRewardsResult.transactions).toHaveTransaction({
            from: poolCreator.address,
            to: poolCreatorJettonWallet.address,
            success: true,
            outMessagesCount: 1,
            op: Opcodes.transfer_jetton,
        });

        expect(addBoostRewardsResult.transactions).toHaveTransaction({
            from: poolCreatorJettonWallet.address,
            to: boostJettonWallet.address,
            success: true,
            op: Opcodes.internal_transfer,
        });

        expect(addBoostRewardsResult.transactions).toHaveTransaction({
            from: boostJettonWallet.address,
            to: boost.address,
            success: true,
            op: Opcodes.transfer_notification,
        });

        const { snapshotItemIndex, snapshotTvl, totalRewards, farmingSpeed } = await boost.getBoostData();

        expect(snapshotItemIndex).toEqual(nextItemId);
        expect(snapshotTvl).toEqual(lastTvl);
        expect(totalRewards).toEqual(BOOST_JETTONS);
        expect(farmingSpeed).toBeGreaterThan(0n);
    });

    it('should successfuly claim boost rewards', async () => {
        const setWalletsResult = await stakingPool.sendSetWallets(poolCreator.getSender(), {
            lockWalletAddress: stackingPoolLockWallet.address,
            rewardsWalletAddress: stackingPoolRewardsWallet.address,
        });

        const addRewardsPoolResult = await poolCreatorJettonWallet.sendTransfer(poolCreator.getSender(), {
            toAddress: stakingPool.address,
            jettonAmount: REWARDS_JETTONS,
            fwdAmount: toNano('0.25'),
            fwdPayload: buildAddPoolRewardsPayload(),
            value: toNano('0.5'),
        });

        blockchain.now = testStackingPool.startTime + 60; // 1 minute after start

        const stakeJettonsPoolResult = await userJettonWallet.sendTransfer(user.getSender(), {
            toAddress: stakingPool.address,
            jettonAmount: STAKED_JETTONS,
            fwdAmount: toNano('0.25'),
            fwdPayload: buildStakeJettonsPoolPayload(testStackingPool.endTime - testStackingPool.startTime),
            value: toNano('0.5'),
        });

        const { nextItemId } = await stakingPool.getCollectionData();
        const { lastTvl, nextBoostIndex } = await stakingPool.getStorageData();

        const boostAddress: Address = await stakingPool.getBoost(nextBoostIndex);
        boost = blockchain.openContract(Boost.createFromAddress(boostAddress));

        boostJettonWallet = blockchain.openContract(
            JettonWallet.createFromAddress(await jettonMinter.getWalletAddress(boost.address)),
        );

        const addBoostResult = await stakingPool.sendAddBoost(poolCreator.getSender(), {
            boostIndex: nextBoostIndex,
            startTime: testBoost.startTime,
            endTime: testBoost.endTime,
            boostWalletAddress: boostJettonWallet.address,
        });

        const addBoostRewardsResult = await poolCreatorJettonWallet.sendTransfer(poolCreator.getSender(), {
            toAddress: boost.address,
            jettonAmount: BOOST_JETTONS,
            fwdAmount: toNano('0.1'),
            fwdPayload: buildAddBoostRewardsPayload(),
            value: toNano('0.2'),
        });

        blockchain.now = testBoost.endTime + 60; // 1 minute after end

        boostHelper = blockchain.openContract(
            BoostHelper.createFromAddress(await boost.getBoostHelperAddress(nftItem.address)),
        );
        const userBalanceBefore: bigint = await userJettonWallet.getJettonBalance();

        const claimBoostRewardsResult = await nftItem.sendClaimBoostRewards(user.getSender(), boost.address);

        expect(claimBoostRewardsResult.transactions).toHaveTransaction({
            from: user.address,
            to: nftItem.address,
            success: true,
        });

        expect(claimBoostRewardsResult.transactions).toHaveTransaction({
            from: nftItem.address,
            to: boost.address,
            success: true,
        });

        expect(claimBoostRewardsResult.transactions).toHaveTransaction({
            from: boost.address,
            to: boostHelper.address,
            success: true,
            deploy: true,
        });

        expect(claimBoostRewardsResult.transactions).toHaveTransaction({
            from: boostHelper.address,
            to: boost.address,
            success: true,
        });

        expect(claimBoostRewardsResult.transactions).toHaveTransaction({
            from: boost.address,
            to: boostJettonWallet.address,
            success: true,
            op: Opcodes.transfer_jetton,
        });

        expect(claimBoostRewardsResult.transactions).toHaveTransaction({
            from: boostJettonWallet.address,
            to: userJettonWallet.address,
            success: true,
            op: Opcodes.internal_transfer,
        });

        const userBalanceAfter: bigint = await userJettonWallet.getJettonBalance();
        expect(userBalanceBefore + BOOST_JETTONS).toEqual(userBalanceAfter);

        const { claimed, userDistributedRewards } = await boostHelper.getHelperData();
        expect(claimed).toEqual(1);

        const { totalRewards } = await boost.getBoostData();
        expect(totalRewards).toBeGreaterThan(0n);

        const userRewards: bigint = userDistributedRewards / distributedRewardsFivider;
        expect(userRewards).toEqual(totalRewards);
    });

    it('should not claim boost rewards by not eligible staker', async () => {
        const setWalletsResult = await stakingPool.sendSetWallets(poolCreator.getSender(), {
            lockWalletAddress: stackingPoolLockWallet.address,
            rewardsWalletAddress: stackingPoolRewardsWallet.address,
        });

        const addRewardsPoolResult = await poolCreatorJettonWallet.sendTransfer(poolCreator.getSender(), {
            toAddress: stakingPool.address,
            jettonAmount: REWARDS_JETTONS,
            fwdAmount: toNano('0.25'),
            fwdPayload: buildAddPoolRewardsPayload(),
            value: toNano('0.5'),
        });

        blockchain.now = testStackingPool.startTime + 60; // 1 minute after start

        const stakeJettonsPoolResult = await userJettonWallet.sendTransfer(user.getSender(), {
            toAddress: stakingPool.address,
            jettonAmount: STAKED_JETTONS,
            fwdAmount: toNano('0.25'),
            fwdPayload: buildStakeJettonsPoolPayload(testStackingPool.endTime - testStackingPool.startTime),
            value: toNano('0.5'),
        });

        const { nextItemId } = await stakingPool.getCollectionData();
        const { lastTvl, nextBoostIndex } = await stakingPool.getStorageData();

        const boostAddress: Address = await stakingPool.getBoost(nextBoostIndex);
        boost = blockchain.openContract(Boost.createFromAddress(boostAddress));

        boostJettonWallet = blockchain.openContract(
            JettonWallet.createFromAddress(await jettonMinter.getWalletAddress(boost.address)),
        );

        const addBoostResult = await stakingPool.sendAddBoost(poolCreator.getSender(), {
            boostIndex: nextBoostIndex,
            startTime: testBoost.startTime,
            endTime: testBoost.endTime,
            boostWalletAddress: boostJettonWallet.address,
        });

        const addBoostRewardsResult = await poolCreatorJettonWallet.sendTransfer(poolCreator.getSender(), {
            toAddress: boost.address,
            jettonAmount: BOOST_JETTONS,
            fwdAmount: toNano('0.1'),
            fwdPayload: buildAddBoostRewardsPayload(),
            value: toNano('0.2'),
        });

        blockchain.now = blockchain.now + 60;

        secondUserNftItem = blockchain.openContract(
            NftItem.createFromAddress(await stakingPool.getNftAddressByIndex(1)),
        );

        const stakeJettonsPoolResult2 = await secondUserJettonWallet.sendTransfer(secondUser.getSender(), {
            toAddress: stakingPool.address,
            jettonAmount: STAKED_JETTONS / 2n,
            fwdAmount: toNano('0.25'),
            fwdPayload: buildStakeJettonsPoolPayload(testStackingPool.endTime - testStackingPool.startTime),
            value: toNano('0.5'),
        });

        expect(stakeJettonsPoolResult2.transactions).toHaveTransaction({
            from: secondUser.address,
            to: secondUserJettonWallet.address,
            success: true,
            outMessagesCount: 1,
            op: Opcodes.transfer_jetton,
        });

        expect(stakeJettonsPoolResult2.transactions).toHaveTransaction({
            from: secondUserJettonWallet.address,
            to: stackingPoolLockWallet.address,
            success: true,
            op: Opcodes.internal_transfer,
        });

        expect(stakeJettonsPoolResult2.transactions).toHaveTransaction({
            from: stackingPoolLockWallet.address,
            to: stakingPool.address,
            success: true,
            op: Opcodes.transfer_notification,
        });

        expect(stakeJettonsPoolResult2.transactions).toHaveTransaction({
            from: stakingPool.address,
            to: secondUserNftItem.address,
            success: true,
            deploy: true,
        });

        const { owner_address } = await secondUserNftItem.getNftData();
        expect(owner_address).toEqualAddress(secondUser.address);

        blockchain.now = testBoost.endTime + 60; // 1 minute after end

        secondUserBoostHelper = blockchain.openContract(
            BoostHelper.createFromAddress(await boost.getBoostHelperAddress(secondUserNftItem.address)),
        );

        const claimBoostRewardsResult = await secondUserNftItem.sendClaimBoostRewards(
            secondUser.getSender(),
            boost.address,
        );

        expect(claimBoostRewardsResult.transactions).toHaveTransaction({
            from: secondUser.address,
            to: secondUserNftItem.address,
            success: true,
        });

        expect(claimBoostRewardsResult.transactions).toHaveTransaction({
            from: secondUserNftItem.address,
            to: boost.address,
            success: false,
            exitCode: ExitCodes.not_eligible,
        });
    });

    it('should restrict claim after fully claimed for boost rewards', async () => {
        const setWalletsResult = await stakingPool.sendSetWallets(poolCreator.getSender(), {
            lockWalletAddress: stackingPoolLockWallet.address,
            rewardsWalletAddress: stackingPoolRewardsWallet.address,
        });

        const addRewardsPoolResult = await poolCreatorJettonWallet.sendTransfer(poolCreator.getSender(), {
            toAddress: stakingPool.address,
            jettonAmount: REWARDS_JETTONS,
            fwdAmount: toNano('0.25'),
            fwdPayload: buildAddPoolRewardsPayload(),
            value: toNano('0.5'),
        });

        blockchain.now = testStackingPool.startTime + 60; // 1 minute after start

        const stakeJettonsPoolResult = await userJettonWallet.sendTransfer(user.getSender(), {
            toAddress: stakingPool.address,
            jettonAmount: STAKED_JETTONS,
            fwdAmount: toNano('0.25'),
            fwdPayload: buildStakeJettonsPoolPayload(testStackingPool.endTime - testStackingPool.startTime),
            value: toNano('0.5'),
        });

        blockchain.now = blockchain.now + 60;

        const stakeJettonsPoolResult2 = await secondUserJettonWallet.sendTransfer(secondUser.getSender(), {
            toAddress: stakingPool.address,
            jettonAmount: STAKED_JETTONS / 2n,
            fwdAmount: toNano('0.25'),
            fwdPayload: buildStakeJettonsPoolPayload(testStackingPool.endTime - testStackingPool.startTime),
            value: toNano('0.5'),
        });

        expect(stakeJettonsPoolResult2.transactions).toHaveTransaction({
            from: secondUser.address,
            to: secondUserJettonWallet.address,
            success: true,
            outMessagesCount: 1,
            op: Opcodes.transfer_jetton,
        });

        expect(stakeJettonsPoolResult2.transactions).toHaveTransaction({
            from: secondUserJettonWallet.address,
            to: stackingPoolLockWallet.address,
            success: true,
            op: Opcodes.internal_transfer,
        });

        expect(stakeJettonsPoolResult2.transactions).toHaveTransaction({
            from: stackingPoolLockWallet.address,
            to: stakingPool.address,
            success: true,
            op: Opcodes.transfer_notification,
        });

        expect(stakeJettonsPoolResult2.transactions).toHaveTransaction({
            from: stakingPool.address,
            to: secondUserNftItem.address,
            success: true,
            deploy: true,
        });

        const { nextItemId } = await stakingPool.getCollectionData();

        const { lastTvl, nextBoostIndex } = await stakingPool.getStorageData();
        expect(lastTvl).toEqual(STAKED_JETTONS + STAKED_JETTONS / 2n);

        const boostAddress: Address = await stakingPool.getBoost(nextBoostIndex);
        boost = blockchain.openContract(Boost.createFromAddress(boostAddress));

        boostJettonWallet = blockchain.openContract(
            JettonWallet.createFromAddress(await jettonMinter.getWalletAddress(boost.address)),
        );

        const addBoostResult = await stakingPool.sendAddBoost(poolCreator.getSender(), {
            boostIndex: nextBoostIndex,
            startTime: testBoost.startTime,
            endTime: testBoost.endTime,
            boostWalletAddress: boostJettonWallet.address,
        });

        const addBoostRewardsResult = await poolCreatorJettonWallet.sendTransfer(poolCreator.getSender(), {
            toAddress: boost.address,
            jettonAmount: BOOST_JETTONS,
            fwdAmount: toNano('0.1'),
            fwdPayload: buildAddBoostRewardsPayload(),
            value: toNano('0.2'),
        });

        blockchain.now = testBoost.endTime + 60; // 1 minute after end

        boostHelper = blockchain.openContract(
            BoostHelper.createFromAddress(await boost.getBoostHelperAddress(nftItem.address)),
        );
        const userBalanceBefore: bigint = await userJettonWallet.getJettonBalance();

        const claimBoostRewardsResult = await nftItem.sendClaimBoostRewards(user.getSender(), boost.address);

        expect(claimBoostRewardsResult.transactions).toHaveTransaction({
            from: user.address,
            to: nftItem.address,
            success: true,
        });

        expect(claimBoostRewardsResult.transactions).toHaveTransaction({
            from: nftItem.address,
            to: boost.address,
            success: true,
        });

        expect(claimBoostRewardsResult.transactions).toHaveTransaction({
            from: boost.address,
            to: boostHelper.address,
            success: true,
            deploy: true,
        });

        expect(claimBoostRewardsResult.transactions).toHaveTransaction({
            from: boostHelper.address,
            to: boost.address,
            success: true,
        });

        expect(claimBoostRewardsResult.transactions).toHaveTransaction({
            from: boost.address,
            to: boostJettonWallet.address,
            success: true,
            op: Opcodes.transfer_jetton,
        });

        expect(claimBoostRewardsResult.transactions).toHaveTransaction({
            from: boostJettonWallet.address,
            to: userJettonWallet.address,
            success: true,
            op: Opcodes.internal_transfer,
        });

        const userBalanceAfter: bigint = await userJettonWallet.getJettonBalance();
        const userRewardFraction =
            Number(fromNano(STAKED_JETTONS)) /
            (Number(fromNano(STAKED_JETTONS)) + Number(fromNano(STAKED_JETTONS)) / 2);
        const expectedUserReward: bigint = toNano(Number(fromNano(BOOST_JETTONS)) * userRewardFraction);
        expect(Number(fromNano(userBalanceBefore + expectedUserReward))).toBeCloseTo(
            Number(fromNano(userBalanceAfter)),
        );

        const { claimed } = await boostHelper.getHelperData();
        expect(claimed).toEqual(1);

        const secondClaimBoostRewardsResult = await nftItem.sendClaimBoostRewards(user.getSender(), boost.address);

        expect(secondClaimBoostRewardsResult.transactions).toHaveTransaction({
            from: user.address,
            to: nftItem.address,
            success: true,
        });

        expect(secondClaimBoostRewardsResult.transactions).toHaveTransaction({
            from: nftItem.address,
            to: boost.address,
            success: true,
        });

        expect(secondClaimBoostRewardsResult.transactions).toHaveTransaction({
            from: boost.address,
            to: boostHelper.address,
            success: false,
            exitCode: ExitCodes.already_claimed,
        });

        const { claimed: claimedAfter, userDistributedRewards } = await boostHelper.getHelperData();
        expect(claimedAfter).toEqual(1);

        const userRewards: number =
            Number(fromNano(userDistributedRewards / distributedRewardsFivider)) * userRewardFraction;
        expect(userRewards).toBeCloseTo(Number(fromNano(expectedUserReward)));
    });

    it('should correctly perform partial claim', async () => {
        const setWalletsResult = await stakingPool.sendSetWallets(poolCreator.getSender(), {
            lockWalletAddress: stackingPoolLockWallet.address,
            rewardsWalletAddress: stackingPoolRewardsWallet.address,
        });

        const addRewardsPoolResult = await poolCreatorJettonWallet.sendTransfer(poolCreator.getSender(), {
            toAddress: stakingPool.address,
            jettonAmount: REWARDS_JETTONS,
            fwdAmount: toNano('0.25'),
            fwdPayload: buildAddPoolRewardsPayload(),
            value: toNano('0.5'),
        });

        blockchain.now = testStackingPool.startTime + 60; // 1 minute after start

        const stakeJettonsPoolResult = await userJettonWallet.sendTransfer(user.getSender(), {
            toAddress: stakingPool.address,
            jettonAmount: STAKED_JETTONS,
            fwdAmount: toNano('0.25'),
            fwdPayload: buildStakeJettonsPoolPayload(testStackingPool.endTime - testStackingPool.startTime),
            value: toNano('0.5'),
        });

        blockchain.now = blockchain.now + 60;

        const stakeJettonsPoolResult2 = await secondUserJettonWallet.sendTransfer(secondUser.getSender(), {
            toAddress: stakingPool.address,
            jettonAmount: STAKED_JETTONS / 2n,
            fwdAmount: toNano('0.25'),
            fwdPayload: buildStakeJettonsPoolPayload(testStackingPool.endTime - testStackingPool.startTime),
            value: toNano('0.5'),
        });

        secondUserNftItem = blockchain.openContract(
            NftItem.createFromAddress(await stakingPool.getNftAddressByIndex(1)),
        );

        const { lastTvl, nextBoostIndex } = await stakingPool.getStorageData();
        expect(lastTvl).toEqual(STAKED_JETTONS + STAKED_JETTONS / 2n);

        const boostAddress: Address = await stakingPool.getBoost(nextBoostIndex);
        boost = blockchain.openContract(Boost.createFromAddress(boostAddress));

        boostJettonWallet = blockchain.openContract(
            JettonWallet.createFromAddress(await jettonMinter.getWalletAddress(boost.address)),
        );

        const addBoostResult = await stakingPool.sendAddBoost(poolCreator.getSender(), {
            boostIndex: nextBoostIndex,
            startTime: testBoost.startTime,
            endTime: testBoost.endTime,
            boostWalletAddress: boostJettonWallet.address,
        });

        const addBoostRewardsResult = await poolCreatorJettonWallet.sendTransfer(poolCreator.getSender(), {
            toAddress: boost.address,
            jettonAmount: BOOST_JETTONS,
            fwdAmount: toNano('0.1'),
            fwdPayload: buildAddBoostRewardsPayload(),
            value: toNano('0.2'),
        });

        blockchain.now = testBoost.startTime + (testBoost.endTime - testBoost.startTime) / 2; // middle of boost

        boostHelper = blockchain.openContract(
            BoostHelper.createFromAddress(await boost.getBoostHelperAddress(nftItem.address)),
        );

        secondUserBoostHelper = blockchain.openContract(
            BoostHelper.createFromAddress(await boost.getBoostHelperAddress(secondUserNftItem.address)),
        );

        const userBalanceBefore: bigint = await userJettonWallet.getJettonBalance();

        const claimBoostRewardsResult = await nftItem.sendClaimBoostRewards(user.getSender(), boost.address);

        expect(claimBoostRewardsResult.transactions).toHaveTransaction({
            from: user.address,
            to: nftItem.address,
            success: true,
        });

        expect(claimBoostRewardsResult.transactions).toHaveTransaction({
            from: nftItem.address,
            to: boost.address,
            success: true,
        });

        expect(claimBoostRewardsResult.transactions).toHaveTransaction({
            from: boost.address,
            to: boostHelper.address,
            success: true,
            deploy: true,
        });

        expect(claimBoostRewardsResult.transactions).toHaveTransaction({
            from: boostHelper.address,
            to: boost.address,
            success: true,
        });

        expect(claimBoostRewardsResult.transactions).toHaveTransaction({
            from: boost.address,
            to: boostJettonWallet.address,
            success: true,
            op: Opcodes.transfer_jetton,
        });

        expect(claimBoostRewardsResult.transactions).toHaveTransaction({
            from: boostJettonWallet.address,
            to: userJettonWallet.address,
            success: true,
            op: Opcodes.internal_transfer,
        });

        const userRewardFraction =
            Number(fromNano(STAKED_JETTONS)) /
            (Number(fromNano(STAKED_JETTONS)) + Number(fromNano(STAKED_JETTONS)) / 2);

        const userBalanceAfter: bigint = await userJettonWallet.getJettonBalance();
        const userReward: bigint = userBalanceAfter - userBalanceBefore;

        const { userDistributedRewards, claimed } = await boostHelper.getHelperData();
        expect(claimed).toBeFalsy();

        const expectedUserReward: number =
            Number(fromNano(userDistributedRewards / distributedRewardsFivider)) * userRewardFraction;
        expect(Number(fromNano(userReward))).toBeCloseTo(expectedUserReward);

        blockchain.now = testBoost.endTime + 60; // 1 minute after end

        const userBalanceBefore2: bigint = await userJettonWallet.getJettonBalance();
        const secondUserBalanceBefore: bigint = await secondUserJettonWallet.getJettonBalance();

        const finalUserClaimResult = await nftItem.sendClaimBoostRewards(user.getSender(), boost.address);

        expect(finalUserClaimResult.transactions).toHaveTransaction({
            from: user.address,
            to: nftItem.address,
            success: true,
        });

        expect(finalUserClaimResult.transactions).toHaveTransaction({
            from: nftItem.address,
            to: boost.address,
            success: true,
        });

        expect(finalUserClaimResult.transactions).toHaveTransaction({
            from: boost.address,
            to: boostHelper.address,
            success: true,
        });

        expect(finalUserClaimResult.transactions).toHaveTransaction({
            from: boostHelper.address,
            to: boost.address,
            success: true,
        });

        expect(finalUserClaimResult.transactions).toHaveTransaction({
            from: boost.address,
            to: boostJettonWallet.address,
            success: true,
        });

        expect(finalUserClaimResult.transactions).toHaveTransaction({
            from: boostJettonWallet.address,
            to: userJettonWallet.address,
            success: true,
        });

        const { claimed: claimedAfter } = await boostHelper.getHelperData();
        expect(claimedAfter).toBeTruthy();

        const userBalanceAfter2: bigint = await userJettonWallet.getJettonBalance();
        const userReward2: bigint = userBalanceAfter2 - userBalanceBefore2;
        expect(Number(fromNano(userReward2 + userReward))).toBeCloseTo(
            Number(fromNano(BOOST_JETTONS)) * userRewardFraction,
        );

        const finalSecondUserClaimResult = await secondUserNftItem.sendClaimBoostRewards(
            secondUser.getSender(),
            boost.address,
        );

        expect(finalSecondUserClaimResult.transactions).toHaveTransaction({
            from: secondUser.address,
            to: secondUserNftItem.address,
            success: true,
        });

        expect(finalSecondUserClaimResult.transactions).toHaveTransaction({
            from: secondUserNftItem.address,
            to: boost.address,
            success: true,
        });

        expect(finalSecondUserClaimResult.transactions).toHaveTransaction({
            from: boost.address,
            to: secondUserBoostHelper.address,
            success: true,
        });

        expect(finalSecondUserClaimResult.transactions).toHaveTransaction({
            from: secondUserBoostHelper.address,
            to: boost.address,
            success: true,
        });

        expect(finalSecondUserClaimResult.transactions).toHaveTransaction({
            from: boost.address,
            to: boostJettonWallet.address,
            success: true,
        });

        expect(finalSecondUserClaimResult.transactions).toHaveTransaction({
            from: boostJettonWallet.address,
            to: secondUserJettonWallet.address,
            success: true,
        });

        const secondUserBalanceAfter: bigint = await secondUserJettonWallet.getJettonBalance();
        const secondUserReward: bigint = secondUserBalanceAfter - secondUserBalanceBefore;

        const { claimed: claimedSecondUser } = await secondUserBoostHelper.getHelperData();
        expect(claimedSecondUser).toBeTruthy();

        const secondUserRewardFraction: number =
            Number(fromNano(STAKED_JETTONS / 2n)) /
            (Number(fromNano(STAKED_JETTONS)) + Number(fromNano(STAKED_JETTONS)) / 2);

        expect(Number(fromNano(secondUserReward))).toBeCloseTo(
            Number(fromNano(BOOST_JETTONS)) * secondUserRewardFraction,
        );
    });

    it('should correctly perform partial claim (including additional top-ups)', async () => {
        const setWalletsResult = await stakingPool.sendSetWallets(poolCreator.getSender(), {
            lockWalletAddress: stackingPoolLockWallet.address,
            rewardsWalletAddress: stackingPoolRewardsWallet.address,
        });

        const addRewardsPoolResult = await poolCreatorJettonWallet.sendTransfer(poolCreator.getSender(), {
            toAddress: stakingPool.address,
            jettonAmount: REWARDS_JETTONS,
            fwdAmount: toNano('0.25'),
            fwdPayload: buildAddPoolRewardsPayload(),
            value: toNano('0.5'),
        });

        blockchain.now = testStackingPool.startTime + 60; // 1 minute after start

        const stakeJettonsPoolResult = await userJettonWallet.sendTransfer(user.getSender(), {
            toAddress: stakingPool.address,
            jettonAmount: STAKED_JETTONS,
            fwdAmount: toNano('0.25'),
            fwdPayload: buildStakeJettonsPoolPayload(testStackingPool.endTime - testStackingPool.startTime),
            value: toNano('0.5'),
        });

        blockchain.now = blockchain.now + 60;

        const stakeJettonsPoolResult2 = await secondUserJettonWallet.sendTransfer(secondUser.getSender(), {
            toAddress: stakingPool.address,
            jettonAmount: STAKED_JETTONS / 2n,
            fwdAmount: toNano('0.25'),
            fwdPayload: buildStakeJettonsPoolPayload(testStackingPool.endTime - testStackingPool.startTime),
            value: toNano('0.5'),
        });

        secondUserNftItem = blockchain.openContract(
            NftItem.createFromAddress(await stakingPool.getNftAddressByIndex(1)),
        );

        const { lastTvl, nextBoostIndex } = await stakingPool.getStorageData();
        expect(lastTvl).toEqual(STAKED_JETTONS + STAKED_JETTONS / 2n);

        const boostAddress: Address = await stakingPool.getBoost(nextBoostIndex);
        boost = blockchain.openContract(Boost.createFromAddress(boostAddress));

        boostJettonWallet = blockchain.openContract(
            JettonWallet.createFromAddress(await jettonMinter.getWalletAddress(boost.address)),
        );

        const addBoostResult = await stakingPool.sendAddBoost(poolCreator.getSender(), {
            boostIndex: nextBoostIndex,
            startTime: testBoost.startTime,
            endTime: testBoost.endTime,
            boostWalletAddress: boostJettonWallet.address,
        });

        const addBoostRewardsResult = await poolCreatorJettonWallet.sendTransfer(poolCreator.getSender(), {
            toAddress: boost.address,
            jettonAmount: BOOST_JETTONS,
            fwdAmount: toNano('0.1'),
            fwdPayload: buildAddBoostRewardsPayload(),
            value: toNano('0.2'),
        });

        blockchain.now = testBoost.startTime + (testBoost.endTime - testBoost.startTime) / 2; // middle of boost

        boostHelper = blockchain.openContract(
            BoostHelper.createFromAddress(await boost.getBoostHelperAddress(nftItem.address)),
        );

        secondUserBoostHelper = blockchain.openContract(
            BoostHelper.createFromAddress(await boost.getBoostHelperAddress(secondUserNftItem.address)),
        );

        const userBalanceBefore: bigint = await userJettonWallet.getJettonBalance();

        const claimBoostRewardsResult = await nftItem.sendClaimBoostRewards(user.getSender(), boost.address);

        const userRewardFraction =
            Number(fromNano(STAKED_JETTONS)) /
            (Number(fromNano(STAKED_JETTONS)) + Number(fromNano(STAKED_JETTONS)) / 2);

        const userReward: bigint = (await userJettonWallet.getJettonBalance()) - userBalanceBefore;

        const addBoostRewardsResult2 = await poolCreatorJettonWallet.sendTransfer(poolCreator.getSender(), {
            toAddress: boost.address,
            jettonAmount: BOOST_JETTONS * 2n,
            fwdAmount: toNano('0.1'),
            fwdPayload: buildAddBoostRewardsPayload(),
            value: toNano('0.2'),
        });

        expect(addBoostRewardsResult2.transactions).toHaveTransaction({
            from: poolCreator.address,
            to: poolCreatorJettonWallet.address,
            success: true,
            outMessagesCount: 1,
            op: Opcodes.transfer_jetton,
        });

        expect(addBoostRewardsResult2.transactions).toHaveTransaction({
            from: poolCreatorJettonWallet.address,
            to: boostJettonWallet.address,
            success: true,
            op: Opcodes.internal_transfer,
        });

        expect(addBoostRewardsResult2.transactions).toHaveTransaction({
            from: boostJettonWallet.address,
            to: boost.address,
            success: true,
            op: Opcodes.transfer_notification,
        });

        const { totalRewards } = await boost.getBoostData();
        expect(totalRewards).toEqual(BOOST_JETTONS * 3n);

        blockchain.now = testBoost.endTime + 60; // 1 minute after end

        const userBalanceBefore2: bigint = await userJettonWallet.getJettonBalance();
        const secondUserBalanceBefore: bigint = await secondUserJettonWallet.getJettonBalance();

        const finalUserClaimResult = await nftItem.sendClaimBoostRewards(user.getSender(), boost.address);

        expect(finalUserClaimResult.transactions).toHaveTransaction({
            from: user.address,
            to: nftItem.address,
            success: true,
        });

        expect(finalUserClaimResult.transactions).toHaveTransaction({
            from: nftItem.address,
            to: boost.address,
            success: true,
        });

        expect(finalUserClaimResult.transactions).toHaveTransaction({
            from: boost.address,
            to: boostHelper.address,
            success: true,
        });

        expect(finalUserClaimResult.transactions).toHaveTransaction({
            from: boostHelper.address,
            to: boost.address,
            success: true,
        });

        expect(finalUserClaimResult.transactions).toHaveTransaction({
            from: boost.address,
            to: boostJettonWallet.address,
            success: true,
        });

        expect(finalUserClaimResult.transactions).toHaveTransaction({
            from: boostJettonWallet.address,
            to: userJettonWallet.address,
            success: true,
        });

        const { claimed: claimedAfter } = await boostHelper.getHelperData();
        expect(claimedAfter).toBeTruthy();

        const userBalanceAfter2: bigint = await userJettonWallet.getJettonBalance();
        const userReward2: bigint = userBalanceAfter2 - userBalanceBefore2;
        expect(Number(fromNano(userReward2 + userReward))).toBeCloseTo(
            Number(fromNano(BOOST_JETTONS * 3n)) * userRewardFraction,
        );

        const finalSecondUserClaimResult = await secondUserNftItem.sendClaimBoostRewards(
            secondUser.getSender(),
            boost.address,
        );

        expect(finalSecondUserClaimResult.transactions).toHaveTransaction({
            from: secondUser.address,
            to: secondUserNftItem.address,
            success: true,
        });

        expect(finalSecondUserClaimResult.transactions).toHaveTransaction({
            from: secondUserNftItem.address,
            to: boost.address,
            success: true,
        });

        expect(finalSecondUserClaimResult.transactions).toHaveTransaction({
            from: boost.address,
            to: secondUserBoostHelper.address,
            success: true,
        });

        expect(finalSecondUserClaimResult.transactions).toHaveTransaction({
            from: secondUserBoostHelper.address,
            to: boost.address,
            success: true,
        });

        expect(finalSecondUserClaimResult.transactions).toHaveTransaction({
            from: boost.address,
            to: boostJettonWallet.address,
            success: true,
        });

        expect(finalSecondUserClaimResult.transactions).toHaveTransaction({
            from: boostJettonWallet.address,
            to: secondUserJettonWallet.address,
            success: true,
        });

        const secondUserBalanceAfter: bigint = await secondUserJettonWallet.getJettonBalance();
        const secondUserReward: bigint = secondUserBalanceAfter - secondUserBalanceBefore;

        const { claimed: claimedSecondUser } = await secondUserBoostHelper.getHelperData();
        expect(claimedSecondUser).toBeTruthy();

        const secondUserRewardFraction: number =
            Number(fromNano(STAKED_JETTONS / 2n)) /
            (Number(fromNano(STAKED_JETTONS)) + Number(fromNano(STAKED_JETTONS)) / 2);

        expect(Number(fromNano(secondUserReward))).toBeCloseTo(
            Number(fromNano(BOOST_JETTONS * 3n)) * secondUserRewardFraction,
        );
    });
});
