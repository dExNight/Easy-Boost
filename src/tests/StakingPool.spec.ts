import { Blockchain, SandboxContract, TreasuryContract } from '@ton/sandbox';
import { Address, beginCell, Cell, Dictionary, fromNano, toNano } from '@ton/core';
import { offchainCollectionContentToCell, StakingPool, stakingPoolConfigToCell } from '../wrappers/StakingPool';
import '@ton/test-utils';
import { compile } from '@ton/blueprint';
import { PoolsAdmin } from '../wrappers/PoolsAdmin';
import { randomAddress } from '@ton/test-utils';
import { JettonMinter } from '../wrappers/JettonMinter';
import { JettonWallet } from '../wrappers/JettonWallet';
import { Gas, Opcodes, ExitCodes, StakingPool as PoolConstants } from '../wrappers/constants';
import { SendMode } from '@ton/core';
import { buildDeployPoolPayload, buildStakeJettonsPoolPayload } from '../wrappers/payload';
import { Boost } from '../wrappers/Boost';
import { NftItem } from '../wrappers/NftItem';

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
    startTime: 1700000000,
    endTime: 1800000000,
    minimumDeposit: toNano('100'),
};

const testBoost = {
    startTime: 1705000000,
    endTime: 1706000000,
    farmingSpeed: 1000000000n,
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
    let boost: SandboxContract<Boost>;

    // Jettons
    let jettonMinter: SandboxContract<JettonMinter>;
    let adminJettonWallet: SandboxContract<JettonWallet>;
    let poolCreatorJettonWallet: SandboxContract<JettonWallet>;

    let poolsAdminJettonWallet: SandboxContract<JettonWallet>;
    let stackingPoolRewardsWallet: SandboxContract<JettonWallet>;
    let stackingPoolLockWallet: SandboxContract<JettonWallet>;

    // Wallets
    let admin: SandboxContract<TreasuryContract>;
    let user: SandboxContract<TreasuryContract>;
    let team: SandboxContract<TreasuryContract>;
    let poolCreator: SandboxContract<TreasuryContract>;

    beforeEach(async () => {
        blockchain = await Blockchain.create();

        admin = await blockchain.treasury('admin');
        user = await blockchain.treasury('user');
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

        adminJettonWallet = blockchain.openContract(
            JettonWallet.createFromAddress(await jettonMinter.getWalletAddress(admin.address)),
        );

        poolCreatorJettonWallet = blockchain.openContract(
            JettonWallet.createFromAddress(await jettonMinter.getWalletAddress(poolCreator.address)),
        );

        poolsAdminJettonWallet = blockchain.openContract(
            JettonWallet.createFromAddress(await jettonMinter.getWalletAddress(poolsAdmin.address)),
        );

        expect(await adminJettonWallet.getJettonBalance()).toEqual(toNano('10000'));
        expect(await poolCreatorJettonWallet.getJettonBalance()).toEqual(toNano('10000'));

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
            creatorAddress: admin.address,
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
        expect((await stakingPool.getCollectionData()).collectionContent).toEqual('https://easy-boost.io/collection.json');
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
});
