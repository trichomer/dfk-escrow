const connectWalletButton = document.getElementById("connectWallet");
const appDiv = document.getElementById("app");

const tokenIdInput = document.getElementById("tokenId");
const buyerAddressInput = document.getElementById("buyerAddress");
const priceInput = document.getElementById("price");
const createTradeButton = document.getElementById("createTrade");

const tradeIdDepositInput = document.getElementById("tradeIdDeposit");
const depositNFTButton = document.getElementById("depositNFT");

const tradeIdExecuteInput = document.getElementById("tradeIdExecute");
const executeTradeButton = document.getElementById("executeTrade");

const accountAddressElem = document.getElementById("account-address");
const accountBalanceElem = document.getElementById("account-balance");
const heroTableBody = document.getElementById("heroTable");

let heroEscrowContract;
let heroCoreContract;
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
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        await window.ethereum.request({ method: "eth_requestAccounts" });
        signer = provider.getSigner();
  
        const response = await fetch("./HeroEscrow.json");
        const contractData = await response.json();
        const heroEscrowAbi = contractData.abi;
        const heroEscrowAddress = "0xf80677B7e33C1A90fD37EA023361386Ff6841410";
  
        heroEscrowContract = new ethers.Contract(heroEscrowAddress, heroEscrowAbi, signer);
  
        const heroCoreAbi = [
          "function balanceOf(address owner) view returns (uint256)",
          "function tokenOfOwnerByIndex(address owner, uint256 index) view returns (uint256)",
        ];
        const heroCoreAddress = "0x268CC8248FFB72Cd5F3e73A9a20Fa2FF40EfbA61";
        heroCoreContract = new ethers.Contract(heroCoreAddress, heroCoreAbi, provider);
  
        const accountAddress = await signer.getAddress();
        const accountBalance = await provider.getBalance(accountAddress);
  
        accountAddressElem.innerText = accountAddress;
        accountBalanceElem.innerText = ethers.utils.formatEther(accountBalance);
  
        appDiv.style.display = "block";
        await renderHeroTable();
      } catch (error) {
        console.error("Error connecting to wallet:", error);
      }
    } else {
      alert("Ethereum provider not found. Please install MetaMask or another compatible wallet.");
    }
  };

  createTradeButton.onclick = async () => {
    const tokenId = parseInt(tokenIdInput.value);
    const buyerAddress = buyerAddressInput.value;
    const price = parseInt(priceInput.value);
  
    try {
      const tx = await heroEscrowContract.createTrade(tokenId, buyerAddress, price);
      await tx.wait();
      alert("Trade created successfully");
    } catch (error) {
      console.error("Error creating trade:", error);
      alert("Error creating trade");
    }
  };
  
  depositNFTButton.onclick = async () => {
    const tradeId = parseInt(tradeIdDepositInput.value);
  
    try {
      const tx = await heroEscrowContract.depositNFT(tradeId);
      await tx.wait();
      alert("NFT deposited successfully");
    } catch (error) {
      console.error("Error depositing NFT:", error);
      alert("Error depositing NFT");
    }
  };
  
  executeTradeButton.onclick = async () => {
    const tradeId = parseInt(tradeIdExecuteInput.value);
  
    try {
      const tx = await heroEscrowContract.executeTrade(tradeId);
      await tx.wait();
      alert("Trade executed successfully");
    } catch (error) {
      console.error("Error executing trade:", error);
      alert("Error executing trade");
    }
  };
  
  const balanceOfButton = document.getElementById("balanceOf");
  const heroTable = document.getElementById("heroTable");
  const heroRowTemplate = document.getElementById("heroRowTemplate");
  
  balanceOfButton.onclick = async () => {
    const accountAddress = await getAccountAddress();
    const heroCoreAddress = "0x268CC8248FFB72Cd5F3e73A9a20Fa2FF40EfbA61";
    const provider = new ethers.providers.JsonRpcProvider();
    const heroCoreContract = new ethers.Contract(heroCoreAddress, heroCoreAbi, provider);
    const heroIds = await heroCoreContract.balanceOf(accountAddress);
  
    heroTable.innerHTML = ""; // clear existing rows
    heroIds.forEach(async (heroId) => {
      const heroData = await getHeroData(heroId);
      const newRow = heroRowTemplate.content.cloneNode(true);
      newRow.querySelector(".hero-id").textContent = heroData.id.toString();
      newRow.querySelector(".hero-name").textContent = heroData.name;
      newRow.querySelector(".hero-type").textContent = heroData.class;
      newRow.querySelector(".hero-level").textContent = heroData.level.toString();
      newRow.querySelector(".select-hero").onclick = () => {
        tokenIdInput.value = heroData.id.toString();
      };
      heroTable.appendChild(newRow);
    });
  };
  
  async function getAccountAddress() {
    if (!window.ethereum) {
      throw new Error("Ethereum provider not found. Please install MetaMask or another compatible wallet.");
    }
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const accounts = await provider.listAccounts();
    if (accounts.length === 0) {
      throw new Error("No accounts found in wallet.");
    }
    return accounts[0];
  }
  
  async function getHeroData(heroId) {
    const heroCoreAddress = "0x268CC8248FFB72Cd5F3e73A9a20Fa2FF40EfbA61";
    const provider = new ethers.providers.JsonRpcProvider();
    const heroCoreContract = new ethers.Contract(heroCoreAddress, heroCoreAbi, provider);
    const heroData = await heroCoreContract.getHeroData(heroId);
    return heroData;
  }
  