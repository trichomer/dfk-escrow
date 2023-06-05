import React, { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import SendIcon from '@mui/icons-material/Send';
import { DataGrid } from '@mui/x-data-grid';
import Paper from '@mui/material/Paper';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Alert from '@mui/material/Alert';
import escrowAbi from './abis/HeroEscrow.json';
import heroAbi from './abis/HeroCoreDiamond.json';
import jewelAbi from './abis/JewelToken.json';
import TradeList from './components/TradeList';
import jewelIcon from './img/jewel_icon.png';
import Typography from '@mui/material/Typography';
import Launch from '@mui/icons-material/Launch';
import Link from '@mui/material/Link';
const escrowAddress = '0x1D110414b4f3b909c2D68564fa19DFb9aEd00FAf';
const heroAddress = '0x268CC8248FFB72Cd5F3e73A9a20Fa2FF40EfbA61';
const jewelAddress = '0x30C103f8f5A3A732DFe2dCE1Cc9446f545527b43';

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#b0bec5',
    },
    secondary: {
      main: '#78909c',
    },
    background: {
      default: '#000000',  // Dark gray background
      paper: '#333333',
    },
    text: {
      primary: '#b0bec5',  // Light gray text
    },
  },
});

function App() {
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [jewelBalance, setJewelBalance] = useState(null);
  const [tokenId, setTokenId] = useState('');
  const [buyerAddress, setBuyerAddress] = useState('');
  const [price, setPrice] = useState('');
  const [heroContract, setHeroContract] = useState(null);
  const [jewelContract, setJewelContract] = useState(null);
  const [heroIds, setHeroIds] = useState([]);
  const [heroIsApproved, setHeroIsApproved] = useState(false);
  const [activeTrades, setActiveTrades] = useState([]);
  const [jewelIsApproved, setJewelIsApproved] = useState(false);

  
  // User clicks Connect button
  async function connect() {
    if (typeof window.ethereum !== 'undefined') {
      // Get the current network
      let networkId = await window.ethereum.request({ method: 'net_version' });
      const klaytnNetworkID = '8217';
      // If the current network is not Klaytn, request to switch to Klaytn
      if (networkId !== klaytnNetworkID) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: '0x2019',
              chainName: 'Klaytn',
              nativeCurrency: {
                name: 'KLAY',
                symbol: 'KLAY',
                decimals: 18,
              },
              rpcUrls: ['https://klaytn.blockpi.network/v1/rpc/public'],
              blockExplorerUrls: ['https://scope.klaytn.com/'],
            }],
          });
          // Wait for the chainChanged event
          await new Promise(resolve => {
            window.ethereum.once('chainChanged', () => {
              resolve();
            });
          });
        } catch (error) {
          console.error(error);
          return;
        }
        // Get the new network id after switch
        networkId = await window.ethereum.request({ method: 'net_version' });
      }

      // Request account access from user
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      const account = accounts[0];
      setSelectedAddress(account);

      // Create a new ethers provider
      const provider = new ethers.providers.Web3Provider(window.ethereum);

      const jewelContractInstance = new ethers.Contract(jewelAddress, jewelAbi, provider);
      setJewelContract(jewelContractInstance);

      const heroContractInstance = new ethers.Contract(heroAddress, heroAbi, provider);
      setHeroContract(heroContractInstance);  // Set the state variable
      checkHeroApproval();

      // const balance = await provider.getBalance(account);
      // setBalance(ethers.utils.formatEther(balance));

      const jewelBalance = await jewelContractInstance.balanceOf(account);
      setJewelBalance(ethers.utils.formatEther(jewelBalance));

      const heroBalance = await heroContractInstance.getUserHeroes(account);
      setHeroIds(heroBalance.map(id => id.toString()));
      
      //console.log(`${ethers.utils.formatEther(balance)} KLAY\n${ethers.utils.formatEther(jewelBalance)} JEWEL`);
      //console.log(`Heroes: ${heroBalance}`);
    } else {
      console.log('No wallet found');
    }
  };

  async function checkHeroApproval() {
    if (heroContract) {
      const approved = await heroContract.isApprovedForAll(selectedAddress, escrowAddress);
      setHeroIsApproved(approved);
    }
  };
  
  async function approveHero() {
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const heroContractWithSigner = heroContract.connect(signer);
      const tx = await heroContractWithSigner.setApprovalForAll(escrowAddress, true);
      await tx.wait();
      checkHeroApproval();
    } catch (error) {
      if (error.code === 4001) {
        console.log("Transaction rejected by user");
    } else {
        throw error;
    }
    }
  };

  async function checkJewelApproval() {
    if (jewelContract) {
      const approved = await jewelContract.allowance(selectedAddress, escrowAddress);
      setJewelIsApproved(approved.gte(ethers.utils.parseEther("1")));  // Minimum 1 JEWEL allowed
    }
  };

  async function approveJewel() {
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const jewelContractWithSigner = jewelContract.connect(signer);
      const tx = await jewelContractWithSigner.approve(escrowAddress, ethers.constants.MaxUint256);
      await tx.wait();
      checkJewelApproval();
    } catch (error) {
      if (error.code === 4001) {
        console.log("Transaction rejected by user");
    } else {
        throw error;
    }
    }
  };
  
  // Format heroIds for the DataGrid component
  const heroRows = heroIds.map((id, index) => ({
    id: index,
    heroId: id,
  }));

  const heroColumns = [
    { field: 'heroId', headerName: 'Hero ID', width: 130 },
  ];

  async function createTrade() {
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const contract = new ethers.Contract(escrowAddress, escrowAbi.abi, provider);
      const signer = provider.getSigner();
      const contractWithSigner = contract.connect(signer);
      await contractWithSigner.createTrade(tokenId, buyerAddress, ethers.utils.parseEther(price));
    } catch (error) {
      if (error.code === 4001) {
        //console.log("Transaction rejected by user");
    } else {
        throw error;
    }
    }
  };

  async function executeTrade(tradeId) {
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const contract = new ethers.Contract(escrowAddress, escrowAbi.abi, provider);
      const signer = provider.getSigner();
      const contractWithSigner = contract.connect(signer);
      await contractWithSigner.executeTrade(tradeId);
    } catch (error) {
      if (error.code === 4001) {
        //console.log("Transaction rejected by user");
    } else {
        throw error;
    }
    }
  };

  async function cancelTrade(tradeId) {
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const contract = new ethers.Contract(escrowAddress, escrowAbi.abi, provider);
      const signer = provider.getSigner();
      const contractWithSigner = contract.connect(signer);
      await contractWithSigner.cancelTrade(tradeId);
    } catch (error) {
      if (error.code === 4001) {
        //console.log("Transaction rejected by user");
    } else {
        throw error;
    }
    }
  };
  
  // Check user's HERO contract approval status
  useEffect(() => {
    checkHeroApproval();
  }, [heroContract, selectedAddress]);

  // Check user's JEWEL approval status
  useEffect(() => {
    checkJewelApproval();
  }, [jewelContract, selectedAddress]);

  // Fetch user's active trades and available heroes
  useEffect(() => {
    async function fetchActiveTradesAndHeroes() {
      if (window.ethereum && window.ethereum.chainId === '0x2019') {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        // Fetch user's active trades
        const contract = new ethers.Contract(escrowAddress, escrowAbi.abi, provider);
        const trades = await contract.getActiveTrades();
        setActiveTrades(trades);
        // Fetch user's available heroes
        const heroContractInstance = new ethers.Contract(heroAddress, heroAbi, provider);
        const heroBalance = await heroContractInstance.getUserHeroes(selectedAddress);
        setHeroIds(heroBalance.map(id => id.toString()));
      } else {
        console.log('Unable to call getActiveTrades(); wallet not connected to Klaytn')
      }
    }
  
    if(selectedAddress) {
      fetchActiveTradesAndHeroes();
    }
  }, [selectedAddress, createTrade, executeTrade, cancelTrade]);


  return (
    <ThemeProvider theme={theme}>
      <div style={{ backgroundColor: theme.palette.background.default, color: theme.palette.text.primary }}>
        <Button variant="contained" onClick={connect}>Connect Wallet</Button>
        {selectedAddress && (
          <div>
            <Card>
              <CardContent>
              <p>Connected: <b>{selectedAddress}</b></p>
              <p>Balance: <b>{jewelBalance}</b> <img src={jewelIcon} alt="JEWEL Icon" style={{ width: '20px' }} /></p>
              </CardContent>
            </Card>
            <br />
            <Card>
              <CardContent>
                <Typography>Escrow contract address:</Typography>
                <Typography>
                  <Link 
                    href="https://scope.klaytn.com/account/0x1D110414b4f3b909c2D68564fa19DFb9aEd00FAf?tabId=internalTx"
                    target="_blank" 
                    rel="noopener noreferrer"  
                  >
                    0x1D110414b4f3b909c2D68564fa19DFb9aEd00FAf<Launch />
                  </Link>
                </Typography>
                <br />
                <Typography variant='h5'>List Hero</Typography>
                <br />
                <TextField 
                  label="Hero ID" 
                  value={tokenId} 
                  onChange={e => setTokenId(e.target.value)} 
                  type="number"
                />
                <TextField 
                  label="Buyer Address" 
                  value={buyerAddress} 
                  onChange={e => setBuyerAddress(e.target.value)} 
                  inputProps={{ pattern: "^[a-zA-Z0-9]*$" }}
                />
                <TextField 
                  label="Price (JEWEL)" 
                  value={price} 
                  onChange={e => setPrice(e.target.value)} 
                  type="number"
                />
                <div>
                  {!heroIsApproved && (
                    <Button 
                      variant="contained" 
                      onClick={() => approveHero().catch(console.error)}
                      disabled={heroIsApproved}
                    >
                      Approve Contract
                    </Button>
                  )}
                  <div>
                    {heroIsApproved 
                      ? 
                      <Alert severity="success">Hero NFT contract approved to deposit heroes</Alert>
                      : 
                      <Alert severity="warning">Please approve the Hero contract to be spent by the Escrow contract</Alert>
                    }
                  </div>
                  <Button 
                    variant="contained"
                    onClick={() => createTrade().catch(console.error)} 
                    endIcon={<SendIcon />}
                    disabled={!heroIsApproved}
                  >
                    List Hero
                  </Button>
                </div>
                <br />
                <Typography variant='h5'>Available Heroes to Sell</Typography>
                <div style={{ height: 400, width: '100%' }}>
                  <DataGrid rows={heroRows} columns={heroColumns} pageSize={10} />
                </div>
              </CardContent>
            </Card>
            <br />
            <Card>
              <CardContent>
              {!jewelIsApproved && (
                    <Button 
                      variant="contained" 
                      onClick={() => approveJewel().catch(console.error)}
                      disabled={jewelIsApproved}
                    >
                      Approve Jewel
                    </Button>
                )}
                {jewelIsApproved
                  ?
                  <Alert severity="success">JEWEL approved for buying heroes</Alert>
                  :
                  <Alert severity="warning">Please approve JEWEL to be spent by the Escrow contract</Alert>
                }
                <Typography variant='h5'>Your Active Trades</Typography>
                <TradeList 
                  trades={activeTrades} 
                  selectedAddress={selectedAddress} 
                  onExecute={executeTrade} 
                  onCancel={cancelTrade}
                  jewelIsApproved={jewelIsApproved} 
                />
              </CardContent>
            </Card>
            <div></div>
          </div>
        )}
      </div>
    </ThemeProvider>
  );
}

export default App;