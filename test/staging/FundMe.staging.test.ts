import { assert } from "chai";
import { ethers, getNamedAccounts, network } from "hardhat";
import { developmentChains } from "../../helper-hardhat-config";
import { FundMe } from "../../typechain-types";

developmentChains.includes(network.name)
    ? describe.skip
    : describe("FundMe Staging", async () => {
          let fundMe: FundMe;
          let deployer: string;
          let sendValue = ethers.utils.parseEther("0.001");

          beforeEach(async () => {
              deployer = (await getNamedAccounts()).deployer;
              fundMe = await ethers.getContract("FundMe", deployer);
          });

          it("should allow people to fund and withdraw", async () => {
              await fundMe.fund({ value: sendValue });
              const transactionResponse = await fundMe.withdraw({
                  gasLimit: 100000
              });
              await transactionResponse.wait(1);
              const endingFundMeBalance = await fundMe.provider.getBalance(
                  fundMe.address
              );
              assert.equal(endingFundMeBalance.toString(), "0");
          });
      });
