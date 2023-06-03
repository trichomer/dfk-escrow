import React from 'react';
import { DataGrid } from '@mui/x-data-grid';
import Button from '@mui/material/Button';
import jewelIcon from '../img/jewel_icon.png';
import { ethers } from "ethers";
import Download from '@mui/icons-material/Download';

function TradeList({ trades, selectedAddress, onExecute, jewelIsApproved }) {
    //console.log("Trades: ", trades);
    //console.log("Selected Address: ", selectedAddress);
    const tradeRows = trades.filter(trade => trade.buyer.toLowerCase() === selectedAddress.toLowerCase()).map((trade, index) => ({
        id: index,
        tradeId: trade.tradeId,
        tokenId: trade.tokenId,
        buyer: trade.buyer,
        seller: trade.seller,
        price: ethers.utils.formatEther(trade.price),
        nftDeposited: trade.nftDeposited ? 'Yes' : 'No',
        executed: trade.executed ? 'Yes' : 'No',
        canceled: trade.canceled ? 'Yes' : 'No'
      }));
    //console.log("Trade Rows: ", tradeRows);

    const tradeColumns = [
    { field: 'tradeId', headerName: 'Trade ID', width: 70 },
    { field: 'tokenId', headerName: 'Token ID', width: 130 },
    { field: 'buyer', headerName: 'Buyer', width: 200 },
    { field: 'seller', headerName: 'Seller', width: 200 },
    { field: 'price', headerName: 'Price (JEWEL)', width: 130 },
    {
        field: 'execute',
        headerName: 'Buy',
        width: 200,
        renderCell: (params) => (
        //console.log("Render Cell Params: ", params);
            <Button 
                variant="contained" 
                color="primary" 
                onClick={() => onExecute(params.row.tradeId)} 
                disabled={!jewelIsApproved}
                endIcon={<Download />}
            >
                Buy
            </Button>
    ),
    },
    ];
    



  return (
    <div style={{ height: 400, width: '100%' }}>
      <DataGrid rows={tradeRows} columns={tradeColumns} pageSize={10} />
    </div>
  );
}

export default TradeList;
