const connectWalletButton = document.getElementById("connectWallet");
const appDiv = document.getElementById("app");

const tokenIdInput = document.getElementById("tokenId");
const buyerAddressInput = document.getElementById("buyerAddress");
const priceInput = document.getElementById("price");
const createAndDepositNFTButton = document.getElementById("createAndDepositNFT");

const tradeIdDepositInput = document.getElementById("tradeIdDeposit");

const tradeIdExecuteInput = document.getElementById("tradeIdExecute");
const executeTradeButton = document.getElementById("executeTrade");


const accountAddressElem = document.getElementById("account-address");
const accountBalanceElem = document.getElementById("account-balance");
const tradesTableBody = document.getElementById("tradesTable");
const heroTableBody = document.getElementById("heroTable");

const checkMark = document.getElementById("checkMark");
const xMark = document.getElementById("xMark");
const approveBtn = document.getElementById("approveBtn");

const heroCoreAbi = [
  "function balanceOf(address owner) view returns (uint256)",
  "function tokenOfOwnerByIndex(address owner, uint256 index) view returns (uint256)",
  "function setApprovalForAll(address operator, bool approved) public",
  "function isApprovedForAll(address owner, address operator) view returns (bool)",
  "event ApprovalForAll(address indexed owner, address indexed operator, bool approved)",
];
const heroCoreAddress = "0x268CC8248FFB72Cd5F3e73A9a20Fa2FF40EfbA61";
const JEWEL_TOKEN_ADDRESS = "0x30C103f8f5A3A732DFe2dCE1Cc9446f545527b43";
const HERO_ESCROW_ADDRESS = "0x1C6dc8a1C71abFb98dB4691cCB0F2D9D4b7B9d09";
const jewelAbi = [
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function balanceOf(address account) view returns (uint256)",
];
const heroEscrowAbi = [
  "event TradeCreated(uint256 indexed tradeId, uint256 indexed tokenId, address indexed seller, address buyer, uint256 price)",
  "event TradeCanceled(uint256 indexed tradeId)",
  "event TradeExecuted(uint256 indexed tradeId)",
  "function createTrade(uint256 tokenId, address buyer, uint256 price) public",
  "function executeTrade(uint256 tradeId) public payable",
  "function getActiveTrades() public view returns (tuple(uint256 tradeId, uint256 tokenId, address seller, address buyer, uint256 price, bool nftDeposited, bool executed, bool canceled)[])",
  "function cancelTrade(uint256 tradeId) public",
];
const provider = new ethers.providers.Web3Provider(window.ethereum);
const heroCoreContract = new ethers.Contract(heroCoreAddress, heroCoreAbi, provider);
const jewelContract = new ethers.Contract(JEWEL_TOKEN_ADDRESS, jewelAbi, provider);
const heroEscrowContract = new ethers.Contract(HERO_ESCROW_ADDRESS, heroEscrowAbi, provider);
const cancelTradeButton = document.getElementById("cancelTrade");
let signer;


const getHeroIds = async () => {
  const owner = await signer.getAddress();
  const balance = await heroCoreContract.balanceOf(owner);
  const heroIds = [];
  for (let i = 0; i < balance; i++) {
    const heroId = await heroCoreContract.tokenOfOwnerByIndex(owner, i);
    heroIds.push(heroId.toNumber());
  }
  return heroIds;
};

const renderHeroTable = async () => {
  const heroIds = await getHeroIds();
  const rows = heroIds.map((heroId) => {
    return `<tr><td>${heroId}</td></tr>`;
  });
  heroTableBody.innerHTML = rows.join("");
};

connectWalletButton.onclick = async () => {
  if (window.ethereum) {
      try {
          await window.ethereum.request({ method: "eth_requestAccounts" });
          signer = provider.getSigner();

          const accountAddress = await signer.getAddress();
          const accountBalance = await provider.getBalance(accountAddress);

          accountAddressElem.innerText = accountAddress;
          accountBalanceElem.innerText = ethers.utils.formatEther(accountBalance);

          appDiv.style.display = "block";
          await renderHeroTable();
          
          // Check if NFT collection is approved
          const isApproved = await heroCoreContract.isApprovedForAll(accountAddress, HERO_ESCROW_ADDRESS);
          if (isApproved) {
            approveNFTButton.innerHTML = "&#x2714; NFT Collection Approved";
          } else {
            approveNFTButton.innerHTML = "&#x2718; Approve NFT Collection";
          }

      } catch (error) {
          console.error("Error connecting to wallet:", error);
      }
  } else {
      alert("Ethereum provider not found. Please install MetaMask or another compatible wallet.");
  }
};



createAndDepositNFTButton.onclick = async () => {
  const tokenId = parseInt(tokenIdInput.value);
  const buyerAddress = buyerAddressInput.value;
  const price = ethers.utils.parseUnits(priceInput.value, 18);

  try {
    signer = provider.getSigner();
    const tx = await heroEscrowContract.connect(signer).createTrade(tokenId, buyerAddress, price);
    await tx.wait();
    alert("Trade created successfully");
  } catch (error) {
    console.error("Error creating trade:", error);
    alert("Error creating trade");
  }
};

document.getElementById("executeTrade").addEventListener("click", async () => {
  const tradeId = parseInt(document.getElementById("tradeIdExecute").value, 10);
  const price = await heroEscrowContract.trades(tradeId - 1).then(trade => trade.price);
  executeTradeFromForm(tradeId, price);
});


const heroTable = document.getElementById("heroTable");

heroTable.addEventListener("click", async (event) => {
  if (event.target.classList.contains("buy-button")) {
    const heroId = event.target.dataset.heroId;
    const price = event.target.dataset.price;

    try {
      // Approve contract to spend JEWEL
      signer = provider.getSigner();
      const approveTx = await jewelContract.connect(signer).approve(HERO_ESCROW_ADDRESS, price);
      await approveTx.wait();

      // Create trade
      const tx = await heroEscrowContract.createTrade(heroId, signer.getAddress(), price);
      await tx.wait();
      alert("Trade created successfully");
    } catch (error) {
      console.error("Error creating trade:", error);
      alert("Error creating trade");
    }
  }
});


tradesTableBody.addEventListener("click", async (event) => {
  if (event.target.classList.contains("buy-button")) {
    const heroId = event.target.dataset.heroId;
    const price = event.target.dataset.price;

    try {
      // Convert the price back to raw format (in wei)
      const rawPrice = ethers.utils.parseUnits(price, 18);

      // Approve contract to spend JEWEL
      signer = provider.getSigner();
      const approveTx = await jewelContract.connect(signer).approve(HERO_ESCROW_ADDRESS, rawPrice);
      await approveTx.wait();

      // Create trade
      const tx = await heroEscrowContract.createTrade(heroId, signer.getAddress(), rawPrice);
      await tx.wait();
      alert("Trade created successfully");
    } catch (error) {
      console.error("Error creating trade:", error);
      alert("Error creating trade");
    }
  } else if (event.target.classList.contains("execute-button")) {
    const tradeId = parseInt(event.target.dataset.tradeId, 10);
    const activeTrades = await heroEscrowContract.getActiveTrades();
    const trade = activeTrades[tradeId - 1];
    executeTradeFromForm(trade.tradeId, trade.price);
  }
});




// Create a new trade
async function createTrade() {
  const tokenIdInput = document.getElementById("tokenIdInput");
  const buyerAddressInput = document.getElementById("buyerAddressInput");
  const priceInput = document.getElementById("priceInput");

  const tokenId = tokenIdInput.value;
  const buyerAddress = buyerAddressInput.value;
  const price = priceInput.value;

  // Call the createTrade function on the contract
  const createTradeTx = await heroEscrowContract.createTrade(tokenId, buyerAddress, price, {
    value: ethers.utils.parseEther(price),
  });

  await createTradeTx.wait();

  renderTradesTable();
};

const approveNFTButton = document.getElementById("approveNFT");

approveNFTButton.onclick = async () => {
  try {
    const operator = HERO_ESCROW_ADDRESS;
    const tx = await heroCoreContract.connect(signer).setApprovalForAll(operator, true);
    await tx.wait();
    alert("NFT collection approved successfully");
  } catch (error) {
    console.error("Error approving NFT collection:", error);
    alert("Error approving NFT collection");
  }
};

const getTrades = async () => {
  try {
    const tradeEvents = await heroEscrowContract.getActiveTrades();
    //console.log("tradeEvents:", tradeEvents);
    const trades = tradeEvents.map((trade) => {
      const tradeId = trade[0].toNumber();
      const tokenId = trade[1].toNumber();
      const seller = trade[2];
      const buyer = trade[3];
      const price = trade[4];
      const nftDeposited = trade[5];
      const executed = trade[6];
      const canceled = trade[7];

      return {
        tradeId,
        tokenId,
        seller,
        buyer,
        price,
        nftDeposited,
        executed,
        canceled,
      };
    });
    return trades;
  } catch (error) {
    console.error(error);
    return [];
  }
};

const getHeroes = async () => {
  const totalHeroes = await heroMarketContract.totalSupply();
  const heroes = await Promise.all(
    [...Array(totalHeroes.toNumber()).keys()].map(async (i) => {
      const heroId = i + 1;
      const hero = await heroMarketContract.heroes(heroId);
      const price = ethers.utils.formatEther(hero.price);
      const owner = await heroMarketContract.ownerOf(heroId);
      return { id: heroId, name: hero.name, power: hero.power, price, owner };
    })
  );
  return heroes;
};

const renderHeroesTable = (heroes) => {
  const body = document.getElementById("heroTableBody");
  body.innerHTML = "";
  heroes.forEach((hero) => {
    const row = body.insertRow();
    row.innerHTML = `<td>${hero.id}</td><td>${hero.name}</td><td>${hero.power}</td><td><button class="btn btn-primary" onclick="createTrade(${hero.id}, '${hero.owner}', '${hero.price}')">Create Trade</button></td>`;
  });
};

const renderTradesTable = async () => {
  const tradesTableBody = document.getElementById("tradesTableBody");

  if (!provider) {
    tradesTableBody.innerHTML = "Please connect a wallet to view trades.";
    return;
  }

  const trades = await getTrades();

  if (trades && typeof trades.forEach === 'function') {
    tradesTableBody.innerHTML = "";
    trades
      .filter((trade) => !trade.executed)
      .forEach((trade) => {
        const formattedPrice = ethers.utils.formatUnits(trade.price, 18);
        const row = tradesTableBody.insertRow();
        row.innerHTML = `
          <td>${trade.tradeId}</td>
          <td>${trade.tokenId}</td>
          <td>${trade.seller}</td>
          <td>${trade.buyer}</td>
          <td>${formattedPrice}</td>
          <td><button class="btn btn-primary execute-button" data-trade-id="${trade.tradeId}" data-price="${formattedPrice}">Buy</button></td>
        `;
      });
  } else {
    console.error("Trades data is not available");
  }
};



const executeTradeFromForm = async (tradeId, price) => {
  if (!provider) {
    console.log("Please connect a wallet.");
    return;
  }

  try {
    const signer = provider.getSigner();
    const userAddress = await signer.getAddress();

    // Check the user's approved Jewel token allowance
    const allowance = await jewelTokenContract.allowance(userAddress, heroEscrowContractAddress);
    const priceAsBigNumber = ethers.utils.parseUnits(price, 18);

    // If the allowance is not enough, approve the Jewel tokens
    if (allowance.lt(priceAsBigNumber)) {
      console.log("Approving Jewel tokens...");
      const approveTx = await jewelTokenContract.connect(signer).approve(heroEscrowContractAddress, priceAsBigNumber);
      await approveTx.wait();
      console.log("Jewel tokens approved.");
    }

    console.log("Executing trade...");
    const executeTradeTx = await heroEscrowContract.connect(signer).executeTrade(tradeId, { value: priceAsBigNumber });
    await executeTradeTx.wait();
    console.log("Trade executed.");
  } catch (error) {
    console.error("Error executing trade:", error);
  }
};





// Render initial table
(async () => {
  const trades = await getTrades();
  renderTradesTable(trades);
})();

// Set up trade event listener
heroEscrowContract.on("TradeCreated", async (tradeId, tokenId, seller, buyer, price, event) => {
  const trade = await getTrade(tradeId);
  const row = tradesTableBody.insertRow();
  row.innerHTML = `<td>${trade.tradeId}</td><td>${trade.tokenId}</td><td>${trade.seller}</td><td>${trade.price}</td><td><button class="btn btn-primary buy-button" data-hero-id="${trade.tokenId}" data-price="${trade.price}">Buy</button></td>`;
});

// Set up approval event listener
heroCoreContract.on("ApprovalForAll", async (owner, operator, approved) => {
  if (operator === HERO_ESCROW_ADDRESS) {
    const isApproved = await heroCoreContract.isApprovedForAll(owner, HERO_ESCROW_ADDRESS);
    if (isApproved) {
      approveNFTButton.innerHTML = "&#x2714; NFT Collection Approved";
    } else {
      approveNFTButton.innerHTML = "&#x2718; Approve NFT Collection";
    }
  }
});

// Set up cancel trade event listener
heroEscrowContract.on("TradeCanceled", async (tradeId) => {
  const row = tradesTableBody.querySelector(`tr[data-trade-id="${tradeId}"]`);
  if (row) {
    row.remove();
  }
});

// Set up execute trade event listener
heroEscrowContract.on("TradeExecuted", async (tradeId) => {
  const row = tradesTableBody.querySelector(`tr[data-trade-id="${tradeId}"]`);
  if (row) {
    row.remove();
  }
});

// Set up approval button listener
approveBtn.onclick = async () => {
  const approveTx = await jewelContract.connect(signer).approve(HERO_ESCROW_ADDRESS, ethers.constants.MaxUint256);
  await approveTx.wait();
  alert("JEWEL token approved for trading.");
};

// Set up check mark listener
checkMark.onclick = async () => {
  const tradeId = parseInt(tradeIdDepositInput.value);
  const depositTx = await heroEscrowContract.connect(signer).depositNFT(tradeId);
  await depositTx.wait();
  alert("NFT deposited successfully");
};

// Set up x mark listener
xMark.onclick = async () => {
  try {
    const tradeId = tradeIdDepositInput.value;
    const tx = await heroEscrowContract.cancelTrade(tradeId);
    await tx.wait();
    alert("Trade canceled successfully");
  } catch (error) {
    console.error("Error canceling trade:", error);
    alert("Error canceling trade");
  }
};

const approveJewel = async () => {
  try {
    signer = provider.getSigner();
    const tx = await jewelContract.connect(signer).approve(HERO_ESCROW_ADDRESS, ethers.constants.MaxUint256);
    await tx.wait();
    alert("JEWEL approved successfully");
  } catch (error) {
    console.error("Error approving JEWEL:", error);
    alert("Error approving JEWEL");
  }
};

const depositNFT = async () => {
  try {
    const tradeId = tradeIdDepositInput.value;
    signer = provider.getSigner();
    const tx = await heroEscrowContract.connect(signer).depositNFT(tradeId);
    await tx.wait();
    alert("NFT deposited successfully");
  } catch (error) {
    console.error("Error depositing NFT:", error);
    alert("Error depositing NFT");
  }
};

approveBtn.onclick = async () => {
  await approveJewel();
};

checkMark.onclick = async () => {
  await depositNFT();
  renderTradesTable();
};

renderTradesTable();


cancelTradeButton.onclick = async () => {
  const tradeId = parseInt(document.getElementById("tradeIdCancel").value);

  try {
    signer = provider.getSigner();
    const tx = await heroEscrowContract.connect(signer).cancelTrade(tradeId);
    await tx.wait();
    alert("Trade canceled successfully");
    renderTradesTable(await getTrades());
  } catch (error) {
    console.error("Error canceling trade:", error);
    alert("Error canceling trade");
  }
};