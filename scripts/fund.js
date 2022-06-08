const {getNamedAccounts, ethers} = require("hardhat")
async function main(){
    const {deployer } = await getNamedAccounts()
    const fundMe = await ethers.getContract("FundMe" , deployer)
    console.log("Contract loaded")
    const transactionResponse = await fundMe.fund({
        value : ethers.utils.parseEther("0.1")
    })
    const {
        gasUsed,
        effectiveGasPrice
    } = await transactionResponse.wait(1)
    console.log("Funded !! with gas cost= " , gasUsed)
}

main()