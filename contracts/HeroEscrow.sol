// SPDX-License-Identifier: UNLICENSED
// This code is released under the Unlicense, a public domain dedication.

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/utils/Context.sol";
import "@openzeppelin/contracts/token/ERC721/utils/ERC721Holder.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";


contract HeroEscrow is Context, ERC721Holder, ReentrancyGuard {
    address constant HERO_NFT = 0x268CC8248FFB72Cd5F3e73A9a20Fa2FF40EfbA61;
    address constant JEWEL_TOKEN = 0x30C103f8f5A3A732DFe2dCE1Cc9446f545527b43;

    struct Trade {
        uint256 tradeId;
        uint256 tokenId;
        address payable seller;
        address payable buyer;
        uint256 price;
        bool nftDeposited;
        bool executed;
        bool canceled;
    }

    Trade[] public trades;
    mapping(uint256 => uint256) public tradeIds;

    function createTrade(uint256 tokenId, address payable buyer, uint256 price) public {
        require(IERC721(HERO_NFT).ownerOf(tokenId) == _msgSender(), "You don't own this hero.");
        require(price > 0, "Price must be greater than 0.");

        // Get the seller's address
        address payable seller = payable(IERC721(HERO_NFT).ownerOf(tokenId));

        // Allow the contract to spend DFK Hero NFTs
        IERC721(HERO_NFT).approve(address(this), tokenId);

        // Transfer the NFT from the seller to the contract
        IERC721(HERO_NFT).safeTransferFrom(_msgSender(), address(this), tokenId);

        // Create the trade
        trades.push(
            Trade({
            tradeId: trades.length + 1,
            tokenId: tokenId,
            seller: seller,
            buyer: buyer,
            price: price,
            nftDeposited: true,
            executed: false,
            canceled: false
            })
        );

        emit TradeCreated(trades.length - 1, tokenId, seller, buyer, price);
    }

    function executeTrade(uint256 tradeId) public nonReentrant {
        Trade storage trade = trades[tradeId - 1];
        require(trade.executed == false, "Trade already executed");
        require(trade.nftDeposited == true, "NFT not deposited yet");
        require(_msgSender() == trade.buyer, "Only buyer can execute trade");

        IERC20 jewelContract = IERC20(JEWEL_TOKEN);
        uint256 jewelAmount = trade.price;
        address payable seller = trade.seller;

        // Verify buyer has enough JEWEL to buy the NFT
        require(jewelContract.balanceOf(_msgSender()) >= jewelAmount, "Insufficient JEWEL balance");

        // Check if contract is approved to transfer enough JEWEL tokens
        require(jewelContract.allowance(_msgSender(), address(this)) >= jewelAmount, "Contract not approved to spend JEWEL tokens");

        // Check if the sent JEWEL amount matches the price of the trade
        require(jewelAmount == trade.price, "Sent JEWEL amount does not match the price of the trade");

        // Transfer JEWEL tokens from buyer to contract
        jewelContract.transferFrom(_msgSender(), address(this), jewelAmount);

        // Transfer NFT from contract to buyer
        IERC721 heroContract = IERC721(HERO_NFT);
        heroContract.safeTransferFrom(address(this), trade.buyer, trade.tokenId);

        // Transfer JEWEL tokens from contract to seller
        jewelContract.transfer(seller, jewelAmount);

        trade.executed = true;
        emit TradeExecuted(trade.tradeId, trade.tokenId, trade.seller, trade.buyer, trade.price);
    }

    function cancelTrade(uint256 tradeId) public nonReentrant {
        Trade storage trade = trades[tradeId - 1];
        require(trade.executed == false, "Trade already executed");
        require(_msgSender() == trade.seller, "Only seller can cancel trade");

        IERC721 heroContract = IERC721(HERO_NFT);
        heroContract.safeTransferFrom(address(this), trade.seller, trade.tokenId);

        trade.canceled = true;

        emit TradeCanceled(trade.tradeId, trade.tokenId, trade.seller, trade.buyer, trade.price);
    }

    function getTradeCount() public view returns (uint256) {
        return trades.length;
    }

    function _exists(uint256 tokenId) internal view returns (bool) {
        IERC721 heroContract = IERC721(HERO_NFT);
        return heroContract.ownerOf(tokenId) != address(0);
    }

    function getActiveTrades() public view returns (Trade[] memory) {
        uint256 tradeCount = 0;
        for (uint i = 0; i < trades.length; i++) {
            if (!trades[i].executed && !trades[i].canceled) {
                tradeCount++;
            }
        }
        Trade[] memory activeTrades = new Trade[](tradeCount);
        uint256 j = 0;
        for (uint k = 0; k < trades.length; k++) {
            if (!trades[k].executed && !trades[k].canceled) {
                activeTrades[j] = trades[k];
                j++;
            }
        }
        return activeTrades;
    }

event TradeCreated(
    uint256 indexed tradeId,
    uint256 indexed tokenId,
    address indexed seller,
    address buyer,
    uint256 price
);

event TradeExecuted(
    uint256 indexed tradeId,
    uint256 indexed tokenId,
    address indexed seller,
    address buyer,
    uint256 price
);

event TradeCanceled(
    uint256 indexed tradeId,
    uint256 indexed tokenId,
    address indexed seller,
    address buyer,
    uint256 price
);
}