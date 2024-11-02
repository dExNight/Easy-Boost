import { Address, beginCell, toNano } from '@ton/core';
import { JettonMinter } from '../wrappers/JettonMinter';
import { compile, NetworkProvider } from '@ton/blueprint';

const JETTON_ADMIN_ADDRESS: Address = Address.parse('0QAAeHjRVfqPfRIjkPlxcv-OAffJUfAxWSu6RFli4FUeUCRn');
const JETTON_METADATA_URL: string = 'https://raw.githubusercontent.com/dExNight/ProjectConfigurations/refs/heads/main/Nightmare/metadata.json';

const JETTONS_TO_MINT: number = 100000000;
const decimals: number = 9;

export async function run(provider: NetworkProvider) {
    const jettonMinter = provider.open(
        JettonMinter.createFromConfig(
            {
                admin: JETTON_ADMIN_ADDRESS,
                content: beginCell().storeUint(1, 8).storeStringTail(JETTON_METADATA_URL).endCell(),
                walletСode: await compile('JettonWallet'),
            },
            await compile('JettonMinter'),
        ),
    );

    const isMinterDeployed: boolean = await provider.isContractDeployed(jettonMinter.address);

    if (!isMinterDeployed) {
        await jettonMinter.sendDeploy(provider.sender(), toNano('0.05'));
        await provider.waitForDeploy(jettonMinter.address);
    }

    // Mint tokens
    await jettonMinter.sendMint(provider.sender(), {
        to: provider.sender().address!,
        jettonAmount: BigInt(JETTONS_TO_MINT * 10 ** decimals),
        fwdTonAmount: 1n,
        totalTonAmount: toNano('0.05'),
    });
}
