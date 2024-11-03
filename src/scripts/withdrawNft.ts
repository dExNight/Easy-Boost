import { Address } from '@ton/core';
import { NetworkProvider } from '@ton/blueprint';
import { NftItem } from '../wrappers/NftItem';

const STAKE_NFT_ITEM_ADDRESS: Address = Address.parse('kQAMkASZO10lehG86gzrr_q5UVmemosu4EKzLZWPkJ1Kt1er');

export async function run(provider: NetworkProvider) {
    const nft = provider.open(NftItem.createFromAddress(STAKE_NFT_ITEM_ADDRESS));

    await nft.sendWithdrawNft(provider.sender(), {});
}
