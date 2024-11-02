import { Address, toNano } from '@ton/core';
import { PoolsAdmin } from '../wrappers/PoolsAdmin';
import { compile, NetworkProvider } from '@ton/blueprint';
import { JettonMinter } from '../wrappers/JettonMinter';
import { amountToJettons } from '../wrappers/utils';

const TEAM_ADDRESS: Address = Address.parse('0QAAeHjRVfqPfRIjkPlxcv-OAffJUfAxWSu6RFli4FUeUCRn');

const JETTON_MINTER_ADDRESS: Address = Address.parse('kQBYjZ-AfW8eMDKOfH2OAJr3pnjcl4dKfaGmWs6EaeT8KrbV');

const poolsAdminConfig = {
    creationFee: amountToJettons(10),
    changeFee: amountToJettons(100),
    teamCommissionFactor: 1,
    conversionAddress: TEAM_ADDRESS,
    host: 'https://raw.githubusercontent.com/dExNight/ProjectConfigurations/refs/heads/main/SimpleStaking/',
};

export async function run(provider: NetworkProvider) {
    const poolsAdmin = provider.open(
        PoolsAdmin.createFromConfig(
            {
                creationFee: poolsAdminConfig.creationFee,
                changeFee: poolsAdminConfig.changeFee,
                stakingPoolCode: await compile('StakingPool'),
                nftItemCode: await compile('NftItem'),
                boostCode: await compile('Boost'),
                boostHelperCode: await compile('BoostHelper'),
                teamCommissionFactor: 1,
                teamAddress: TEAM_ADDRESS,
                conversionAddress: poolsAdminConfig.conversionAddress,
                host: poolsAdminConfig.host,
            },
            await compile('PoolsAdmin'),
        ),
    );

    if (!(await provider.isContractDeployed(poolsAdmin.address))) {
        await poolsAdmin.sendDeploy(provider.sender(), toNano('0.05'));

        await provider.waitForDeploy(poolsAdmin.address);
    }

    // Compute and set poolsAdmin jetton wallet address
    const jettonMinter = provider.open(JettonMinter.createFromAddress(JETTON_MINTER_ADDRESS));
    const poolsAdminJettonWalletAddress: Address = await jettonMinter.getWalletAddress(poolsAdmin.address);

    await poolsAdmin.sendSetJettonWalletAddress(provider.sender(), poolsAdminJettonWalletAddress);
}
