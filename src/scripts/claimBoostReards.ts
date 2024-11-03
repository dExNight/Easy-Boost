import { Address } from '@ton/core';
import { NetworkProvider } from '@ton/blueprint';
import { NftItem } from '../wrappers/NftItem';

const STAKE_NFT_ITEM_ADDRESS: Address = Address.parse('kQD6IEKPL82zD5kfcg5bxAj6qTvBxOJjuoCRvT8S9zueApCh');

const BOOST_ADDRESS: Address = Address.parse('kQA40zG_tOv54SPPQhK7tKRVMcQTrUcrOgYh9hWmg3jzsuRS');

export async function run(provider: NetworkProvider) {
    const nft = provider.open(NftItem.createFromAddress(STAKE_NFT_ITEM_ADDRESS));

    await nft.sendClaimBoostRewards(provider.sender(), BOOST_ADDRESS);
}
