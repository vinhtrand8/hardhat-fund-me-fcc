export interface networkConfigItem {
    name?: string;
    ethUsdPriceFeed?: string;
    blockConfirmations?: number;
}

export interface networkConfigInfo {
    [key: number]: networkConfigItem;
}

export const networkConfig: networkConfigInfo = {
    31337: {},
    4: {
        name: "rinkeby",
        ethUsdPriceFeed: "0x8A753747A1Fa494EC906cE90E9f37563A8AF630e",
        blockConfirmations: 6
    }
};

export const developmentChains = ["localhost", "hardhat"];

export const DECIMALS = 8;
export const INITIAL_ANSWER = 200000000000;
