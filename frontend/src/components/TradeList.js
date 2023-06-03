import React from 'react';
import { DataGrid } from '@mui/x-data-grid';
import Button from '@mui/material/Button';
import ExecuteTrade from './ExecuteTrade';

function TradeList({ trades, selectedAddress, onExecute }) {
    const tradeRows = trades.filter(trade => trade.buyer === selectedAddress).map((trade, index) => ({
        id: index,
        tradeId: trade.tradeId,
        tokenId: trade.tokenId,
        buyer: trade.buyer,
        seller: trade.seller,
        price: trade.price,
        nftDeposited: trade.nftDeposited ? 'Yes' : 'No',
        executed: trade.executed ? 'Yes' : 'No',
        canceled: trade.canceled ? 'Yes' : 'No'
      }));
    

      const tradeColumns = [
        { field: 'tradeId', headerName: 'Trade ID', width: 130 },
        { field: 'tokenId', headerName: 'Token ID', width: 130 },
        { field: 'buyer', headerName: 'Buyer', width: 200 },
        { field: 'seller', headerName: 'Seller', width: 200 },
        { field: 'price', headerName: 'Price', width: 130 },
        { field: 'nftDeposited', headerName: 'NFT Deposited', width: 150 },
        { field: 'executed', headerName: 'Executed', width: 130 },
        { field: 'canceled', headerName: 'Canceled', width: 130 },
        {
          field: 'execute',
          headerName: 'Execute Trade',
          width: 200,
          renderCell: (params) => (
            <ExecuteTrade tradeId={params.row.tradeId} onExecute={onExecute} />
          ),
        },
      ];
    



  return (
    <div style={{ height: 400, width: '50%' }}>
      <DataGrid rows={tradeRows} columns={tradeColumns} pageSize={10} />
    </div>
  );
}

export default TradeList;
