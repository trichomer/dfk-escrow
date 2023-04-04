const HeroEscrow = artifacts.require("HeroEscrow");

module.exports = function (deployer) {
  deployer.deploy(HeroEscrow);
};
