import { TonCenterUrl } from "../constants";
import { ipfsToHttp, sleep } from "../utils";

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
  index: number;
  collection_address: string;
  owner_address: string;
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

export interface CollectionContent {
  image?: string;
  name?: string;
  description?: string;
  social_links?: string[];
  uri?: string;
}

export interface NftCollection {
  address: string;
  owner_address: string;
  next_item_index: string;
  collection_content: CollectionContent;
  code_hash: string;
}

interface NftCollectionsResponse {
  nft_collections: NftCollection[];
}

export default class TonCenterV3 {
  base_url: string;

  constructor() {
    this.base_url = TonCenterUrl;
  }

  private async getJsonFile(url: string): Promise<any> {
    const maxRetries = 5;
    let retries = 0;
    let response;

    while (retries < maxRetries) {
      try {
        response = await fetch(url);

        if (response.ok) {
          break;
        }
        await sleep(1200);
      } catch (error) {}
    }
    return await response?.json();
  }

  async getNftItemsInfo(
    data: {
      nft_address?: string;
      owner_address?: string;
      collection_address?: string;
    },
    limit: number = 1,
    offset: number = 0
  ): Promise<NftItemResponse[] | null> {
    const maxRetries = 5;
    let retries = 0;
    let response;

    const url = new URL(`${this.base_url}/nft/items`);
    const params = new URLSearchParams({
      address: data.nft_address ? data.nft_address : "",
      owner_address: data.owner_address ? data.owner_address : "",
      collection_address: data.collection_address
        ? data.collection_address
        : "",
      limit: `${limit}`,
      offset: `${offset}`,
    });
    url.search = params.toString();

    while (retries < maxRetries) {
      try {
        response = await fetch(url.toString());

        if (response.ok) {
          break;
        }
        await sleep(1200);
      } catch (error) {}
    }

    const result: NftItems | null = await response?.json();

    if (!result) {
      return null;
    }

    const nfts: NftItem[] = result.nft_items;
    const returnNfts: NftItemResponse[] = [];

    for (let nft of nfts) {
      returnNfts.push({
        address: nft.address,
        index: parseInt(nft.index),
        collection_address: nft.collection_address,
        owner_address: nft.owner_address,
      });
    }

    return returnNfts;
  }

  async getJettonMetadata(address: string): Promise<JettonMaster | undefined> {
    const maxRetries = 5;
    let retries = 0;
    let response;

    const url = new URL(`${this.base_url}/jetton/masters`);
    const params = new URLSearchParams({
      address: address,
      limit: "1",
      offset: "0",
    });
    url.search = params.toString();

    while (retries < maxRetries) {
      try {
        response = await fetch(url.toString());

        if (response.ok) {
          break;
        }
        await sleep(1200);
      } catch (error) {}
    }

    const result: JettonMastersResponse | null = await response?.json();

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

    return jettonMaster;
  }

  async getCollectionMetadata(
    address: string
  ): Promise<NftCollection | undefined> {
    const maxRetries = 5;
    let retries = 0;
    let response;

    const url = new URL(`${this.base_url}/nft/collections`);
    const params = new URLSearchParams({
      collection_address: address,
      limit: "1",
      offset: "0",
    });
    url.search = params.toString();

    while (retries < maxRetries) {
      try {
        response = await fetch(url.toString());

        if (response.ok) {
          break;
        }
        await sleep(1200);
      } catch (error) {}
    }

    const result: NftCollectionsResponse | null = await response?.json();

    if (!result) {
      return undefined;
    }

    const collection: NftCollection | undefined = result.nft_collections[0];

    if (collection.collection_content.uri) {
      const metadata_uri: string = ipfsToHttp(
        collection.collection_content.uri
      );
      let metadata: CollectionContent = await this.getJsonFile(metadata_uri);

      metadata.description = metadata.description ? metadata.description : "";
      metadata.name = metadata.name ? metadata.name : "No name";
      metadata.image = metadata.image ? metadata.image : "";
      metadata.social_links = metadata.social_links
        ? metadata.social_links
        : [];

      return {
        address: collection.address,
        owner_address: collection.owner_address,
        next_item_index: collection.next_item_index,
        collection_content: metadata,
        code_hash: collection.code_hash,
      };
    }

    return collection;
  }
}
