import React, { useContext } from 'react';
import AlertContext from '../../context/alert/alertContext';
import { Alert as MuiAlert, Stack } from '@mui/material';

const Alert = () => {
  const alertContext = useContext(AlertContext);

  return (
    <Stack sx={{ width: '100%', marginBottom: 2 }} spacing={2}>
      {alertContext.alerts.length > 0 &&
        alertContext.alerts.map(alert => (
          <MuiAlert
            key={alert.id}
            severity={alert.type}
            variant="filled"
            sx={{ width: '100%' }}
          >
            {alert.msg}
          </MuiAlert>
        ))}
    </Stack>
  );
};

export default Alert; 