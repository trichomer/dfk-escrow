import React from 'react';
import { DataGrid } from '@mui/x-data-grid';

function TradeList({ trades, selectedAddress }) {
  const tradeRows = trades.filter(trade => trade.buyer === selectedAddress).map((trade, index) => ({
    id: index,
    tradeId: trade.tradeId,
    tokenId: trade.tokenId,
    price: trade.price,
  }));

  const tradeColumns = [
    { field: 'tradeId', headerName: 'Trade ID', width: 130 },
    { field: 'tokenId', headerName: 'Token ID', width: 130 },
    { field: 'price', headerName: 'Price', width: 130 },
  ];

  return (
    <div style={{ height: 400, width: '50%' }}>
      <DataGrid rows={tradeRows} columns={tradeColumns} pageSize={10} />
    </div>
  );
}

export default TradeList;
