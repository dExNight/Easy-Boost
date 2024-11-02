import { Address } from '@ton/core';
import { NetworkProvider } from '@ton/blueprint';
import { NftItem } from '../wrappers/NftItem';

const STAKE_NFT_ITEM_ADDRESS: Address = Address.parse('kQC_2w2cC2l1UUvALUqdAg6qUQ8SV7kTuQUmCDip86UifBxH');

export async function run(provider: NetworkProvider) {
    const nft = provider.open(NftItem.createFromAddress(STAKE_NFT_ITEM_ADDRESS));

    await nft.sendClaimNft(provider.sender(), {});
}
