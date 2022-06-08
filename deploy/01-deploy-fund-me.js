// Here we are extracting getNamedAccounts , deployments

const {
    network
} = require("hardhat")
const {
    networkConfig,
    developmentChains
} = require("../helper-hardhat-config")
const {
    verify
} = require("../utils/verify")
// from hre object which is passed by hardhat 
module.exports = async ({
    getNamedAccounts,
    deployments
}) => {
    const {
        deploy,
        log
    } = deployments
    const {
        deployer
    } = await getNamedAccounts()

    const chainId = network.config.chainId
    let ethUsdPriceFeedAddress

    if (chainId == 31337) {
        const ethUsdAggregator = await deployments.get("MockV3Aggregator")
        ethUsdPriceFeedAddress = ethUsdAggregator.address
    } else {
        ethUsdPriceFeedAddress = networkConfig[chainId]["ethUsdPriceFeed"]
    }

    const fundMe = await deploy("FundMe", {
        from: deployer,
        args: [ethUsdPriceFeedAddress],
        log: true,
        waitConfirmations: network.config.blockConfirmations || 1,
    })

    if (chainId != 31337 && process.env.ETHERSCAN_API_KEY) {
        await verify(fundMe.address, [ethUsdPriceFeedAddress])
    }
    log("-----------")
}

module.exports.tags = ["all", "fundme"]