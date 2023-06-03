import React from 'react';
import Button from '@mui/material/Button';

function ExecuteTrade({ tradeId, onExecute }) {
  return (
    <Button variant="contained" onClick={() => onExecute(tradeId)}>
      Execute Trade
    </Button>
  );
}

export default ExecuteTrade;
