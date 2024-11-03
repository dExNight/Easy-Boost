import { Address } from '@ton/core';
import { NetworkProvider } from '@ton/blueprint';
import { NftItem } from '../wrappers/NftItem';

const STAKE_NFT_ITEM_ADDRESS: Address = Address.parse('kQD6IEKPL82zD5kfcg5bxAj6qTvBxOJjuoCRvT8S9zueApCh');

export async function run(provider: NetworkProvider) {
    const nft = provider.open(NftItem.createFromAddress(STAKE_NFT_ITEM_ADDRESS));

    await nft.sendClaimNft(provider.sender(), {});
}
