// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition
require("dotenv").config();


const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

const OWNER_ADDRESS = process.env.OWNER_ADDRESS;


module.exports = buildModule("CapsulaModule", (m) => {

    const capsula = m.contract("Capsula", [OWNER_ADDRESS], {
        value: 0n,
    });

    return { capsula };
});
