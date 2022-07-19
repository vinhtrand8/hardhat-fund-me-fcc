import { getNamedAccounts, deployments, network, ethers } from "hardhat";
import { DeployFunction } from "hardhat-deploy/dist/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { networkConfig, developmentChains } from "../helper-hardhat-config";
import verify from "../utils/verify";

const deployStorage: DeployFunction = async (
    hre: HardhatRuntimeEnvironment
) => {
    const { getNamedAccounts, deployments } = hre;
    const { deploy, log } = deployments;
    const { deployer } = await getNamedAccounts();
    const chainId: number = network.config.chainId!;

    log("----------------------------------------------------");
    log("Deploying FunWithStorage and waiting for confirmations...");
    const funWithStorage = await deploy("FunWithStorage", {
        from: deployer,
        args: [],
        log: true,
        // we need to wait if on a live network so we can verify properly
        waitConfirmations: networkConfig[chainId].blockConfirmations || 1
    });

    log("Logging storage...");
    for (let i = 0; i < 10; i++) {
        log(
            `Location ${i}: ${await ethers.provider.getStorageAt(
                funWithStorage.address,
                i
            )}`
        );
    }

    // You can use this to trace!
    // const trace = await network.provider.send("debug_traceTransaction", [
    //     funWithStorage.transactionHash
    // ]);
    // for (let structLog in trace.structLogs) {
    //     if (trace.structLogs[structLog].op == "SSTORE") {
    //         console.log(trace.structLogs[structLog]);
    //     }
    // }
    const firstelementLocation = ethers.utils.keccak256(
        "0x0000000000000000000000000000000000000000000000000000000000000002"
    );
    const arrayElement = await ethers.provider.getStorageAt(
        funWithStorage.address,
        firstelementLocation
    );
    log(`Location ${firstelementLocation}: ${arrayElement}`);

    // Can you write a function that finds the storage slot of the arrays and mappings?
    // And then find the data in those slots?
};

deployStorage.tags = ["storage"];

export default deployStorage;
