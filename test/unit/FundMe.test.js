const {
    deployments,
    ethers,
    getNamedAccounts
} = require('hardhat')
const {
    assert,
    expect
} = require('chai')


describe("FundMe", async function () {
    let fundMe
    let deployer
    let mockV3Aggregator
    const sendValue = ethers.utils.parseEther("1")
    beforeEach(async () => {
        deployer = (await getNamedAccounts()).deployer;
        await deployments.fixture("all")
        fundMe = await ethers.getContract("FundMe", deployer)
        mockV3Aggregator = await ethers.getContract(
            "MockV3Aggregator",
            deployer
        )
    });

    describe("constructor", async () => {
        it("set the aggregator address correctly", async () => {
            const response = await fundMe.getPriceFeed()
            assert.equal(response, mockV3Aggregator.address)
        })
    })
    describe('fund', async () => {
        it("Fail if you don't send enough eth", async () => {
            await expect(fundMe.fund()).to.be.revertedWith("You need to spend more ETH!")
        })
        it("updates the amount funded data structure", async () => {
            await fundMe.fund({
                value: sendValue
            })
            const response = await fundMe.getAddressToAmountFunded(
                deployer
            )
            assert.equal(response.toString(), sendValue.toString())
        })
        it("Add funder to array of funders", async () => {
            await fundMe.fund({
                value: sendValue
            })
            const funder = await fundMe.getFunder(0)
            assert.equal(funder, deployer)
        })
    })
    describe("withdraw", async () => {
        beforeEach(async () => {
            await fundMe.fund({
                value: sendValue
            })
        })
        it("withdraw ETH from as single founder", async function () {
            // Arrange
            const startingFundMeBalance = await fundMe.provider.getBalance(
                fundMe.address
            )
            const startingDeployerBalance = await fundMe.provider.getBalance(
                deployer
            )

            // Act 
            const transactionResponse = await fundMe.withdraw()
            const transactionReceipt = await transactionResponse.wait(1)

            const {
                gasUsed,
                effectiveGasPrice
            } = transactionReceipt
            const gasCost = gasUsed.mul(effectiveGasPrice)

            const endingFundMeBalance = await fundMe.provider.getBalance(
                fundMe.address
            )
            const endingDeployerBalance =
                await fundMe.provider.getBalance(deployer)

            // Assert 
            assert.equal(endingFundMeBalance, 0)
            assert.equal(
                startingFundMeBalance
                .add(startingDeployerBalance)
                .toString(),
                endingDeployerBalance.add(gasCost).toString()
            )
        })
        it("cheaper withdraw ETH from as single founder", async function () {
            // Arrange
            const startingFundMeBalance = await fundMe.provider.getBalance(
                fundMe.address
            )
            const startingDeployerBalance = await fundMe.provider.getBalance(
                deployer
            )

            // Act 
            const transactionResponse = await fundMe.cheaperWithdraw()
            const transactionReceipt = await transactionResponse.wait(1)

            const {
                gasUsed,
                effectiveGasPrice
            } = transactionReceipt
            const gasCost = gasUsed.mul(effectiveGasPrice)

            const endingFundMeBalance = await fundMe.provider.getBalance(
                fundMe.address
            )
            const endingDeployerBalance =
                await fundMe.provider.getBalance(deployer)

            // Assert 
            assert.equal(endingFundMeBalance, 0)
            assert.equal(
                startingFundMeBalance
                .add(startingDeployerBalance)
                .toString(),
                endingDeployerBalance.add(gasCost).toString()
            )
        })

        it("allow us to withdraw with mulitple funders", async () => {
            const accounts = await ethers.getSigners()
            // This is to connect different accounts to our smart contract and 
            // perform transaction like funding us.
            for (let i = 1; i < 6; i++) {
                // for connecting the account. 
                const fundMeConnectContract = await fundMe.connect(
                    accounts[i]
                )
                await fundMeConnectContract.fund({
                    value: sendValue
                })
            }
            const startingFundMeBalance = await fundMe.provider.getBalance(
                fundMe.address
            )
            const startingDeployerBalance = await fundMe.provider.getBalance(
                deployer
            )
            const transactionResponse = await fundMe.withdraw ()

            const transactionReceipt = await transactionResponse.wait()
            const {
                gasUsed,
                effectiveGasPrice
            } = transactionReceipt
            const gasCost = gasUsed.mul(effectiveGasPrice)

            const endingFundMeBalance = await fundMe.provider.getBalance(
                fundMe.address
            )
            const endingDeployerBalance =
                await fundMe.provider.getBalance(deployer)

            assert.equal(endingFundMeBalance, 0)
            assert.equal(
                startingFundMeBalance
                .add(startingDeployerBalance)
                .toString(),
                endingDeployerBalance.add(gasCost).toString()
            )

            await expect(fundMe.getFunder(0)).to.be.reverted
            for (let i = 1; i < 6; i++) {
                assert.equal(
                    await fundMe.getAddressToAmountFunded(
                        accounts[i].address
                    ),
                    0)
            }
        })

        it("allow us to withdraw cheaper with mulitple funders", async () => {
            const accounts = await ethers.getSigners()
            // This is to connect different accounts to our smart contract and 
            // perform transaction like funding us.
            for (let i = 1; i < 6; i++) {
                // for connecting the account. 
                const fundMeConnectContract = await fundMe.connect(
                    accounts[i]
                )
                await fundMeConnectContract.fund({
                    value: sendValue
                })
            }
            const startingFundMeBalance = await fundMe.provider.getBalance(
                fundMe.address
            )
            const startingDeployerBalance = await fundMe.provider.getBalance(
                deployer
            )
            const transactionResponse = await fundMe.cheaperWithdraw()

            const transactionReceipt = await transactionResponse.wait()
            const {
                gasUsed,
                effectiveGasPrice
            } = transactionReceipt
            const gasCost = gasUsed.mul(effectiveGasPrice)

            const endingFundMeBalance = await fundMe.provider.getBalance(
                fundMe.address
            )
            const endingDeployerBalance =
                await fundMe.provider.getBalance(deployer)

            assert.equal(endingFundMeBalance, 0)
            assert.equal(
                startingFundMeBalance
                .add(startingDeployerBalance)
                .toString(),
                endingDeployerBalance.add(gasCost).toString()
            )

            await expect(fundMe.getFunder(0)).to.be.reverted
            for (let i = 1; i < 6; i++) {
                assert.equal(
                    await fundMe.getAddressToAmountFunded(
                        accounts[i].address
                    ),
                    0)
            }
        })

        it("only allow owner to withdraw", async () => {
            const accounts = ethers.getSigners()
            const attacker = accounts[1]
            const attackerConnectedContract = fundMe.connect(attacker)
            await expect(attackerConnectedContract.withdraw()).to.be.reverted
        })
    })
})