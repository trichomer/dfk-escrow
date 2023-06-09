import React from 'react';
import { DataGrid } from '@mui/x-data-grid';
import Button from '@mui/material/Button';
import jewelIcon from '../img/jewel_icon.png';
import { ethers } from "ethers";
import Download from '@mui/icons-material/Download';
import Cancel from '@mui/icons-material/Cancel';

function TradeList({ trades, selectedAddress, onExecute, onCancel, jewelIsApproved }) {
    //console.log("Trades: ", trades);
    //console.log("Selected Address: ", selectedAddress);
    const tradeRows = trades
    .filter(trade => 
        trade.buyer.toLowerCase() === selectedAddress.toLowerCase() || 
        trade.seller.toLowerCase() === selectedAddress.toLowerCase())
    .map((trade, index) => {
        let price;
        try {
            price = ethers.utils.formatEther(trade.price);
        } catch (e) {
            console.error(`Failed to format price for trade ${trade.tradeId}: ${e.message}`);
            console.error(`trade.price is: ${trade.price}`);
            price = 'N/A';
        }
        return {
            id: index,
            tradeId: trade.tradeId,
            tokenId: trade.tokenId,
            buyer: trade.buyer,
            seller: trade.seller,
            price: price,
            nftDeposited: trade.nftDeposited ? 'Yes' : 'No',
            executed: trade.executed ? 'Yes' : 'No',
            canceled: trade.canceled ? 'Yes' : 'No'
        }
    });


    //console.log("Trade Rows: ", tradeRows);

    const tradeColumns = [
    { field: 'tokenId', headerName: 'Hero ID', width: 130 },
    { 
        field: 'price', 
        headerName: 'Price',
        width: 100,
        renderCell: (params) => (
            <>
                {params.value}
                <img src={jewelIcon} alt="JEWEL" style={{width: '15px', height: '15px'}} />
            </>
        )
    },
    {
        field: 'execute',
        headerName: 'Buy',
        width: 120,
        renderCell: (params) => (
        //console.log("Render Cell Params: ", params);
            selectedAddress.toLowerCase() === params.row.buyer.toLowerCase() && (
            <Button 
                variant="contained" 
                color="primary" 
                onClick={() => onExecute(params.row.tradeId)} 
                disabled={!jewelIsApproved}
                endIcon={<Download />}
            >
                Buy
            </Button>
            )
    ),
    },
    {
        field: 'cancel',
        headerName: 'Cancel',
        width: 120,
        renderCell: (params) => (
          selectedAddress.toLowerCase() === params.row.seller.toLowerCase() && (
            <Button 
              variant="contained" 
              color="primary" 
              onClick={() => onCancel(params.row.tradeId)}
              endIcon={<Cancel />}
            >
                Cancel
            </Button>
          )
        ),
      },
      { field: 'buyer', headerName: 'Buyer', width: 360 },
    ];
    



  return (
    <div style={{ height: 400, width: '100%' }}>
      <DataGrid rows={tradeRows} columns={tradeColumns} pageSize={10} />
    </div>
  );
}

export default TradeList;
