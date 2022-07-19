import { ethers, getNamedAccounts } from "hardhat";
import { FundMe } from "../typechain-types";

async function main() {
    const { deployer } = await getNamedAccounts();
    const fundMe: FundMe = await ethers.getContract("FundMe", deployer);
    console.log("Funding contract.....");
    const responseTrasaction = await fundMe.fund({
        value: ethers.utils.parseEther("1")
    });
    await responseTrasaction.wait(1);
    console.log("Funded!");
}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });
