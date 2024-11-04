import { TonCenterUrl } from "../constants";
import { ipfsToHttp } from "../utils";

type Dict = Record<string, any>;

interface NftItemCollection {
  address: string;
  owner_address: string;
  last_transaction_lt: string;
  next_item_index: string;
  collection_content: Dict;
}

export interface NftItem {
  address: string;
  init: boolean;
  index: string;
  collection_address: string;
  owner_address: string;
  content: Dict;
  last_transaction_lt: string;
  collection: NftItemCollection;
}

export interface Metadata {
  name?: string;
  description?: string;
  image?: string;
  attributes?: Dict;
}

export interface NftItems {
  nft_items: NftItem[];
  metadata: Metadata;
}

export interface NftItemResponse {
  address: string;
  init: boolean;
  index: string;
  collection_address: string;
  owner_address: string;
  metadata?: Metadata;
  collection: NftItemCollection;
}

interface JettonContent {
  decimals?: string;
  description?: string;
  name?: string;
  symbol?: string;
  image?: string;
  uri?: string;
}

export interface JettonMaster {
  address: string;
  total_supply: string;
  mintable: boolean;
  admin_address: string;
  jetton_content: JettonContent;
}

interface JettonMastersResponse {
  jetton_masters: JettonMaster[];
}

export default class TonCenterV3 {
  base_url: string;

  constructor() {
    this.base_url = TonCenterUrl;
  }

  private async getJsonFile(url: string): Promise<any> {
    const response = await fetch(url);
    return await response.json();
  }

  async getNftItemInfo(address: string): Promise<NftItemResponse | null> {
    const url = new URL(`${this.base_url}/nft/items`);
    const params = new URLSearchParams({
      address: address,
      limit: "1",
      offset: "0",
    });
    url.search = params.toString();

    const response = await fetch(url.toString());
    const result: NftItems | null = await response.json();

    if (!result) {
      return null;
    }

    const nft: NftItem = result.nft_items[0];

    if (!nft.content["uri"]) {
      if (!nft.content["name"]) {
        return null;
      }

      return {
        address: nft.address,
        init: nft.init,
        index: nft.index,
        collection_address: nft.collection_address,
        owner_address: nft.owner_address,
        metadata: {
          name: nft.content["name"],
          description: nft.content["description"],
          image: nft.content["image"],
        },
        collection: nft.collection,
      };
    }

    const metadata_uri: string = ipfsToHttp(nft.content["uri"]);
    const metadata: Metadata = await this.getJsonFile(metadata_uri);

    return {
      address: nft.address,
      init: nft.init,
      index: nft.index,
      collection_address: nft.collection_address,
      owner_address: nft.owner_address,
      metadata: metadata,
      collection: nft.collection,
    };
  }

  async getJettonMetadata(address: string): Promise<JettonMaster | undefined> {
    const url = new URL(`${this.base_url}/jetton/masters`);
    const params = new URLSearchParams({
      address: address,
      limit: "1",
      offset: "0",
    });
    url.search = params.toString();

    const response = await fetch(url.toString());
    const result: JettonMastersResponse | null = await response.json();

    if (!result) {
      return undefined;
    }

    const jettonMaster: JettonMaster | undefined = result.jetton_masters[0];

    if (jettonMaster.jetton_content.uri) {
      const metadata_uri: string = ipfsToHttp(jettonMaster.jetton_content.uri);
      let metadata: JettonContent = await this.getJsonFile(metadata_uri);

      metadata.decimals = metadata.decimals ? metadata.decimals : "9";
      metadata.description = metadata.description
        ? metadata.description
        : "No description";
      metadata.name = metadata.name ? metadata.name : "No name";
      metadata.symbol = metadata.symbol ? metadata.symbol : "NTHNG";

      return {
        address: jettonMaster.address,
        total_supply: jettonMaster.total_supply,
        mintable: jettonMaster.mintable,
        admin_address: jettonMaster.admin_address,
        jetton_content: metadata,
      };
    }
  }
}
