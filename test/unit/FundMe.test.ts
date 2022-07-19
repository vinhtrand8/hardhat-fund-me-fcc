import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { assert, expect } from "chai";
import { BigNumber, Contract } from "ethers";
import { deployments, ethers, network } from "hardhat";
import { developmentChains } from "../../helper-hardhat-config";
import { FundMe } from "../../typechain-types";

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("FundMe", () => {
          let fundMe: FundMe;
          let mockV3Aggregator: Contract;
          let accounts: SignerWithAddress[];
          let developer: SignerWithAddress;

          const sendValue: BigNumber = ethers.utils.parseEther("1");

          beforeEach(async () => {
              // developer = (await getNamedAccounts()).developer;
              accounts = await ethers.getSigners();
              developer = accounts[0];
              await deployments.fixture("all");
              fundMe = await ethers.getContract("FundMe", developer);
              mockV3Aggregator = await ethers.getContract(
                  "MockV3Aggregator",
                  developer
              );
          });

          describe("constructor", () => {
              it("should set the aggregator address correctly", async () => {
                  const response = await fundMe.getPriceFeed();
                  assert.equal(response, mockV3Aggregator.address);
              });
          });

          describe("fund", () => {
              it("should fail if you don't send enough ETH", async () => {
                  await expect(fundMe.fund()).to.be.revertedWith(
                      "You need to spend more ETH"
                  );
              });

              it("should update the amount funded data structure", async () => {
                  await fundMe.fund({ value: sendValue });
                  const response = await fundMe.getAddressToAmountFunded(
                      developer.address
                  );
                  assert.equal(response.toString(), sendValue.toString());
              });

              it("should add funder to array of funders", async () => {
                  await fundMe.fund({ value: sendValue });
                  const response = await fundMe.getFunder(0);
                  assert.equal(response, developer.address);
              });
          });

          describe("withdraw", () => {
              beforeEach(async () => {
                  await fundMe.fund({ value: sendValue });
              });

              it("should withdraw ETH from a single funder", async () => {
                  // Arrange
                  const startingFundMeBalance = await fundMe.provider.getBalance(
                      fundMe.address
                  );
                  const startingDeployerBalance = await developer.getBalance();

                  // Act
                  const transactionResponse = await fundMe.withdraw();
                  const transactionReceipt = await transactionResponse.wait(1);

                  const { gasUsed, effectiveGasPrice } = transactionReceipt;
                  const gasCost = gasUsed.mul(effectiveGasPrice);

                  const endingFundMeBalance = await fundMe.provider.getBalance(
                      fundMe.address
                  );
                  const endingDeployerBalance = await developer.getBalance();

                  // Assert
                  assert.equal(endingFundMeBalance.toString(), "0");
                  assert.equal(
                      startingFundMeBalance
                          .add(startingDeployerBalance)
                          .toString(),
                      endingDeployerBalance.add(gasCost).toString()
                  );
              });

              it("should allow us withdraw with multiple funders", async () => {
                  // Arrange
                  for (let i = 1; i < 6; i++) {
                      const fundMeConnectedContract = await fundMe.connect(
                          accounts[i]
                      );
                      await fundMeConnectedContract.fund({ value: sendValue });
                  }
                  const startingFundMeBalance = await fundMe.provider.getBalance(
                      fundMe.address
                  );
                  const testFundMeBalance = await ethers.provider.getBalance(
                      fundMe.address
                  );
                  const startingDeployerBalance = await developer.getBalance();

                  // Act
                  const transactionResponse = await fundMe.withdraw();
                  const transactionReceipt = await transactionResponse.wait(1);

                  const { gasUsed, effectiveGasPrice } = transactionReceipt;
                  const gasCost = gasUsed.mul(effectiveGasPrice);

                  const endingFundMeBalance = await fundMe.provider.getBalance(
                      fundMe.address
                  );
                  const endingDeployerBalance = await developer.getBalance();

                  // Assert
                  assert.equal(endingFundMeBalance.toString(), "0");
                  assert.equal(
                      startingFundMeBalance
                          .add(startingDeployerBalance)
                          .toString(),
                      endingDeployerBalance.add(gasCost).toString()
                  );

                  // Make sure funders to be reset properly
                  await expect(fundMe.getFunder(0)).to.be.reverted;

                  for (let i = 1; i < 6; i++) {
                      const amoundtFunded = await fundMe.getAddressToAmountFunded(
                          accounts[i].address
                      );
                      assert.equal(amoundtFunded.toString(), "0");
                  }
              });

              it("should only allow the owner to withdraw", async () => {
                  const attacker = accounts[1];
                  const attackerConnectedContract = fundMe.connect(attacker);
                  await expect(
                      attackerConnectedContract.withdraw()
                  ).to.be.revertedWithCustomError(fundMe, "FundMe__NotOwner");
              });
          });

          /*  
    describe("cheaperWithdraw", () => {
        beforeEach(async () => {
            await fundMe.fund({ value: sendValue });
        });

        it("should cheaper withdraw ETH from a single funder", async () => {
            // Arrange
            const startingFundMeBalance = await fundMe.provider.getBalance(
                fundMe.address
            );
            const startingDeployerBalance = await developer.getBalance();

            // Act
            const transactionResponse = await fundMe.cheaperWithdraw();
            const transactionReceipt = await transactionResponse.wait(1);

            const { gasUsed, effectiveGasPrice } = transactionReceipt;
            const gasCost = gasUsed.mul(effectiveGasPrice);

            const endingFundMeBalance = await fundMe.provider.getBalance(
                fundMe.address
            );
            const endingDeployerBalance = await developer.getBalance();

            // Assert
            assert.equal(endingFundMeBalance.toString(), "0");
            assert.equal(
                startingFundMeBalance.add(startingDeployerBalance).toString(),
                endingDeployerBalance.add(gasCost).toString()
            );
        });

        it("should allow us cheaper withdraw with multiple funders", async () => {
            // Arrange
            for (let i = 1; i < 6; i++) {
                const fundMeConnectedContract = fundMe.connect(accounts[i]);
                await fundMeConnectedContract.fund({ value: sendValue });
            }
            const startingFundMeBalance = await fundMe.provider.getBalance(
                fundMe.address
            );
            const testFundMeBalance = await ethers.provider.getBalance(
                fundMe.address
            );
            const startingDeployerBalance = await developer.getBalance();

            // Act
            const transactionResponse = await fundMe.cheaperWithdraw();
            const transactionReceipt = await transactionResponse.wait(1);

            const { gasUsed, effectiveGasPrice } = transactionReceipt;
            const gasCost = gasUsed.mul(effectiveGasPrice);

            const endingFundMeBalance = await fundMe.provider.getBalance(
                fundMe.address
            );
            const endingDeployerBalance = await developer.getBalance();

            // Assert
            assert.equal(endingFundMeBalance.toString(), "0");
            assert.equal(
                startingFundMeBalance.add(startingDeployerBalance).toString(),
                endingDeployerBalance.add(gasCost).toString()
            );

            // Make sure funders to be reset properly
            await expect(fundMe.getFunder(0)).to.be.reverted;

            for (let i = 1; i < 6; i++) {
                const amoundtFunded = await fundMe.getAddressToAmountFunded(
                    accounts[i].address
                );
                assert.equal(amoundtFunded.toString(), "0");
            }
        });

        it("should only allow the owner to cheaper withdraw", async () => {
            const attacker = accounts[1];
            const attackerConnectedContract = fundMe.connect(attacker);
            await expect(
                attackerConnectedContract.cheaperWithdraw()
            ).to.be.revertedWithCustomError(fundMe, "FundMe__NotOwner");
        });
    });
    */
      });
