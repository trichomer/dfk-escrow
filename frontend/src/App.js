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
import ExecuteTrade from './components/ExecuteTrade';
const escrowAddress = '0x6D8D4959E2a2F59C5A8eD306465B8Ef7E2c9Ea36';
const heroAddress = '0x268CC8248FFB72Cd5F3e73A9a20Fa2FF40EfbA61';
const jewelAddress = '0x30C103f8f5A3A732DFe2dCE1Cc9446f545527b43';
const rpcUrl = 'https://public-node-api.klaytnapi.com/v1/cypress';

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
//console.log(theme);

function App() {
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [balance, setBalance] = useState(null);
  const [jewelBalance, setJewelBalance] = useState(null);
  const [tokenId, setTokenId] = useState('');
  const [buyerAddress, setBuyerAddress] = useState('');
  const [price, setPrice] = useState('');
  const [heroContract, setHeroContract] = useState(null);
  const [heroIds, setHeroIds] = useState([]);
  const [heroIsApproved, setHeroIsApproved] = useState(false);
  const [activeTrades, setActiveTrades] = useState([]);

  
  // User clicks Connect button
  async function connect() {
    if (typeof window.ethereum !== 'undefined') {
      // Request account access from user
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      const account = accounts[0];
      setSelectedAddress(account);

      // Create a new ethers provider
      const provider = new ethers.providers.Web3Provider(window.ethereum);

      const jewelContract = new ethers.Contract(jewelAddress, jewelAbi, provider);
      const heroContractInstance = new ethers.Contract(heroAddress, heroAbi, provider);
      setHeroContract(heroContractInstance);  // Set the state variable
      checkHeroApproval();



      const balance = await provider.getBalance(account);
      setBalance(ethers.utils.formatEther(balance));

      const jewelBalance = await jewelContract.balanceOf(account);
      setJewelBalance(ethers.utils.formatEther(jewelBalance));

      const heroBalance = await heroContractInstance.getUserHeroes(account);
      setHeroIds(heroBalance.map(id => id.toString()));
      
      console.log(`${ethers.utils.formatEther(balance)} KLAY\n${ethers.utils.formatEther(jewelBalance)} JEWEL`);
      console.log(`Heroes: ${heroBalance}`);
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
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    const heroContractWithSigner = heroContract.connect(signer);
    const tx = await heroContractWithSigner.setApprovalForAll(escrowAddress, true);
    await tx.wait();
    checkHeroApproval();
  };
  
  // Format heroIds for the DataGrid component
  const rows = heroIds.map((id, index) => ({
    id: index,
    heroId: id,
  }));

  const columns = [
    { field: 'heroId', headerName: 'Hero ID', width: 130 },
  ];

  async function createTrade() {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const contract = new ethers.Contract(escrowAddress, escrowAbi.abi, provider);
    const signer = provider.getSigner();
    const contractWithSigner = contract.connect(signer);
    await contractWithSigner.createTrade(tokenId, buyerAddress, ethers.utils.parseEther(price));
  };

  async function executeTrade(tradeId) {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const contract = new ethers.Contract(escrowAddress, escrowAbi.abi, provider);
    const signer = provider.getSigner();
    const contractWithSigner = contract.connect(signer);
    await contractWithSigner.executeTrade(tradeId);
  };
  
  useEffect(() => {
    checkHeroApproval();
  }, [heroContract, selectedAddress]);

  useEffect(() => {
    async function fetchActiveTrades() {
      if (typeof window.ethereum !== 'undefined') {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const contract = new ethers.Contract(escrowAddress, escrowAbi.abi, provider);
        const trades = await contract.getActiveTrades();
        console.log(`Trades: ${trades}`);
        const formattedTrades = trades.map((trade, index) => ({
          id: index,
          tradeId: trade.tradeId.toString(),
          tokenId: trade.tokenId.toString(),
          buyer: trade.buyer,
          seller: trade.seller,
          price: ethers.utils.formatEther(trade.price),
          nftDeposited: trade.nftDeposited,
          executed: trade.executed,
          canceled: trade.canceled
        }));
        setActiveTrades(trades);
      }
    }
  
    fetchActiveTrades();
  }, []);
  

  return (
    <ThemeProvider theme={theme}>
      <div style={{ backgroundColor: theme.palette.background.default, color: theme.palette.text.primary }}>
        <Button variant="contained" onClick={connect}>Connect Wallet</Button>
        {selectedAddress && (
          <div>
            <Paper elevation={3}>
              <p>Connected with: {selectedAddress}</p>
              <p>{balance} KLAY</p>
              <p>{jewelBalance} JEWEL</p>
            </Paper>
            <Card>
              <CardContent>
                <TextField 
                  label="Token Id" 
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
                  label="Price" 
                  value={price} 
                  onChange={e => setPrice(e.target.value)} 
                  type="number"
                />
                <div>
                  {!heroIsApproved && (
                    <Button 
                      variant="contained" 
                      onClick={approveHero}
                      disabled={heroIsApproved}
                    >
                      Approve Contract
                    </Button>
                  )}
                  <div>
                    {heroIsApproved 
                      ? 
                      <Alert severity="success">Contract Approved</Alert>
                      : 
                      <Alert severity="warning">Please approve the Hero contract to be spent by the Escrow contract</Alert>
                    }
                  </div>
                  <Button 
                    variant="contained"
                    onClick={createTrade} 
                    endIcon={<SendIcon />}
                    disabled={!heroIsApproved}
                  >
                    List Hero
                  </Button>
                </div>
                <div style={{ height: 400, width: '50%' }}>
                  <DataGrid rows={rows} columns={columns} pageSize={10} />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent>
                <TradeList trades={activeTrades} selectedAddress={selectedAddress} onExecute={executeTrade} />
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