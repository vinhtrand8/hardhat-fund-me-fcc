// import
import { network } from "hardhat";
import { DeployFunction, Deployment } from "hardhat-deploy/dist/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { networkConfig, developmentChains } from "../helper-hardhat-config";
import verify from "../utils/verify";
import "dotenv/config";

// declare main function
const deployFunc: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
    const { deployments, getNamedAccounts } = hre;
    const { deploy, log } = deployments;
    const { deployer } = await getNamedAccounts();
    const chainId: number = network.config.chainId!;
    let ethUsdPriceFeed;

    if (developmentChains.includes(network.name)) {
        const aggregatorV3Mocks: Deployment = await deployments.get(
            "MockV3Aggregator"
        );
        ethUsdPriceFeed = aggregatorV3Mocks.address;
    } else {
        ethUsdPriceFeed =
            networkConfig[chainId]["ethUsdPriceFeed"] ||
            "0x8A753747A1Fa494EC906cE90E9f37563A8AF630e";
    }

    const args = [ethUsdPriceFeed];
    const fundMe = await deploy("FundMe", {
        from: deployer,
        log: true,
        args: args,
        waitConfirmations: networkConfig[chainId].blockConfirmations || 1
    });
    log(`FundMe deployed at ${fundMe.address}`);
    if (
        !developmentChains.includes(network.name) &&
        process.env.ETHERSCAN_API_KEY
    ) {
        await verify(fundMe.address, args);
    }
};

deployFunc.tags = ["all", "fundme"];

// export main function
export default deployFunc;
