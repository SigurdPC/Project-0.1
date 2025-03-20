import { useState } from 'react';
import { Container, Typography } from '@mui/material';
import DataTable, { Column } from '../components/DataTable';
import { BunkeringOperation as BunkeringOperationType, FuelType } from '../types';

const columns: Column[] = [
  { id: 'date', label: 'Date', type: 'date' },
  { 
    id: 'fuelType', 
    label: 'Fuel Type', 
    type: 'select',
    options: ['ULSD', 'Change XL', 'Other'] as FuelType[]
  },
  { id: 'density', label: 'Density', type: 'number' },
  { id: 'timeStart', label: 'Time Start', type: 'time' },
  { id: 'timeStop', label: 'Time Stop', type: 'time' },
  { id: 'received', label: 'Received', type: 'number' },
];

const BunkeringOperation = () => {
  const [data, setData] = useState<BunkeringOperationType[]>([]);

  const handleAdd = (newData: BunkeringOperationType) => {
    setData([...data, newData]);
  };

  const handleEdit = (id: string, updatedData: BunkeringOperationType) => {
    setData(data.map((item) => (item.id === id ? updatedData : item)));
  };

  const handleDelete = (id: string) => {
    setData(data.filter((item) => item.id !== id));
  };

  return (
    <Container sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>
        Bunkering Operation
      </Typography>
      <DataTable
        columns={columns}
        data={data}
        onAdd={handleAdd}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
    </Container>
  );
};

export default BunkeringOperation; 