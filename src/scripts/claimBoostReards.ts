import { Address } from '@ton/core';
import { NetworkProvider } from '@ton/blueprint';
import { NftItem } from '../wrappers/NftItem';

const STAKE_NFT_ITEM_ADDRESS: Address = Address.parse('kQC_2w2cC2l1UUvALUqdAg6qUQ8SV7kTuQUmCDip86UifBxH');

const BOOST_ADDRESS: Address = Address.parse('kQBEj8gHb_HKF_SBu741-HoV2Lo0gFcSL6uHpOhkCw7bS0cE');

export async function run(provider: NetworkProvider) {
    const nft = provider.open(NftItem.createFromAddress(STAKE_NFT_ITEM_ADDRESS));

    await nft.sendClaimBoostRewards(provider.sender(), BOOST_ADDRESS);
}
