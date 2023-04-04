// SPDX-License-Identifier: UNLICENSED
// This code is released under the Unlicense, a public domain dedication.

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract HeroEscrow {
    struct Trade {
        uint256 tokenId;
        address payable seller;
        address payable buyer;
        uint256 price;
        bool isDeposited;
        bool isCompleted;
    }

    uint256 private tradeCounter;
    mapping(uint256 => Trade) public trades;

    address constant JEWEL_TOKEN = 0x30C103f8f5A3A732DFe2dCE1Cc9446f545527b43;
    address constant HERO_CORE_NFT = 0x268CC8248FFB72Cd5F3e73A9a20Fa2FF40EfbA61;

    event TradeCreated(uint256 tradeId);
    event NFTDeposited(uint256 tradeId);
    event TradeCompleted(uint256 tradeId);

    function createTrade(
        uint256 tokenId,
        address buyer,
        uint256 price
    ) public {
        tradeCounter++;
        trades[tradeCounter] = Trade({
            tokenId: tokenId,
            seller: payable(msg.sender),
            buyer: payable(buyer),
            price: price,
            isDeposited: false,
            isCompleted: false
        });
        emit TradeCreated(tradeCounter);
    }

    function depositNFT(uint256 tradeId) public {
        Trade storage trade = trades[tradeId];
        require(msg.sender == trade.seller, "Only the seller can deposit the hero NFT.");
        require(!trade.isDeposited, "Hero NFT is already deposited into contract.");

        IERC721(HERO_CORE_NFT).transferFrom(msg.sender, address(this), trade.tokenId);
        trade.isDeposited = true;
        emit NFTDeposited(tradeId);
    }

    function executeTrade(uint256 tradeId) public payable {
        Trade storage trade = trades[tradeId];
        require(msg.sender == trade.buyer, "Only the designated buyer can execute the trade.");
        require(!trade.isCompleted, "Trade is already completed.");
        require(trade.isDeposited, "Hero NFT is not yet deposited in to contract.");
        require(msg.value == trade.price, "Invalid payment amount");

        IERC20(JEWEL_TOKEN).transferFrom(msg.sender, trade.seller, trade.price);
        IERC721(HERO_CORE_NFT).transferFrom(address(this), msg.sender, trade.tokenId);
        trade.isCompleted = true;
        emit TradeCompleted(tradeId);
    }

    function setApprovalForAllNFT(bool approved) public {
        IERC721(HERO_CORE_NFT).setApprovalForAll(msg.sender, approved);
    }
}