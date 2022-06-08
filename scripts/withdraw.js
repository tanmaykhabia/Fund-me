const {getNamedAccounts, ethers} = require("hardhat")
async function main(){
    const {deployer } = await getNamedAccounts()
    const fundMe = await ethers.getContract("FundMe" , deployer)
    console.log("Contract loaded")
    const transactionResponse = await fundMe.withdraw()
    const {
        gasUsed,
        effectiveGasPrice
    } = await transactionResponse.wait(1)
    console.log("Got it !! with gas cost= " , gasUsed.toString())
}

main()